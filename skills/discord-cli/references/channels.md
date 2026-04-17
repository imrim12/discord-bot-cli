# discord channels

List all channels in a Discord server.

## Usage

```bash
# All channels in default guild
discord channels

# Specific guild
discord channels --guild 1473974056427716725

# Filter by type
discord channels --type text
discord channels --type voice
discord channels --type category
discord channels --type announcement
```

## Options

| Flag | Description |
|------|-------------|
| `-g, --guild <id>` | Guild ID. Falls back to `DISCORD_GUILD_ID` |
| `-t, --type <type>` | Filter: `text`, `voice`, `category`, `announcement` |

## Output

Table with columns: Channel (# or [] for categories), ID, Type, Parent category ID.

## When to use

- Discover channel IDs for `send`, `history`, or `listen`
- Overview of server structure
- Find the right channel to post in
