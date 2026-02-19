#!/bin/bash
# OpenClaw Gateway 停止脚本
# 用途: 优雅地停止 OpenClaw Gateway 服务

set -e

# 项目根目录
PROJECT_DIR="/usr/local/src/clawdbot"
cd "$PROJECT_DIR"

# 日志目录
LOG_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOG_DIR/gateway.pid"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 查找gateway进程
find_gateway_process() {
    # 1. 从PID文件读取
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "$pid"
            return 0
        fi
    fi

    # 2. 通过进程名查找
    local pid=$(ps aux | grep "[n]ode.*gateway" | awk '{print $1}' | head -1)
    if [ -n "$pid" ]; then
        echo "$pid"
        return 0
    fi

    # 3. 通过端口查找
    local port=${GATEWAY_PORT:-18789}
    if command -v lsof >/dev/null 2>&1; then
        pid=$(lsof -t -i ":$port" 2>/dev/null)
    elif command -v ss >/dev/null 2>&1; then
        pid=$(ss -tulpn | grep ":$port" | awk '{print $6}' | head -1)
    fi

    if [ -n "$pid" ]; then
        echo "$pid"
        return 0
    fi

    return 1
}

# 停止服务
stop_gateway() {
    local pid=$(find_gateway_process)

    if [ -z "$pid" ]; then
        log_warn "Gateway 未运行"
        rm -f "$PID_FILE"
        exit 0
    fi

    log_info "正在停止 Gateway (PID: $pid)..."

    # 发送TERM信号
    kill -TERM "$pid" 2>/dev/null || true

    # 等待进程结束
    local max_wait=10
    local count=0

    while [ $count -lt $max_wait ]; do
        if ! ps -p "$pid" > /dev/null 2>&1; then
            log_info "✅ Gateway 已停止"
            rm -f "$PID_FILE"
            exit 0
        fi
        sleep 1
        count=$((count + 1))
        echo -n "."
    done
    echo

    # 如果还没停止，强制KILL
    if ps -p "$pid" > /dev/null 2>&1; then
        log_warn "进程未响应 TERM 信号，使用 KILL..."
        kill -KILL "$pid" 2>/dev/null || true
        sleep 1
        if ! ps -p "$pid" > /dev/null 2>&1; then
            log_info "✅ Gateway 已强制停止"
            rm -f "$PID_FILE"
            exit 0
        fi
    fi

    log_warn "⚠️  无法停止进程，可能需要手动检查"
    exit 1
}

# 主逻辑
main() {
    echo "========================================"
    echo "  OpenClaw Gateway 停止脚本"
    echo "========================================"
    echo

    stop_gateway
}

main "$@"
