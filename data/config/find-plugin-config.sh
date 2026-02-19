#!/bin/bash
echo "========================================="
echo "  查找插件配置入口"
echo "========================================="
echo ""

# 查找所有Chrome窗口
echo "方法 1: 通过扩展页面"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. 在Chrome地址栏输入:"
echo "   chrome://extensions/"
echo ""
echo "2. 在扩展列表中找到:"
echo "   'OpenClaw Browser Relay'"
echo ""
echo "3. 点击卡片右侧的按钮或链接"
echo "   通常有: '详细信息' '删除' '选项'"
echo ""
echo "4. 如果没有'选项'按钮，点击 '详细信息'"
echo "   然后在详情页找: '扩展程序选项'"
echo ""

echo "方法 2: 通过Chrome工具栏"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. 点击Chrome工具栏右侧的拼图图标"
echo ""
echo "2. 找到 'OpenClaw Browser Relay'"
echo ""
echo "3. 点击该图标或右侧的更多按钮 (···)"
echo ""
echo "4. 选择 '选项' 或右键 → '选项'"
echo ""

echo "方法 3: 直接访问"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "直接在地址栏输入配置URL"
echo ""

# 查找插件ID
for ext_dir in ~/.config/google-chrome/*/Extensions/*openclaw* 2>/dev/null; do
    if [ -d "$ext_dir" ]; then
        ext_id=$(basename "$ext_dir")
        echo "chrome-extension://$ext_id/options.html"
        break
    fi
done

echo ""
echo "========================================="
echo "如果以上方法都不行，插件可能未正确加载"
echo "========================================="
