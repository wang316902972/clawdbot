# WhatsApp 网络连接问题解决方案

## 问题诊断

### 根本原因
Clawdbot 部署在内网容器中，无法访问公网的 WhatsApp 服务器。WhatsApp Web 协议需要与以下服务器建立直接连接：

- `web.whatsapp.com` - 主服务器
- `.whatsapp.net` 域名 - 用于 WebSocket 和媒体传输
- 其他 Meta/Facebook 服务器用于认证和同步

### 当前 Docker Compose 配置分析

您的 `docker-compose.yml` 中已经配置了代理：
```yaml
environment:
  HTTP_PROXY: ${HTTP_PROXY:-http://192.168.136.223:7897}
  HTTPS_PROXY: ${HTTPS_PROXY:-http://192.168.136.223:7897}
  NO_PROXY: ${NO_PROXY:-localhost,127.0.0.1}
```

但是 `network_mode: host` 可能会导致代理配置不生效。

## 解决方案

### 方案 1: 配置容器使用代理（推荐）

#### 1.1 修改 docker-compose.yml

```yaml
services:
  clawdbot-gateway:
    image: ${CLAWDBOT_IMAGE:-clawdbot:local}
    # 不要使用 host 网络，改为使用桥接网络
    # network_mode: host  # 注释掉这行
    networks:
      - clawdbot-network
    ports:
      - "18789:18789"  # 显式映射端口
    environment:
      HOME: /home/node
      TERM: xterm-256color
      CLAWDBOT_GATEWAY_TOKEN: ${CLAWDBOT_GATEWAY_TOKEN}
      # 代理配置
      HTTP_PROXY: ${HTTP_PROXY:-http://192.168.136.223:7897}
      HTTPS_PROXY: ${HTTPS_PROXY:-http://192.168.136.223:7897}
      NO_PROXY: ${NO_PROXY:-localhost,127.0.0.1}
      # WhatsApp 需要直接连接的域名（不应通过代理）
      # WA 会在内部处理这些域名
    # ... 其他配置保持不变

  clawdbot-cli:
    image: ${CLAWDBOT_IMAGE:-clawdbot:local}
    networks:
      - clawdbot-network
    environment:
      HTTP_PROXY: ${HTTP_PROXY:-http://192.168.136.223:7897}
      HTTPS_PROXY: ${HTTPS_PROXY:-http://192.168.136.223:7897}
      NO_PROXY: ${NO_PROXY:-localhost,127.0.0.1}
    # ... 其他配置保持不变

networks:
  clawdbot-network:
    driver: bridge
```

#### 1.2 确保 Node.js 代理配置

在容器启动时添加 Node.js 特定的代理配置：

```yaml
environment:
  # ... 现有环境变量
  NODE_TLS_REJECT_UNAUTHORIZED: "0"  # 如果使用自签名证书的代理
  GLOBAL_AGENT_HTTP_PROXY: ${HTTP_PROXY:-http://192.168.136.223:7897}
  GLOBAL_AGENT_HTTPS_PROXY: ${HTTPS_PROXY:-http://192.168.136.223:7897}
  GLOBAL_AGENT_NO_PROXY: ${NO_PROXY:-localhost,127.0.0.1}
```

### 方案 2: 使用宿主机网络 + 代理转发

如果必须使用 `network_mode: host`，则需要确保代理在宿主机上可访问：

#### 2.1 检查代理是否在宿主机上运行

```bash
# 测试代理连接
curl -x http://192.168.136.223:7897 https://web.whatsapp.com

# 应该返回 WhatsApp 页面或重定向
```

#### 2.2 确保容器可以访问代理

```bash
# 进入容器测试
docker compose exec clawdbot-gateway bash

# 在容器内测试代理
curl -x http://192.168.136.223:7897 https://web.whatsapp.com

# 测试 DNS 解析
nslookup web.whatsapp.com
```

### 方案 3: 配置防火墙/NAT 规则（最彻底）

如果您的网络环境允许，可以配置防火墙规则允许容器直接访问外网：

#### 3.1 Docker 网络配置

```yaml
# docker-compose.yml
services:
  clawdbot-gateway:
    # 使用自定义网络
    networks:
      clawdbot-network:
        ipv4_address: 172.20.0.2

networks:
  clawdbot-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/24
    driver_opts:
      com.docker.network.bridge.name: br-clawdbot
```

#### 3.2 iptables NAT 规则（在宿主机上）

```bash
# 允许容器网络通过宿主机访问外网
sudo iptables -t nat -A POSTROUTING -s 172.20.0.0/24 -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -i br-clawdbot -o eth0 -j ACCEPT
sudo iptables -A FORWARD -i eth0 -o br-clawdbot -m state --state RELATED,ESTABLISHED -j ACCEPT

# 保存规则
sudo iptables-save > /etc/iptables/rules.v4
```

### 方案 4: 使用 VPN 或 Tailscale

如果您的环境有 Tailscale 或其他 VPN：

#### 4.1 在容器中使用 Tailscale

```dockerfile
# Dockerfile
FROM clawdbot:local

# 安装 Tailscale
RUN curl -fsSL https://tailscale.com/install.sh | sh

# 启动脚本
ENTRYPOINT ["sh", "-c", "tailscaled --state=/var/lib/tailscale/tailscaled.sock --socket=/var/run/tailscale/tailscaled.sock & exec node dist/index.js"]
```

```yaml
# docker-compose.yml
volumes:
  - tailscale-state:/var/lib/tailscale
  - tailscale-run:/var/run/tailscale
```

## 验证步骤

### 1. 检查容器网络配置

```bash
# 查看容器网络
docker compose ps
docker network inspect $(docker compose ps -q | head -1 | xargs docker inspect --format='{{.Networks}}')

# 查看容器内的网络接口
docker compose exec clawdbot-gateway ip addr
docker compose exec clawdbot-gateway ip route
```

### 2. 测试外网连接

```bash
# 在容器内测试
docker compose exec clawdbot-gateway bash -c "
  # 测试 DNS
  nslookup web.whatsapp.com

  # 测试 HTTP 连接（通过代理）
  curl -x http://192.168.136.223:7897 -I https://web.whatsapp.com

  # 测试 WebSocket 连接
  # WhatsApp 使用 WebSocket，需要特殊处理
"

# 测试代理是否工作
docker compose exec clawdbot-gateway env | grep -i proxy
```

### 3. 测试 WhatsApp 连接

```bash
# 尝试登录 WhatsApp（详细模式）
docker compose exec clawdbot-cli clawdbot channels login --verbose

# 应该看到：
# - "WhatsApp QR received."
# - 二维码显示
# - 如果网络不通，会看到超时或连接错误
```

## 常见错误和解决方法

### 错误 1: "ETIMEDOUT" 或 "ECONNREFUSED"

**原因**: 容器无法访问代理服务器

**解决**:
```bash
# 检查代理地址是否正确
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 从容器内测试代理连接
docker compose exec clawdbot-gateway curl -v http://192.168.136.223:7897

# 如果代理在宿主机上，使用宿主机 IP
# 在容器中，localhost 指向容器本身，不是宿主机
```

### 错误 2: "getaddrinfo ENOTFOUND web.whatsapp.com"

**原因**: DNS 解析失败

**解决**:
```yaml
# docker-compose.yml
services:
  clawdbot-gateway:
    dns:
      - 8.8.8.8
      - 8.8.4.4
      - 114.114.114.114  # 中国 DNS
```

### 错误 3: QR 码显示但扫描后无法连接

**原因**: WebSocket 连接被阻断

**解决**: 确保代理支持 WebSocket 转发（大多数 HTTP 代理都支持）

### 错误 4: "Proxy Authentication Required"

**原因**: 代理需要认证

**解决**:
```bash
# 在代理 URL 中包含认证信息
export HTTP_PROXY=http://username:password@192.168.136.223:7897
export HTTPS_PROXY=http://username:password@192.168.136.223:7897
```

## 推荐配置（针对您的环境）

基于您的配置（使用代理 192.168.136.223:7897），推荐的 docker-compose.yml：

```yaml
services:
  clawdbot-gateway:
    image: ${CLAWDBOT_IMAGE:-clawdbot:local}
    # 使用桥接网络而不是 host
    networks:
      - clawdbot-network
    ports:
      - "${CLAWDBOT_GATEWAY_PORT:-18789}:18789"
    environment:
      HOME: /home/node
      TERM: xterm-256color
      CLAWDBOT_GATEWAY_TOKEN: ${CLAWDBOT_GATEWAY_TOKEN}
      # 代理配置
      HTTP_PROXY: http://192.168.136.223:7897
      HTTPS_PROXY: http://192.168.136.223:7897
      NO_PROXY: localhost,127.0.0.1
      # Node.js 全局代理
      GLOBAL_AGENT_HTTP_PROXY: http://192.168.136.223:7897
      GLOBAL_AGENT_HTTPS_PROXY: http://192.168.136.223:7897
      # Z.AI / GLM 模型配置
      ZAI_API_KEY: ${ZAI_API_KEY}
      # DNS 配置
      CLAUDE_AI_SESSION_KEY: ${CLAUDE_AI_SESSION_KEY}
      CLAUDE_WEB_SESSION_KEY: ${CLAUDE_WEB_SESSION_KEY}
      CLAUDE_WEB_COOKIE: ${CLAUDE_WEB_COOKIE}
    volumes:
      - ${CLAWDBOT_CONFIG_DIR}:/home/node/.clawdbot
      - ${CLAWDBOT_WORKSPACE_DIR}:/home/node/clawd
      - ${CLAWDBOT_SKILLS_DIR:-./skills}:/home/node/clawdbot/skills
      - ${CLAWDBOT_EXTENSIONS_DIR:-./extensions}:/home/node/clawdbot/extensions
    dns:
      - 8.8.8.8
      - 114.114.114.114
    init: true
    restart: unless-stopped
    command:
      [
        "node",
        "dist/index.js",
        "gateway",
        "--bind",
        "${CLAWDBOT_GATEWAY_BIND:-lan}",
        "--port",
        "${CLAWDBOT_GATEWAY_PORT:-18789}"
      ]

  clawdbot-cli:
    image: ${CLAWDBOT_IMAGE:-clawdbot:local}
    networks:
      - clawdbot-network
    environment:
      HOME: /home/node
      TERM: xterm-256color
      BROWSER: echo
      HTTP_PROXY: http://192.168.136.223:7897
      HTTPS_PROXY: http://192.168.136.223:7897
      NO_PROXY: localhost,127.0.0.1
      GLOBAL_AGENT_HTTP_PROXY: http://192.168.136.223:7897
      GLOBAL_AGENT_HTTPS_PROXY: http://192.168.136.223:7897
      ZAI_API_KEY: ${ZAI_API_KEY}
      CLAUDE_AI_SESSION_KEY: ${CLAUDE_AI_SESSION_KEY}
      CLAUDE_WEB_SESSION_KEY: ${CLAUDE_WEB_SESSION_KEY}
      CLAUDE_WEB_COOKIE: ${CLAUDE_WEB_COOKIE}
    volumes:
      - ${CLAWDBOT_CONFIG_DIR}:/home/node/.clawdbot
      - ${CLAWDBOT_WORKSPACE_DIR}:/home/node/clawd
      - ${CLAWDBOT_SKILLS_DIR:-./skills}:/home/node/clawdbot/skills
      - ${CLAWDBOT_EXTENSIONS_DIR:-./extensions}:/home/node/clawdbot/extensions
    dns:
      - 8.8.8.8
      - 114.114.114.114
    stdin_open: true
    tty: true
    init: true
    entrypoint: ["node", "dist/index.js"]

networks:
  clawdbot-network:
    driver: bridge
```

## 应用配置并测试

```bash
# 1. 停止现有容器
docker compose down

# 2. 应用新配置
docker compose up -d

# 3. 等待容器启动
sleep 5

# 4. 测试网络连接
docker compose exec clawdbot-gateway curl -I https://web.whatsapp.com

# 5. 测试 WhatsApp 登录
docker compose exec clawdbot-cli clawdbot channels login --verbose

# 6. 如果成功，扫描二维码
```

## 仍然无法解决？

请提供以下调试信息：

```bash
# 容器网络信息
docker compose exec clawdbot-gateway ip addr
docker compose exec clawdbot-gateway ip route
docker compose exec clawdbot-gateway cat /etc/resolv.conf

# 代理测试
docker compose exec clawdbot-gateway curl -v http://192.168.136.223:7897
docker compose exec clawdbot-gateway curl -x http://192.168.136.223:7897 -I https://web.whatsapp.com

# WhatsApp 登录日志
docker compose exec clawdbot-cli clawdbot channels login --verbose 2>&1 | tee login-debug.log
```

将这些信息提供给支持团队进行进一步分析。
