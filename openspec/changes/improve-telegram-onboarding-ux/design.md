# Design: Improve Telegram Onboarding UX

## Context

当前 Telegram Bot 配置通过 onboarding wizard 或手动编辑 `clawdbot.json` 完成。用户反馈表明配置过程可以更友好，特别是：
- Token 格式错误在运行时才发现
- 不确定 token 是否有效
- BotFather 操作指引不够详细

## Goals / Non-Goals

**Goals:**
- 提供即时的 token 格式验证
- 允许用户在保存前测试 token 连接
- 提供清晰的错误消息和修复建议
- 添加快捷配置命令
- 改进 BotFather 操作指南

**Non-Goals:**
- 不实现 Telegram 用户账号登录（违反 ToS）
- 不修改现有的 token 存储方式
- 不改变 Telegram bot 的核心功能

## Decisions

### 1. Token Format Validation

**Decision**: 使用正则表达式验证 token 格式

**Format**: `^\d+:[A-Za-z0-9_-]{35}$`
- `\d+`: Bot ID（数字）
- `:`: 分隔符
- `[A-Za-z0-9_-]{35}`: 35 字符的 token

**Rationale**:
- Telegram Bot Token 格式是固定的
- 早期验证可以快速发现格式错误
- 正则表达式简单高效

**Alternatives considered**:
- 跳过格式验证，直接测试 API - ❌ 会浪费 API 调用
- 仅测试 API，不验证格式 - ❌ 无法提供具体的格式错误提示

### 2. Connection Test API

**Decision**: 使用 `getMe` API 端点验证 token

**Implementation**:
```typescript
async function testTelegramToken(token: string): Promise<{
  valid: boolean;
  bot?: { id: number; name: string; username: string };
  error?: string;
}> {
  const url = `https://api.telegram.org/bot${token}/getMe`;
  // ... fetch and validate
}
```

**Rationale**:
- `getMe` 是最轻量的验证方法
- 返回 bot 信息，可以展示给用户确认
- 无需 webhook 即可测试

**Alternatives considered**:
- 使用 `getUpdates` - ❌ 可能有副作用（拉取 updates）
- 使用 `getWebhookInfo` - ❌ 不能验证 token 有效性，只能检查 webhook

### 3. Quick Setup Command

**Decision**: 创建独立命令 `clawdbot telegram setup`

**Flags**:
- `--token <token>`: 非交互模式，直接设置 token
- `--test`: 仅测试现有 token，不修改配置
- `--account <id>`: 指定账户（默认: default）

**Rationale**:
- 提供快捷方式，无需完整 onboarding
- 支持脚本化/自动化场景
- 与现有 onboarding wizard 共享逻辑

**Alternatives considered**:
- 仅改进 onboarding wizard - ❌ 不够方便
- 使用 `clawdbot config set` - ❌ 太通用，没有 Telegram 特定逻辑

### 4. Error Handling Strategy

**Decision**: 分层错误处理

**Layers**:
1. **Format errors**: 正则验证失败 → 提示正确格式
2. **Network errors**: 连接失败 → 提示网络问题
3. **API errors**: 401/403 → 提示 token 无效
4. **Unexpected errors**: 其他错误 → 显示技术细节 + 日志路径

**Rationale**:
- 每层错误有不同的解决方案
- 友好的错误消息减少用户困惑
- 保留技术细节用于调试

## Risks / Trade-offs

**Risk**: API 测试增加配置时间
- **Mitigation**: 可选的测试步骤，用户可跳过
- **Impact**: 低 - 大多数用户会愿意花 1-2 秒验证 token

**Risk**: Telegram API 变更导致测试失败
- **Mitigation**: 使用官方 Bot API 文档，添加版本检查
- **Impact**: 低 - Bot API 很稳定

**Trade-off**: 额外的代码复杂度 vs 更好的 UX
- **Decision**: 接受额外复杂度，UX 提升显著
- **Impact**: 中 - 需要维护新代码，但复用性强

## Migration Plan

**Steps**:
1. 添加验证和测试工具（不影响现有流程）
2. 更新 onboarding adapter（可选使用新功能）
3. 添加快捷命令（独立功能）
4. 更新文档

**Rollback**:
- 新功能都是可选的，不影响现有配置方式
- 如果出现问题，用户仍可手动编辑 `clawdbot.json`

**Compatibility**:
- 向后兼容：现有配置继续工作
- 新功能：opt-in，不强制使用

## Open Questions

- [ ] 是否应该在每次启动 gateway 时验证 token？（建议：否，仅配置时验证）
- [ ] 是否支持多个 bot token 快速切换？（建议：未来增强）
- [ ] 是否需要 token 过期提醒？（建议：Telegram bot token 不会过期）
