# Project Context

## Purpose

**Clawdbot** 是一个个人 AI 助手，运行在用户的设备上。它通过用户已经使用的消息渠道（WhatsApp、Telegram、Slack、Discord、Google Chat、Signal、iMessage、Microsoft Teams、WebChat）以及扩展渠道（BlueBubbles、Matrix、Zalo 等）提供回答。它支持在 macOS/iOS/Android 上进行语音交互，并可以渲染用户控制的实时 Canvas。Gateway 只是控制平面——产品是 AI 助手本身。

核心目标：
- 提供本地化、快速、始终在线的个人 AI 助手
- 支持多平台消息渠道的统一接入
- 保护用户隐私，数据本地存储
- 通过插件系统实现可扩展性

## Tech Stack

### 核心技术
- **语言**: TypeScript (ES2022, strict mode)
- **运行时**: Node.js 22+ (支持 Bun 作为可选运行时)
- **包管理器**: pnpm 10.23.0
- **构建工具**: TypeScript Compiler (tsc)
- **测试框架**: Vitest (V8 覆盖率)

### 主要依赖
- **AI/Agent**: `@mariozechner/pi-agent-core` (0.49.3), `@mariozechner/pi-ai` (0.49.3)
- **消息渠道**:
  - WhatsApp: `@whiskeysockets/baileys` (7.0.0-rc.9)
  - Discord: `discord-api-types` + 自定义实现
  - Slack: `@slack/bolt` (4.6.0)
  - Telegram: `grammy` (1.39.3)
  - Signal: 自定义实现
  - iMessage: 自定义实现 (macOS only)
  - WeChat: `wechaty` (1.20.2)
  - 其他: Line, Microsoft Teams, Google Chat, Zalo, Matrix 等
- **Web 框架**: `express` (5.2.1), `hono` (4.11.4)
- **HTTP**: `undici` (7.19.0)
- **媒体处理**: `sharp` (0.34.5), `pdfjs-dist` (5.4.530), `playwright-core` (1.58.0)
- **数据库**: SQLite + `sqlite-vec` (向量搜索)
- **协议**: `@agentclientprotocol/sdk` (0.13.1)

### 移动端应用
- **macOS**: Swift (SwiftUI, Observation framework)
- **iOS**: Swift (SwiftUI)
- **Android**: Kotlin (Jetpack Compose)

### 开发工具
- **代码检查**: Oxlint (1.41.0) + tsgolint
- **代码格式化**: Oxfmt (0.26.0)
- **Swift 工具**: SwiftLint, SwiftFormat
- **版本管理**: Git (semantic versioning)

## Project Conventions

### Code Style

#### TypeScript 代码规范
- **严格模式**: 启用 TypeScript strict mode
- **目标版本**: ES2022
- **模块系统**: NodeNext (ESM)
- **导入顺序**:
  1. Node.js 内置模块
  2. 外部依赖
  3. 内部模块（相对路径）
- **文件大小**: 首选 <500 LOC，软限制 700 LOC
- **注释**: 为复杂或非显而易见的逻辑添加简短注释

#### 命名约定
- **文件名**: kebab-case (例: `channel-web.ts`, `auto-reply.ts`)
- **变量/函数**: camelCase
- **类/接口**: PascalCase
- **常量**: UPPER_SNAKE_CASE
- **类型**: PascalCase，前缀 `T` 可选（不强制）
- **目录**: kebab-case (例: `media-understanding`, `link-understanding`)

#### 格式化规则
- 使用 **Oxfmt** 进行代码格式化
- 使用 **Oxlint** 进行代码检查
- 运行 `pnpm format:fix` 自动修复格式问题
- 运行 `pnpm lint:fix` 自动修复 lint 问题

### Architecture Patterns

#### 核心架构
- **CLI 入口**: `src/cli/` - 命令行接口和程序定义
- **Gateway**: `src/gateway/` - 控制平面和服务管理
- **渠道抽象**: `src/channels/` - 统一的消息渠道接口
- **路由系统**: `src/routing/` - 消息路由和分发
- **会话管理**: `src/sessions/` - Pi Agent 会话状态
- **插件系统**: `src/plugins/` + `extensions/` - 可扩展功能
- **媒体管道**: `src/media/` + `src/media-understanding/` + `src/link-understanding/` - 媒体处理

#### 依赖注入
- 使用 `createDefaultDeps()` 创建默认依赖
- 支持依赖注入以实现可测试性

#### 错误处理
- 全局未捕获异常处理器
- 全未处理 Promise 拒绝处理器
- 结构化错误格式化 (`src/infra/errors.ts`)

#### 配置管理
- 配置文件: `~/.clawdbot/config.json`
- 环境变量: 支持 `.env` 文件
- 会话存储: `~/.clawdbot/sessions/`

### Testing Strategy

#### 测试类型
- **单元测试**: `*.test.ts` 文件，与源文件并列
- **E2E 测试**: `*.e2e.test.ts` 文件
- **Docker 测试**: `scripts/e2e/*.sh` - 完整环境测试
- **Live 测试**: `CLAWDBOT_LIVE_TEST=1` - 需要真实 API 密钥

#### 覆盖率要求
- **阈值**: 70% (lines, functions, branches, statements)
- **提供者**: V8
- **运行**: `pnpm test:coverage`

#### 测试命令
```bash
pnpm test              # 单元测试
pnpm test:e2e         # E2E 测试
pnpm test:live        # Live 测试（需要真实凭证）
pnpm test:docker:all  # Docker 环境测试
pnpm test:all         # 所有测试（lint + build + test + e2e + live + docker）
```

#### 测试约定
- 测试文件与源文件并列
- 使用 Vitest 作为测试框架
- 并行运行测试（默认）
- 最大测试工作线程: 16

### Git Workflow

#### 分支策略
- **main**: 主分支，稳定代码
- **feature/*** 或直接在 main 上开发小改动

#### 提交约定
- 使用 `scripts/committer` 工具创建提交
- 遵循 **Conventional Commits** 规范
- 提交前运行预提交钩子（`prek install`）

#### 提交消息格式
```
<type>: <description>

[可选的详细描述]
```

类型 (type):
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具链相关
- `perf`: 性能优化

#### PR 指南
- PR 应总结范围、执行的测试、用户可见的变更
- 创建 PR 时使用模板
- PR 审查通过后合并（优先 rebase，必要时 squash）
- 合并后添加 contributor 到 README

#### 版本发布
- **Stable**: 标签发布 (vYYYY.M.D)，npm dist-tag `latest`
- **Beta**: 预发布 (vYYYY.M.D-beta.N)，npm dist-tag `beta`
- **Dev**: main 分支的最新代码，npm dist-tag `dev`

#### Changelog 维护
- 保持最新发布版本在顶部（无 "Unreleased" 部分）
- 发布后 bump 版本并开始新的顶部部分

## Domain Context

### 消息渠道集成
Clawdbot 支持多个消息渠道，每个渠道有独特的特性：
- **WhatsApp**: 通过 Baileys (Web 协议)，最完整的支持
- **Telegram**: 通过 Grammy，支持 Bot API
- **Discord**: 自定义实现，支持 Bot 和 Webhook
- **Slack**: 通过 Bolt 框架
- **Signal**: 通过 libsignal-cli
- **iMessage**: 仅 macOS，通过 AppleScript/Swift
- **WeChat**: 通过 Wechaty 框架
- **其他**: Line, Microsoft Teams, Google Chat, Zalo, Matrix, BlueBubbles 等

### AI 模型集成
- 支持 Anthropic Claude (推荐 Pro/Max + Opus 4.5)
- 支持 OpenAI (ChatGPT/Codex)
- 支持 OAuth 和 API Key 认证
- 支持模型故障转移和配置轮换
- 长上下文支持（100K-200K tokens）

### 插件系统
- 插件作为 workspace packages 组织在 `extensions/` 下
- 插件运行时依赖必须在自己的 `package.json` 中
- 使用 `clawdbot/plugin-sdk` 开发插件
- 避免在 root `package.json` 中添加插件依赖

### 会话管理
- Pi Agent 会话存储在 `~/.clawdbot/sessions/` 下
- 支持多个并发会话
- 会话隔离基于 agent ID

### 媒体处理
- **图像**: 使用 sharp 进行缩略图生成
- **PDF**: 使用 pdfjs-dist 提取文本和图像
- **音频**: TTS 集成 (node-edge-tts)
- **链接**: 使用 Playwright 和 readability 提取内容

## Important Constraints

### 技术约束
- **Node 版本**: 必须是 Node.js 22.12.0 或更高
- **TypeScript**: strict mode 不可禁用
- **文件大小**: 保持文件 <500 LOC，必要时拆分
- **测试覆盖率**: 最低 70%
- **依赖管理**:
  - 插件依赖放在各自的 `package.json` 中
  - 避免在 root `package.json` 中添加插件依赖
  - 使用 workspace:* 时谨慎，优先使用 devDependencies/peerDependencies

### 安全约束
- **凭证管理**:
  - Web provider 凭证存储在 `~/.clawdbot/credentials/`
  - 永不提交真实的手机号码、视频或实时配置值
  - 使用明显虚假的占位符
- **Secret 扫描**: 使用 detect-secrets 扫描代码
- **环境变量**: 不要在代码中硬编码敏感信息

### 文档约束
- **内部链接**: 使用根相对路径，无 `.md`/`.mdx` 后缀
- **章节交叉引用**: 使用锚点链接
- **标题**: 避免使用 em dash 和撇号（破坏 Mintlify 锚点链接）
- **README**: 使用绝对文档 URL (`https://docs.clawd.bot/...`)

### 多代理安全
- 不要创建/应用/drop `git stash` 条目（除非明确请求）
- 不要创建/删除/修改 `git worktree` checkouts（除非明确请求）
- 不要切换分支（除非明确请求）
- 聚焦报告于自己的编辑
- Lint/format churn 可以自动解决

### 发布约束
- 不经操作员明确同意不得更改版本号
- 发布前始终请求权限运行 npm publish/release 步骤

## External Dependencies

### AI 服务
- **Anthropic Claude**: 主要 AI 模型提供商
- **OpenAI**: 备用 AI 模型提供商
- **Pi Agent Core**: 核心 AI 框架 (@mariozechner/*)

### 消息渠道服务
- **WhatsApp**: 通过 Baileys (无官方 API)
- **Telegram**: Bot API
- **Discord**: Bot API + Webhook
- **Slack**: Bot API + Events API
- **Signal**: libsignal-cli
- **WeChat**: Wechaty 框架
- 其他第三方消息服务

### 基础设施
- **GitHub**: 代码托管、CI/CD
- **Mintlify**: 文档托管 (docs.clawd.bot)
- **npm**: 包发布
- **Docker**: 容器化部署

### 移动端分发
- **macOS**: 独立应用包
- **iOS**: App Store (未来)
- **Android**: APK/Google Play (未来)

### 开发工具
- **Oxlint/Oxfmt**: 代码质量工具
- **Vitest**: 测试框架
- **TypeScript**: 类型系统
- **SwiftLint/SwiftFormat**: Swift 代码质量
- **Git**: 版本控制
- **pnpm**: 包管理器

### 安装脚本
- 安装脚本托管在 `https://clawd.bot/*` (sibling repo `../clawd.bot`)
- 包括 `install.sh`, `install-cli.sh`, `install.ps1`

## 特殊注意事项

### 渠道集成规则
- 总是考虑**所有**内置 + 扩展渠道
- 核心渠道文档: `docs/channels/`
- 核心渠道代码: `src/telegram`, `src/discord`, `src/slack`, `src/signal`, `src/imessage`, `src/web`
- 扩展: `extensions/*`
- 添加渠道/扩展/应用/文档时，审查 `.github/labeler.yml` 的标签覆盖

### 连接提供者
- 添加新连接时，更新每个 UI 表面和文档
- macOS app, web UI, mobile (如果适用)
- onboarding/overview docs
- 添加匹配的状态 + 配置表单

### 版本位置
- `package.json` (CLI)
- `apps/android/app/build.gradle.kts` (versionName/versionCode)
- `apps/ios/Sources/Info.plist` + `apps/ios/Tests/Info.plist` (CFBundleShortVersionString/CFBundleVersion)
- `apps/macos/Sources/Clawdbot/Resources/Info.plist` (CFBundleShortVersionString/CFBundleVersion)
- `docs/install/updating.md` (固定的 npm 版本)
- `docs/platforms/mac/release.md` (APP_VERSION/APP_BUILD 示例)
- Peekaboo Xcode projects/Info.plists (MARKETING_VERSION/CURRENT_PROJECT_VERSION)

### 多代理协调
- 支持运行多个代理（每个代理有自己的会话）
- 其他代理的 WIP 保持不变
- 避免跨会话的状态变更
