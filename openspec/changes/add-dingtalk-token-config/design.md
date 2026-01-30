# Design: DingTalk Token Configuration

## Overview

本设计描述了如何为钉钉channel插件添加token配置功能，使用户能够通过Agent工具或命令行方便地配置钉钉应用的凭证，而无需手动编辑配置文件或扫码登录。

## Architecture

### Current State

```
┌─────────────────────────────────────────────────────────────┐
│                    DingTalk Plugin                          │
├─────────────────────────────────────────────────────────────┤
│  extensions/dingtalk/                                        │
│  ├── index.ts (plugin entry)                                │
│  ├── src/channel.ts (channel implementation)                 │
│  └── src/runtime.ts (runtime holder)                         │
├─────────────────────────────────────────────────────────────┤
│  src/dingtalk/                                               │
│  ├── accounts.ts (account config resolution)                 │
│  ├── send.ts (message sending + token cache)                │
│  └── normalize.ts (target normalization)                     │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Changes

```
┌─────────────────────────────────────────────────────────────┐
│                    DingTalk Plugin (Enhanced)                │
├─────────────────────────────────────────────────────────────┤
│  extensions/dingtalk/src/channel.ts                          │
│  + agentTools: async () => [                                 │
│  +   createLoginTool(),           // existing                │
│  +   configureDingTalkTool()     // NEW                    │
│  + ]                                                          │
├─────────────────────────────────────────────────────────────┤
│  src/dingtalk/send.ts                                        │
│  + validateCredentials()          // NEW                    │
│  + handleConfigureDingTalk()      // NEW                    │
│  + getAccessToken()               // existing, enhanced      │
│  + sendMessageDingTalk()          // existing               │
│  + sendMediaDingTalk()            // existing               │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Credential Validation Function

**Location:** `src/dingtalk/send.ts`

**Function:** `validateDingTalkCredentials(appKey, appSecret)`

**Purpose:** 验证钉钉凭证是否有效，不保存配置

**Algorithm:**

```typescript
async function validateDingTalkCredentials(
  appKey: string,
  appSecret: string
): Promise<{
  valid: boolean;
  accessToken?: string;
  expiresAt?: number;
  error?: string;
  errcode?: number;
}> {
  try {
    const url = `https://oapi.dingtalk.com/gettoken?appkey=${appKey}&appsecret=${appSecret}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.errcode === 0) {
      return {
        valid: true,
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      };
    } else {
      return {
        valid: false,
        error: data.errmsg,
        errcode: data.errcode,
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

**Error Handling:**
- Network errors → Return `{ valid: false, error: "Network error: ..." }`
- Invalid credentials → Return `{ valid: false, error: errmsg, errcode }`
- Success → Return `{ valid: true, accessToken, expiresAt }`

### 2. Configuration Handler

**Location:** `src/dingtalk/send.ts`

**Function:** `handleConfigureDingTalk(params, context)`

**Purpose:** 处理Agent工具的配置请求，验证并保存凭证

**Parameters:**

```typescript
interface ConfigureDingTalkParams {
  appKey: string;
  appSecret: string;
  agentId?: string;
  accountId?: string;
  name?: string;
}
```

**Algorithm:**

1. **Input Validation**
   - Validate required parameters (appKey, appSecret)
   - Normalize accountId (default: "default")
   - Trim all string inputs

2. **Credential Validation**
   - Call `validateDingTalkCredentials(appKey, appSecret)`
   - If invalid, return error response immediately
   - If valid, proceed to step 3

3. **Configuration Update**
   - Load current config
   - Build config path: `channels.dingtalk.accounts.<accountId>`
   - Set fields: appKey, appSecret, agentId (if provided), name (if provided), enabled: true
   - Write config to file

4. **Cache Pre-population**
   - Store access token in cache (from validation step)
   - Set expiration time

5. **Response**
   - Return success response with validation details

**Response Format:**

```typescript
// Success
{
  success: true,
  message: "DingTalk account configured successfully",
  accountId: string,
  validated: true,
  details: {
    appKey: string,
    agentId?: string,
    accessTokenExpiresAt: number,
  }
}

// Failure
{
  success: false,
  message: "Failed to configure DingTalk account",
  error: string,
  errorCode?: number,
  details?: {
    helpUrl: string,
  }
}
```

### 3. Agent Tool Registration

**Location:** `src/plugins/runtime/types.ts` and `src/plugins/runtime/index.ts`

**Type Definition:**

```typescript
export type HandleConfigureDingTalk = (
  params: ConfigureDingTalkParams,
  accountId: string
) => Promise<ConfigureDingTalkResult>;

export interface DingTalkRuntime {
  // ... existing methods
  configureDingTalk: HandleConfigureDingTalk;
}
```

**Registration:**

```typescript
// src/plugins/runtime/index.ts
dingtalk: {
  // ... existing exports
  configureDingTalk: () => import("../../dingtalk/send.js").then(m => m.handleConfigureDingTalk),
}
```

### 4. Plugin Integration

**Location:** `extensions/dingtalk/src/channel.ts`

**Change:** Update `agentTools` function

```typescript
agentTools: async () => {
  const runtime = getDingTalkRuntime();
  return [
    await runtime.channel.dingtalk.createLoginTool(),
    await runtime.channel.dingtalk.createConfigureTool(),  // NEW
  ];
}
```

**Tool Schema:**

```typescript
{
  name: "configure_dingtalk",
  description: "Configure DingTalk application credentials (appKey, appSecret, agentId)",
  input_schema: {
    type: "object",
    properties: {
      appKey: {
        type: "string",
        description: "DingTalk application AppKey"
      },
      appSecret: {
        type: "string",
        description: "DingTalk application AppSecret"
      },
      agentId: {
        type: "string",
        description: "DingTalk robot AgentId (optional)"
      },
      accountId: {
        type: "string",
        description: "Account identifier (default: 'default')"
      },
      name: {
        type: "string",
        description: "Display name for the account"
      }
    },
    required: ["appKey", "appSecret"]
  }
}
```

## Data Flow

### Configuration Flow

```
User Input
    │
    ▼
┌─────────────────────────────────────────┐
│ AI Agent invokes configure_dingtalk     │
│ with appKey, appSecret, [agentId]       │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ handleConfigureDingTalk()               │
│ - Validate inputs                       │
│ - Call validateDingTalkCredentials()    │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ DingTalk API: /gettoken                 │
│ https://oapi.dingtalk.com/gettoken      │
└────────────────────┬────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    Success                 Failure
         │                       │
         ▼                       ▼
┌──────────────┐      ┌──────────────┐
│ Cache token  │      │ Return error │
│ Save config  │      │ Don't save   │
│ Return ok    │      │              │
└──────────────┘      └──────────────┘
```

### Message Sending Flow (with cached token)

```
Send Message Request
    │
    ▼
┌─────────────────────────────────────────┐
│ sendMessageDingTalk()                   │
└────────────────────┬────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Check token cache     │
         └───┬───────────────┬───┘
             │               │
         Valid           Expired/None
             │               │
             ▼               ▼
    ┌──────────┐    ┌──────────────────┐
    │ Use token│    │ getAccessToken() │
    └─────┬────┘    │ Call API        │
          │         └────────┬─────────┘
          │                  │
          │                  ▼
          │         ┌───────────────┐
          │         │ Cache token   │
          │         └───────┬───────┘
          │                 │
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │ Send message    │
          │ with token      │
          └─────────────────┘
```

## Security Considerations

### 1. Credential Storage

- **Location:** `~/.clawdbot/config.json`
- **Permissions:** File permissions should be `0600` (user read/write only)
- **Secrets:** appSecret stored in plaintext (future: consider encryption)

### 2. Token Caching

- **Scope:** In-memory only, never persisted to disk
- **Lifetime:** Short-lived (2 hours with 60s buffer)
- **Isolation:** Separate cache per accountId

### 3. Logging

- **Sensitive Data:** All credential values redacted from logs
- **Debug Mode:** In verbose mode, show last 4 chars of appKey only
- **Access Tokens:** Never log access tokens

### 4. Input Validation

- **Injection:** All string inputs trimmed and validated
- **Length Limits:** appKey/appSecret max length 256 chars
- **Character Set:** Alphanumeric + common symbols (no special chars that could break config JSON)

## Error Handling

### Error Codes

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `ERR_INVALID_CREDENTIALS` | "Invalid appKey or appSecret" | DingTalk API returns errcode !== 0 | Verify credentials in DingTalk developer console |
| `ERR_NETWORK_ERROR` | "Network error: ..." | Fetch failed | Check internet connectivity |
| `ERR_MISSING_PARAMS` | "Missing required parameters" | appKey/appSecret not provided | Provide all required parameters |
| `ERR_CONFIG_WRITE_FAILED` | "Failed to write configuration" | File system error | Check file permissions |
| `ERR_VALIDATION_FAILED` | "Credential validation failed" | API error during validation | See error details for specific cause |

### Error Response Format

```typescript
{
  success: false,
  message: "User-friendly error message",
  error: "Detailed error information",
  errorCode: "ERR_...",
  details?: {
    helpUrl: string,
    troubleshooting?: string[],
  }
}
```

## Testing Strategy

### Unit Tests

1. **Credential Validation**
   - Test with valid credentials (mock API)
   - Test with invalid credentials (errcode !== 0)
   - Test network error handling
   - Test token extraction and caching

2. **Configuration Handler**
   - Test input validation
   - Test configuration writing
   - Test multi-account scenarios
   - Test error responses

3. **Token Cache**
   - Test cache hit
   - Test cache miss
   - Test token expiration
   - Test cache invalidation

### Integration Tests

1. **End-to-End Configuration**
   - Call `configure_dingtalk` tool
   - Verify config file updated
   - Verify token cached
   - Send test message

2. **Multi-Account**
   - Configure account1
   - Configure account2
   - Verify both accounts work independently

### Manual Tests

1. Use real DingTalk app credentials
2. Test via AI conversation
3. Verify message sending
4. Test configuration persistence

## Performance Considerations

### Token Caching

- **Cache Duration:** ~2 hours (7200s - 60s buffer)
- **Cache Size:** O(n) where n = number of accounts (typically 1-5)
- **Memory Usage:** ~500 bytes per cached token

### API Call Optimization

- **Validation:** 1 API call per configuration
- **Message Sending:** 1 API call per batch of messages (using cached token)
- **Token Refresh:** Lazy refresh only when needed

### Configuration Reload

- **Hot Reload:** Config changes trigger reload without restart
- **Selective Reload:** Only reload DingTalk channel, not entire system

## Future Enhancements

### Phase 2 (Potential)

1. **Web UI Configuration**
   - Add configuration form in web interface
   - Real-time validation feedback
   - Multiple account management UI

2. **Credential Encryption**
   - Encrypt appSecret in config file
   - Use system keyring (macOS Keychain, Windows Credential Manager)
   - Master password protection

3. **Advanced Token Management**
   - Persistent token cache (encrypted)
   - Preemptive token refresh (before expiration)
   - Token refresh retry logic

4. **Configuration Templates**
   - Pre-configured templates for common scenarios
   - Configuration import/export
   - Batch configuration from CSV/JSON

## Dependencies

### Internal Dependencies

- `src/config/config.ts` - Configuration file I/O
- `src/plugins/runtime/` - Plugin runtime system
- `clawdbot/plugin-sdk` - Plugin SDK types and utilities

### External Dependencies

- None (uses existing `fetch` API)

### API Dependencies

- DingTalk GetToken API: `https://oapi.dingtalk.com/gettoken`
- DingTalk Send Message API: `https://api.dingtalk.com/v1.0/robot/groupMessages/send`

## Compatibility

### Backward Compatibility

- ✅ Existing configurations continue to work
- ✅ QR code login flow still available
- ✅ All existing message sending functions unchanged
- ✅ Configuration schema unchanged (already supports appKey/appSecret)

### Breaking Changes

- None

### Migration Required

- None (existing users unaffected)

## Rollout Plan

### Phase 1: Core Implementation
1. Implement validation function
2. Implement configuration handler
3. Register agent tool
4. Update plugin integration

### Phase 2: Testing
1. Unit tests
2. Integration tests
3. Manual testing with real credentials

### Phase 3: Documentation
1. Update channel documentation
2. Add troubleshooting guide
3. Add example configurations

### Phase 4: Release
1. Merge to main branch
2. Update changelog
3. Tag and release
