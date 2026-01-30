## 1. Integration Fix

- [ ] 1.1 Create WeChat outbound adapter (`src/channels/plugins/outbound/wechat.ts`)
- [ ] 1.2 Update `src/wechat/bot-manager.ts` to integrate with Clawdbot message system
- [ ] 1.3 Remove duplicate code from `extensions/wechat/src/`
- [ ] 1.4 Update `extensions/wechat/index.ts` to use `src/wechat/` implementations
- [ ] 1.5 Add proper TypeScript types for WeChat message handling
- [ ] 1.6 Add error handling and logging

## 2. Testing

- [ ] 2.1 Add unit tests for outbound adapter
- [ ] 2.2 Add integration tests for message flow
- [ ] 2.3 Test WeChat bot login/logout flow
- [ ] 2.4 Test inbound message processing
- [ ] 2.5 Test outbound message sending

## 3. Documentation

- [ ] 3.1 Update WeChat channel documentation
- [ ] 3.2 Add configuration examples
- [ ] 3.3 Document troubleshooting steps
