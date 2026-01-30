# Tasks: Improve Telegram Onboarding UX

## 1. Token Validation
- [ ] 1.1 Create `src/telegram/token-validation.ts` with format validation
- [ ] 1.2 Implement regex validation: `^\d+:[A-Za-z0-9_-]{35}$`
- [ ] 1.3 Add validation error messages with hints
- [ ] 1.4 Write unit tests for validation logic

## 2. Bot API Test Utilities
- [ ] 2.1 Create `src/telegram/bot-api.ts` with test functions
- [ ] 2.2 Implement `getMe()` call to verify token
- [ ] 2.3 Implement `getWebhookInfo()` to check bot status
- [ ] 2.4 Add timeout and error handling
- [ ] 2.5 Write tests for API calls (with mocked responses)

## 3. Enhanced Onboarding Adapter
- [ ] 3.1 Update `src/channels/plugins/onboarding/telegram.ts`
- [ ] 3.2 Add token format validation in prompt
- [ ] 3.3 Add connection test after token input
- [ ] 3.4 Display bot info (name, username) on success
- [ ] 3.5 Improve error messages with actionable hints
- [ ] 3.6 Update BotFather instructions with more details
- [ ] 3.7 Write tests for new onboarding flows

## 4. Quick Setup Command
- [ ] 4.1 Create `src/commands/telegram-setup.ts`
- [ ] 4.2 Implement `clawdbot telegram setup` command
- [ ] 4.3 Support `--token <token>` flag for non-interactive mode
- [ ] 4.4 Support `--test` flag to test existing token
- [ ] 4.5 Add command to CLI program
- [ ] 4.6 Write tests for the command

## 5. Documentation Updates
- [ ] 5.1 Update `docs/telegram.md` with new setup instructions
- [ ] 5.2 Add troubleshooting section for common errors
- [ ] 5.3 Document token format and validation rules
- [ ] 5.4 Add examples of valid/invalid tokens
- [ ] 5.5 Update inline code comments

## 6. Integration & Testing
- [ ] 6.1 Run `pnpm test` to ensure no regressions
- [ ] 6.2 Run `pnpm lint` to check code quality
- [ ] 6.3 Manual test: onboarding wizard with invalid token
- [ ] 6.4 Manual test: onboarding wizard with valid token
- [ ] 6.5 Manual test: `clawdbot telegram setup` command
- [ ] 6.6 Test error messages and user guidance
- [ ] 6.7 Test connection test with various scenarios

## 7. Code Quality
- [ ] 7.1 Ensure all new code has type annotations
- [ ] 7.2 Add error handling for network failures
- [ ] 7.3 Add logging for debugging
- [ ] 7.4 Ensure consistent code style with existing codebase
