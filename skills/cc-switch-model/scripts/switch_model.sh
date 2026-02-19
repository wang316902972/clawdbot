#!/bin/bash
# 切换 Claude Code 默认模型脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 默认配置
CLAUDE_DIR="$HOME/.claude"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
BACKUP_DIR="$CLAUDE_DIR/backups"

# 支持的模型
MODELS=(
    "haiku"
    "sonnet"
    "opus"
    "glm-4.7"
    "minmax"
    "zai/glm-4.7"
)

# 显示使用说明
usage() {
    echo "用法: $0 <模型名称>"
    echo ""
    echo "支持的模型:"
    printf '  - %s\n' "${MODELS[@]}"
    echo ""
    echo "示例:"
    echo "  $0 sonnet"
    echo "  $0 opus"
    echo "  $0 minmax"
}

# 验证模型
validate_model() {
    local model=$1
    for valid_model in "${MODELS[@]}"; do
        if [[ "$model" == "$valid_model" ]]; then
            return 0
        fi
    done
    return 1
}

# 备份当前配置
backup_config() {
    mkdir -p "$BACKUP_DIR"
    if [[ -f "$SETTINGS_FILE" ]]; then
        local backup_file="$BACKUP_DIR/settings.json.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$SETTINGS_FILE" "$backup_file"
        echo -e "${YELLOW}已备份当前配置到: $backup_file${NC}"
    fi
}

# 切换模型
switch_model() {
    local model=$1

    # 验证模型
    if ! validate_model "$model"; then
        echo -e "${RED}错误: 不支持的模型 '$model'${NC}"
        echo ""
        usage
        exit 1
    fi

    # 备份配置
    backup_config

    # 创建 Claude 目录
    mkdir -p "$CLAUDE_DIR"

    # 写入新配置
    cat > "$SETTINGS_FILE" << EOF
{
  "model": "$model"
}
EOF

    echo -e "${GREEN}✓ 默认模型已切换到: $model${NC}"
    echo ""
    echo "配置文件: $SETTINGS_FILE"
    echo ""
    echo "提示: 重启 Claude Code 会话以应用新模型"
}

# 显示当前模型
show_current() {
    if [[ -f "$SETTINGS_FILE" ]]; then
        local current_model=$(grep -o '"model":[[:space:]]*"[^"]*"' "$SETTINGS_FILE" | cut -d'"' -f4)
        if [[ -n "$current_model" ]]; then
            echo -e "${GREEN}当前默认模型: $current_model${NC}"
        else
            echo -e "${YELLOW}未设置默认模型（将使用系统默认）${NC}"
        fi
    else
        echo -e "${YELLOW}未设置默认模型（将使用系统默认）${NC}"
    fi
}

# 主函数
main() {
    case "$1" in
        -h|--help|help)
            usage
            exit 0
            ;;
        --current|--show|current|show)
            show_current
            exit 0
            ;;
        "")
            echo -e "${RED}错误: 未指定模型${NC}"
            echo ""
            usage
            exit 1
            ;;
        *)
            switch_model "$1"
            ;;
    esac
}

main "$@"
