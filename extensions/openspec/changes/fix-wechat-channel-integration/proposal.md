# Change: Fix WeChat Channel Integration

## Why

The WeChat channel extension exists but is not properly integrated with Clawdbot's message handling system. Messages from WeChat are only logged to console but not processed by the agent system, and outbound messaging does not use the standard channel adapter pattern used by other channels (WhatsApp, Telegram, etc.).

## What Changes

- Connect WeChat message handler to Clawdbot's inbound message processing system
- Add WeChat outbound adapter following the same pattern as WhatsApp/Telegram
- Remove duplicate/incomplete code from `extensions/wechat/` that conflicts with `src/wechat/`
- Update WeChat bot manager to emit messages through the proper Clawdbot runtime
- Add proper error handling and logging consistent with other channels

## Impact

- Affected specs: wechat-channel
- Affected code:
  - `src/wechat/bot-manager.ts` - Message handling
  - `src/wechat/send.ts` - Already exists, needs adapter integration
  - `extensions/wechat/*` - Will be cleaned up
  - New: `src/channels/plugins/outbound/wechat.ts` - Outbound adapter

## Breaking Changes

None. This is a bug fix that enables existing but non-functional code.
