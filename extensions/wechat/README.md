# WeChat Plugin for Clawdbot

这个插件为 Clawdbot 添加 WeChat（微信）支持，实现 WhatsApp 与 WeChat 之间的消息桥接。

## 架构设计

### 1. WeChat 集成方案

使用 **WeChaty** 框架，这是一个基于 Web WeChat API 的 Node.js 库：
- 类似于 WhatsApp 使用的 Baileys（WhatsApp Web API）
- 支持个人账号登录
- 提供消息收发、联系人管理等功能

### 2. 插件结构

```
extensions/wechat/
├── package.json           # NPM 包配置
├── clawdbot.plugin.json  # Clawdbot 插件元数据
├── index.ts              # 插件入口
├── src/
│   ├── runtime.ts        # 运行时管理
│   ├── channel.ts        # 渠道接口实现
│   ├── bot.ts            # WeChat bot 管理
│   ├── handlers.ts       # 消息处理器
│   └── bridge.ts         # WhatsApp-WeChat 桥接
└── README.md
```

### 3. 消息流

#### WeChat 到 WhatsApp
```
WeChat 消息 → WeChaty → Clawdbot Agent → 消息转换 → WhatsApp 发送
```

#### WhatsApp 到 WeChat
```
WhatsApp 消息 → Baileys → Clawdbot Agent → 消息转换 → WeChat 发送
```

## 功能特性

### 核心功能
- ✅ WeChat 个人账号登录
- ✅ 消息收发（文本、图片、文件）
- ✅ 联系人和群组管理
- ✅ 与 WhatsApp 双向桥接
- ✅ 消息格式转换

### 消息类型支持
- 文本消息
- 图片消息
- 文件消息
- 群组消息
- 私聊消息

## 配置示例

```yaml
channels:
  wechat:
    accounts:
      default:
        name: "My WeChat Bot"
        botName: "WeChat Bot"
        enabled: true
        dmPolicy: "pairing"
        allowFrom:
          - "wx_user123"
        groups:
          wechat_group_id:
            name: "Test Group"
            policy: "allowlist"

  # WhatsApp 配置（已存在）
  whatsapp:
    accounts:
      default:
        enabled: true

# 桥接配置
bridges:
  whatsapp-wechat:
    enabled: true
    mappings:
      - whatsapp: "1234567890@s.whatsapp.net"
        wechat: "wx_user123"
        direction: "bidirectional"
      - whatsapp: "whatsapp_group@g.us"
        wechat: "wechat_group_id"
        direction: "bidirectional"
```

## 安装和使用

### 1. 安装插件

```bash
cd extensions/wechat
pnpm install
```

### 2. 配置 WeChat

```bash
clawdbot channels add wechat
# 扫描二维码登录 WeChat
```

### 3. 配置桥接

编辑 `~/.clawdbot/config.yaml`，添加 `bridges` 配置。

### 4. 启动服务

```bash
clawdbot gateway run
```

## 消息转换规则

### 文本消息
- WeChat → WhatsApp: 直接转发
- WhatsApp → WeChat: 直接转发

### 媒体消息
- 图片: 自动下载并重新上传
- 文件: 大小限制检查（最大 100MB）

### 格式保留
- 表情符号: 转换为 Unicode
- 链接: 保留原始 URL
- 提及: 转换为 @用户名

## 技术依赖

- **wechaty**: ^1.20.2
- **wechaty-puppet-wechat**: ^1.18.4
- **clawdbot/plugin-sdk**: Clawdbot 插件 SDK

## 安全考虑

1. **登录凭证**: WeChat 登录凭证存储在 `~/.clawdbot/credentials/`
2. **隐私保护**: 不记录消息内容
3. **访问控制**: 支持 `allowFrom` 白名单
4. **配对机制**: 私聊默认需要配对授权

## 开发状态

当前版本: **v2026.1.25-alpha**

### 已完成
- ✅ 插件基础结构
- ✅ 渠道接口实现
- ✅ 配置系统

### 进行中
- 🔄 WeChat bot 实现
- 🔄 消息处理逻辑
- 🔄 桥接功能

### 待开发
- ⏳ 测试用例
- ⏳ 文档完善
- ⏳ 错误处理增强

## 参考资料

### WeChat 相关
- [WeChaty 文档](https://wechaty.js.org/)
- [Web WeChat 协议](https://github.com/wechaty/wechaty)
- [微信官方文档](https://developer.weixin.qq.com/)

### Clawdbot 相关
- [Clawdbot 插件开发指南](https://docs.clawd.bot/)
- [WhatsApp 插件实现](../whatsapp/)
- [Telegram 插件实现](../telegram/)

### Sources
- [wechat-api-next on NPM](https://www.npmjs.com/package/wechat-api-next)
- [WeChat API GitHub Topics](https://github.com/topics/wechat-api?o=desc&s=updated)
- [Node.js WeChat Integration Guide (Chinese)](https://blog.csdn.net/qq_56109145/article/details/137610116)

## 许可证

MIT License - 详见项目根目录

## 贡献

欢迎提交 Issue 和 Pull Request！

## 作者

Clawdbot Contributors

---

**注意**: 此插件仅用于个人学习和研究目的。请遵守微信服务条款和相关法律法规。
