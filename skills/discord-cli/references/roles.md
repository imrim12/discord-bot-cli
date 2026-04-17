# discord roles

List all roles in a Discord server.

## Usage

```bash
discord roles
discord roles --guild 1473974056427716725
```

## Options

| Flag | Description |
|------|-------------|
| `-g, --guild <id>` | Guild ID. Falls back to `DISCORD_GUILD_ID` |

## Output

Table with columns: Name, ID, Color, Position. Sorted by position (highest first).

## When to use

- Discover role IDs
- Understand the server's role hierarchy
