# Change: Add DingTalk Token Configuration

## Why

当前钉钉插件虽然已经实现了通过appKey/appSecret获取access token并发送消息的功能，但配置凭证的方式不够用户友好：

1. **手动编辑配置文件** - 用户需要直接编辑 `~/.clawdbot/config.json`，容易出错
2. **缺少验证机制** - 用户无法确认配置的凭证是否有效，直到发送消息时才发现
3. **没有便捷的配置工具** - 无法在对话中或通过命令行快速配置
4. **缺少错误提示** - 配置错误时没有清晰的错误信息和修复指南
5. **多账户支持不明显** - 虽然架构支持多账户，但配置流程不清晰

通过添加Agent工具和命令行配置支持，用户可以：
- 在与AI助手的对话中直接配置钉钉凭证
- 自动验证配置是否正确
- 获得即时的配置反馈和错误提示
- 更轻松地配置多个钉钉账户

## What Changes

- 添加 `configure_dingtalk` Agent工具用于配置凭证
- 实现凭证验证功能（调用钉钉API验证appKey/appSecret）
- 添加配置写入逻辑（保存到 `channels.dingtalk.accounts.<accountId>`）
- 增强access token缓存机制（配置成功后预填充缓存）
- 提供清晰的错误提示和配置指南
- 支持多账户配置（通过accountId参数）

## Impact

- Affected specs:
  - `channels/dingtalk` (新增: Agent工具配置, 凭证验证)
- Affected code:
  - `src/dingtalk/send.ts` (添加验证函数和配置处理器)
  - `src/plugins/runtime/index.ts` (注册新的agent工具)
  - `extensions/dingtalk/src/channel.ts` (更新agent tools导出)
  - `src/dingtalk/send.test.ts` (新增测试)
  - `docs/channels/dingtalk.md` (新增配置文档)

## Proposed Solution

### 1. Agent工具：`configure_dingtalk`

提供一个Agent工具，允许AI助手在对话中帮助用户配置钉钉凭证：

**输入参数：**
- `appKey`: 钉钉应用的AppKey
- `appSecret`: 钉钉应用的AppSecret
- `agentId`: 钉钉机器人的AgentId（可选）
- `accountId`: 账户ID（可选，默认为"default"）
- `name`: 账户名称（可选）

**功能：**
- 保存凭证到配置文件
- 自动验证凭证是否有效（尝试获取access token）
- 返回配置结果和验证状态

### 2. 命令行配置支持

扩展CLI命令，支持钉钉配置：

```bash
# 配置钉钉凭证
clawdbot config set channels.dingtalk.accounts.default.appKey=<your-app-key>
clawdbot config set channels.dingtalk.accounts.default.appSecret=<your-app-secret>
clawdbot config set channels.dingtalk.accounts.default.agentId=<your-agent-id>

# 验证配置
clawdbot channels status dingtalk
```

### 3. 配置验证增强

在保存配置后自动验证：
- 尝试使用配置的appKey/appSecret获取access token
- 检查agentId是否有效（如果提供）
- 提供清晰的错误提示和修复建议

## Impact Analysis

### 修改的文件

**核心代码：**
- `src/dingtalk/send.ts` - 添加配置验证函数和工具处理器
- `src/dingtalk/accounts.ts` - 可能需要添加配置辅助函数
- `src/plugins/runtime/index.ts` - 注册新的agent工具

**配置Schema：**
- `src/config/zod-schema.dingtalk.ts` - 确认现有schema支持（已支持）

**插件代码：**
- `extensions/dingtalk/src/channel.ts` - 更新agent工具注册

**测试：**
- 新增 `src/dingtalk/send.test.ts` - 测试配置验证功能
- 新增 `src/dingtalk/config.test.ts` - 测试配置流程

**文档：**
- `docs/channels/dingtalk.md` - 添加配置说明

### 不需要修改

- 钉钉的发送消息逻辑（已经实现并工作正常）
- Access token缓存机制（已经实现）
- 配置schema定义（已经支持所需的字段）

## Alternatives Considered

### 1. 仅通过配置文件配置
**优点：** 实现简单，不需要额外代码
**缺点：** 用户体验差，需要手动编辑文件，容易出错

### 2. 扫码登录
**优点：** 用户体验好，不需要手动输入凭证
**缺点：** 钉钉企业应用的认证流程通常是appKey/appSecret方式，扫码更适合个人应用

### 3. OAuth流程
**优点：** 标准化的认证流程
**缺点：** 钉钉的OAuth流程复杂，且需要额外的回调服务器

## Dependencies

- 无新增外部依赖
- 使用现有的钉钉API调用机制

## Success Criteria

1. 用户可以通过Agent工具配置钉钉凭证
2. 配置后自动验证凭证有效性
3. 验证成功后可以正常发送消息
4. 提供清晰的错误提示和配置指南
5. 所有新代码有完整的测试覆盖（≥70%）

## Open Questions

1. 是否需要支持多个钉钉账户配置？（现有架构已支持）
2. 是否需要Web UI配置界面？（作为后续增强）
3. agentId是否应该设为必填？（根据钉钉API文档，部分场景可选）

## Timeline Estimate

- 实现Agent工具和验证逻辑：1-2小时
- 更新插件注册和runtime：30分钟
- 编写测试：1小时
- 文档更新：30分钟
- 总计：3-4小时
