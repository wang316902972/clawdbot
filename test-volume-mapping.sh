#!/bin/bash
# 测试 Docker Compose 磁盘映射配置

set -e

echo "========================================="
echo "Docker Compose 磁盘映射测试"
echo "========================================="
echo ""

# 加载环境变量
if [ -f .env.docker ]; then
    echo "✓ 加载环境变量: .env.docker"
    export $(cat .env.docker | grep -v '^#' | xargs)
else
    echo "✗ 未找到 .env.docker 文件"
    exit 1
fi

echo ""
echo "配置的磁盘映射:"
echo "-----------------------------------------"
echo "Skills: ${CLAWDBOT_SKILLS_DIR:-./skills} -> /home/node/clawdbot/skills"
echo "Extensions: ${CLAWDBOT_EXTENSIONS_DIR:-./extensions} -> /home/node/clawdbot/extensions"
echo ""

# 检查目录是否存在
echo "检查宿主机目录:"
echo "-----------------------------------------"
if [ -d "${CLAWDBOT_SKILLS_DIR:-./skills}" ]; then
    echo "✓ Skills 目录存在: ${CLAWDBOT_SKILLS_DIR:-./skills}"
    echo "  包含 $(ls -1 "${CLAWDBOT_SKILLS_DIR:-./skills}" | wc -l) 个项目"
else
    echo "✗ Skills 目录不存在: ${CLAWDBOT_SKILLS_DIR:-./skills}"
fi

if [ -d "${CLAWDBOT_EXTENSIONS_DIR:-./extensions}" ]; then
    echo "✓ Extensions 目录存在: ${CLAWDBOT_EXTENSIONS_DIR:-./extensions}"
    echo "  包含 $(ls -1 "${CLAWDBOT_EXTENSIONS_DIR:-./extensions}" | wc -l) 个项目"
else
    echo "✗ Extensions 目录不存在: ${CLAWDBOT_EXTENSIONS_DIR:-./extensions}"
fi

echo ""
echo "========================================="
echo "验证完成"
echo "========================================="
echo ""
echo "使用方法:"
echo "1. 启动容器: docker compose up -d"
echo "2. 进入容器: docker compose exec clawdbot-gateway bash"
echo "3. 验证映射: ls -la /home/node/clawdbot/skills"
echo ""
