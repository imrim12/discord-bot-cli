# Contributing to Discord Agent CLI

Thank you for your interest in contributing to Discord Agent CLI! This project is open source under the MIT license and we welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Adding a New Command](#adding-a-new-command)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Contact](#contact)

## Code of Conduct

Be respectful, constructive, and professional. We are building tools that people rely on — treat every contributor's time and effort with the same care you'd want for your own.

## How to Contribute

There are many ways to contribute:

- **Report bugs** — found something broken? Open an issue.
- **Fix bugs** — check the issue tracker for open bugs and submit a fix.
- **Add features** — propose your idea in an issue first, then implement it.
- **Improve documentation** — typos, unclear instructions, missing examples — all welcome.
- **Write tests** — help us improve coverage and reliability.
- **Review pull requests** — a second pair of eyes is always valuable.

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 10+
- A Discord bot token for testing ([create one here](https://discord.com/developers/applications))

### Getting Started

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/discord-agent-cli.git
cd discord-agent-cli

# 2. Install dependencies
pnpm install

# 3. Build
pnpm build

# 4. Set up your test credentials
cp .env.example .env
# Edit .env with your bot token and guild ID

# 5. Verify everything works
node dist/cli.js doctor
```

### Development Workflow

```bash
# Build after making changes
pnpm build

# Run a command
node dist/cli.js <command>

# Run all commands as a smoke test
node dist/cli.js doctor
node dist/cli.js status
node dist/cli.js channels --type text
node dist/cli.js send "#bot-status" "test message"
node dist/cli.js history "#bot-status" --limit 1
node dist/cli.js listen --once
```

## Project Architecture

```
src/
  cli.ts                    # Entrypoint — registers all commands with Commander
  lib/
    config.ts               # Loads DISCORD_* env vars with .env/.env.local precedence
    client.ts               # Thin wrapper around Discord REST API (no gateway)
    format.ts               # Table formatting, timestamps, truncation
    resolve-channel.ts      # Resolves #channel-name to channel ID via suffix match
  commands/
    <command>.ts             # One file per CLI command
```

**Key design decisions:**

- **REST-only for commands.** The CLI uses the Discord REST API directly (via discord.js REST), not the gateway. This keeps commands fast and stateless.
- **Polling over gateway for `listen`.** The `listen` command uses sequential REST polling instead of a WebSocket gateway connection. This is intentional — it's simpler, more debuggable, and fits the CLI execution model.
- **Config is loaded per-invocation.** Each command call loads env vars fresh. No daemon, no persistent state beyond the listen state file.

## Adding a New Command

1. **Create the command file** at `src/commands/<name>.ts`:

```typescript
import { Command } from "commander";
import { loadConfig } from "../lib/config.js";
import { DiscordClient } from "../lib/client.js";

export function registerMyCommand(program: Command) {
  program
    .command("my-command")
    .description("What this command does")
    .option("-f, --flag <value>", "Description of the flag")
    .action(async (opts) => {
      const cfg = loadConfig();
      const dc = new DiscordClient(cfg.token);

      // Implementation here
    });
}
```

2. **Register it in `src/cli.ts`**:

```typescript
import { registerMyCommand } from "./commands/my-command.js";
// ...
registerMyCommand(program);
```

3. **Add a skill reference** at `skills/discord-cli/references/<name>.md`

4. **Update the commands table** in `skills/discord-cli/SKILL.md`

5. **Update `README.md`** with usage examples

6. **Build and test:**

```bash
pnpm build
node dist/cli.js my-command
```

## Coding Standards

- **TypeScript** — all source files are TypeScript with strict mode enabled.
- **ESM** — the project uses ES modules (`"type": "module"` in package.json). Use `.js` extensions in import paths (TypeScript resolves `.ts` files from `.js` imports).
- **No unnecessary abstractions** — keep commands self-contained. Shared logic goes in `lib/`, but don't abstract prematurely.
- **Error handling** — catch Discord API errors and provide clear, actionable messages. Use `process.exit(1)` for unrecoverable errors.
- **Output** — default output is human-readable tables/lines. Use `--json` flags for machine-readable output where applicable.
- **No runtime dependencies beyond what's needed.** Don't add dependencies for things Node.js can do natively.

## Commit Messages

Use clear, descriptive commit messages in imperative mood:

```
add forum channel support to channels command
fix listen state not saving on Windows SIGTERM
update README with webhook --cleanup examples
```

Prefix with a scope when helpful:

```
doctor: check for expired bot token
webhook: restore endpoint on SIGHUP
listen: skip archived channels
```

## Pull Request Process

1. **Open an issue first** for non-trivial changes. Discuss the approach before writing code.
2. **Fork the repo** and create a feature branch from `main`.
3. **Keep PRs focused.** One feature or fix per PR. Small PRs get reviewed faster.
4. **Build and test locally** before submitting. Run `discord doctor` and smoke-test your changes against a real Discord server.
5. **Update documentation** if your change adds or modifies a command.
6. **Write a clear PR description** explaining what changed and why.

### PR Title Format

```
<type>: <short description>

Examples:
feat: add forum channel listing
fix: handle rate limits in listen polling
docs: add webhook --cleanup to README
refactor: extract channel resolution to shared helper
```

## Reporting Bugs

Open an issue with:

- **What you expected** to happen
- **What actually happened** (include error messages and stack traces)
- **Steps to reproduce**
- **Output of `discord doctor`**
- **Environment:** OS, Node.js version, package version

## Requesting Features

Open an issue with:

- **What you want** — describe the feature
- **Why you want it** — what problem does it solve?
- **How you'd use it** — example commands or workflow

We prioritize features that benefit the agent integration use case.

## Contact

For questions, feedback, or partnership inquiries:

- **Email:** [contact@thecodeorigin.com](mailto:contact@thecodeorigin.com)
- **Subject format:** `[Discord Agent CLI] <your subject here>`

---

Thank you for contributing! Every bug report, feature idea, and pull request makes this tool better for everyone.
