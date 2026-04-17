import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";
import { table } from "../lib/format.js";

export function registerMembers(program: Command) {
  program
    .command("members")
    .description("List guild members")
    .option("-g, --guild <id>", "Guild ID (defaults to DISCORD_GUILD_ID)")
    .option("-l, --limit <n>", "Max members to fetch", "100")
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
      const roleMap = Object.fromEntries(
        roles.map((r) => [r.id, r.name])
      );

      let members;
      try {
        members = await dc.listMembers(guildId, {
          limit: parseInt(opts.limit, 10),
        });
      } catch (err: any) {
        if (err.status === 403) {
          console.error(
            "Missing Access. Enable the 'Server Members Intent' in the Discord Developer Portal:\n" +
              "  Application > Bot > Privileged Gateway Intents > Server Members Intent"
          );
          process.exit(1);
        }
        throw err;
      }

      const rows = members.map((m: any) => [
        m.nick || m.user.global_name || m.user.username,
        `${m.user.username}#${m.user.discriminator}`,
        m.user.id,
        m.user.bot ? "bot" : "human",
        m.roles
          .map((r: string) => roleMap[r] || r)
          .join(", ") || "-",
      ]);

      console.log(table(rows, ["Name", "Tag", "ID", "Type", "Roles"]));
    });
}
