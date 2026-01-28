# WhatsApp 二维码关联修复

## 问题分析

发现的根本原因：

1. **浏览器标识不兼容** (`src/web/session.ts:117`)
   - 原始标识: `["clawdbot", "cli", VERSION]`
   - 问题: WhatsApp 检测到非标准浏览器，可能阻止设备关联
   - 修复: 改为 `["Clawdbot", "Chrome", VERSION]` 模拟标准 Chrome 浏览器

2. **二维码纠错级别过低** (`src/web/qr-image.ts:19`)
   - 原始: `QRErrorCorrectLevel.L` (约 7% 纠错能力)
   - 问题: 手机摄像头可能无法准确识别低纠错级别的二维码
   - 修复: 改为 `QRErrorCorrectLevel.M` (约 15% 纠错能力)

3. **二维码生成超时时间过短** (`src/web/login-qr.ts:145`)
   - 原始: 30 秒超时
   - 问题: 网络慢时可能无法及时生成二维码
   - 修复: 延长至 60 秒

4. **等待连接超时时间过短** (`src/web/login-qr.ts:227`)
   - 原始: 120 秒超时
   - 问题: 用户扫码后需要更多时间完成握手
   - 修复: 延长至 180 秒 (3 分钟)

5. **WebSocket 关闭延迟过短** (`src/web/login.ts:49, 76`)
   - 原始: 500ms
   - 问题: 可能导致事件未完全刷新就关闭连接
   - 修复: 延长至 1000ms

## 修改的文件

1. `src/web/session.ts` - 浏览器标识修复
2. `src/web/qr-image.ts` - 二维码纠错级别提升
3. `src/web/login-qr.ts` - 超时时间延长
4. `src/web/login.ts` - WebSocket 关闭延迟延长

## 测试建议

1. 清理旧的 WhatsApp 认证信息:
   ```bash
   clawdbot channels logout
   ```

2. 重新生成二维码:
   ```bash
   clawdbot channels login --verbose
   ```

3. 使用手机 WhatsApp 扫描二维码，观察是否成功关联

4. 检查日志输出，确认连接状态

## 预期效果

- 二维码更容易被手机识别
- WhatsApp 服务器接受标准浏览器标识
- 用户有充足时间完成扫码和关联流程
- 连接稳定性提升
