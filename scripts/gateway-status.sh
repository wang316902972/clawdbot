#!/bin/bash
# OpenClaw Gateway 状态查询脚本
# 用途: 查看 Gateway 服务运行状态

set -e

# 项目根目录
PROJECT_DIR="/usr/local/src/clawdbot"
LOG_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOG_DIR/gateway.pid"
GATEWAY_PORT=${GATEWAY_PORT:-18789}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 查找进程
find_process() {
    # 1. 从PID文件
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "$pid"
            return 0
        fi
    fi

    # 2. 通过进程名（使用pgrep更可靠）
    if command -v pgrep >/dev/null 2>&1; then
        local pid=$(pgrep -f "node.*gateway" | head -1)
        if [ -n "$pid" ]; then
            echo "$pid"
            return 0
        fi
    fi

    # 3. 通过ps查找
    ps aux | grep '[n]ode.*gateway' | awk '{print $2}' | head -1
}

# 格式化时间
format_time() {
    local seconds=$1
    if [ $seconds -lt 60 ]; then
        echo "${seconds}秒"
    elif [ $seconds -lt 3600 ]; then
        echo "$((seconds / 60))分钟"
    else
        echo "$((seconds / 3600))小时$((seconds % 3600 / 60))分钟"
    fi
}

# 显示状态
show_status() {
    echo "========================================"
    echo "  OpenClaw Gateway 服务状态"
    echo "========================================"
    echo

    local pid=$(find_process)

    if [ -z "$pid" ]; then
        echo -e "${RED}状态: 未运行${NC}"
        echo
        echo "使用以下命令启动："
        echo -e "${GREEN}  bash scripts/gateway-start.sh${NC}"
        exit 0
    fi

    echo -e "${GREEN}状态: 运行中${NC}"
    echo

    # 进程信息
    echo "━━━ 进程信息 ━━━"
    echo "PID:        $pid"
    echo "命令行:     $(ps -p $pid -o command= | cut -c1-60)"

    # 运行时间
    local elapsed_time=$(ps -p "$pid" -o etimes= 2>/dev/null | tr -d ' ')
    if [ -n "$elapsed_time" ] && [ "$elapsed_time" != "ELAPSED" ]; then
        echo "运行时间:   $(format_time "$elapsed_time")"
    else
        echo "运行时间:   N/A"
    fi

    # 内存使用
    local mem_kb=$(ps -p "$pid" -o rss= 2>/dev/null | tr -d ' ')
    if [ -n "$mem_kb" ] && [ "$mem_kb" != "RSS" ]; then
        local mem=$(awk "BEGIN {printf \"%.1f\", $mem_kb/1024}")
        echo "内存使用:   ${mem} MB"
    else
        echo "内存使用:   N/A"
    fi

    # CPU使用率
    local cpu=$(ps -p "$pid" -o %cpu= 2>/dev/null | tr -d ' ')
    if [ -n "$cpu" ] && [ "$cpu" != "%CPU" ]; then
        echo "CPU使用:    ${cpu}%"
    else
        echo "CPU使用:    N/A"
    fi

    echo

    # 端口监听
    echo "━━━ 网络状态 ━━━"
    if command -v lsof >/dev/null 2>&1; then
        if lsof -i ":$GATEWAY_PORT" >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} 端口 $GATEWAY_PORT 正在监听"
            lsof -i ":$GATEWAY_PORT" | grep -v COMMAND | awk '{printf "  协议: %-6s  地址: %s\n", $5, $4}'
        else
            echo -e "${RED}✗${NC} 端口 $GATEWAY_PORT 未监听"
        fi
    elif command -v ss >/dev/null 2>&1; then
        if ss -tulpn | grep -q ":$GATEWAY_PORT"; then
            echo -e "${GREEN}✓${NC} 端口 $GATEWAY_PORT 正在监听"
        else
            echo -e "${RED}✗${NC} 端口 $GATEWAY_PORT 未监听"
        fi
    fi

    echo

    # HTTP服务测试
    echo "━━━ HTTP 服务 ━━━"
    if command -v curl >/dev/null 2>&1; then
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$GATEWAY_PORT" --max-time 3 2>/dev/null || echo "000")
        if [ "$http_code" = "200" ] || [ "$http_code" = "304" ]; then
            echo -e "${GREEN}✓${NC} HTTP 服务正常 (HTTP $http_code)"
            local title=$(curl -s "http://localhost:$GATEWAY_PORT" 2>/dev/null | grep -o '<title>.*</title>' | sed 's/<[^>]*>//g')
            echo "  标题: ${title:0:50}"
        else
            echo -e "${YELLOW}⚠${NC} HTTP 服务未响应 (HTTP $http_code)"
        fi
    else
        echo "curl 未安装，无法测试 HTTP 服务"
    fi

    echo

    # 日志文件
    echo "━━━ 日志信息 ━━━"
    if [ -d "$LOG_DIR" ]; then
        local latest_log=$(ls -t "$LOG_DIR"/gateway-*.log 2>/dev/null | head -1)
        if [ -n "$latest_log" ]; then
            echo "最新日志:   $latest_log"
            echo "文件大小:   $(du -h "$latest_log" | awk '{print $1}')"
            echo "最后修改:   $(stat -c %y "$latest_log" 2>/dev/null || stat -f '%Sm' "$latest_log")"
            echo
            echo "查看最新日志:"
            echo -e "${CYAN}  tail -f $latest_log${NC}"
        else
            echo "未找到日志文件"
        fi
    else
        echo "日志目录不存在: $LOG_DIR"
    fi

    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 主逻辑
main() {
    show_status
}

main "$@"
