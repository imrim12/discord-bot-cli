import { Command } from "commander";
import { loadConfigSafe } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

interface Check {
  name: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

export function registerDoctor(program: Command) {
  program
    .command("doctor")
    .description("Diagnose environment, credentials, permissions, and state")
    .action(async () => {
      const checks: Check[] = [];
      const cwd = process.cwd();
      const cfg = loadConfigSafe(cwd);

      // ── 1. Env files ──────────────────────────────────────

      const envExists = existsSync(resolve(cwd, ".env"));
      const envLocalExists = existsSync(resolve(cwd, ".env.local"));
      checks.push({
        name: ".env file",
        status: envExists ? "pass" : "warn",
        detail: envExists
          ? resolve(cwd, ".env")
          : "Not found — credentials must come from global env or .env.local",
      });
      checks.push({
        name: ".env.local file",
        status: envLocalExists ? "pass" : "warn",
        detail: envLocalExists
          ? resolve(cwd, ".env.local")
          : "Not found (optional, highest priority override)",
      });

      // ── 2. Required env vars ──────────────────────────────

      checks.push({
        name: "DISCORD_BOT_TOKEN",
        status: cfg.token ? "pass" : "fail",
        detail: cfg.token
          ? `Set (${cfg.token.slice(0, 10)}...${cfg.token.slice(-4)})`
          : "MISSING — required for all commands",
      });

      checks.push({
        name: "DISCORD_GUILD_ID",
        status: cfg.guildId ? "pass" : "warn",
        detail: cfg.guildId
          ? cfg.guildId
          : "Not set — you will need --guild on every command",
      });

      checks.push({
        name: "DISCORD_APPLICATION_ID",
        status: cfg.applicationId ? "pass" : "warn",
        detail: cfg.applicationId
          ? cfg.applicationId
          : "Not set — required for 'webhook' command",
      });

      checks.push({
        name: "DISCORD_PUBLIC_KEY",
        status: cfg.publicKey ? "pass" : "warn",
        detail: cfg.publicKey
          ? `${cfg.publicKey.slice(0, 16)}...`
          : "Not set — required for 'webhook' command signature verification",
      });

      checks.push({
        name: "DISCORD_POLL_INTERVAL",
        status: "pass",
        detail: `${cfg.pollInterval}s`,
      });

      // ── 3. Token validity ─────────────────────────────────

      if (cfg.token) {
        const dc = new DiscordClient(cfg.token);
        try {
          const me = await dc.getMe();
          checks.push({
            name: "Bot authentication",
            status: "pass",
            detail: `${me.username}#${me.discriminator} (${me.id})`,
          });

          // ── 4. Guild access ─────────────────────────────

          const guilds = await dc.listGuilds();
          checks.push({
            name: "Guild membership",
            status: guilds.length > 0 ? "pass" : "warn",
            detail:
              guilds.length > 0
                ? `${guilds.length} guild(s): ${guilds.map((g: any) => g.name).join(", ")}`
                : "Bot is not in any guilds — invite it to a server",
          });

          // ── 5. Default guild access ─────────────────────

          if (cfg.guildId) {
            const inGuild = guilds.some((g: any) => g.id === cfg.guildId);
            checks.push({
              name: "Default guild access",
              status: inGuild ? "pass" : "fail",
              detail: inGuild
                ? `Bot is in guild ${cfg.guildId}`
                : `Bot is NOT in guild ${cfg.guildId} — check DISCORD_GUILD_ID or invite the bot`,
            });

            // ── 6. Channel permissions ──────────────────

            if (inGuild) {
              try {
                const channels = await dc.listChannels(cfg.guildId);
                const textChannels = channels.filter(
                  (c: any) => c.type === 0 || c.type === 5
                );
                checks.push({
                  name: "Text channels visible",
                  status: textChannels.length > 0 ? "pass" : "warn",
                  detail: `${textChannels.length} text/announcement channel(s) visible`,
                });

                // Test read access on first text channel
                if (textChannels.length > 0) {
                  let readable = 0;
                  let sendable = 0;
                  const sample = textChannels.slice(0, 5);
                  for (const ch of sample) {
                    try {
                      await dc.getMessages(ch.id, { limit: 1 });
                      readable++;
                    } catch {
                      // no access
                    }
                    try {
                      // We don't actually send — just check if the earlier send worked
                      // Actually we can't test send without sending. Skip.
                      sendable++; // Optimistic — real check is in send command
                    } catch {
                      // skip
                    }
                  }
                  checks.push({
                    name: "Channel read access (sample)",
                    status: readable > 0 ? "pass" : "fail",
                    detail: `${readable}/${sample.length} sampled channels readable`,
                  });
                }
              } catch (err: any) {
                checks.push({
                  name: "Channel listing",
                  status: "fail",
                  detail: `Failed: ${err.message}`,
                });
              }

              // ── 7. Bot roles ────────────────────────────

              try {
                const me = await dc.getMe();
                const memberRes = await fetch(
                  `https://discord.com/api/v10/guilds/${cfg.guildId}/members/${me.id}`,
                  { headers: { Authorization: `Bot ${cfg.token}` } }
                );
                if (memberRes.ok) {
                  const member = (await memberRes.json()) as any;
                  const roles = await dc.listRoles(cfg.guildId);
                  const roleMap = Object.fromEntries(
                    roles.map((r: any) => [r.id, r.name])
                  );
                  const botRoles = member.roles
                    .map((id: string) => roleMap[id] || id)
                    .join(", ");
                  checks.push({
                    name: "Bot roles",
                    status: member.roles.length > 0 ? "pass" : "warn",
                    detail: botRoles || "No roles assigned — may have limited permissions",
                  });
                }
              } catch {
                // non-critical
              }
            }
          }
        } catch (err: any) {
          checks.push({
            name: "Bot authentication",
            status: "fail",
            detail: `FAILED: ${err.message} — check your DISCORD_BOT_TOKEN`,
          });
        }
      }

      // ── 8. Listen state ─────────────────────────────────

      const stateFile = resolve(cwd, ".discord-listen-state.json");
      if (existsSync(stateFile)) {
        try {
          const state = JSON.parse(readFileSync(stateFile, "utf-8"));
          const channelCount = Object.keys(state).length;
          checks.push({
            name: "Listen state file",
            status: "pass",
            detail: `${stateFile} — tracking ${channelCount} channel(s)`,
          });
        } catch {
          checks.push({
            name: "Listen state file",
            status: "warn",
            detail: `${stateFile} exists but is corrupted — use 'listen --reset'`,
          });
        }
      } else {
        checks.push({
          name: "Listen state file",
          status: "warn",
          detail: "Not found — will be created on first 'listen' run",
        });
      }

      // ── 9. ngrok availability ───────────────────────────

      let ngrokAvailable = false;
      try {
        // Check if @ngrok/ngrok is importable
        await import("@ngrok/ngrok");
        ngrokAvailable = true;
        checks.push({
          name: "ngrok (npm package)",
          status: "pass",
          detail: "@ngrok/ngrok is installed",
        });
      } catch {
        checks.push({
          name: "ngrok (npm package)",
          status: "warn",
          detail: "Not available — required for 'webhook' command",
        });
      }

      // Also check for NGROK_AUTHTOKEN
      checks.push({
        name: "NGROK_AUTHTOKEN",
        status: process.env.NGROK_AUTHTOKEN ? "pass" : "warn",
        detail: process.env.NGROK_AUTHTOKEN
          ? "Set"
          : "Not set — ngrok free tunnel may require it (get one at https://dashboard.ngrok.com)",
      });

      // ── Print report ────────────────────────────────────

      console.log("\nDiscord Bot CLI — Doctor\n");

      let passes = 0;
      let warns = 0;
      let fails = 0;

      for (const c of checks) {
        const icon =
          c.status === "pass" ? "OK" : c.status === "warn" ? "!!" : "XX";
        const label =
          c.status === "pass"
            ? "\x1b[32m"
            : c.status === "warn"
              ? "\x1b[33m"
              : "\x1b[31m";
        const reset = "\x1b[0m";
        console.log(`  ${label}[${icon}]${reset} ${c.name}`);
        console.log(`       ${c.detail}`);

        if (c.status === "pass") passes++;
        else if (c.status === "warn") warns++;
        else fails++;
      }

      console.log(
        `\n  ${passes} passed, ${warns} warning(s), ${fails} failed\n`
      );

      if (fails > 0) {
        console.log(
          "  Fix the [XX] items above to get the CLI working.\n"
        );
        process.exit(1);
      } else if (warns > 0) {
        console.log(
          "  Some optional features may not work. Review [!!] items above.\n"
        );
      } else {
        console.log("  Everything looks good!\n");
      }
    });
}
