# WeChat Assistant Skill

## Description
Mac 微信自动化技能 - 通过 OpenClaw 控制微信 Mac 客户端自动发送消息

## Usage
- "发微信消息给 [联系人] [消息内容]"
- "run wechat assistant"
- "发送祝福给所有联系人"

## Implementation

### 核心功能
1. **窗口控制**: 聚焦微信 Mac 客户端
2. **联系人遍历**: 自动滚动联系人列表
3. **消息发送**: 模拟键盘输入并发送
4. **状态管理**: JSON 日志记录发送进度
5. **防重复**: 检查聊天记录避免重复发送

### 技术要点
- 使用 `exec` 运行 AppleScript 控制微信
- 使用 `canvas` 或 `browser` 进行截图 OCR（可选）
- 状态持久化到 `wechat-state.json`

### 安全提示
- 首次使用建议手动测试
- 避免短时间内大量发送
- 重要消息建议人工确认
