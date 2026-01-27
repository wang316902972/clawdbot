# WeChat Integration Documentation

## Overview

This document describes the WeChat integration for Clawdbot, including the plugin-sdk helper functions, configuration schema, and implementation details.

## Architecture

### Plugin Structure

```
extensions/wechat/
├── package.json              # NPM configuration (wechaty dependencies)
├── index.ts                  # Plugin entry point
├── src/
│   ├── runtime.ts           # Runtime management
│   ├── channel.ts           # Channel interface implementation
│   ├── bot.ts               # WeChat bot management (Wechaty)
│   └── bridge.ts            # WhatsApp-WeChat bridge logic
├── README.md                # Plugin documentation
└── SETUP.md                 # Setup guide
```

### Core Integration Files

```
src/
├── wechat/
│   ├── accounts.ts          # Account management
│   ├── normalize.ts         # Target normalization
│   ├── accounts.test.ts     # Account tests
│   └── normalize.test.ts    # Normalization tests
├── channels/plugins/
│   ├── onboarding/wechat.ts # Onboarding wizard
│   ├── normalize/wechat.ts  # Plugin normalization
│   └── group-mentions.ts    # Group mention support
├── config/
│   └── zod-schema.wechat.ts # Config schema
└── plugin-sdk/
    └── index.ts             # Exported functions
```

## Plugin-SDK API

### Account Management

```typescript
import {
  listWeChatAccountIds,
  resolveDefaultWeChatAccountId,
  resolveWeChatAccount,
  type ResolvedWeChatAccount,
} from "clawdbot/plugin-sdk";

// List all configured WeChat accounts
const accountIds = listWeChatAccountIds(cfg);
// Returns: ["default", "account1", "account2"]

// Get the default account ID
const defaultId = resolveDefaultWeChatAccountId(cfg);
// Returns: "default"

// Resolve a specific account
const account: ResolvedWeChatAccount = resolveWeChatAccount({
  cfg,
  accountId: "default",
});
```

### ResolvedWeChatAccount Type

```typescript
type ResolvedWeChatAccount = {
  accountId: string;
  name?: string;
  enabled: boolean;
  botName?: string;
  puppet?: string;
  dmPolicy?: "pairing" | "allowlist" | "open" | "disabled";
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groupPolicy?: "open" | "allowlist" | "disabled";
  groups?: Record<string, WeChatGroupConfig>;
  messagePrefix?: string;
  historyLimit?: number;
  dmHistoryLimit?: number;
  textChunkLimit?: number;
  chunkMode?: "length" | "newline";
  blockStreaming?: boolean;
  streamMode?: "off" | "partial" | "block";
  mediaMaxMb?: number;
  markdown?: MarkdownConfig;
  commands?: ProviderCommandsConfig;
  configWrites?: boolean;
  actions?: WeChatActionConfig;
  heartbeat?: ChannelHeartbeatVisibilityConfig;
  retry?: OutboundRetryConfig;
  dms?: Record<string, DmConfig>;
  draftChunk?: BlockStreamingChunkConfig;
  blockStreamingCoalesce?: BlockStreamingCoalesceConfig;
};
```

### Target Normalization

```typescript
import {
  normalizeWeChatTarget,
  isWeChatUserTarget,
  isWeChatGroupTarget,
} from "clawdbot/plugin-sdk";

// Normalize WeChat targets (users and groups)
const userId = normalizeWeChatTarget("wxid_abc123def456");
// Returns: "wxid_abc123def456"

const groupId = normalizeWeChatTarget("12345678900@chatroom");
// Returns: "12345678900@chatroom"

// Check target types
const isUser = isWeChatUserTarget("wxid_abc123");
// Returns: true

const isGroup = isWeChatGroupTarget("12345678900@chatroom");
// Returns: true
```

### Group Configuration

```typescript
import {
  resolveWeChatGroupRequireMention,
  resolveWeChatGroupToolPolicy,
} from "clawdbot/plugin-sdk";

// Check if group requires @mention
const requireMention = resolveWeChatGroupRequireMention({
  cfg,
  groupId: "12345678900@chatroom",
  accountId: "default",
});
// Returns: true or false

// Get group tool policy
const toolPolicy = resolveWeChatGroupToolPolicy({
  cfg,
  groupId: "12345678900@chatroom",
  accountId: "default",
});
// Returns: GroupToolPolicyConfig or undefined
```

### Onboarding

```typescript
import { wechatOnboardingAdapter } from "clawdbot/plugin-sdk";

// Get WeChat status
const status = await wechatOnboardingAdapter.getStatus({
  cfg,
  accountOverrides: { wechat: "default" },
});
// Returns: { channel, configured, statusLines, selectionHint, quickstartScore }

// Configure WeChat
const result = await wechatOnboardingAdapter.configure({
  cfg,
  runtime,
  prompter,
  accountOverrides,
  shouldPromptAccountIds,
});
// Returns: { cfg: updatedConfig, accountId }
```

### Config Schema

```typescript
import { WeChatConfigSchema } from "clawdbot/plugin-sdk";

// Validate WeChat configuration
const result = WeChatConfigSchema.parse(rawConfig);
```

## Configuration

### Basic Config

```yaml
# ~/.clawdbot/config.yaml

channels:
  wechat:
    # Global settings
    enabled: true
    dmPolicy: "pairing"  # pairing | allowlist | open | disabled
    groupPolicy: "allowlist"  # open | allowlist | disabled

    # Bot configuration
    botName: "Clawdbot"
    puppet: "wechaty-puppet-wechat"

    # Access control
    allowFrom:
      - "wxid_abc123def456"
      - "username_ghi789"
    groupAllowFrom:
      - "wxid_xyz111"

    # Message handling
    textChunkLimit: 2000
    chunkMode: "length"
    streamMode: "partial"
    mediaMaxMb: 100

    # Multi-account support
    accounts:
      default:
        name: "My WeChat Bot"
        enabled: true
        botName: "Clawdbot"

      work:
        name: "Work Account"
        enabled: true
        dmPolicy: "allowlist"
```

### Group Configuration

```yaml
channels:
  wechat:
    groups:
      "12345678900@chatroom":
        requireMention: true  # Require @mention in groups
        enabled: true
        allowFrom:
          - "wxid_allowed_user"
        tools:
          policy: "allowlist"
          allow:
            - "weather"
            - "calc"
        skills:
          - "finance"
        systemPrompt: "You are a helpful assistant for this group."

      "*":  # Default for all groups
        requireMention: true
        enabled: true
```

## WeChat ID Formats

### User IDs

WeChat user IDs come in two formats:

1. **Internal IDs**: `wxid_abc123def456` (auto-generated)
2. **Usernames**: `username_123` (custom WeChat ID)

Examples:
```typescript
"wxid_abc123def456"      // Internal ID
"username_test"         // Custom username
"user_123"              // Custom username with underscore
```

### Group IDs

WeChat group IDs use the format: `{number}@chatroom`

Examples:
```typescript
"12345678900@chatroom"   // 11-digit group ID
"98765432100@chatroom"   // Another group
```

### Normalization Rules

1. Strip `wechat:` prefix (case-insensitive)
2. Convert to lowercase for IDs
3. Trim whitespace
4. Validate format:
   - User IDs: Must start with `wx_` followed by 10+ alphanumeric chars
   - Group IDs: Must be 10+ digits followed by `@chatroom`
   - Usernames: Any non-empty string (trimmed)

## Message Handling

### Supported Message Types

- ✅ Text messages
- ✅ Images (Image type)
- ✅ Files/Attachments (Attachment type)
- ✅ Group messages
- ✅ Direct messages

### Message Flow

```
WeChat Message
  ↓
Wechaty Event Listener
  ↓
Message Parser (extract sender, room, text, type)
  ↓
Target Normalization (wxid → canonical form)
  ↓
Security Check (DM policy, group policy, mention gating)
  ↓
Clawdbot Runtime (AI processing)
  ↓
Response Generation
  ↓
WeChat Sender (via Wechaty)
```

## Security Model

### DM Policy

- **pairing**: Unknown senders get a pairing code; owner must approve
- **allowlist**: Only senders in `allowFrom` can message
- **open**: Public inbound DMs (requires `allowFrom: ["*"]`)
- **disabled**: Ignore all DMs

### Group Policy

- **open**: Groups bypass `allowFrom`, only mention-gating applies
- **allowlist**: Only groups in `groupAllowFrom` can message
- **disabled**: Block all group messages

### Mention Gating

Groups can require `@mention` to trigger the bot:

```yaml
channels:
  wechat:
    groups:
      "12345678900@chatroom":
        requireMention: true  # Must @mention bot
```

## Testing

### Unit Tests

```bash
# Run WeChat tests
pnpm test src/wechat/

# Run specific test file
pnpm test src/wechat/normalize.test.ts
pnpm test src/wechat/accounts.test.ts
```

### Test Coverage

- ✅ Target normalization (users, groups, prefixes, invalid input)
- ✅ Account listing and resolution
- ✅ Config merging and defaults
- ✅ ID normalization
- ✅ Enabled/disabled states

## Examples

### Example 1: Simple Bot

```yaml
channels:
  wechat:
    enabled: true
    dmPolicy: "pairing"
    botName: "MyBot"
```

### Example 2: Multi-Account Setup

```yaml
channels:
  wechat:
    accounts:
      personal:
        name: "Personal Account"
        enabled: true
        dmPolicy: "pairing"

      work:
        name: "Work Account"
        enabled: true
        dmPolicy: "allowlist"
        allowFrom:
          - "wxid_colleague1"
          - "wxid_colleague2"
```

### Example 3: Group Configuration

```yaml
channels:
  wechat:
    groupPolicy: "allowlist"
    groupAllowFrom:
      - "12345678900@chatroom"  # Family group
      - "98765432100@chatroom"  # Work group

    groups:
      "12345678900@chatroom":
        requireMention: false  # Always active in family group
        systemPrompt: "You are a friendly family assistant."

      "98765432100@chatroom":
        requireMention: true  # Only when @mentioned
        tools:
          policy: "allowlist"
          allow:
            - "schedule"
            - "meeting"
```

## Troubleshooting

### Common Issues

1. **Bot not starting**
   - Check puppet is installed: `npm install wechaty-puppet-wechat`
   - Verify bot name is unique
   - Check logs for error messages

2. **Messages not received**
   - Verify WeChat is logged in
   - Check `dmPolicy` and `allowFrom` settings
   - Ensure group has `requireMention: false` or user @mentioned

3. **Normalization failing**
   - Ensure ID format is correct (wxid_*, *@chatroom)
   - Check for whitespace in IDs
   - Verify prefix is stripped

### Debug Mode

```yaml
# Enable debug logging
channels:
  wechat:
    enabled: true
    debug: true  # Enable verbose logging
```

## Performance Considerations

- **Message batching**: Wechaty handles message queuing
- **Media limits**: Default 100MB max per file
- **Text chunking**: 2000 chars per chunk (default)
- **Rate limiting**: WeChat has built-in rate limits

## Security Best Practices

1. **Never commit WeChat credentials** (session files, tokens)
2. **Use `pairing` mode** for production (not `open`)
3. **Restrict `allowFrom`** to known users
4. **Enable `requireMention`** in busy groups
5. **Monitor logs** for suspicious activity

## References

- [Wechaty Documentation](https://wechaty.js.org/)
- [Wechaty GitHub](https://github.com/wechaty/wechaty)
- [Clawdbot Docs](https://docs.clawd.bot/)
- [Plugin Development Guide](https://docs.clawd.bot/plugins)

## Changelog

### 2026-01-27
- ✅ Initial WeChat integration
- ✅ Plugin-sdk helper functions
- ✅ Account management
- ✅ Target normalization
- ✅ Group configuration
- ✅ Onboarding wizard
- ✅ Config schema
- ✅ Unit tests

### Next Steps

- ⏳ Bot implementation (Wechaty integration)
- ⏳ Message routing to runtime
- ⏳ CLI commands (`clawdbot channels add wechat`)
- ⏳ Integration tests
- ⏳ Documentation updates
