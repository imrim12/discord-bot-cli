# discord threads

List all active threads in a guild.

## Usage

```bash
discord threads
discord threads --guild 1473974056427716725
```

## Options

| Flag | Description |
|------|-------------|
| `-g, --guild <id>` | Guild ID. Falls back to `DISCORD_GUILD_ID` |

## Output

Table with columns: Thread name, ID, Parent Channel ID, Message count, Member count.

## When to use

- Find active discussions in threads
- Discover thread IDs for reading history via `discord history`
