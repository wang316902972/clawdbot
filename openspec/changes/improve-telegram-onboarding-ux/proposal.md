# Change: Improve Telegram Bot Token Configuration UX

## Why

当前 Telegram Bot Token 配置向导虽然功能完整，但用户体验存在改进空间：
1. Token 格式验证不足 - 用户输入无效 token 时只有在运行时才发现
2. 缺少连接测试 - 用户不知道 token 是否有效直到启动 gateway
3. BotFather 指引可以更详细 - 新用户可能不知道如何操作
4. 缺少快捷配置命令 - 必须通过完整的 onboarding 流程
5. Token 验证提示不够友好 - 技术错误消息对非技术用户不友好

## What Changes

- 添加 Telegram Bot Token 格式验证（正则：`^\d+:[A-Za-z0-9_-]{35}$`）
- 添加 Token 连接测试功能（调用 `getMe` API 验证）
- 改进 BotFather 操作指南（分步说明 + 截图链接）
- 添加快捷配置命令 `clawdbot telegram setup`
- 添加友好的错误提示和修复建议
- 支持 Token 有效性预检查（在保存前验证）
- 添加 Bot 信息展示（Bot 名称、用户名）

## Impact

- Affected specs:
  - `channels/telegram` (新增: Token validation, Connection test)
- Affected code:
  - `src/channels/plugins/onboarding/telegram.ts` (改进 UX)
  - `src/commands/telegram-setup.ts` (新增快捷命令)
  - `src/telegram/token-validation.ts` (新增验证逻辑)
  - `src/telegram/bot-api.ts` (新增 API 测试工具)
