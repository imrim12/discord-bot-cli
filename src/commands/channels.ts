import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";
import { channelType, table } from "../lib/format.js";

export function registerChannels(program: Command) {
  program
    .command("channels")
    .description("List all channels in a guild")
    .option("-g, --guild <id>", "Guild ID (defaults to DISCORD_GUILD_ID)")
    .option(
      "-t, --type <type>",
      "Filter by type: text, voice, category, announcement"
    )
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
      let channels = await dc.listChannels(guildId);

      channels.sort((a, b) => {
        const catA = (a.parent_id || a.id) as string;
        const catB = (b.parent_id || b.id) as string;
        if (catA !== catB) return catA.localeCompare(catB);
        if (a.type === 4) return -1;
        if (b.type === 4) return 1;
        return ((a.position as number) ?? 0) - ((b.position as number) ?? 0);
      });

      if (opts.type) {
        const typeMap: Record<string, number> = {
          text: 0,
          voice: 2,
          category: 4,
          announcement: 5,
        };
        const filterType = typeMap[opts.type];
        if (filterType === undefined) {
          console.error(
            `Unknown type: ${opts.type}. Use: text, voice, category, announcement`
          );
          process.exit(1);
        }
        channels = channels.filter((c) => c.type === filterType);
      }

      const rows = channels.map((c) => [
        c.type === 4 ? `[${c.name}]` : `#${c.name}`,
        c.id as string,
        channelType(c.type as number),
        (c.parent_id as string) || "-",
      ]);

      console.log(table(rows, ["Channel", "ID", "Type", "Parent"]));
    });
}
