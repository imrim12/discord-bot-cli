# discord doctor

Diagnose environment, credentials, permissions, and state. Run this when something isn't working.

## Usage

```bash
discord doctor
```

## Checks performed

| Check | Type | What it verifies |
|-------|------|-----------------|
| `.env` / `.env.local` | File | Env files exist in working directory |
| `DISCORD_BOT_TOKEN` | Env | Token is set |
| `DISCORD_GUILD_ID` | Env | Default guild is configured |
| `DISCORD_APPLICATION_ID` | Env | App ID set (needed for webhook) |
| `DISCORD_PUBLIC_KEY` | Env | Public key set (needed for webhook) |
| `DISCORD_POLL_INTERVAL` | Env | Poll interval value |
| Bot authentication | API | Token is valid, shows bot username |
| Guild membership | API | Bot is in at least one server |
| Default guild access | API | Bot is in the configured guild |
| Text channels visible | API | Bot can see text channels |
| Channel read access | API | Bot can read messages (samples 5 channels) |
| Bot roles | API | What roles the bot has in the default guild |
| Listen state file | File | `.discord-listen-state.json` exists and is valid |
| ngrok package | Import | `@ngrok/ngrok` is installed |
| `NGROK_AUTHTOKEN` | Env | ngrok auth token is set |

## Exit codes

- `0` — all checks passed (warnings are OK)
- `1` — one or more critical checks failed

## When to use

- First-time setup validation
- After changing credentials or permissions
- When a command fails unexpectedly
- Before running `webhook` to ensure everything is configured
