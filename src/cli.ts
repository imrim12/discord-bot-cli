#!/usr/bin/env node

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

const program = new Command();

program
  .name("discord / discord-agent")
  .description(
    "Discord Bot CLI — manage channels, messages, and listen for activity"
  )
  .version("1.0.0");

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
