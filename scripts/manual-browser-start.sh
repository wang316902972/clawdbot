#!/bin/bash
# 手动启动 Chrome Browser Relay 的调试脚本

echo "========================================"
echo "  手动启动 Chrome Browser Relay"
echo "========================================"
echo ""

CHROME_PORT=18792
USER_DATA_DIR="/tmp/chrome-debug-profile"

# 检查Chrome是否安装
if ! command -v google-chrome &> /dev/null; then
    echo "❌ 错误: 未找到 google-chrome 命令"
    echo ""
    echo "请安装 Chrome:"
    echo "  sudo apt install google-chrome-stable"
    exit 1
fi

# 检查端口占用
if lsof -i ":$CHROME_PORT" >/dev/null 2>&1; then
    echo "⚠️  端口 $CHROME_PORT 已被占用"
    echo "PID: $(lsof -t -i ":$CHROME_PORT" | awk '{print $2}')"
    echo ""
    read -p "是否停止占用进程? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        lsof -t -i ":$CHROME_PORT" | awk '{print $2}' | xargs kill -9
        echo "✅ 进程已停止"
        sleep 1
    fi
fi

# 清理旧的profile
if [ -d "$USER_DATA_DIR" ]; then
    echo "清理旧的用户数据目录..."
    rm -rf "$USER_DATA_DIR"
fi

# 启动Chrome
echo "启动 Chrome (CDP端口: $CHROME_PORT)..."
echo ""

google-chrome \
    --remote-debugging-port="$CHROME_PORT" \
    --user-data-dir="$USER_DATA_DIR" \
    --no-first-run \
    --no-default-browser-check \
    --disable-backgrounding- \
    about:blank &

CHROME_PID=$!
echo "✅ Chrome 已启动 (PID: $CHROME_PID)"
echo ""
echo "CDP 端口: $CHROME_PORT"
echo "用户数据: $USER_DATA_DIR"
echo ""
echo "等待5秒检查端口..."
sleep 5

if lsof -i ":$CHROME_PORT" >/dev/null 2>&1; then
    echo "✅ 端口 $CHROME_PORT 正在监听"
    echo ""
    echo "浏览器扩展现在应该可以连接了！"
else
    echo "❌ 端口 $CHROME_PORT 未监听"
    echo ""
    echo "请检查 Chrome 是否正常启动"
fi
