#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Command } from "commander";
import { registerStatus } from "./commands/status.js";
import { registerGuilds } from "./commands/guilds.js";
import { registerChannels } from "./commands/channels.js";
import { registerMembers } from "./commands/members.js";
import { registerRoles } from "./commands/roles.js";
import { registerSend } from "./commands/send.js";
import { registerHistory } from "./commands/history.js";
import { registerReact } from "./commands/react.js";
import { registerPins } from "./commands/pins.js";
import { registerThreads } from "./commands/threads.js";
import { registerListen } from "./commands/listen.js";
import { registerDoctor } from "./commands/doctor.js";
import { registerWebhook } from "./commands/webhook.js";

const pkg = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../package.json"),
    "utf8"
  )
) as { version: string };

const program = new Command();

program
  .name("discord / discord-agent")
  .description(
    "Discord Bot CLI — manage channels, messages, and listen for activity"
  )
  .version(pkg.version);

registerStatus(program);
registerGuilds(program);
registerChannels(program);
registerMembers(program);
registerRoles(program);
registerSend(program);
registerHistory(program);
registerReact(program);
registerPins(program);
registerThreads(program);
registerListen(program);
registerDoctor(program);
registerWebhook(program);

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
