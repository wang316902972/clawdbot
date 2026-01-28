# 方案 2: 使用宿主机网络 + 代理转发

## 概述

保持 `network_mode: host`，通过配置环境变量确保 Node.js 和 Baileys 库正确使用代理。

## 已实施的修改

### docker-compose.yml 更新

为两个服务添加了 Node.js 全局代理配置：

```yaml
services:
  clawdbot-gateway:
    network_mode: host
    environment:
      # 标准代理环境变量
      HTTP_PROXY: http://127.0.0.1:7897
      HTTPS_PROXY: http://127.0.0.1:7897
      # Node.js 全局代理（关键！）
      GLOBAL_AGENT_HTTP_PROXY: http://127.0.0.1:7897
      GLOBAL_AGENT_HTTPS_PROXY: http://127.0.0.1:7897
```

### 关键点

1. **127.0.0.1 在 host 模式下指向宿主机**
   - 不需要使用宿主机的实际 IP（如 192.168.136.223）
   - 容器直接共享宿主机网络栈

2. **GLOBAL_AGENT_* 环境变量**
   - 某些 Node.js 库（包括 Baileys）不遵循标准的 HTTP_PROXY
   - 需要显式设置 GLOBAL_AGENT_* 来确保所有网络请求都通过代理

3. **统一的代理地址**
   - gateway 和 cli 都使用 `127.0.0.1:7897`
   - 保持配置一致性

## 使用步骤

### 1. 确保代理服务运行

```bash
# 测试代理是否工作
curl -x http://127.0.0.1:7897 https://web.whatsapp.com

# 应该返回 WhatsApp 页面或重定向
```

### 2. 重启 Docker 容器

```bash
# 停止现有容器
docker compose down

# 重新构建（如果需要）
docker compose build

# 启动容器
docker compose up -d

# 查看日志
docker compose logs -f
```

### 3. 运行测试脚本

```bash
# 执行自动化测试
./test-proxy.sh
```

测试脚本会验证：
- ✓ 代理服务是否运行
- ✓ 是否可以访问 WhatsApp 网站
- ✓ 容器是否能访问代理
- ✓ 环境变量是否正确配置

### 4. 测试 WhatsApp 登录

```bash
# 在容器中执行登录命令
docker compose exec clawdbot-cli clawdbot channels login --verbose
```

**预期输出**:
```
WhatsApp QR received.
Scan this QR in WhatsApp (Linked Devices):
[QR 码图形]
```

### 5. 在手机上扫描二维码

1. 打开 WhatsApp
2. 进入 **设置** → **关联设备**
3. 点击 **关联设备**
4. 扫描终端中显示的二维码

## 常见问题

### Q1: 测试脚本显示 "容器无法访问宿主机代理"

**原因**: 在某些 Docker 版本或配置中，`network_mode: host` 可能不生效

**解决方案 A**: 使用宿主机的实际 IP 地址

```bash
# 获取宿主机 IP
ip addr show | grep "inet " | grep -v 127.0.0.1

# 假设是 192.168.1.100，创建 .env 文件
cat > .env <<EOF
HTTP_PROXY=http://192.168.1.100:7897
HTTPS_PROXY=http://192.168.1.100:7897
NO_PROXY=localhost,127.0.0.1
EOF

# 重启容器
docker compose down && docker compose up -d
```

**解决方案 B**: 检查 Docker 守护进程配置

```bash
# 检查 Docker 是否以 host 模式运行
docker version
docker info | grep -i "network"

# 如果使用 Docker Desktop，需要：
# Settings → Resources → Proxies
# 启用 Manual proxy configuration
```

### Q2: "ETIMEDOUT connecting to web.whatsapp.com"

**原因**: 代理不支持 WebSocket 连接

**解决方案**: 确认您的代理支持 HTTP/HTTPS 和 WebSocket

常见的支持 WebSocket 的代理：
- V2Ray (需要配置 WebSocket 传输)
- Clash (支持 WebSocket)
- SS/SSR + Privoxy (可能不支持)

测试 WebSocket:
```bash
# 使用 websocat 测试
docker run --rm --network=host nixery.dev/websocat ws://web.whatsapp.com
```

### Q3: QR 码显示但扫描后无响应

**原因**: WebSocket 连接建立成功但 WhatsApp 服务器响应异常

**解决步骤**:

1. 检查代理日志，查看 WhatsApp 服务器的响应
2. 尝试使用不同的代理服务器
3. 检查是否有 IP 被封禁
4. 清除旧的 WhatsApp 凭据:
   ```bash
   docker compose exec clawdbot-cli clawdbot channels logout
   ```

### Q4: 环境变量未生效

**验证方法**:
```bash
# 查看容器内的环境变量
docker compose exec clawdbot-cli env | grep -i proxy

# 应该看到：
# HTTP_PROXY=http://127.0.0.1:7897
# HTTPS_PROXY=http://127.0.0.1:7897
# GLOBAL_AGENT_HTTP_PROXY=http://127.0.0.1:7897
```

**如果未设置**: 检查 .env 文件或 docker-compose.yml 中的环境变量配置

## 验证成功的标志

### 测试脚本输出
```
=========================================
✓ 代理服务运行正常
✓ WhatsApp 网站可访问 (HTTP 200)
✓ Docker 容器已启动
✓ 容器可以访问宿主机代理
✓ 容器可以通过代理访问 WhatsApp (HTTP 200)
=========================================
所有测试通过！
```

### WhatsApp 登录输出
```
WhatsApp QR received.
Scan this QR in WhatsApp (Linked Devices):
█████████████████████████
█████████████████████████
...

Waiting for WhatsApp connection...

✅ Linked! WhatsApp is ready.
```

## 其他解决方案

如果方案 2 仍然无法解决问题，请尝试：

- **方案 1**: 使用桥接网络 + 代理（见 WHATSAPP_NETWORK_FIX.md）
- **方案 3**: 配置防火墙/NAT 规则
- **方案 4**: 使用 VPN 或 Tailscale

## 技术说明

### 为什么需要 GLOBAL_AGENT_* ？

Node.js 的网络请求分几层：

1. **http/https 模块**: 遵循 `HTTP_PROXY`/`HTTPS_PROXY`
2. **第三方库** (如 Baileys): 可能有自己的网络实现
3. **WebSocket 连接**: 需要特殊处理

`GLOBAL_AGENT_*` 环境变量通过 `global-agent` 包为所有 Node.js 网络请求设置全局代理，确保 Baileys 的 WebSocket 连接也能通过代理。

### network_mode: host 的含义

- 容器**不**获得独立的网络命名空间
- 容器直接使用宿主机的网络栈
- `127.0.0.1` 在容器内 = 宿主机的 `127.0.0.1`
- 不需要端口映射（ports 配置被忽略）

## 需要帮助？

如果按照以上步骤操作后问题依旧存在，请收集以下信息：

```bash
# 1. 测试脚本输出
./test-proxy.sh > test-results.txt 2>&1

# 2. Docker 日志
docker compose logs > docker-logs.txt

# 3. 环境变量
docker compose exec clawdbot-cli env > env-vars.txt

# 4. WhatsApp 登录日志（详细模式）
docker compose exec clawdbot-cli clawdbot channels login --verbose 2>&1 | tee login-debug.txt
```

将这些文件提供给支持团队。
