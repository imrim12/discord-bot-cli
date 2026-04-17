import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";
import { resolveChannel } from "../lib/resolve-channel.js";

export function registerSend(program: Command) {
  program
    .command("send")
    .description("Send a message to a channel")
    .argument("<channel>", "Channel ID or #channel-name")
    .argument("<message...>", "Message content (joined with spaces)")
    .option("-g, --guild <id>", "Guild ID for channel name resolution")
    .option("-r, --reply <messageId>", "Reply to a specific message")
    .option("--embed", "Send as a rich embed instead of plain text")
    .action(async (channel: string, messageParts: string[], opts) => {
      const cfg = loadConfig();
      const dc = new DiscordClient(cfg.token);
      const message = messageParts.join(" ");
      const guildId = opts.guild || cfg.guildId;

      const channelId = await resolveChannel(dc, channel, guildId);

      const sendOpts: { embeds?: Array<Record<string, unknown>>; reply?: string } = {};
      if (opts.reply) sendOpts.reply = opts.reply;

      let result;
      if (opts.embed) {
        sendOpts.embeds = [{ description: message, color: 0x00cc88 }];
        result = await dc.sendMessage(channelId, null, sendOpts);
      } else {
        result = await dc.sendMessage(channelId, message, sendOpts);
      }

      console.log(`Sent message ${result.id} to ${channelId}`);
    });
}
