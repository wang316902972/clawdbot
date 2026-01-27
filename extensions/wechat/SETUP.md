# WhatsApp-WeChat Bridge Setup Guide

本指南详细说明如何设置和使用 WhatsApp 与 WeChat 之间的消息桥接功能。

## 前提条件

1. ✅ Clawdbot 已安装并运行
2. ✅ WhatsApp 账户已配置
3. ✅ WeChat 账户已配置
4. ✅ 两个平台都已登录并可以正常收发消息

## 快速开始

### 1. 安装 WeChat 插件

```bash
cd extensions/wechat
pnpm install
```

### 2. 配置 WeChat 账户

```bash
clawdbot channels add wechat
```

按照提示：
1. 输入账户名称（如 "My WeChat"）
2. 扫描二维码登录 WeChat
3. 等待登录成功

### 3. 配置桥接映射

编辑 `~/.clawdbot/config.yaml`：

```yaml
bridges:
  whatsapp-wechat:
    enabled: true
    mappings:
      # 私聊映射
      - whatsapp: "1234567890@s.whatsapp.net"
        wechat: "wxid_abc123def456"
        direction: bidirectional

      # 群组映射
      - whatsapp: "abcdefgh@g.us"
        wechat: "12345678901@chatroom"
        direction: wechat-to-whatsapp
```

### 4. 重启服务

```bash
clawdbot gateway restart
```

## 配置详解

### 映射规则

每个映射包含以下字段：

- `whatsapp`: WhatsApp JID（用户或群组 ID）
- `wechat`: WeChat ID（wxid 或群组 ID）
- `direction`: 消息方向
  - `bidirectional`: 双向桥接
  - `whatsapp-to-wechat`: 仅 WhatsApp → WeChat
  - `wechat-to-whatsapp`: 仅 WeChat → WhatsApp
- `enabled`: 是否启用（默认 true）

### 获取 ID

#### WhatsApp ID

私聊格式: `PHONE_NUMBER@s.whatsapp.net`
群组格式: `GROUP_ID@g.us`

获取方法：
```bash
clawdbot channels status whatsapp
```

#### WeChat ID

私聊格式: `wxid_XXXXXXXXXXXXXXX`
群组格式: `XXXXXXXXXXXXXX@chatroom`

获取方法：
```bash
clawdbot channels status wechat
# 查看联系人列表
clawdbot directory list --channel wechat
```

## 使用场景

### 场景 1: 个人消息同步

将你的 WhatsApp 和 WeChat 私聊连接起来：

```yaml
mappings:
  - whatsapp: "1234567890@s.whatsapp.net"
    wechat: "wxid_abc123def456"
    direction: bidirectional
```

效果：
- 你在 WhatsApp 收到的消息会转发到对应的 WeChat 联系人
- 你在 WeChat 收到的消息会转发到对应的 WhatsApp 联系人

### 场景 2: 跨平台群组

创建跨平台群组：

```yaml
mappings:
  - whatsapp: "family_group@g.us"
    wechat: "98765432100@chatroom"
    direction: bidirectional
```

效果：
- WhatsApp 群组的消息会转发到 WeChat 群组
- WeChat 群组的消息会转发到 WhatsApp 群组

### 场景 3: 单向通知

仅接收通知（不回复）：

```yaml
mappings:
  - whatsapp: "business_updates@g.us"
    wechat: "wxid_notifications123"
    direction: whatsapp-to-wechat  # 仅 WhatsApp → WeChat
```

## 消息格式

### 文本消息

原始消息：
```
Hello from WhatsApp!
```

转发后：
```
[来自 WhatsApp] John Doe:
Hello from WhatsApp!
```

### 媒体消息

图片和文件会自动下载并重新上传到目标平台：
- 支持格式：JPG, PNG, GIF, PDF, DOC, DOCX 等
- 大小限制：100MB
- 超出限制的消息会被忽略并记录日志

### 特殊处理

- **表情符号**: 自动转换为 Unicode
- **链接**: 保留原始 URL
- **提及**: 转换为 `@用户名` 格式

## 故障排查

### 问题 1: 消息未转发

检查：
1. 桥接是否启用: `bridges.whatsapp-wechat.enabled: true`
2. 映射是否正确: ID 必须完全匹配
3. 两个平台都已登录

查看日志：
```bash
clawdbot logs --channel whatsapp,wechat
```

### 问题 2: WeChat 登录失败

解决方案：
1. 确保网络连接正常
2. 尝试重新登录: `clawdbot channels login wechat`
3. 检查二维码是否过期

### 问题 3: 媒体文件过大

当前限制：100MB

选项：
1. 压缩文件后再发送
2. 使用云存储链接代替文件
3. 修改代码调整限制（需重启服务）

## 高级配置

### 消息过滤

只转发包含特定关键词的消息：

```yaml
bridges:
  whatsapp-wechat:
    enabled: true
    filters:
      keywords: ["urgent", "重要"]
      mode: "whitelist"  # 或 "blacklist"
```

### 时间窗口

只在特定时间段转发：

```yaml
bridges:
  whatsapp-wechat:
    enabled: true
    schedule:
      start: "09:00"
      end: "18:00"
      timezone: "Asia/Shanghai"
```

### 消息去重

避免重复消息：

```yaml
bridges:
  whatsapp-wechat:
    enabled: true
    deduplication:
      enabled: true
      window: 60  # 秒
```

## 性能优化

### 批量转发

对于高流量场景，启用批量处理：

```yaml
bridges:
  whatsapp-wechat:
    enabled: true
    batching:
      enabled: true
      maxBatchSize: 10
      maxWaitTime: 5  # 秒
```

### 并发控制

限制并发转发数量：

```yaml
bridges:
  whatsapp-wechat:
    enabled: true
    concurrency:
      maxConcurrent: 5
      queueSize: 100
```

## 安全建议

1. **加密传输**: 所有消息通过本地处理，不会上传到第三方服务器
2. **访问控制**: 使用 `allowFrom` 白名单控制谁可以触发转发
3. **日志脱敏**: 确保日志中不包含敏感信息
4. **定期更新**: 保持插件和依赖库最新版本

## 示例配置

完整示例配置：

```yaml
# ~/.clawdbot/config.yaml

channels:
  whatsapp:
    accounts:
      default:
        enabled: true
        dmPolicy: "pairing"

  wechat:
    accounts:
      default:
        name: "My WeChat"
        enabled: true
        dmPolicy: "pairing"

bridges:
  whatsapp-wechat:
    enabled: true
    deduplication:
      enabled: true
      window: 60
    mappings:
      # 私聊 - 双向
      - whatsapp: "1234567890@s.whatsapp.net"
        wechat: "wxid_abc123def456"
        direction: bidirectional

      # 群组 - WeChat → WhatsApp
      - whatsapp: "family_whatsapp@g.us"
        wechat: "98765432100@chatroom"
        direction: wechat-to-whatsapp

      # 工作群 - 双向
      - whatsapp: "work_updates@g.us"
        wechat: "11223344555@chatroom"
        direction: bidirectional
```

## 支持与反馈

- **问题报告**: [GitHub Issues](https://github.com/clawdbot/clawdbot/issues)
- **功能请求**: [GitHub Discussions](https://github.com/clawdbot/clawdbot/discussions)
- **文档**: [docs.clawd.bot](https://docs.clawd.bot/)

---

**注意**: 本功能仅供个人使用。请遵守 WhatsApp 和 WeChat 的服务条款。
