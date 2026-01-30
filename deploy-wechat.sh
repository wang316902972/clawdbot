#!/bin/bash

# Clawdbot WeChat 扩展快速部署脚本
# 一键完成所有配置和部署步骤

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}Clawdbot WeChat 扩展快速部署${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# 检查 Docker 和 Docker Compose
echo -e "${BLUE}[1/8] 检查 Docker 和 Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    exit 1
fi

# 检查 Docker Compose（新版本使用 docker compose）
if ! docker compose version &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker 和 Docker Compose 已安装${NC}"
echo ""

# 检查并创建 .env 文件
echo -e "${BLUE}[2/8] 配置环境变量...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}警告: .env 文件不存在${NC}"
    echo "正在从 .env.wechat.example 创建 .env 文件..."
    
    if [ -f .env.wechat.example ]; then
        cp .env.wechat.example .env
        echo -e "${GREEN}✓ 已创建 .env 文件${NC}"
        echo -e "${YELLOW}⚠ 请编辑 .env 文件并填写必要的配置${NC}"
        echo ""
        echo "必需配置项："
        echo "  - CLAWDBOT_GATEWAY_TOKEN"
        echo "  - ZAI_API_KEY"
        echo ""
        read -p "是否现在编辑 .env 文件？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    else
        echo -e "${RED}错误: .env.wechat.example 文件不存在${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env 文件已存在${NC}"
fi
echo ""

# 创建必要的目录
echo -e "${BLUE}[3/8] 创建必要的目录...${NC}"
mkdir -p data/config
mkdir -p data/workspace
mkdir -p data/wechaty
mkdir -p skills
mkdir -p extensions
echo -e "${GREEN}✓ 目录创建完成${NC}"
echo ""

# 设置权限
echo -e "${BLUE}[4/8] 设置目录权限...${NC}"
if sudo chown -R 1000:1000 data 2>/dev/null; then
    echo -e "${GREEN}✓ 权限设置完成${NC}"
else
    echo -e "${YELLOW}警告: 无法设置权限（可能需要 sudo）${NC}"
fi
echo ""

# 安装 WeChat 扩展依赖
echo -e "${BLUE}[5/8] 安装 WeChat 扩展依赖...${NC}"
if [ -d extensions/wechat ]; then
    cd extensions/wechat
    if [ -f package.json ]; then
        echo "安装 npm 依赖..."
        if npm install 2>&1 | grep -q "up to date"; then
            echo -e "${GREEN}✓ 依赖已是最新${NC}"
        else
            echo -e "${GREEN}✓ 依赖安装完成${NC}"
        fi
    else
        echo -e "${YELLOW}警告: extensions/wechat/package.json 不存在${NC}"
    fi
    cd ../..
else
    echo -e "${YELLOW}警告: extensions/wechat 目录不存在${NC}"
fi
echo ""

# 停止现有容器
echo -e "${BLUE}[6/8] 停止现有容器...${NC}"
if docker compose down 2>/dev/null; then
    echo -e "${GREEN}✓ 容器已停止${NC}"
else
    echo -e "${YELLOW}没有运行中的容器${NC}"
fi
echo ""

# 重新构建镜像
echo -e "${BLUE}[7/8] 重新构建 Docker 镜像...${NC}"
echo -e "${YELLOW}这可能需要几分钟时间，请耐心等待...${NC}"
if docker compose build --no-cache 2>&1 | tail -5; then
    echo -e "${GREEN}✓ 镜像构建完成${NC}"
else
    echo -e "${RED}错误: 镜像构建失败${NC}"
    exit 1
fi
echo ""

# 启动服务
echo -e "${BLUE}[8/8] 启动服务...${NC}"
if docker compose up -d 2>&1 | tail -5; then
    echo -e "${GREEN}✓ 服务已启动${NC}"
else
    echo -e "${RED}错误: 服务启动失败${NC}"
    exit 1
fi
echo ""

# 等待服务启动
echo -e "${BLUE}等待服务启动...${NC}"
sleep 5

# 检查服务状态
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}服务状态${NC}"
echo -e "${BLUE}==========================================${NC}"
docker compose ps
echo ""

# 显示日志
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}服务日志（最后 50 行）${NC}"
echo -e "${BLUE}==========================================${NC}"
docker compose logs --tail=50
echo ""

# 显示后续步骤
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}部署完成！${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""
echo -e "${GREEN}✓ WeChat 扩展已成功部署${NC}"
echo ""
echo "后续步骤："
echo ""
echo "1. 配置 WeChat 通道："
echo -e "   ${YELLOW}docker compose exec clawdbot-gateway clawdbot channels add wechat${NC}"
echo ""
echo "2. 查看服务日志："
echo -e "   ${YELLOW}docker compose logs -f${NC}"
echo ""
echo "3. 进入容器："
echo -e "   ${YELLOW}docker compose exec clawdbot-gateway bash${NC}"
echo ""
echo "4. 停止服务："
echo -e "   ${YELLOW}docker compose down${NC}"
echo ""
echo "5. 重启服务："
echo -e "   ${YELLOW}docker compose restart${NC}"
echo ""
echo "详细文档请查看："
echo -e "   ${YELLOW}extensions/wechat/DOCKER_DEPLOYMENT_FIX.md${NC}"
echo ""
echo -e "${BLUE}==========================================${NC}"
