#!/bin/bash
#
# Claude Code Heartbeat - 监控任务完成并通知 AGI
#
# 用途：配合 cron 定期检查 pending-wake.json
#

PENDING_WAKE="/usr/local/src/clawdbot/data/claude-code-results/pending-wake.json"
OPENCLAW_BIN="/usr/local/src/clawdbot/dist/index.js"

if [[ ! -f "$PENDING_WAKE" ]]; then
    exit 0
fi

# 读取信号
EVENT=$(jq -r '.event // empty' "$PENDING_WAKE")
TASK_NAME=$(jq -r '.task_name // empty' "$PENDING_WAKE")
TARGET_GROUP=$(jq -r '.target_group // empty' "$PENDING_WAKE")
RESULT_FILE=$(jq -r '.result_file // empty' "$PENDING_WAKE")

if [[ "$EVENT" != "claude-code-complete" ]]; then
    exit 0
fi

if [[ -z "$TARGET_GROUP" ]] || [[ -z "$RESULT_FILE" ]]; then
    echo "[heartbeat] Invalid pending-wake data"
    rm -f "$PENDING_WAKE"
    exit 1
fi

# 读取完整结果
if [[ ! -f "$RESULT_FILE" ]]; then
    echo "[heartbeat] Result file not found: $RESULT_FILE"
    rm -f "$PENDING_WAKE"
    exit 1
fi

OUTPUT=$(jq -r '.output // ""' "$RESULT_FILE" | head -c 1000)
TIMESTAMP=$(jq -r '.timestamp // ""' "$RESULT_FILE")

# 构建通知消息
MESSAGE="🤖 **Claude Code 任务完成**

📋 **任务**: $TASK_NAME
⏰ **时间**: $TIMESTAMP

📄 **输出预览**:
\`\`\`
$OUTPUT
\`\`\`

---
查看完整结果: $RESULT_FILE"

# 发送到 OpenClaw 群组
node "$OPENCLAW_BIN" message send \
    --channel telegram \
    --target "$TARGET_GROUP" \
    --message "$MESSAGE" \
    --json

# 清理信号文件
rm -f "$PENDING_WAKE"

echo "[heartbeat] Task completed and notified: $TASK_NAME"
