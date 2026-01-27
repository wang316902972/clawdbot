#!/bin/bash
# Clawdbot Docker 快速启动脚本
# 使用 Z.AI GLM-4.7 模型

set -e

echo "🚀 Clawdbot Docker 部署脚本"
echo "================================"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "📝 .env 文件不存在，从模板创建..."
    cp .env.docker .env

    echo ""
    echo "⚠️  请编辑 .env 文件并设置以下配置："
    echo "   - CLAWDBOT_GATEWAY_TOKEN (必填，用于控制 UI 访问)"
    echo ""
    read -p "按 Enter 继续编辑 .env 文件..."

    ${EDITOR:-vi} .env
fi

# 创建必要的目录
echo "📁 创建数据目录..."
mkdir -p data/config
mkdir -p data/workspace

# 检查配置文件
if [ ! -f "data/config/clawdbot.json" ]; then
    echo "📝 clawdbot.json 不存在，从模板创建..."
    cp clawdbot.json.example data/config/clawdbot.json
    echo "✅ 配置文件已创建: data/config/clawdbot.json"
fi

# 检查镜像
if ! docker image inspect clawdbot:local &> /dev/null; then
    echo "🔨 Docker 镜像不存在，开始构建..."
    echo "这可能需要几分钟时间..."
    docker build -t clawdbot:local .
    echo "✅ 镜像构建完成"
else
    echo "✅ Docker 镜像已存在"
fi

# 启动服务
echo ""
echo "🎯 启动 Clawdbot 网关服务..."
docker compose up -d clawdbot-gateway

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 检查服务状态
if docker compose ps clawdbot-gateway | grep -q "Up"; then
    echo ""
    echo "✅ Clawdbot 网关已成功启动！"
    echo ""
    echo "📍 访问地址: http://localhost:18789"
    echo "📋 查看日志: docker compose logs -f clawdbot-gateway"
    echo "🛑 停止服务: docker compose stop clawdbot-gateway"
    echo ""
    echo "📚 完整文档: docs/docker-deployment.md"
else
    echo ""
    echo "❌ 服务启动失败，请查看日志："
    echo "   docker compose logs clawdbot-gateway"
    exit 1
fi
