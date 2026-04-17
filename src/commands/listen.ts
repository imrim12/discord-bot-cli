import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";
import { truncate, timestamp } from "../lib/format.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const TEXT_TYPES = new Set([0, 5]); // GuildText, GuildAnnouncement

type ListenState = Record<string, string>;

function getStateFile(): string {
  return resolve(process.cwd(), ".discord-listen-state.json");
}

function loadState(stateFile: string): ListenState {
  if (existsSync(stateFile)) {
    try {
      return JSON.parse(readFileSync(stateFile, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveState(stateFile: string, state: ListenState) {
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

export function registerListen(program: Command) {
  program
    .command("listen")
    .description("Poll all channels for new messages every N seconds (default 30)")
    .option("-g, --guild <id>", "Guild ID (defaults to DISCORD_GUILD_ID)")
    .option("-i, --interval <seconds>", "Poll interval in seconds", "30")
    .option(
      "-c, --channels <ids>",
      "Comma-separated channel IDs to watch (default: all text channels)"
    )
    .option("--json", "Output new messages as JSON lines")
    .option("--once", "Poll once and exit (don't loop)")
    .option("--reset", "Clear saved state and start fresh")
    .action(async (opts) => {
      const cfg = loadConfig();
      const guildId = opts.guild || cfg.guildId;
      if (!guildId) {
        console.error(
          "No guild ID. Use --guild <id> or set DISCORD_GUILD_ID."
        );
        process.exit(1);
      }

      const interval = parseInt(opts.interval, 10) * 1000;
      const dc = new DiscordClient(cfg.token);
      const stateFile = getStateFile();

      let state: ListenState = opts.reset ? {} : loadState(stateFile);
      if (opts.reset) {
        console.log("State reset. Will fetch latest messages on first poll.");
        saveState(stateFile, state);
      }

      let watchChannelIds: string[];
      if (opts.channels) {
        watchChannelIds = (opts.channels as string).split(",").map((s) => s.trim());
      } else {
        const allChannels = await dc.listChannels(guildId);
        watchChannelIds = allChannels
          .filter((c) => TEXT_TYPES.has(c.type as number))
          .map((c) => c.id as string);
      }

      const allChannels = await dc.listChannels(guildId);
      const channelNames = Object.fromEntries(
        allChannels.map((c) => [c.id, c.name as string])
      );

      console.log(
        `Listening to ${watchChannelIds.length} channel(s) in guild ${guildId}`
      );
      console.log(`Poll interval: ${interval / 1000}s`);
      console.log(`State file: ${stateFile}`);
      console.log("---");

      const poll = async () => {
        for (const channelId of watchChannelIds) {
          try {
            const fetchOpts: { limit: number; after?: string } = { limit: 50 };
            if (state[channelId]) fetchOpts.after = state[channelId];

            const messages = await dc.getMessages(channelId, fetchOpts);
            if (messages.length === 0) continue;

            const sorted = [...messages].reverse();
            for (const m of sorted) {
              const chName = channelNames[channelId] || channelId;

              if (opts.json) {
                console.log(
                  JSON.stringify({
                    channel: channelId,
                    channelName: chName,
                    messageId: m.id,
                    author: m.author.username,
                    authorId: m.author.id,
                    isBot: m.author.bot || false,
                    content: m.content,
                    embeds: m.embeds?.length || 0,
                    attachments: m.attachments?.length || 0,
                    timestamp: m.timestamp,
                  })
                );
              } else {
                const content =
                  (m.content as string) ||
                  (m.embeds?.length ? "[embed]" : "[no content]");
                console.log(
                  `[${timestamp(m.timestamp as string)}] #${chName} | ${m.author.username}: ${truncate(content, 300)}`
                );
              }
            }

            state[channelId] = sorted[sorted.length - 1].id as string;
          } catch (err: any) {
            if (err.status === 403) continue;
            console.error(
              `Error polling #${channelNames[channelId] || channelId}: ${err.message}`
            );
          }
        }
        saveState(stateFile, state);
      };

      // First poll: seed positions if no state
      if (Object.keys(state).length === 0) {
        console.log("First run — recording channel positions (no output)...");
        for (const channelId of watchChannelIds) {
          try {
            const messages = await dc.getMessages(channelId, { limit: 1 });
            if (messages.length > 0) {
              state[channelId] = messages[0].id as string;
            }
          } catch (err: any) {
            if (err.status !== 403) {
              console.error(
                `Error seeding #${channelNames[channelId] || channelId}: ${err.message}`
              );
            }
          }
        }
        saveState(stateFile, state);
        console.log(
          `Seeded ${Object.keys(state).length} channel(s). Listening for new messages...\n`
        );
      }

      if (opts.once) {
        await poll();
        return;
      }

      const tick = async () => {
        await poll();
        setTimeout(tick, interval);
      };

      setTimeout(tick, interval);

      process.on("SIGINT", () => {
        console.log("\nStopping listener. State saved.");
        saveState(stateFile, state);
        process.exit(0);
      });
      process.on("SIGTERM", () => {
        saveState(stateFile, state);
        process.exit(0);
      });
    });
}
