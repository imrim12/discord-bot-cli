import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";
import { table } from "../lib/format.js";

export function registerRoles(program: Command) {
  program
    .command("roles")
    .description("List all roles in a guild")
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
      const roles = await dc.listRoles(guildId);

      const rows = roles
        .filter((r) => r.name !== "@everyone")
        .sort(
          (a, b) => (b.position as number) - (a.position as number)
        )
        .map((r) => [
          r.name as string,
          r.id as string,
          r.color
            ? `#${(r.color as number).toString(16).padStart(6, "0")}`
            : "-",
          r.position as number,
        ]);

      console.log(table(rows, ["Name", "ID", "Color", "Position"]));
    });
}
