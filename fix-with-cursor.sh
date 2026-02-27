#!/bin/bash

# 用 Cursor 自动修复代码问题
# 使用方法：./fix-with-cursor.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

echo "🤖 用 Cursor 修复微信助手代码..."
echo ""

# 1. 在 Cursor 中打开项目
echo "📂 打开项目..."
osascript "$SCRIPT_DIR/open-in-cursor.scpt" "$PROJECT_DIR"
sleep 2

# 2. 创建 Cursor 命令文件
cat > "$SCRIPT_DIR/.cursor-command.md" << 'CURSOR_EOF'
# Cursor 代码修复任务

请帮我修复 wechat-assistant.js 的以下问题：

## 问题
1. AppleScript 路径硬编码，不够灵活
2. 错误处理不够完善
3. 没有重试机制
4. 联系人搜索可能失败（微信窗口结构变化）

## 要求
1. 使用更稳健的 AppleScript 调用方式
2. 添加重试机制（最多 3 次）
3. 添加详细的错误日志
4. 支持中文输入
5. 添加窗口检测

## 文件
- wechat-assistant.js - 主程序
- wechat-send-fixed.scpt - AppleScript 脚本

请优化这两个文件。
CURSOR_EOF

echo ""
echo "✅ 已创建 Cursor 任务文件：.cursor-command.md"
echo ""
echo "📋 下一步操作："
echo ""
echo "1. Cursor 应该已经打开项目"
echo "2. 在 Cursor 中按 Cmd+L 打开聊天"
echo "3. 复制 .cursor-command.md 的内容发给 Cursor"
echo "4. 让 Cursor 自动修复代码"
echo ""
echo "或者，我可以直接帮你优化代码..."
echo ""

# 3. 打开命令文件
open "$SCRIPT_DIR/.cursor-command.md"

echo "📄 已打开任务说明文件"
