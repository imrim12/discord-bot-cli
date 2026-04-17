import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";
import { truncate, timestamp } from "../lib/format.js";
import { resolveChannel } from "../lib/resolve-channel.js";

export function registerHistory(program: Command) {
  program
    .command("history")
    .description("Read message history from a channel")
    .argument("<channel>", "Channel ID or #channel-name")
    .option("-g, --guild <id>", "Guild ID for channel name resolution")
    .option("-n, --limit <n>", "Number of messages to fetch", "25")
    .option("--after <messageId>", "Fetch messages after this ID")
    .option("--before <messageId>", "Fetch messages before this ID")
    .option("--full", "Show full message content (no truncation)")
    .option("--json", "Output as JSON")
    .action(async (channel: string, opts) => {
      const cfg = loadConfig();
      const dc = new DiscordClient(cfg.token);
      const guildId = opts.guild || cfg.guildId;

      const channelId = await resolveChannel(dc, channel, guildId);

      const messages = await dc.getMessages(channelId, {
        limit: parseInt(opts.limit, 10),
        after: opts.after,
        before: opts.before,
      });

      if (opts.json) {
        console.log(JSON.stringify(messages, null, 2));
        return;
      }

      if (messages.length === 0) {
        console.log("No messages found.");
        return;
      }

      const sorted = [...messages].reverse();
      for (const m of sorted) {
        const author = m.author.username as string;
        const time = timestamp(m.timestamp as string);
        const content = opts.full
          ? (m.content as string)
          : truncate(m.content as string, 200);
        const embeds = m.embeds?.length ? ` [+${m.embeds.length} embed(s)]` : "";
        const attachments = m.attachments?.length
          ? ` [+${m.attachments.length} file(s)]`
          : "";
        console.log(
          `[${time}] ${author} (${m.id}): ${content}${embeds}${attachments}`
        );
      }
    });
}
