import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";
import { table } from "../lib/format.js";

export function registerGuilds(program: Command) {
  program
    .command("guilds")
    .description("List all guilds (servers) the bot is in")
    .action(async () => {
      const cfg = loadConfig();
      const dc = new DiscordClient(cfg.token);

      const guilds = await dc.listGuilds();
      if (guilds.length === 0) {
        console.log("Bot is not in any guilds.");
        return;
      }

      const rows = guilds.map((g) => [
        g.name as string,
        g.id as string,
        g.owner ? "owner" : "member",
      ]);
      console.log(table(rows, ["Name", "ID", "Role"]));
    });
}
