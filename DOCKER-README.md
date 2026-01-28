# Clawdbot Docker 部署 - GLM-4.7 模型

快速部署 Clawdbot 并使用 Z.AI GLM-4.7 模型。

## 🎯 一键启动

```bash
./docker-start.sh
```

脚本会自动：
1. 检查 Docker 环境
2. 创建配置文件
3. 构建 Docker 镜像
4. 启动网关服务

## 📝 手动部署

### 1. 配置环境变量

```bash
cp .env.docker .env
# 编辑 .env，设置 CLAWDBOT_GATEWAY_TOKEN
```

### 2. 创建配置文件

```bash
mkdir -p data/config
cp clawdbot.json.example data/config/clawdbot.json
```

### 3. 构建并启动

```bash
docker build -t clawdbot:local .
docker compose up -d clawdbot-gateway
```

## 🌐 访问服务

- **控制 UI**: http://localhost:18789
- **API 端点**: http://localhost:18789/rpc

## 📚 详细文档

完整的部署指南请查看：[docs/docker-deployment.md](docs/docker-deployment.md)

## 🔑 已配置的 API Key

Z.AI API Key 已预配置：
- API Key: `cb04e8770ba4474681762483d068b899.gUQqIdqzOGCzkyxJ`
- 模型: `zai/glm-4.7`

## 🛠️ 常用命令

```bash
# 查看状态
docker compose ps

# 查看日志
docker compose logs -f clawdbot-gateway

# 停止服务
docker compose stop clawdbot-gateway

# 重启服务
docker compose restart clawdbot-gateway

# 运行 CLI
docker compose run --rm clawdbot-cli status
```

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `.env.docker` | 环境变量模板 |
| `docker-compose.yml` | Docker Compose 配置 |
| `Dockerfile` | Docker 镜像构建文件 |
| `clawdbot.json.example` | Clawdbot 配置模板 |
| `docker-start.sh` | 一键启动脚本 |
| `docs/docker-deployment.md` | 完整部署文档 |

## 🔐 安全提醒

⚠️ **重要**：请务必修改 `.env` 文件中的 `CLAWDBOT_GATEWAY_TOKEN` 为强密码！

## 🆘 故障排查

```bash
# 运行诊断
docker compose run --rm clawdbot-cli doctor

# 查看详细日志
docker compose logs --tail=100 clawdbot-gateway

# 验证配置
docker compose run --rm clawdbot-cli config validate
```

## 📖 更多资源

- [完整文档](https://docs.clawd.bot)
- [GLM 模型文档](https://docs.clawd.bot/providers/glm)
- [GitHub Issues](https://github.com/clawdbot/clawdbot/issues)
