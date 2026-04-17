import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";
import { table } from "../lib/format.js";

export function registerThreads(program: Command) {
  program
    .command("threads")
    .description("List active threads in a guild")
    .option("-g, --guild <id>", "Guild ID (defaults to DISCORD_GUILD_ID)")
    .action(async (opts) => {
      const cfg = loadConfig();
      const guildId = opts.guild || cfg.guildId;
      if (!guildId) {
        console.error(
          "No guild ID. Use --guild <id> or set DISCORD_GUILD_ID."
        );
        process.exit(1);
      }

      const dc = new DiscordClient(cfg.token);
      const { threads } = await dc.listActiveThreads(guildId);

      if (!threads || threads.length === 0) {
        console.log("No active threads.");
        return;
      }

      const rows = threads.map((t) => [
        t.name as string,
        t.id as string,
        t.parent_id as string,
        (t.message_count as number) ?? "-",
        (t.member_count as number) ?? "-",
      ]);
      console.log(
        table(rows, ["Thread", "ID", "Parent Channel", "Messages", "Members"])
      );
    });
}
