import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";
import { truncate, timestamp } from "../lib/format.js";
import { resolveChannel } from "../lib/resolve-channel.js";

export function registerPins(program: Command) {
  program
    .command("pins")
    .description("List pinned messages in a channel")
    .argument("<channel>", "Channel ID or #channel-name")
    .option("-g, --guild <id>", "Guild ID for channel name resolution")
    .action(async (channel: string, opts) => {
      const cfg = loadConfig();
      const dc = new DiscordClient(cfg.token);
      const guildId = opts.guild || cfg.guildId;

      const channelId = await resolveChannel(dc, channel, guildId);

      const pins = await dc.getPins(channelId);
      if (pins.length === 0) {
        console.log("No pinned messages.");
        return;
      }

      for (const m of pins) {
        console.log(
          `[${timestamp(m.timestamp as string)}] ${m.author.username} (${m.id}): ${truncate(m.content as string, 200)}`
        );
      }
    });
}
