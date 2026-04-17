# discord members

List members of a Discord server.

## Usage

```bash
discord members
discord members --guild 1473974056427716725 --limit 50
```

## Options

| Flag | Description |
|------|-------------|
| `-g, --guild <id>` | Guild ID. Falls back to `DISCORD_GUILD_ID` |
| `-l, --limit <n>` | Max members to fetch (default: 100) |

## Output

Table with columns: Name, Tag, ID, Type (human/bot), Roles.

## Prerequisites

Requires **Server Members Intent** enabled in Discord Developer Portal:
Application > Bot > Privileged Gateway Intents > Server Members Intent

## When to use

- See who is in a server
- Find a user's ID for mentions or DMs
- Check role assignments
