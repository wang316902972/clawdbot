#!/bin/bash
# OpenClaw Gateway 启动脚本
# 用途: 启动 OpenClaw Gateway 服务

set -e

# 项目根目录
PROJECT_DIR="/usr/local/src/clawdbot"
cd "$PROJECT_DIR"

# 日志目录
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

# 配置
GATEWAY_PORT=${GATEWAY_PORT:-18789}
PID_FILE="$LOG_DIR/gateway.pid"
LOG_FILE="$LOG_DIR/gateway-$(date +%Y%m%d).log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否已运行
check_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0  # 正在运行
        else
            # PID文件存在但进程不存在，清理
            rm -f "$PID_FILE"
        fi
    fi

    # 检查端口占用
    if command -v lsof >/dev/null 2>&1; then
        if lsof -i ":$GATEWAY_PORT" >/dev/null 2>&1; then
            local pid=$(lsof -t -i ":$GATEWAY_PORT")
            echo "$pid" > "$PID_FILE"
            log_warn "端口 $GATEWAY_PORT 已被进程 $pid 占用，已更新 PID 文件"
            return 0
        fi
    elif command -v ss >/dev/null 2>&1; then
        if ss -tulpn | grep -q ":$GATEWAY_PORT"; then
            log_warn "端口 $GATEWAY_PORT 已被占用"
            return 0
        fi
    fi

    return 1  # 未运行
}

# 启动服务
start_gateway() {
    log_info "正在启动 OpenClaw Gateway..."

    # 确保配置文件存在
    if [ ! -f "$HOME/.openclaw/openclaw.json" ]; then
        log_error "配置文件不存在: $HOME/.openclaw/openclaw.json"
        log_info "尝试从项目配置复制..."
        mkdir -p "$HOME/.openclaw"
        if [ -f "data/config/clawdbot.json" ]; then
            cp data/config/clawdbot.json "$HOME/.openclaw/openclaw.json"
            log_info "已复制配置文件"
        else
            log_error "项目配置文件也不存在，请先配置"
            exit 1
        fi
    fi

    # 检查配置有效性
    if command -v jq >/dev/null 2>&1; then
        local gateway_mode=$(jq -r '.gateway.mode // "unset"' "$HOME/.openclaw/openclaw.json")
        if [ "$gateway_mode" = "unset" ] || [ -z "$gateway_mode" ]; then
            log_error "配置无效: gateway.mode 未设置或为空"
            exit 1
        fi
        log_info "Gateway 模式: $gateway_mode"
    fi

    # 启动服务
    nohup /usr/local/bin/node dist/index.js gateway --port "$GATEWAY_PORT" >> "$LOG_FILE" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"

    # 等待启动
    log_info "等待服务启动 (PID: $pid)..."
    local max_wait=10
    local count=0

    while [ $count -lt $max_wait ]; do
        if ! ps -p "$pid" > /dev/null 2>&1; then
            log_error "启动失败，请查看日志: $LOG_FILE"
            tail -20 "$LOG_FILE"
            exit 1
        fi

        if command -v lsof >/dev/null 2>&1; then
            if lsof -i ":$GATEWAY_PORT" >/dev/null 2>&1; then
                break
            fi
        elif command -v ss >/dev/null 2>&1; then
            if ss -tulpn | grep -q ":$GATEWAY_PORT"; then
                break
            fi
        fi

        sleep 1
        count=$((count + 1))
        echo -n "."
    done
    echo

    # 验证服务
    if ps -p "$pid" > /dev/null 2>&1; then
        log_info "✅ Gateway 启动成功!"
        log_info "PID: $pid"
        log_info "端口: $GATEWAY_PORT"
        log_info "日志: $LOG_FILE"

        # 测试HTTP服务
        sleep 1
        if command -v curl >/dev/null 2>&1; then
            if curl -s "http://localhost:$GATEWAY_PORT" >/dev/null 2>&1; then
                log_info "✅ HTTP 服务响应正常"
            else
                log_warn "⚠️  HTTP 服务未响应，可能正在初始化"
            fi
        fi
    else
        log_error "❌ 启动失败，请查看日志"
        exit 1
    fi
}

# 主逻辑
main() {
    echo "========================================"
    echo "  OpenClaw Gateway 启动脚本"
    echo "========================================"
    echo

    if check_running; then
        log_warn "Gateway 已经在运行"
        local pid=$(cat "$PID_FILE")
        log_info "PID: $pid, 端口: $GATEWAY_PORT"
        exit 0
    fi

    start_gateway
}

main "$@"
