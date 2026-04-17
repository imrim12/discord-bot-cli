import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";
import { timestamp } from "../lib/format.js";
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { createInterface } from "readline";
import nacl from "tweetnacl";

// Discord interaction types
const INTERACTION_TYPE = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

const INTERACTION_NAMES: Record<number, string> = {
  1: "PING",
  2: "APPLICATION_COMMAND",
  3: "MESSAGE_COMPONENT",
  4: "AUTOCOMPLETE",
  5: "MODAL_SUBMIT",
};

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verifySignature(
  publicKey: string,
  signature: string,
  timestampHeader: string,
  body: Buffer
): boolean {
  try {
    const message = Buffer.concat([
      Buffer.from(timestampHeader, "utf-8"),
      body,
    ]);
    return nacl.sign.detached.verify(
      message,
      Buffer.from(signature, "hex"),
      Buffer.from(publicKey, "hex")
    );
  } catch {
    return false;
  }
}

export function registerWebhook(program: Command) {
  program
    .command("webhook")
    .description(
      "Start a webhook server with ngrok tunnel to receive Discord interaction events"
    )
    .option("-p, --port <port>", "Local port for the HTTP server", "8787")
    .option("--json", "Output received events as JSON lines")
    .option("--cleanup", "Clear the interactions endpoint and exit (use after a crash)")
    .action(async (opts) => {
      const cfg = loadConfig();
      const dc = new DiscordClient(cfg.token);

      // ── Cleanup mode: just clear the endpoint and exit ──
      if (opts.cleanup) {
        try {
          const app = await dc.getApplication();
          const current = app.interactions_endpoint_url;
          if (current) {
            await dc.updateApplication({ interactions_endpoint_url: "" });
            console.log(`Cleared interactions endpoint: ${current}`);
          } else {
            console.log("No interactions endpoint is currently set.");
          }
        } catch (err: any) {
          console.error(`Failed to clear endpoint: ${err.message}`);
          process.exit(1);
        }
        return;
      }

      if (!cfg.applicationId) {
        console.error(
          "Missing DISCORD_APPLICATION_ID. Set it in your environment, .env, or .env.local.\n" +
            "Find it at: https://discord.com/developers/applications → your app → General Information"
        );
        process.exit(1);
      }

      if (!cfg.publicKey) {
        console.error(
          "Missing DISCORD_PUBLIC_KEY. Set it in your environment, .env, or .env.local.\n" +
            "Find it at: https://discord.com/developers/applications → your app → General Information"
        );
        process.exit(1);
      }

      const port = parseInt(opts.port, 10);

      // Save the original interactions endpoint so we can restore it
      let originalEndpointUrl: string | null = null;

      // ── Start HTTP server ───────────────────────────────

      const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== "POST" || req.url !== "/") {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }

        const body = await readBody(req);

        const signature = req.headers["x-signature-ed25519"] as string;
        const timestampHeader = req.headers["x-signature-timestamp"] as string;

        if (!signature || !timestampHeader) {
          res.writeHead(401);
          res.end("Missing signature headers");
          return;
        }

        if (!verifySignature(cfg.publicKey!, signature, timestampHeader, body)) {
          res.writeHead(401);
          res.end("Invalid signature");
          return;
        }

        const interaction = JSON.parse(body.toString("utf-8"));
        const type = interaction.type as number;

        // Respond to PING with PONG (required by Discord for endpoint verification)
        if (type === INTERACTION_TYPE.PING) {
          console.log(`[${timestamp(new Date().toISOString())}] PING received — responding with PONG`);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ type: 1 }));
          return;
        }

        // Log the interaction
        if (opts.json) {
          console.log(JSON.stringify(interaction));
        } else {
          const typeName = INTERACTION_NAMES[type] || `UNKNOWN(${type})`;
          const user = interaction.member?.user?.username || interaction.user?.username || "unknown";
          const guild = interaction.guild_id || "DM";
          const channel = interaction.channel_id || "-";
          const data = interaction.data;

          console.log(`[${timestamp(new Date().toISOString())}] ${typeName} from ${user}`);
          console.log(`  Guild: ${guild} | Channel: ${channel}`);
          if (data?.name) console.log(`  Command: ${data.name}`);
          if (data?.custom_id) console.log(`  Component: ${data.custom_id}`);
          if (data?.options) {
            const optStr = data.options
              .map((o: any) => `${o.name}=${o.value}`)
              .join(", ");
            console.log(`  Options: ${optStr}`);
          }
          console.log("");
        }

        // Acknowledge the interaction
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            type: type === INTERACTION_TYPE.APPLICATION_COMMAND_AUTOCOMPLETE ? 8 : 4,
            data: {
              content: "Received by discord-bot-cli webhook.",
            },
          })
        );
      });

      await new Promise<void>((resolve) => server.listen(port, resolve));
      console.log(`HTTP server listening on port ${port}`);

      // ── Start ngrok tunnel ──────────────────────────────

      let ngrok: typeof import("@ngrok/ngrok");
      try {
        ngrok = await import("@ngrok/ngrok");
      } catch {
        console.error(
          "Failed to import @ngrok/ngrok. Install it: pnpm add @ngrok/ngrok"
        );
        server.close();
        process.exit(1);
      }

      let listener: Awaited<ReturnType<typeof ngrok.forward>>;
      try {
        listener = await ngrok.forward({
          addr: port,
          authtoken_from_env: true,
        });
      } catch (err: any) {
        console.error(`ngrok failed to start: ${err.message}`);
        console.error(
          "Make sure NGROK_AUTHTOKEN is set. Get one at: https://dashboard.ngrok.com/get-started/your-authtoken"
        );
        server.close();
        process.exit(1);
      }

      const tunnelUrl = listener.url()!;
      console.log(`ngrok tunnel: ${tunnelUrl}`);

      // ── Register endpoint on Discord application ────────

      console.log("\nRegistering interactions endpoint on Discord application...");

      try {
        const app = await dc.getApplication();
        originalEndpointUrl = app.interactions_endpoint_url || null;
        if (originalEndpointUrl) {
          console.log(`  Previous endpoint: ${originalEndpointUrl}`);
        }

        await dc.updateApplication({
          interactions_endpoint_url: tunnelUrl,
        });
        console.log(`  Registered: ${tunnelUrl}`);
      } catch (err: any) {
        console.error(`\nFailed to register endpoint: ${err.message}`);
        console.error(
          "Discord validates the endpoint by sending a PING. If this fails, check your DISCORD_PUBLIC_KEY."
        );
        await cleanup();
        process.exit(1);
      }

      console.log("\nWebhook is live. Waiting for interactions...");
      console.log("Press Ctrl+C to stop and clean up.\n");

      // ── Cleanup on exit ─────────────────────────────────

      let cleanedUp = false;

      async function cleanup() {
        if (cleanedUp) return;
        cleanedUp = true;

        console.log("\nCleaning up...");

        // Restore or clear the interactions endpoint
        try {
          if (originalEndpointUrl) {
            console.log(
              `  Restoring previous endpoint: ${originalEndpointUrl}`
            );
            await dc.updateApplication({
              interactions_endpoint_url: originalEndpointUrl,
            });
          } else {
            console.log("  Clearing interactions endpoint...");
            await dc.updateApplication({
              interactions_endpoint_url: "",
            });
          }
          console.log("  Discord endpoint cleaned up.");
        } catch (err: any) {
          console.error(`  Failed to clean up endpoint: ${err.message}`);
        }

        // Close ngrok
        try {
          await listener.close();
          console.log("  ngrok tunnel closed.");
        } catch {
          // ignore
        }

        // Close HTTP server
        server.close();
        console.log("  HTTP server stopped.");
        console.log("Done.\n");
      }

      // On Windows, child.kill('SIGINT') doesn't trigger process.on('SIGINT').
      // Use readline to reliably capture Ctrl+C in foreground mode, and also
      // hook all signals for non-Windows or background kills.
      if (process.stdin.isTTY) {
        const rl = createInterface({ input: process.stdin });
        rl.on("close", async () => {
          await cleanup();
          process.exit(0);
        });
      }

      for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
        process.on(sig, async () => {
          await cleanup();
          process.exit(0);
        });
      }

      process.on("beforeExit", async () => {
        await cleanup();
      });

      process.on("exit", () => {
        // Synchronous last-resort: if cleanup didn't run, at least warn
        if (!cleanedUp) {
          console.error(
            "\nWARNING: Process exited without cleanup. The interactions endpoint may be stale.\n" +
            "Run: discord webhook --cleanup   or clear it in the Developer Portal."
          );
        }
      });
    });
}
