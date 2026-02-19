#!/bin/bash
# OpenClaw Gateway 重启脚本
# 用途: 重启 OpenClaw Gateway 服务

set -e

# 项目根目录
PROJECT_DIR="/usr/local/src/clawdbot"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_action() {
    echo -e "${BLUE}[ACTION]${NC} $1"
}

# 主逻辑
main() {
    echo "========================================"
    echo "  OpenClaw Gateway 重启脚本"
    echo "========================================"
    echo

    # 1. 停止服务
    if [ -f "$PROJECT_DIR/scripts/gateway-stop.sh" ]; then
        log_action "步骤 1/2: 停止服务"
        bash "$PROJECT_DIR/scripts/gateway-stop.sh"
        echo
    else
        echo -e "${YELLOW}[ERROR]${NC} 停止脚本不存在"
        exit 1
    fi

    # 2. 等待一下
    log_info "等待 2 秒..."
    sleep 2
    echo

    # 3. 启动服务
    if [ -f "$PROJECT_DIR/scripts/gateway-start.sh" ]; then
        log_action "步骤 2/2: 启动服务"
        bash "$PROJECT_DIR/scripts/gateway-start.sh"
    else
        echo -e "${YELLOW}[ERROR]${NC} 启动脚本不存在"
        exit 1
    fi
}

main "$@"
