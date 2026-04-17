# discord webhook

Start a local HTTP server exposed via ngrok to receive Discord interaction events (slash commands, buttons, modals). Automatically registers the tunnel URL as the application's Interactions Endpoint on Discord and cleans it up on exit.

## Usage

```bash
# Start with defaults (port 8787)
discord webhook

# Custom port
discord webhook --port 3000

# JSON output for piping
discord webhook --json

# Clean up a stale endpoint after a crash
discord webhook --cleanup
```

## Options

| Flag | Description |
|------|-------------|
| `-p, --port <port>` | Local HTTP server port (default: 8787) |
| `--json` | Output received interactions as JSON lines |
| `--cleanup` | Clear the interactions endpoint from Discord and exit (use after a crash) |

## Required environment variables

| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Bot token (for API calls) |
| `DISCORD_APPLICATION_ID` | Application ID from Developer Portal |
| `DISCORD_PUBLIC_KEY` | Public key for verifying Discord signatures |
| `NGROK_AUTHTOKEN` | ngrok auth token (get at https://dashboard.ngrok.com) |

## How it works

1. Starts an HTTP server on the specified port
2. Creates an ngrok tunnel to expose it publicly
3. Calls `PATCH /applications/@me` to set the tunnel URL as the Interactions Endpoint
4. Discord sends a PING to verify — the server responds with PONG
5. All subsequent interactions are logged to stdout
6. On Ctrl+C (SIGINT), the endpoint is restored/cleared and ngrok is shut down

## Lifecycle

```
Start → HTTP server → ngrok tunnel → Register endpoint → Wait for events
                                                              ↓
Ctrl+C → Restore/clear endpoint → Close ngrok → Stop server → Exit
```

## What you receive

- **PING** — Discord verification (handled automatically)
- **APPLICATION_COMMAND** — Slash command invocations
- **MESSAGE_COMPONENT** — Button clicks, select menus
- **MODAL_SUBMIT** — Modal form submissions
- **AUTOCOMPLETE** — Slash command autocomplete requests

## When to use

- Testing slash commands and interactions locally
- Receiving Discord events without a permanent server
- Development and debugging of Discord app features
- Temporary webhook endpoint for agent integration

## Tips

- Run `discord doctor` first to verify all credentials are set
- The endpoint is automatically cleaned up on Ctrl+C — no leftover config
- If the process crashes without cleanup, the stale endpoint URL will fail Discord's verification and interactions will stop working. Run `discord webhook --cleanup` to clear it.
- `--cleanup` is idempotent — safe to run even if no endpoint is set.
