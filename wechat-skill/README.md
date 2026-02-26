# 🤖 WeChat Assistant for OpenClaw

> Mac 微信自动化私人助手 - 支持 Cursor 协作开发

[![GitHub](https://img.shields.io/github/license/RandomHuang/wechat-assistant)](LICENSE)
[![macOS](https://img.shields.io/badge/macOS-12+-blue)](https://www.apple.com/macos)
[![WeChat](https://img.shields.io/badge/WeChat-Mac-green)](https://mac.weixin.qq.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v22+-brightgreen)](https://nodejs.org/)

---

## ✨ 功能特性

- 📤 **自动发送** - 命令行发送微信消息
- 💾 **状态持久化** - 自动记录进度，支持断点续传
- 🛡️ **防重复机制** - 智能检测避免重复发送
- 🔄 **重试机制** - 失败自动重试（最多 3 次）
- 📊 **详细日志** - 记录所有发送历史
- 🤖 **Cursor 支持** - 内置 `.cursorrules`，AI 协作开发

---

## 🚀 快速开始

### 前置条件

- ✅ macOS 12+
- ✅ 微信 Mac 客户端
- ✅ Node.js v22+
- ✅ 辅助功能权限（系统设置 → 隐私与安全性 → 辅助功能）

### 安装

```bash
# 克隆项目
git clone https://github.com/RandomHuang/wechat-assistant.git
cd wechat-assistant/wechat-skill

# 无需安装依赖，纯原生 Node.js
```

### 使用

```bash
# 发送消息
node wechat-assistant.js send "联系人名字" "消息内容"

# 查看状态
node wechat-assistant.js status

# 查看日志
node wechat-assistant.js log "联系人名字"

# 清除状态
node wechat-assistant.js clear
```

### 示例

```bash
# 发送祝福
node wechat-assistant.js send "张三" "新年快乐！🎉"

# 查看发送记录
node wechat-assistant.js log "张三"

# 查看总体状态
node wechat-assistant.js status
```

---

## 🤖 Cursor 协作开发

### 打开项目

```bash
# 方法 1: 命令行
cursor .

# 方法 2: AppleScript
osascript open-in-cursor.scpt "$(pwd)"
```

### 让 Cursor 帮你写代码

1. 按 `Cmd+L` 打开聊天
2. 描述你想添加的功能
3. Cursor 会自动生成代码

**示例：**
```
帮我添加批量发送功能：
1. 从 contacts.json 读取联系人
2. 每条消息间隔 2 秒
3. 显示进度条
```

### 详细指南

查看 [`CURSOR_GUIDE.md`](CURSOR_GUIDE.md) 了解更多 Cursor 协作技巧。

---

## 📁 项目结构

```
wechat-skill/
├── wechat-assistant.js       # 主程序
├── wechat-send-fixed.scpt    # AppleScript 脚本
├── .cursorrules              # Cursor 规则
├── open-in-cursor.scpt       # Cursor 打开脚本
├── fix-with-cursor.sh        # Cursor 修复工具
├── CURSOR_GUIDE.md           # Cursor 使用指南
├── package.json              # 项目配置
├── README.md                 # 本文件
├── wechat-state.json         # 运行状态（自动生成）
└── wechat-log.json           # 发送日志（自动生成）
```

---

## ⚙️ 配置

编辑 `wechat-assistant.js` 中的 `CONFIG` 对象：

```javascript
const CONFIG = {
    maxRetries: 3,        // 最大重试次数
    retryDelay: 1000,     // 重试间隔（毫秒）
    scriptTimeout: 15000  // 脚本超时（毫秒）
};
```

---

## 🔒 隐私与安全

- 所有数据本地存储（`wechat-state.json`, `wechat-log.json`）
- 不上传任何数据到云端
- 不依赖外部 API
- 开源代码，可审查

---

## ⚠️ 免责声明

**温馨提示：自动发送有平台风险，后果自负。**

请合理使用工具，避免对他人造成骚扰：
- 不要短时间内大量发送
- 不要用于垃圾消息
- 遵守微信使用条款

---

## 📝 更新日志

### v1.1.0 (2026-02-26)
- ✨ 添加重试机制
- 🐛 修复 AppleScript 输入问题
- 📊 完善错误日志
- 🤖 添加 Cursor 支持
- 📚 添加使用文档

### v1.0.0 (2026-02-26)
- 🎉 初始版本
- 基础消息发送功能
- 状态持久化
- 防重复机制

---

## 🙏 致谢

- [OpenClaw](https://openclaw.ai) - AI 助手框架
- [Cursor](https://cursor.com) - AI 代码编辑器
- [wxclaw2026](https://github.com/mr-kelly/wxclaw2026) - 灵感来源

---

## 📄 License

MIT License - 详见 [LICENSE](LICENSE)

---

**Happy Messaging! 💬**
