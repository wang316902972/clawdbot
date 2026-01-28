#!/bin/bash
# 代理连接测试脚本

set -e

echo "========================================="
echo "Clawdbot WhatsApp 网络连接测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查代理是否在宿主机上运行
echo "1. 检查宿主机代理服务 (127.0.0.1:7897)..."
if curl -x http://127.0.0.1:7897 -s -o /dev/null -w "%{http_code}" https://www.google.com 2>/dev/null | grep -q "200"; then
    echo -e "${GREEN}✓${NC} 代理服务运行正常"
else
    echo -e "${RED}✗${NC} 代理服务无法访问"
    echo ""
    echo "请确保代理服务在宿主机 7897 端口运行："
    echo "  - 检查代理是否启动"
    echo "  - 检查防火墙是否允许 localhost 连接"
    echo "  - 测试: curl -x http://127.0.0.1:7897 https://www.google.com"
    exit 1
fi
echo ""

# 测试 WhatsApp 网站连接
echo "2. 测试通过代理访问 WhatsApp..."
HTTP_CODE=$(curl -x http://127.0.0.1:7897 -s -o /dev/null -w "%{http_code}" https://web.whatsapp.com 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✓${NC} WhatsApp 网站可访问 (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} 无法访问 WhatsApp 网站 (HTTP $HTTP_CODE)"
    echo ""
    echo "可能的原因："
    echo "  - 代理不支持 HTTPS"
    echo "  - 代理被 WhatsApp 服务器阻止"
    echo "  - 网络配置问题"
    exit 1
fi
echo ""

# 检查 Docker 容器状态
echo "3. 检查 Docker 容器..."
if docker compose ps 2>/dev/null | grep -q "clawdbot"; then
    echo -e "${GREEN}✓${NC} Docker 容器已启动"
else
    echo -e "${YELLOW}⚠${NC} Docker 容器未运行，请先启动: docker compose up -d"
    exit 1
fi
echo ""

# 测试容器内的代理连接
echo "4. 测试容器内的网络连接..."
echo "   测试代理可访问性..."
if docker compose exec -T clawdbot-cli curl -x http://127.0.0.1:7897 -s -o /dev/null -w "%{http_code}" https://www.google.com 2>/dev/null | grep -q "200"; then
    echo -e "${GREEN}✓${NC} 容器可以访问宿主机代理"
else
    echo -e "${RED}✗${NC} 容器无法访问宿主机代理"
    echo ""
    echo "在 network_mode: host 模式下，127.0.0.1 应该指向宿主机。"
    echo "如果仍然失败，请检查："
    echo "  - Docker 是否以 --network=host 模式运行"
    echo "  - 容器内环境变量是否正确: docker compose exec clawdbot-cli env | grep -i proxy"
    exit 1
fi
echo ""

echo "   测试 WhatsApp 连接..."
HTTP_CODE=$(docker compose exec -T clawdbot-cli curl -x http://127.0.0.1:7897 -s -o /dev/null -w "%{http_code}" https://web.whatsapp.com 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✓${NC} 容器可以通过代理访问 WhatsApp (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} 容器无法通过代理访问 WhatsApp (HTTP $HTTP_CODE)"
    exit 1
fi
echo ""

# 检查环境变量
echo "5. 验证容器内环境变量..."
echo "   HTTP_PROXY: $(docker compose exec -T clawdbot-cli printenv HTTP_PROXY 2>/dev/null || echo '<not set>')"
echo "   HTTPS_PROXY: $(docker compose exec -T clawdbot-cli printenv HTTPS_PROXY 2>/dev/null || echo '<not set>')"
echo "   GLOBAL_AGENT_HTTP_PROXY: $(docker compose exec -T clawdbot-cli printenv GLOBAL_AGENT_HTTP_PROXY 2>/dev/null || echo '<not set>')"
echo ""

echo "========================================="
echo -e "${GREEN}所有测试通过！${NC}"
echo "========================================="
echo ""
echo "现在可以尝试 WhatsApp 登录："
echo "  docker compose exec clawdbot-cli clawdbot channels login --verbose"
echo ""
