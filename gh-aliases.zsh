# GitHub 多账户别名
# 添加到 ~/.zshrc:  source /Users/randomhuang/.openclaw/workspace/gh-aliases.zsh

# GitHub 私人账户 (RandomHuang)
alias gh-personal='GH_CONFIG_DIR=~/.config/gh-personal gh'

# GitHub 公司账户 (randomhuangpl)
alias gh-company='GH_CONFIG_DIR=~/.config/gh-company gh'

# 快捷函数
gh-whoami() {
    echo "当前 gh 账户配置:"
    echo ""
    echo "🏠 私人账户 (gh-personal):"
    GH_CONFIG_DIR=~/.config/gh-personal gh auth status 2>&1 | head -5
    echo ""
    echo "🏢 公司账户 (gh-company):"
    GH_CONFIG_DIR=~/.config/gh-company gh auth status 2>&1 | head -5
}
