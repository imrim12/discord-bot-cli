import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";

export function registerReact(program: Command) {
  program
    .command("react")
    .description("Add a reaction to a message")
    .argument("<channel>", "Channel ID")
    .argument("<messageId>", "Message ID")
    .argument("<emoji>", "Emoji (unicode or name:id for custom)")
    .action(async (channel: string, messageId: string, emoji: string) => {
      const cfg = loadConfig();
      const dc = new DiscordClient(cfg.token);

      await dc.addReaction(channel, messageId, emoji);
      console.log(`Reacted with ${emoji} on ${messageId}`);
    });
}
