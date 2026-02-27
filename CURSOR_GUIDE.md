# 🤖 用 Cursor 协作开发微信助手

## 快速开始

### 1. 在 Cursor 中打开项目

```bash
# 方法 1: 命令行
cd /Users/randomhuang/.openclaw/workspace/wechat-skill
cursor .

# 方法 2: AppleScript
osascript open-in-cursor.scpt "$(pwd)"

# 方法 3: Cursor 界面
# File → Open Folder → 选择 wechat-skill 目录
```

### 2. Cursor 已配置

项目包含 `.cursorrules` 文件，Cursor 会自动理解：
- 项目结构和技术栈
- 编码规范
- 测试方法
- 常见问题

### 3. 让 Cursor 帮你写代码

**按 `Cmd+L` 打开聊天**，然后说：

```
帮我添加一个功能：批量发送消息给联系人列表

要求：
1. 从 contacts.json 读取联系人和消息
2. 支持延迟发送（避免被微信判定为机器人）
3. 显示进度条
4. 支持暂停和恢复
```

或者：

```
优化 wechat-send-fixed.scpt 的稳定性

问题：
1. 有时找不到搜索框
2. 消息输入框可能聚焦失败
3. 需要更好的错误提示
```

### 4. 用 Cursor 修复 Bug

**按 `Cmd+K` 内联编辑**，选中代码后说：
- "添加错误处理"
- "优化这段逻辑"
- "添加中文注释"

---

## 自动化脚本

### 用 Cursor 自动修复代码

```bash
./fix-with-cursor.sh
```

这个脚本会：
1. 在 Cursor 中打开项目
2. 创建任务说明文件 `.cursor-command.md`
3. 打开任务文件让你审查

然后你在 Cursor 中按 `Cmd+L`，把任务内容发给 Cursor AI。

---

## 常用 Cursor 命令

| 快捷键 | 功能 |
|--------|------|
| `Cmd+L` | 打开聊天面板 |
| `Cmd+K` | 内联编辑选中代码 |
| `Cmd+I` | 快速修复 |
| `Cmd+Shift+M` | 解释选中的代码 |
| `@files` | 引用文件（在聊天中） |
| `@symbols` | 引用符号/函数 |

---

## 示例：让 Cursor 添加功能

### 添加定时发送

在聊天中说：

```
@wechat-assistant.js 

添加定时发送功能：
1. 新增命令：schedule <时间> <联系人> <消息>
2. 时间格式：YYYY-MM-DD HH:mm:ss
3. 使用 setTimeout 实现
4. 定时任务保存到 schedules.json
5. 程序重启后恢复定时任务
```

### 添加联系人分组

```
@wechat-assistant.js

添加联系人分组功能：
1. 新增 groups.json 存储分组
2. 命令：send-group <分组名> <消息>
3. 给分组内所有联系人发送消息
4. 支持延迟（每条间隔 2 秒）
```

### 添加消息模板

```
@wechat-assistant.js

添加消息模板功能：
1. 新增 templates.json 存储模板
2. 命令：send-template <联系人> <模板名>
3. 模板支持变量：{name}, {date}
4. 内置模板：早安、晚安、节日祝福
```

---

## 调试技巧

### 1. 让 Cursor 解释错误

复制错误信息到聊天：
```
这个错误是什么意思？如何修复？

[粘贴错误信息]
```

### 2. 让 Cursor 写测试

```
为 sendMessage 函数写单元测试
使用 Jest 框架
包括正常情况和错误情况
```

### 3. 让 Cursor 优化性能

```
分析这段代码的性能问题
提出优化建议
然后实现优化
```

---

## 最佳实践

1. **小步提交** - 让 Cursor 完成一个小功能就提交
2. **审查代码** - Cursor 生成的代码要审查后再用
3. **测试验证** - 运行测试确保功能正常
4. **更新文档** - 让 Cursor 同时更新 README

---

## 故障排除

### Cursor 无法打开项目

```bash
# 检查 Cursor 是否安装
which cursor

# 如果没安装，创建软链接
ln -s /Applications/Cursor.app/Contents/Resources/app/bin/cursor /usr/local/bin/cursor
```

### Cursor 不理解项目

确保 `.cursorrules` 文件存在，内容正确。

### AppleScript 不工作

让 Cursor 帮你检查：
```
@wechat-send-fixed.scpt

检查这个 AppleScript 的问题
微信版本：最新版
macOS 版本：最新
辅助功能权限：已开启
```

---

## 下一步

1. **试试让 Cursor 优化代码** - 按 `Cmd+L` 开始聊天
2. **添加新功能** - 参考上面的示例
3. **分享你的改进** - push 到 GitHub

**Happy Coding! 🚀**
