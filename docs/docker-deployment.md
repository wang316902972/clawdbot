# Docker 部署指南 - 使用 Z.AI GLM-4.7 模型

本指南介绍如何使用 Docker 部署 Clawdbot，并配置使用 Z.AI 的 GLM-4.7 模型。

## 📋 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- Z.AI API Key ([获取地址](https://open.bigmodel.cn/))

## 🚀 快速开始

### 1. 准备配置文件

```bash
# 复制环境变量模板
cp .env.docker .env

# 复制配置文件模板
mkdir -p data/config
cp clawdbot.json.example data/config/clawdbot.json
```

### 2. 编辑环境变量

编辑 `.env` 文件，设置必要的配置：

```bash
# 网关访问令牌 (必填，用于控制 UI 访问)
CLAWDBOT_GATEWAY_TOKEN=your-secure-token-here

# Z.AI API Key (必填，已预配置)
ZAI_API_KEY=cb04e8770ba4474681762483d068b899.gUQqIdqzOGCzkyxJ

# 网关绑定地址 (lan/loopback)
CLAWDBOT_GATEWAY_BIND=lan

# 网关端口
CLAWDBOT_GATEWAY_PORT=18789
```

### 3. 构建镜像

```bash
# 构建本地镜像
docker build -t clawdbot:local .
```

### 4. 启动服务

```bash
# 启动网关服务
docker compose up -d clawdbot-gateway

# 查看日志
docker compose logs -f clawdbot-gateway
```

## 🔧 配置说明

### 环境变量 (.env)

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `CLAWDBOT_GATEWAY_TOKEN` | 网关访问令牌 | - | ✅ |
| `ZAI_API_KEY` | Z.AI API Key | - | ✅ |
| `CLAWDBOT_GATEWAY_BIND` | 绑定地址 (lan/loopback) | lan | ❌ |
| `CLAWDBOT_GATEWAY_PORT` | 网关端口 | 18789 | ❌ |
| `CLAWDBOT_CONFIG_DIR` | 配置文件目录 | ./data/config | ❌ |
| `CLAWDBOT_WORKSPACE_DIR` | 工作空间目录 | ./data/workspace | ❌ |

### 配置文件 (data/config/clawdbot.json)

主要配置项：

```json5
{
  agents: {
    defaults: {
      model: {
        // 使用 GLM-4.7 模型
        primary: "zai/glm-4.7",
        fast: "zai/glm-4.7",
        long: "zai/glm-4.7"
      }
    }
  }
}
```

完整配置示例请参考 `clawdbot.json.example`。

## 📂 目录结构

```
.
├── .env                              # 环境变量配置
├── .env.docker                       # 环境变量模板
├── docker-compose.yml                # Docker Compose 配置
├── Dockerfile                        # Docker 镜像构建文件
├── clawdbot.json.example             # Clawdbot 配置模板
└── data/                             # 数据目录 (运行时创建)
    ├── config/                       # 配置文件目录
    │   └── clawdbot.json            # Clawdbot 配置
    └── workspace/                    # 工作空间目录
```

## 🛠️ 常用命令

### 服务管理

```bash
# 启动网关
docker compose up -d clawdbot-gateway

# 停止网关
docker compose stop clawdbot-gateway

# 重启网关
docker compose restart clawdbot-gateway

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f clawdbot-gateway

# 停止所有服务
docker compose down

# 停止并删除数据卷
docker compose down -v
```

### CLI 操作

```bash
# 运行 CLI 命令
docker compose run --rm clawdbot-cli <command>

# 示例：查看状态
docker compose run --rm clawdbot-cli status

# 示例：查看通道状态
docker compose run --rm clawdbot-cli channels status

# 示例：运行诊断
docker compose run --rm clawdbot-cli doctor
```

### 进入容器

```bash
# 进入 CLI 容器
docker compose run --rm clawdbot-cli bash

# 进入运行中的网关容器
docker compose exec clawdbot-gateway bash
```

## 🔍 验证部署

### 1. 检查服务状态

```bash
docker compose ps
```

预期输出：
```
NAME                    STATUS         PORTS
clawdbot-gateway-1      Up             0.0.0.0:18789->18789/tcp
```

### 2. 检查网关健康状态

```bash
docker compose run --rm clawdbot-cli gateway health
```

### 3. 检查配置

```bash
docker compose run --rm clawdbot-cli config get
```

### 4. 访问控制 UI

打开浏览器访问：
```
http://localhost:18789
```

输入环境变量中设置的 `CLAWDBOT_GATEWAY_TOKEN` 即可访问。

## 🔐 安全建议

1. **修改默认令牌**：务必修改 `CLAWDBOT_GATEWAY_TOKEN` 为强密码
2. **限制访问**：生产环境建议使用 `CLAWDBOT_GATEWAY_BIND=loopback` 并通过反向代理访问
3. **保护 API Key**：不要将 `.env` 文件提交到版本控制系统
4. **定期更新**：定期更新 Docker 镜像以获取安全补丁

## 🐛 故障排查

### 网关无法启动

1. 检查日志：
```bash
docker compose logs clawdbot-gateway
```

2. 验证配置：
```bash
docker compose run --rm clawdbot-cli doctor
```

3. 检查配置文件语法：
```bash
docker compose run --rm clawdbot-cli config validate
```

### API 调用失败

1. 验证 API Key：
```bash
docker compose run --rm clawdbot-cli models list
```

2. 检查环境变量：
```bash
docker compose exec clawdbot-gateway env | grep ZAI_API_KEY
```

### 端口冲突

如果 18789 端口被占用，修改 `.env` 文件：
```bash
CLAWDBOT_GATEWAY_PORT=18790
```

## 📊 性能优化

### 资源限制

编辑 `docker-compose.yml`，添加资源限制：

```yaml
services:
  clawdbot-gateway:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### 日志管理

限制日志大小：

```yaml
services:
  clawdbot-gateway:
    # ... 其他配置
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 📚 更多资源

- [完整配置文档](https://docs.clawd.bot/gateway/configuration)
- [GLM 模型文档](https://docs.clawd.bot/providers/glm)
- [Docker 部署最佳实践](https://docs.clawd.bot/platforms/docker)
- [故障排查指南](https://docs.clawd.bot/help/faq)

## 🆘 获取帮助

如果遇到问题：

1. 查看 [FAQ](https://docs.clawd.bot/help/faq)
2. 运行诊断工具：`docker compose run --rm clawdbot-cli doctor`
3. 提交 Issue：[GitHub Issues](https://github.com/clawdbot/clawdbot/issues)

## 📝 更新日志

- 2025-01-27: 添加 GLM-4.7 模型支持
- 持续更新：详见 [CHANGELOG.md](https://github.com/clawdbot/clawdbot/blob/main/CHANGELOG.md)
