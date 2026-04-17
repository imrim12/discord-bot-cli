# discord history

Read message history from a Discord channel.

## Usage

```bash
# Last 25 messages (default)
discord history "#general"

# Last 50 messages
discord history "#general" --limit 50

# Messages after a specific message
discord history "#general" --after 1494558460027736144

# Full content, no truncation
discord history "#general" --full

# JSON output
discord history "#general" --json
```

## Arguments

| Arg | Description |
|-----|-------------|
| `channel` | Channel ID or `#channel-name` |

## Options

| Flag | Description |
|------|-------------|
| `-g, --guild <id>` | Guild ID for resolving `#channel-name` |
| `-n, --limit <n>` | Number of messages (default: 25, max: 100) |
| `--after <id>` | Fetch messages after this message ID |
| `--before <id>` | Fetch messages before this message ID |
| `--full` | Show full message content without truncation |
| `--json` | Output as JSON for programmatic parsing |

## Output

Default: `[timestamp] author (messageId): content [+N embed(s)] [+N file(s)]`

JSON: Full message objects with all Discord API fields.

## When to use

- Read recent conversation in a channel
- Catch up on discussions
- Pipe JSON output into other tools for analysis
