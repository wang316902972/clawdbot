# Project Context

## Purpose

**Clawdbot** is a personal AI assistant that runs on your own devices. It provides:

- **Multi-channel communication**: WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat, and extension channels (BlueBubbles, Matrix, Zalo, Zalo Personal)
- **Voice interface**: Speak and listen on macOS/iOS/Android
- **Interactive Canvas**: Live canvas that users can control
- **Local-first**: Fast, always-on, single-user assistant
- **Gateway control plane**: Gateway is just the control — the product is the assistant

The project emphasizes privacy, local execution, and seamless integration with existing communication channels.

## Tech Stack

### Core Runtime
- **TypeScript**: Strict mode, ES2022 target, NodeNext module resolution
- **Node.js**: ≥22.12.0 (required runtime)
- **Package Manager**: pnpm 10.23.0 (preferred), Bun optional for dev

### Build & Tooling
- **Build Tool**: TypeScript compiler (tsc)
- **Bundler**: Rolldown (for some packages)
- **Linting**: Oxlint (type-aware) with custom tsgolint rules
- **Formatting**: Oxfmt (code), SwiftFormat (Swift code)
- **Testing**: Vitest with V8 coverage
- **UI**: Vite + Rolldown for web UI, Xcode for iOS/macOS, Gradle for Android

### Major Dependencies
- **AI/Agent**: Pi Agent (@mariozechner/*), ACP SDK, Carbon
- **Messaging**: Baileys (WhatsApp), Grammy (Telegram), Slack Bolt, Discord API, Signal utils, Wechaty
- **Web**: Express, Hono, Playwright
- **Database**: SQLite with sqlite-vec for vector search
- **Media**: Sharp, @napi-rs/canvas, PDF.js, node-edge-tts

### Platform Support
- **CLI**: macOS, Linux, Windows (WSL2 strongly recommended)
- **Desktop**: Native macOS app
- **Mobile**: iOS (Swift), Android (Kotlin)

## Project Conventions

### Code Style
- **TypeScript strict mode**: All code must pass strict type checking
- **File size limit**: Aim for <700 LOC per file (guideline, not hard limit)
- **Naming conventions**:
  - Use **Clawdbot** for product/app/docs headings
  - Use **clawdbot** for CLI command, package/binary, paths, and config keys
- **Import style**: ESM only (`"type": "module"`), NodeNext module resolution
- **Comments**: Add brief code comments for tricky or non-obvious logic

### Formatting & Linting
```bash
# Check formatting
pnpm format        # Oxfmt check
pnpm format:swift  # SwiftFormat check

# Lint
pnpm lint          # Oxlint type-aware
pnpm lint:swift    # SwiftLint

# Auto-fix
pnpm format:fix    # Oxfmt write
pnpm lint:fix      # Oxfmt + Oxlint --fix
```

### Architecture Patterns

#### Plugin System
- **Extensions**: Live under `extensions/*` as workspace packages
- **Plugin SDK**: Exposed via `clawdbot/plugin-sdk`
- **Runtime deps**: Must live in plugin `dependencies` (not devDependencies)
- **Install pattern**: `npm install --omit=dev` in plugin dir

#### Channel Architecture
- **Core channels**: `src/{telegram,discord,slack,signal,imessage,web,whatsapp}/`
- **Extension channels**: `extensions/{msteams,matrix,zalo,zalouser,voice-call}/`
- **Shared logic**: Always consider ALL channels (core + extensions) when refactoring routing, allowlists, pairing, command gating, onboarding

#### Gateway Pattern
- **Gateway**: Control plane only, manages connections and routing
- **Agent**: The actual AI assistant logic
- **Sessions**: Live under `~/.clawdbot/sessions/` by default

#### File Organization
- **Source code**: `src/` (CLI in `src/cli`, commands in `src/commands`, infra in `src/infra`)
- **Tests**: Colocated `*.test.ts` next to source
- **Docs**: `docs/` (built output in `dist/`)
- **Extensions**: `extensions/*` (workspace packages)

### Testing Strategy

#### Coverage Requirements
- **V8 coverage thresholds**: 70% lines/branches/functions/statements
- **Test types**:
  - Unit tests: `*.test.ts` (colocated with source)
  - E2E tests: `*.e2e.test.ts`
  - Live tests: `vitest.live.config.ts` (requires `CLAWDBOT_LIVE_TEST=1`)

#### Test Commands
```bash
pnpm test                # Run all tests
pnpm test:coverage       # Coverage report
pnpm test:e2e           # E2E tests
pnpm test:live          # Live tests (requires flag)
pnpm test:docker:all    # Full Docker E2E suite
```

#### Testing Guidelines
- Do not set test workers above 16
- Run `pnpm test` before pushing when touching logic
- Pure test additions generally do NOT need changelog entries

### Git Workflow

#### Branching Strategy
- **main**: Primary development branch
- **feature branches**: Use for development (no strict naming convention)
- **Release channels**: stable (tags), beta (prereleases), dev (main head)

#### Commit Conventions
- **Use script**: `scripts/committer "<msg>" <file...>` (avoids manual git add/commit)
- **Style**: Concise, action-oriented (e.g., "CLI: add verbose flag to send")
- **Changelog**: Keep latest released version at top (no "Unreleased" section)

#### PR Guidelines
- **Review mode**: Use `gh pr view`/`gh pr diff`, do NOT switch branches
- **Landing mode**: Create integration branch from main, merge PR (prefer rebase), apply fixes, add changelog entry
- **Goal**: Merge PRs (prefer rebase for clean history, squash when messy)
- **After merge**: Run `bun scripts/update-clawtributors.ts` for new contributors

#### Sync Command
- **sync**: Commit all dirty changes → `git pull --rebase` → `git push` (or stop on conflict)

## Domain Context

### Multi-Channel Messaging
Clawdbot integrates with 10+ messaging platforms. Each channel has:
- **Connection provider**: Authentication and session management
- **Message handlers**: Sending, receiving, and routing messages
- **Format conversion**: Channel-specific to internal message format
- **Status tracking**: Connection health and delivery status

### AI Agent Integration
- **Model providers**: Anthropic (recommended), OpenAI, AWS Bedrock, local models via Ollama
- **Agent protocol**: Agent Client Protocol (ACP) SDK for structured communication
- **Pi integration**: @mariozechner/pi-* for core agent functionality
- **Long context**: Support for extended context windows (Anthropic Pro/Max)

### Media Pipeline
- **Images**: Sharp for processing, @napi-rs/canvas for generation
- **Documents**: PDF.js for PDF parsing, markdown-it for rendering
- **Audio**: node-edge-tts for text-to-speech
- **Vector search**: sqlite-vec for semantic search

### Session Management
- **Location**: `~/.clawdbot/sessions/` (not configurable)
- **Format**: JSONL logs per agent session
- **Persistence**: Agent conversations and tool outputs

## Important Constraints

### Technical Constraints
- **Node version**: Requires Node ≥22.12.0
- **Platform support**: CLI on macOS/Linux/Windows(WSL2), native apps on iOS/macOS/Android
- **Memory/performance**: Files should stay under ~700 LOC when feasible
- **Type safety**: No `any` types, strict TypeScript enforcement

### Platform-Specific Constraints
- **macOS app**: Cannot rebuild over SSH; must be built directly on Mac
- **iOS/Android**: Check for connected real devices before reaching for simulators/emulators
- **Windows**: WSL2 strongly recommended for CLI usage

### Security Constraints
- **No committing**: Real phone numbers, videos, or live configuration values
- **Use placeholders**: Fake data in docs, tests, and examples
- **Credentials**: Web provider stores creds at `~/.clawdbot/credentials/`

### Multi-Agent Safety
- **No git stash**: Do not create/apply/drop stash entries unless explicitly requested
- **Branch safety**: Do not switch branches unless explicitly requested
- **Worktree safety**: Do not create/remove/modify git worktrees unless explicitly requested
- **Commit scope**: "push" may `git pull --rebase`, "commit" scopes to your changes only

## External Dependencies

### AI/ML Services
- **Anthropic Claude**: Recommended AI provider (best for long context)
- **OpenAI**: Alternative AI provider
- **AWS Bedrock**: AWS-hosted model access
- **Ollama**: Local model execution (optional dependency)

### Messaging Platforms
- **WhatsApp**: Baileys library (web protocol)
- **Telegram**: Grammy library
- **Slack**: Slack Bolt SDK
- **Discord**: discord-api-types
- **Signal**: signal-utils
- **Google Chat**: Google Chat API
- **iMessage**: Apple-specific (macOS/iOS only)
- **Microsoft Teams**: Microsoft Bot Framework
- **WeChat**: Wechaty (extension)
- **Other**: Matrix, Zalo, Zalo Personal, BlueBubbles (extensions)

### Development Tools
- **Oxlint**: Fast linting with custom rules
- **Oxfmt**: Code formatting
- **Vitest**: Testing framework
- **TypeScript**: Compiler and language server
- **Bun**: Optional runtime for dev (for TypeScript execution)

### Documentation
- **Mintlify**: Docs hosted at docs.clawd.bot
- **Links**: Use root-relative paths in `docs/**/*.md` (no `.md` extension)
- **External**: Keep absolute URLs in README for GitHub compatibility

### Release Infrastructure
- **npm**: Public registry distribution
- **GitHub**: Releases, issues, PRs
- **1Password**: OTP and credential management for publishing
- **Installers**: Served from `https://clawd.bot/*` (sibling repo `../clawd.bot`)
