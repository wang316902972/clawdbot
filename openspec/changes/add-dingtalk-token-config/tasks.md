# Tasks: Add DingTalk Token Configuration

## Implementation Checklist

### Phase 1: Core Functionality
- [ ] **1.1** 添加配置验证函数到 `src/dingtalk/send.ts`
  - [ ] 1.1.1 实现 `validateDingTalkCredentials(appKey, appSecret)` 函数
  - [ ] 1.1.2 实现测试获取access token的逻辑
  - [ ] 1.1.3 返回验证结果（成功/失败+错误信息）

- [ ] **1.2** 实现Agent工具处理器
  - [ ] 1.2.1 添加 `configureDingTalk` 函数处理配置请求
  - [ ] 1.2.2 解析输入参数（appKey, appSecret, agentId, accountId, name）
  - [ ] 1.2.3 调用配置写入逻辑（使用plugin-sdk的配置API）
  - [ ] 1.2.4 调用验证逻辑确认配置正确
  - [ ] 1.2.5 返回配置结果和验证状态

- [ ] **1.3** 更新Agent工具注册
  - [ ] 1.3.1 在 `src/dingtalk/send.ts` 中导出新的工具函数
  - [ ] 1.3.2 更新 `src/plugins/runtime/types.ts` 添加类型定义
  - [ ] 1.3.3 更新 `src/plugins/runtime/index.ts` 注册工具

### Phase 2: Plugin Integration
- [ ] **2.1** 更新插件配置
  - [ ] 2.1.1 更新 `extensions/dingtalk/src/channel.ts` 的agentTools函数
  - [ ] 2.1.2 导出新的配置工具
  - [ ] 2.1.3 确保工具在运行时可用

- [ ] **2.2** 测试插件集成
  - [ ] 2.2.1 加载插件并验证工具注册
  - [ ] 2.2.2 测试工具在AI对话中的调用
  - [ ] 2.2.3 验证配置写入到正确的位置

### Phase 3: Testing
- [ ] **3.1** 编写单元测试
  - [ ] 3.1.1 新建 `src/dingtalk/send.test.ts`
  - [ ] 3.1.2 测试 `validateDingTalkCredentials` 函数
  - [ ] 3.1.3 测试成功场景（有效的appKey/appSecret）
  - [ ] 3.1.4 测试失败场景（无效的凭证）
  - [ ] 3.1.5 测试网络错误处理
  - [ ] 3.1.6 测试access token缓存逻辑

- [ ] **3.2** 编写配置测试
  - [ ] 3.2.1 新建 `src/dingtalk/config.test.ts`
  - [ ] 3.2.2 测试配置写入逻辑
  - [ ] 3.2.3 测试多账户配置场景
  - [ ] 3.2.4 测试配置覆盖和更新

- [ ] **3.3** 集成测试
  - [ ] 3.3.1 测试完整的配置流程
  - [ ] 3.3.2 测试配置后发送消息
  - [ ] 3.3.3 测试access token过期和刷新

### Phase 4: Error Handling & UX
- [ ] **4.1** 改进错误提示
  - [ ] 4.1.1 提供清晰的配置错误消息
  - [ ] 4.1.2 提供凭证获取指南链接
  - [ ] 4.1.3 处理网络超时和API限流

- [ ] **4.2** 日志和调试
  - [ ] 4.2.1 添加配置过程的详细日志
  - [ ] 4.2.2 添加敏感信息redaction
  - [ ] 4.2.3 添加verbose模式支持

### Phase 5: Documentation
- [ ] **5.1** 更新文档
  - [ ] 5.1.1 创建或更新 `docs/channels/dingtalk.md`
  - [ ] 5.1.2 添加配置步骤说明
  - [ ] 5.1.3 添加故障排除指南
  - [ ] 5.1.4 添加钉钉开发者应用创建链接

- [ ] **5.2** 更新README和示例
  - [ ] 5.2.1 在主README中添加钉钉支持说明
  - [ ] 5.2.2 提供配置示例
  - [ ] 5.2.3 添加使用场景说明

### Phase 6: Validation
- [ ] **6.1** 代码质量检查
  - [ ] 6.1.1 运行 `pnpm lint` 确保无lint错误
  - [ ] 6.1.2 运行 `pnpm format` 确保代码格式正确
  - [ ] 6.1.3 运行 `pnpm build` 确保TypeScript编译通过
  - [ ] 6.1.4 检查测试覆盖率 ≥70%

- [ ] **6.2** 手动测试
  - [ ] 6.2.1 使用真实钉钉应用进行端到端测试
  - [ ] 6.2.2 测试Agent工具调用
  - [ ] 6.2.3 验证配置持久化
  - [ ] 6.2.4 验证消息发送成功

## Dependencies & Ordering

**必须按顺序完成的任务：**
1. Phase 1 (1.1 → 1.2 → 1.3) - 核心功能必须先实现
2. Phase 2 - 依赖Phase 1完成
3. Phase 3 - 依赖Phase 1和2完成
4. Phase 4 - 可以与Phase 3并行
5. Phase 5 - 可以与Phase 3并行
6. Phase 6 - 必须在所有其他阶段完成后

**可以并行的工作：**
- Phase 4和5可以在Phase 3之后并行开发
- 文档编写可以与测试编写并行进行

## Validation Criteria

每个任务完成的标准：
- 代码通过所有lint检查
- 代码通过TypeScript编译
- 新功能有对应的测试用例
- 测试覆盖率不低于70%
- 手动测试验证功能正常工作
