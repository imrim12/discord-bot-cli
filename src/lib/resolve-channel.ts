import { DiscordClient } from "./client.js";

/**
 * Resolve a channel argument that can be either an ID or #channel-name.
 * Suffix-matching: #general matches 💬・general.
 */
export async function resolveChannel(
  dc: DiscordClient,
  channel: string,
  guildId?: string
): Promise<string> {
  if (!channel.startsWith("#")) return channel;

  if (!guildId) {
    console.error("Need --guild or DISCORD_GUILD_ID to resolve channel names.");
    process.exit(1);
  }

  const channels = await dc.listChannels(guildId);
  const name = channel.slice(1);
  const found = channels.find(
    (c: Record<string, any>) => c.name === name || c.name.endsWith(name)
  );
  if (!found) {
    console.error(`Channel "${channel}" not found.`);
    process.exit(1);
  }
  return found.id as string;
}
