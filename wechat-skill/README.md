# 🤖 WeChat Assistant for OpenClaw

> Mac 微信自动化私人助手 - 帮你自动发送消息、管理聊天

## 功能

- 📤 自动发送消息
- 📝 状态持久化（断点续传）
- 🛡️ 防重复机制
- 🎯 智能联系人管理

## 技术实现

- **Core**: OpenClaw Skill System
- **Language**: JavaScript (Node.js)
- **Environment**: macOS + WeChat Desktop
- **Key Logic**:
  1. 聚焦微信窗口
  2. 遍历联系人列表
  3. 模拟键盘输入发送消息
  4. 记录发送状态到 JSON 日志

## 使用方法

在 OpenClaw 中呼叫：
> "发微信消息给 xxx" 或 "run wechat assistant"

## 免责声明

**温馨提示：自动发送有平台风险，后果自负。**
请合理使用工具，避免对他人造成骚扰。
