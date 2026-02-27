# 微信自动化方法对比

本项目实现了三种微信自动化方法，各有优劣：

---

## 📊 方法对比

| 方法 | 文件 | 优点 | 缺点 | 推荐场景 |
|------|------|------|------|----------|
| **基础版** | `wechat-assistant.js` | 简单可靠，已验证 | 无视觉验证 | 日常使用 |
| **视觉版** | `vision-wechat-simple.js` | 每步验证，更可靠 | UI 路径依赖微信版本 | 重要消息 |
| **混合版** | `hybrid-wechat.js` | 平衡性能和可靠性 | 代码复杂 | 推荐默认 |

---

## 1️⃣ 基础版 (Basic)

**文件：** `wechat-assistant.js` + `wechat-send-fixed.scpt`

### 工作原理
```
Node.js → AppleScript → 微信 Mac 客户端
```

### 使用方法
```bash
node wechat-assistant.js send "联系人" "消息"
```

### 特点
- ✅ 使用成熟的 AppleScript 脚本
- ✅ 重试机制（3 次）
- ✅ 防重复日志
- ✅ 状态持久化
- ❌ 无视觉验证

### 适用场景
- 日常消息发送
- 已知联系人
- 快速发送

---

## 2️⃣ 视觉版 (Vision-Based)

**文件：** `vision-wechat-simple.js`

### 工作原理
```
Node.js → AppleScript → 微信
              ↓
         视觉验证每步结果
         - 搜索框内容
         - 聊天对象
         - 消息内容
         - 发送确认
```

### 使用方法
```bash
node vision-wechat-simple.js send "联系人" "消息"
```

### 特点
- ✅ 每步视觉验证
- ✅ 确认搜索框内容
- ✅ 确认聊天对象
- ✅ 确认消息已发送
- ⚠️ UI 路径依赖微信版本
- ⚠️ 可能误报验证失败

### 适用场景
- 重要消息
- 需要确认发送成功
- 调试 UI 问题

### Desktop Automator Agent 风格

视觉版参考了 Desktop Automator Agent 的设计理念：

> **"模拟人眼和人手"** - 不仅执行操作，还要：
> - 👁️ 看屏幕确认状态
> - 🧠 验证操作结果
> - 🔄 失败时重试

类似项目：
- [Clawd Cursor](https://github.com/topics/desktop-automation) - 社区项目
- [OpenClaw Canvas](https://docs.openclaw.ai/tools/canvas) - OpenClaw 内置工具

---

## 3️⃣ 混合版 (Hybrid) ⭐ 推荐

**文件：** `hybrid-wechat.js`

### 工作原理
```
基础版 AppleScript + 关键步骤视觉验证
```

### 使用方法
```bash
node hybrid-wechat.js send "联系人" "消息"
```

### 特点
- ✅ 使用成熟脚本（可靠）
- ✅ 关键步骤验证
- ✅ 详细步骤日志
- ✅ 自动重试
- ✅ 性能平衡

### 步骤日志示例
```
🎯 混合模式：发送消息给 "Random"
──────────────────────────────────────────────────
  ✅ 检查微信运行
  🔄 激活微信
  ✅ 激活微信
  ✅ 检查脚本文件
  🔄 执行发送脚本
  ✅ 脚本执行：✅ 消息已发送给：Random：...
  🔄 视觉验证
  ✅ 微信响应
──────────────────────────────────────────────────
✅ 混合模式发送成功！
```

---

## 🔧 调试工具

### UI 调试
```bash
node debug-wechat-ui.js
```
打印微信窗口的完整 UI 树，帮助找出正确的元素路径。

### 视觉测试
```bash
node vision-wechat-simple.js test
```
测试视觉检查功能。

---

## 🤖 用 Cursor 改进

在 Cursor 中打开项目：
```bash
cursor .
```

然后按 `Cmd+L` 让 Cursor 帮你：

### 改进视觉验证
```
@vision-wechat-simple.js

优化视觉验证逻辑：
1. 使用更稳健的 UI 路径
2. 添加 OCR 识别支持
3. 添加截图功能（如果系统支持）
```

### 添加新功能
```
@hybrid-wechat.js

添加批量发送功能：
1. 从 CSV 读取联系人和消息
2. 每条消息间隔 2-5 秒随机延迟
3. 显示进度条
4. 支持暂停/恢复
```

### 添加定时发送
```
@wechat-assistant.js

添加定时发送：
1. 命令：schedule <时间> <联系人> <消息>
2. 使用 node-cron 或 setTimeout
3. 定时任务保存到 schedules.json
4. 程序重启后恢复
```

---

## 📚 参考项目

### Desktop Automator Agent
- **Clawd Cursor** - 社区项目，让 LLM 看到屏幕、截图、识别 UI
- **OpenClaw Nodes** - OpenClaw 的节点屏幕控制
- **Playwright** - 浏览器自动化（可用于微信网页版）

### 类似项目
- [wxclaw2026](https://github.com/mr-kelly/wxclaw2026) - 春节祝福 Skill（本项目灵感来源）
- [WeChatFerry](https://github.com/lich0821/WeChatFerry) - 微信机器人框架
- [itchat](https://github.com/itchat) - 微信个人号 API（已失效）

---

## 🎯 推荐使用方法

### 日常使用
```bash
# 基础版 - 最快
node wechat-assistant.js send "张三" "你好"

# 或混合版 - 更可靠
node hybrid-wechat.js send "张三" "你好"
```

### 重要消息
```bash
# 视觉版 - 带完整验证
node vision-wechat-simple.js send "张三" "重要通知"
```

### 批量发送
```bash
# 使用基础版 + 自定义脚本
# 参考 wechat-assistant.js 添加批量功能
```

---

## ⚠️ 注意事项

1. **辅助功能权限** - 需要在系统设置中开启
2. **微信版本** - 不同版本 UI 结构可能不同
3. **发送频率** - 避免短时间内大量发送
4. **隐私** - 所有数据本地存储

---

**选择适合你的方法，开始自动化吧！** 🚀
