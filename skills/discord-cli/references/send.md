# discord send

Send a message to a Discord channel.

## Usage

```bash
# By channel ID
discord send 1473974057459384404 "Hello from the CLI!"

# By channel name
discord send "#general" "Hello from the CLI!"

# Reply to a message
discord send "#general" "I agree!" --reply 1494558460027736144

# Send as rich embed
discord send "#bot-status" "System is online" --embed
```

## Arguments

| Arg | Description |
|-----|-------------|
| `channel` | Channel ID or `#channel-name` |
| `message` | Message content (multiple words joined with spaces) |

## Options

| Flag | Description |
|------|-------------|
| `-g, --guild <id>` | Guild ID for resolving `#channel-name` |
| `-r, --reply <id>` | Reply to a specific message by ID |
| `--embed` | Send as a rich embed with green accent |

## When to use

- Post announcements, status updates, or notifications
- Reply to messages programmatically
- Send bot status reports
- CI/CD notifications and alerts

## Tips

- `#channel-name` uses suffix matching: `#general` matches `💬・general`
- `--embed` makes important messages visually distinct
