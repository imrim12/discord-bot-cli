# Discord Agent CLI

A command-line interface for managing Discord servers through a bot, purpose-built for AI agent integration. Send messages, read history, list channels/members/roles, poll for new activity, and receive interaction events — all from the terminal.

Built and maintained by [THECODEORIGIN](https://thecodeorigin.com).

## Why Discord Agent CLI?

AI agents need a reliable, scriptable way to interact with Discord. Most Discord libraries are designed for long-running bots with persistent gateway connections. This CLI takes a different approach — lightweight, stateless REST commands that agents can call on demand, plus an active polling mechanism for monitoring channels without a gateway connection.

- **Agent-first design** — JSON output, exit codes, and stateless commands built for automation
- **Active polling** — no gateway required, just sequential REST pulls on a configurable interval
- **Webhook receiver** — ngrok-tunneled HTTP server with auto-registration and cleanup
- **Self-diagnosing** — built-in `doctor` command validates your entire setup in seconds
- **Zero config resolution** — use `#channel-name` instead of memorizing IDs

## Installation

```bash
# Install globally from npm
npm install -g discord-agent-cli

# Or with pnpm
pnpm add -g discord-agent-cli

# Or run directly with npx
npx discord-agent-cli status
```

After installation, the `discord` command is available globally.

### Install from source

```bash
git clone https://github.com/imrim12/discord-agent-cli.git
cd discord-agent-cli
pnpm install
pnpm build
pnpm link --global
```

## Quick Start

```bash
# 1. Configure your bot token
echo "DISCORD_BOT_TOKEN=your-token-here" > .env
echo "DISCORD_GUILD_ID=your-guild-id" >> .env

# 2. Verify everything works
discord doctor

# 3. Start using it
discord channels --type text
discord send "#general" "Hello from the CLI!"
discord history "#general" --limit 10
```

## Setup

### 1. Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**, name it, and save
3. Go to the **Bot** tab, click **Reset Token**, and copy it
4. Under **Privileged Gateway Intents**, enable:
  - **Server Members Intent** (required for `discord members`)
  - **Message Content Intent** (required to read message text from other users)
5. Go to **OAuth2 > URL Generator**:
  - Scopes: `bot`
  - Permissions: Read Messages/View Channels, Send Messages, Read Message History, Embed Links, Add Reactions, Attach Files
6. Open the generated URL to invite the bot to your server

### 2. Configure credentials

Create a `.env` file in the directory where you run the CLI:

```bash
DISCORD_BOT_TOKEN=your-bot-token-here
DISCORD_GUILD_ID=your-default-guild-id
DISCORD_APPLICATION_ID=your-application-id
DISCORD_PUBLIC_KEY=your-public-key-hex
DISCORD_POLL_INTERVAL=30
NGROK_AUTHTOKEN=your-ngrok-authtoken
```

Or use `.env.local` for local overrides that take the highest priority.

**Credential precedence** (later overrides earlier):

1. Global environment variables
2. `.env` file
3. `.env.local` file


| Variable                 | Required | Description                                                                                                          |
| ------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `DISCORD_BOT_TOKEN`      | Yes      | Bot token from Developer Portal                                                                                      |
| `DISCORD_GUILD_ID`       | No       | Default guild ID (avoids `--guild` on every command)                                                                 |
| `DISCORD_APPLICATION_ID` | No       | Application ID (required for `webhook` command)                                                                      |
| `DISCORD_PUBLIC_KEY`     | No       | Public key hex (required for `webhook` signature verification)                                                       |
| `DISCORD_POLL_INTERVAL`  | No       | Poll interval in seconds for `listen` (default: 30)                                                                  |
| `NGROK_AUTHTOKEN`        | No       | ngrok auth token (required for `webhook` command, get at [https://dashboard.ngrok.com](https://dashboard.ngrok.com)) |


### 3. Verify setup

```bash
discord doctor
```

This checks all env vars, validates the token, verifies guild access and bot permissions, inspects the listen state file, and confirms ngrok is available.

## Commands

### `discord doctor`

Diagnose environment, credentials, permissions, and state.

```bash
discord doctor
```

Checks 16 items: env files, all env vars, token validity, guild access, channel permissions, bot roles, listen state file, and ngrok availability. Exits with code 1 if any critical check fails.

### `discord status`

Show bot identity, connected guilds, and server info.

```bash
discord status
```

### `discord guilds`

List all servers the bot is a member of.

```bash
discord guilds
```

### `discord channels`

List channels in a guild.

```bash
discord channels                    # All channels
discord channels --type text        # Text channels only
discord channels --type voice       # Voice channels only
discord channels --guild <id>       # Specific guild
```

### `discord members`

List guild members (requires Server Members Intent).

```bash
discord members                     # Default guild
discord members --limit 50          # Limit results
```

### `discord roles`

List all roles in a guild.

```bash
discord roles
```

### `discord send`

Send a message to a channel.

```bash
discord send "#general" "Hello!"                     # By channel name
discord send 1234567890 "Hello!"                     # By channel ID
discord send "#general" "Agreed!" --reply 9876543210 # Reply to message
discord send "#bot-status" "All good" --embed        # Rich embed
```

Channel names use suffix matching: `#general` matches channels like `general`.

### `discord history`

Read message history from a channel.

```bash
discord history "#general"                # Last 25 messages
discord history "#general" --limit 50     # Last 50
discord history "#general" --full         # No truncation
discord history "#general" --json         # JSON output
discord history "#general" --after <id>   # After a specific message
```

### `discord react`

Add a reaction to a message.

```bash
discord react <channelId> <messageId> "thumbsup"
```

### `discord pins`

List pinned messages in a channel.

```bash
discord pins "#general"
```

### `discord threads`

List active threads in a guild.

```bash
discord threads
```

### `discord listen`

Poll all text channels for new messages on a recurring interval.

```bash
discord listen                          # Poll every 30s (default)
discord listen --interval 10            # Poll every 10s
discord listen --channels <id1>,<id2>   # Watch specific channels
discord listen --json                   # JSON line output
discord listen --once                   # Poll once and exit
discord listen --reset                  # Clear state, start fresh
```

**How it works:**

- First run seeds each channel's last-seen position (no output)
- Each tick polls every text channel for messages after the last-seen ID
- State is persisted to `.discord-listen-state.json` across restarts
- Channels the bot can't access (403) are silently skipped
- Graceful shutdown on SIGINT/SIGTERM saves state

**Background usage:**

```bash
discord listen &                        # Run in background
discord listen --json >> messages.log & # Log to file
```

### `discord webhook`

Start a local webhook server exposed via ngrok to receive Discord interaction events.

```bash
discord webhook                  # Default port 8787
discord webhook --port 3000      # Custom port
discord webhook --json           # JSON output
discord webhook --cleanup        # Clear stale endpoint after a crash
```

**How it works:**

1. Starts an HTTP server on the specified port
2. Creates an ngrok tunnel to expose it publicly
3. Registers the tunnel URL as the application's Interactions Endpoint on Discord
4. Discord verifies with a PING — the server responds with PONG
5. All interactions (slash commands, buttons, modals) are logged to stdout
6. On Ctrl+C: restores the previous endpoint (or clears it), closes ngrok, stops server

**Crash recovery:** If the process gets killed without graceful shutdown, the stale endpoint remains on Discord. Run `discord webhook --cleanup` to clear it.

**Required env vars:** `DISCORD_APPLICATION_ID`, `DISCORD_PUBLIC_KEY`, `NGROK_AUTHTOKEN`

## Agent Integration

This CLI is designed for AI agents. Typical workflow:

```bash
# 1. Check for new messages
discord listen --once --json

# 2. Read specific channel
discord history "#support" --json --limit 10

# 3. Respond
discord send "#support" "Issue resolved, deploying fix now."

# 4. Acknowledge
discord react <channelId> <messageId> "white_check_mark"
```

The `--json` flag on `history` and `listen` outputs structured JSON suitable for programmatic consumption. The `listen --once` mode is designed for scheduled polling in agent heartbeat loops.

See `[skills/discord-cli/SKILL.md](skills/discord-cli/SKILL.md)` for the full agent skill documentation.

## Project Structure

```
discord-agent-cli/
  src/                          # TypeScript source
    cli.ts                      # CLI entrypoint
    lib/
      config.ts                 # Env/config loader
      client.ts                 # Discord REST API wrapper
      format.ts                 # Table/timestamp formatters
      resolve-channel.ts        # #channel-name resolution
    commands/
      doctor.ts                 # discord doctor
      status.ts                 # discord status
      guilds.ts                 # discord guilds
      channels.ts               # discord channels
      members.ts                # discord members
      roles.ts                  # discord roles
      send.ts                   # discord send
      history.ts                # discord history
      react.ts                  # discord react
      pins.ts                   # discord pins
      threads.ts                # discord threads
      listen.ts                 # discord listen
      webhook.ts                # discord webhook
  dist/                         # Compiled output
  skills/
    discord-cli/
      SKILL.md                  # Agent skill overview
      references/               # Per-command reference docs
  .env.example                  # Template for credentials
```

## Development

```bash
git clone https://github.com/nickytonline/discord-agent-cli.git
cd discord-agent-cli
pnpm install
pnpm build
pnpm start -- status           # Run a command
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

## Contributing

We welcome contributions of all kinds — bug reports, feature requests, documentation improvements, and code. Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a pull request.

## Contact

- **Email:** [contact@thecodeorigin.com](mailto:contact@thecodeorigin.com)
- **Subject format:** `[Discord Agent CLI] <your subject here>`

**Example:**

```
To: contact@thecodeorigin.com
Subject: [Discord Agent CLI] Feature request — support for forum channels

Hi,

I'd like to request support for listing and posting in forum channels.
My use case is ...

Thanks!
```

## License

MIT &copy; [THECODEORIGIN](https://thecodeorigin.com)