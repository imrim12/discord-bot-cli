# discord status

Check the bot's identity, connection status, and which servers it belongs to.

## Usage

```bash
discord status
```

## Output

- Bot username, discriminator, and ID
- Number of guilds and their names/IDs
- If `DISCORD_GUILD_ID` is set: approximate member and online counts

## When to use

- Verify the bot is properly configured and connected
- Confirm which servers the bot has access to
- Health check before running other commands
