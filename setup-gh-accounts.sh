#!/bin/bash

# GitHub 多账户配置脚本 - 方案 3（完全隔离）
# 使用方法：bash setup-gh-accounts.sh

set -e

echo "🔧 配置 GitHub 多账户..."

# 创建配置目录
mkdir -p ~/.config/gh-personal
mkdir -p ~/.config/gh-company

echo ""
echo "📋 步骤 1: 登录私人账户 (RandomHuang)"
echo "   会打开浏览器，请登录 RandomHuang 账户"
echo ""
read -p "按回车继续..."
GH_CONFIG_DIR=~/.config/gh-personal gh auth login --hostname github.com --git-protocol ssh

echo ""
echo "📋 步骤 2: 登录公司账户 (randomhuangpl)"
echo "   会打开浏览器，请登录 randomhuangpl 账户"
echo ""
read -p "按回车继续..."
GH_CONFIG_DIR=~/.config/gh-company gh auth login --hostname github.com --git-protocol ssh

echo ""
echo "✅ 配置完成！"
echo ""
echo "📖 使用方法："
echo ""
echo "   # 私人账户操作"
echo "   GH_CONFIG_DIR=~/.config/gh-personal gh repo create my-project"
echo "   GH_CONFIG_DIR=~/.config/gh-personal gh pr list"
echo ""
echo "   # 公司账户操作"
echo "   GH_CONFIG_DIR=~/.config/gh-company gh repo list"
echo "   GH_CONFIG_DIR=~/.config/gh-company gh pr list"
echo ""
echo "💡 或者添加别名到 ~/.zshrc："
echo ""
cat << 'EOF'

# GitHub 私人账户
alias gh-personal='GH_CONFIG_DIR=~/.config/gh-personal gh'

# GitHub 公司账户
alias gh-company='GH_CONFIG_DIR=~/.config/gh-company gh'

EOF

echo ""
echo "添加后运行：source ~/.zshrc"
echo "然后就可以直接用：gh-personal / gh-company"
