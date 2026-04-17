# discord react

Add a reaction emoji to a message.

## Usage

```bash
# Unicode emoji
discord react 1473974057459384404 1494558460027736144 "👍"

# Custom server emoji
discord react 1473974057459384404 1494558460027736144 "custom_emoji:123456789"
```

## Arguments

| Arg | Description |
|-----|-------------|
| `channel` | Channel ID containing the message |
| `messageId` | The message to react to |
| `emoji` | Unicode emoji or `name:id` for custom |

## When to use

- Acknowledge messages programmatically
- Add status indicators (checkmark, eyes, etc.)
- Part of automated workflows
