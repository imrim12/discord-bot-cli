import { config as loadDotenv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

export interface Config {
  token: string;
  guildId?: string;
  applicationId?: string;
  publicKey?: string;
  pollInterval: number;
}

/**
 * Load DISCORD_* configuration with precedence:
 *   1. Global environment variables (lowest)
 *   2. .env file in cwd
 *   3. .env.local file in cwd (highest)
 */
export function loadConfig(cwd: string = process.cwd()): Config {
  const envLocal = resolve(cwd, ".env.local");
  const envFile = resolve(cwd, ".env");

  if (existsSync(envLocal)) {
    loadDotenv({ path: envLocal, override: true });
  }
  if (existsSync(envFile)) {
    loadDotenv({ path: envFile, override: false });
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const applicationId = process.env.DISCORD_APPLICATION_ID;
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  const pollInterval = parseInt(process.env.DISCORD_POLL_INTERVAL || "30", 10);

  if (!token) {
    console.error(
      "Missing DISCORD_BOT_TOKEN. Set it in your environment, .env, or .env.local"
    );
    process.exit(1);
  }

  return { token, guildId, applicationId, publicKey, pollInterval };
}

/** Like loadConfig but returns partial results without exiting — for diagnostics. */
export function loadConfigSafe(cwd: string = process.cwd()): Partial<Config> {
  const envLocal = resolve(cwd, ".env.local");
  const envFile = resolve(cwd, ".env");

  if (existsSync(envLocal)) {
    loadDotenv({ path: envLocal, override: true });
  }
  if (existsSync(envFile)) {
    loadDotenv({ path: envFile, override: false });
  }

  return {
    token: process.env.DISCORD_BOT_TOKEN || undefined,
    guildId: process.env.DISCORD_GUILD_ID || undefined,
    applicationId: process.env.DISCORD_APPLICATION_ID || undefined,
    publicKey: process.env.DISCORD_PUBLIC_KEY || undefined,
    pollInterval: parseInt(process.env.DISCORD_POLL_INTERVAL || "30", 10),
  };
}
