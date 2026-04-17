import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";

export function registerStatus(program: Command) {
  program
    .command("status")
    .description("Show bot identity, connected guilds, and permissions")
    .action(async () => {
      const cfg = loadConfig();
      const dc = new DiscordClient(cfg.token);

      const me = await dc.getMe();
      console.log(`Bot:      ${me.username}#${me.discriminator}`);
      console.log(`ID:       ${me.id}`);

      const guilds = await dc.listGuilds();
      console.log(`Guilds:   ${guilds.length}`);
      for (const g of guilds) {
        console.log(`  - ${g.name} (${g.id})`);
      }

      if (cfg.guildId) {
        const guild = await dc.getGuild(cfg.guildId);
        console.log(`\nDefault guild: ${guild.name}`);
        console.log(`  Members: ~${guild.approximate_member_count}`);
        console.log(`  Online:  ~${guild.approximate_presence_count}`);
      }
    });
}
