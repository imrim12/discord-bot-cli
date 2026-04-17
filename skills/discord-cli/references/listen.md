# discord listen

Poll all text channels for new messages on a recurring interval.

## Usage

```bash
# Default 30s interval
discord listen

# Custom interval
discord listen --interval 10

# Watch specific channels only
discord listen --channels 1473974057459384404,1473974057883013206

# JSON output (one JSON line per new message)
discord listen --json

# Poll once and exit
discord listen --once

# Reset state and start fresh
discord listen --reset
```

## Options

| Flag | Description |
|------|-------------|
| `-g, --guild <id>` | Guild ID. Falls back to `DISCORD_GUILD_ID` |
| `-i, --interval <s>` | Poll interval in seconds (default: 30) |
| `-c, --channels <ids>` | Comma-separated channel IDs to watch |
| `--json` | Output new messages as JSON lines |
| `--once` | Poll once and exit (no loop) |
| `--reset` | Clear saved state file and start fresh |

## How it works

1. On first run, seeds each channel's "last seen" message ID (no output)
2. On each tick, sequentially polls every watched text channel for messages after the last-seen ID
3. Prints new messages to stdout (human-readable or JSON)
4. Saves state to `.discord-listen-state.json` so it survives restarts
5. Gracefully saves state on SIGINT/SIGTERM

## State management

- State file: `.discord-listen-state.json` in working directory
- Contains `{ channelId: lastSeenMessageId }` map
- Use `--reset` to clear and re-seed
- Safe to delete the file manually

## When to use

- Monitor team activity across all channels
- Feed Discord messages into an AI agent pipeline
- Log all server activity
- Use `--once` in cron jobs or agent heartbeats
- Use `--json` when piping into other tools
