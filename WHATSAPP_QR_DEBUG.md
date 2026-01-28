# WhatsApp 二维码调试指南

## 已实施的修复

### 1. 浏览器标识标准化
- **文件**: `src/web/session.ts:117`
- **修改**: `browser: ["Clawdbot", "Chrome", VERSION]`
- **原因**: WhatsApp 更容易接受标准 Chrome 浏览器标识

### 2. 二维码纠错级别提升
- **文件**: `src/web/qr-image.ts:19`
- **修改**: `QRErrorCorrectLevel.L` → `QRErrorCorrectLevel.M`
- **原因**: 提高二维码容错能力，使手机摄像头更容易识别

### 3. 二维码尺寸增大
- **文件**: `src/web/qr-image.ts:106`
- **修改**: `scale = 6` → `scale = 10`
- **原因**: 更大的二维码更容易被扫描

### 4. 超时时间延长
- **文件**: `src/web/login-qr.ts:145, 227`
- **修改**:
  - QR 生成超时: 30s → 60s
  - 连接等待超时: 120s → 180s
- **原因**: 给用户更多时间完成扫码和关联流程

### 5. WebSocket 关闭延迟延长
- **文件**: `src/web/login.ts:49, 76`
- **修改**: 500ms → 1000ms
- **原因**: 确保事件完全刷新

## 用户调试步骤

### 步骤 1: 清理旧数据
```bash
# 登出 WhatsApp
clawdbot channels logout

# 清理凭证目录（可选，如果上述命令无效）
rm -rf ~/.clawdbot/credentials/whatsapp/
```

### 步骤 2: 生成新二维码（详细模式）
```bash
clawdbot channels login --verbose
```

### 步骤 3: 观察输出

**期望看到的输出**:
```
WhatsApp QR received.
Scan this QR in WhatsApp (Linked Devices):
[QR 码图形]
```

**如果看到错误**，记录完整错误信息。

### 步骤 4: 扫描二维码

1. 在手机上打开 WhatsApp
2. 进入 **设置** → **关联设备** (Linked Devices)
3. 点击 **关联设备** (Link a Device)
4. 扫描终端中显示的二维码

### 步骤 5: 等待连接

成功后应该看到:
```
✅ Linked! WhatsApp is ready.
```

## 常见问题排查

### 问题 1: 二维码显示但无法扫描

**可能原因**:
- 终端分辨率过低
- QR 码太小或不清晰

**解决方案**:
1. 尝试在 Web UI 中生成 QR 码
2. 增加终端窗口大小
3. 使用 SSH 时确保支持 UTF-8 字符

### 问题 2: 扫描后立即断开

**可能原因**:
- 网络不稳定
- WhatsApp 服务器拒绝连接

**解决方案**:
1. 检查网络连接
2. 尝试使用 VPN
3. 等待几分钟后重试

### 问题 3: QR 码生成超时

**可能原因**:
- 网络连接问题
- Baileys 库版本问题

**解决方案**:
```bash
# 检查 Baileys 版本
npm list @whiskeysockets/baileys

# 重新安装依赖
pnpm install

# 重试登录
clawdbot channels login --verbose
```

### 问题 4: 代码 515 错误

**症状**: 看到包含 "515" 或 "restart" 的错误消息

**说明**: 这是正常的 WhatsApp 配对流程，代码会自动重试

**无需操作**: 系统会自动处理并重新连接

### 问题 5: "Session logged out" 错误

**解决方案**:
```bash
clawdbot channels logout
clawdbot channels login --verbose
```

## 高级调试

### 启用详细日志

```bash
# 查看实时日志
clawdbot logs --follow

# 或设置环境变量
export DEBUG=baileys:*
clawdbot channels login --verbose
```

### 检查凭证文件

```bash
# 检查凭证是否存在
ls -lh ~/.clawdbot/credentials/whatsapp/

# 查看凭证内容（如果有）
cat ~/.clawdbot/credentials/whatsapp/default/creds.json
```

### 测试 QR 码生成

```bash
# 运行测试
pnpm test qr-image

# 手动测试 QR 码渲染
node -e "
import('./dist/web/qr-image.js').then(m => {
  m.renderQrPngBase64('test').then(b64 => {
    console.log('QR code generated:', b64.length, 'bytes');
  });
});
"
```

## 依然无法解决？

请收集以下信息：

1. **完整错误日志**:
   ```bash
   clawdbot channels login --verbose 2>&1 | tee login-debug.log
   ```

2. **系统信息**:
   ```bash
   uname -a
   node --version
   npm --version
   ```

3. **依赖版本**:
   ```bash
   npm list @whiskeysockets/baileys
   ```

4. **网络测试**:
   ```bash
   ping web.whatsapp.com
   curl -I https://web.whatsapp.com
   ```

将这些信息提供给支持团队。

## 相关文档

- [WhatsApp 官方文档](/channels/whatsapp)
- [故障排查指南](/gateway/troubleshooting)
- [Baileys 文档](https://github.com/adiwajshing/Baileys)
