---
name: discord-cli
description: Interact with Discord servers from the terminal via the `discord-agent` CLI — send/read messages, list channels/members/roles, react, poll channels for new activity, and run a webhook receiver. Use when the user wants to send a Discord message, read channel history, monitor a server, react to a message, or otherwise drive a Discord bot from an agent/script.
---

# Discord CLI

A command-line interface for managing Discord servers, channels, messages, and real-time activity monitoring via a Discord Bot.

## Overview

This CLI uses the Discord REST API through a bot token to interact with servers. It supports sending/reading messages, listing channels/members/roles, reacting to messages, and continuously polling for new activity.

All commands load credentials in this order (later overrides earlier):
1. Global environment variables
2. `.env` file in the working directory
3. `.env.local` file in the working directory

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `DISCORD_GUILD_ID` | No | Default guild ID (avoids passing `--guild` every time) |
| `DISCORD_APPLICATION_ID` | No | Application ID (required for `webhook` command) |
| `DISCORD_PUBLIC_KEY` | No | Public key hex (required for `webhook` signature verification) |
| `DISCORD_POLL_INTERVAL` | No | Default poll interval in seconds for `listen` (default: 30) |
| `NGROK_AUTHTOKEN` | No | ngrok auth token (required for `webhook` command) |

## Commands

| Command | Description | Reference |
|---------|-------------|-----------|
| `discord status` | Show bot identity and connected guilds | [status.md](references/status.md) |
| `discord guilds` | List all servers the bot is in | [guilds.md](references/guilds.md) |
| `discord channels` | List all channels in a guild | [channels.md](references/channels.md) |
| `discord members` | List guild members | [members.md](references/members.md) |
| `discord roles` | List all roles in a guild | [roles.md](references/roles.md) |
| `discord send` | Send a message to a channel | [send.md](references/send.md) |
| `discord history` | Read message history from a channel | [history.md](references/history.md) |
| `discord react` | Add a reaction emoji to a message | [react.md](references/react.md) |
| `discord pins` | List pinned messages in a channel | [pins.md](references/pins.md) |
| `discord threads` | List active threads in a guild | [threads.md](references/threads.md) |
| `discord listen` | Poll channels for new messages on interval | [listen.md](references/listen.md) |
| `discord doctor` | Diagnose env, credentials, permissions, and state | [doctor.md](references/doctor.md) |
| `discord webhook` | Start ngrok webhook for Discord interaction events | [webhook.md](references/webhook.md) |

## Quick Examples

```bash
# Diagnose setup
discord doctor

# Check bot is working
discord status

# List text channels
discord channels --type text

# Send a message
discord send "#general" "Hello from the CLI!"

# Read last 10 messages
discord history "#general" --limit 10

# Start background listener (polls every 30s)
discord listen

# Listen with JSON output for piping to other tools
discord listen --json

# Start webhook server (ngrok tunnel + auto-registration)
discord webhook

# Clean up stale webhook endpoint after a crash
discord webhook --cleanup
```

## Channel Name Resolution

Any command that takes a `<channel>` argument accepts either:
- A channel ID: `1473974057459384404`
- A `#channel-name`: `#general`

Channel name resolution uses suffix matching, so `#general` will match `💬・general`. This requires `DISCORD_GUILD_ID` to be set or `--guild` to be passed.

## Agent Integration

This CLI is designed to be used by AI agents. The `--json` flag on `history` and `listen` outputs structured JSON suitable for programmatic consumption. The `listen --once` mode is useful for scheduled polling in agent heartbeat loops.

Typical agent workflow:
1. `discord listen --once --json` — check for new messages
2. Process messages and decide on actions
3. `discord send "#channel" "response"` — reply
4. `discord react <channel> <messageId> "✅"` — acknowledge
