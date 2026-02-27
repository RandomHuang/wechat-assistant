# WeChat Skill - 微信消息发送

## Description
Mac 微信自动化技能 - 通过 AppleScript 和 OCR 视觉识别控制微信 Mac 客户端发送消息。

基于 [wxclaw2026](https://github.com/mr-kelly/wxclaw2026) 项目实现。

## Usage
- "发微信给 [联系人] [消息内容]"
- "发送消息给 [联系人] 说 [消息]"
- "run wechat assistant send [联系人] [消息]"

## Usage Examples
```bash
node wechat-assistant.js send "文件传输助手" "测试消息"
node wechat-assistant.js send "张三" "你好！"
node wechat-assistant.js send "Random" "今天天气很好😄"
```

## Implementation

### 核心功能
1. **自动启动微信** - 检测微信是否运行，未运行则自动启动
2. **视觉识别** - OCR 扫描联系人列表，精准定位
3. **智能搜索** - 自动搜索联系人并选择
4. **消息发送** - 输入消息并发送
5. **重试机制** - 失败自动重试（最多 3 次）

### 技术要点
- 使用 Swift Vision 进行 OCR 识别
- 使用 peekaboo 进行屏幕交互
- 使用 AppleScript 控制微信窗口
- 状态持久化到本地 JSON 文件

### 依赖
- macOS 12+
- 微信 Mac 客户端
- peekaboo: `brew install steipete/tap/peekaboo`
- Node.js 18+

### 首次使用
1. 安装依赖：`brew install steipete/tap/peekaboo`
2. 授权辅助功能：系统设置 → 隐私与安全 → 辅助功能 → 添加终端/OpenClaw
3. 测试发送：`node wechat-assistant.js send "文件传输助手" "测试"`

## Configuration
编辑 `wechat-assistant.js` 中的 `CONFIG` 对象：
```javascript
const CONFIG = {
    maxRetries: 3,        // 最大重试次数
    retryDelay: 2000,     // 重试间隔（毫秒）
    scrollTicks: -8,      // 滚动步长
    anchorX: 150          // 点击 X 坐标
};
```

## Safety
- 所有数据本地存储
- 不上传任何信息到云端
- 合理控制发送频率，避免被微信判定为机器人

## Troubleshooting

### 问题 1: `screencapture: command not found`
**解决:** 确保 macOS 系统完整，或使用替代方案：
```bash
# 安装 peekaboo
brew install steipete/tap/peekaboo
```

### 问题 2: 辅助功能权限错误
**解决:** 
1. 打开 系统设置 → 隐私与安全 → 辅助功能
2. 添加 终端.app 或 OpenClaw
3. 重启终端

### 问题 3: 找不到联系人
**解决:**
- 确保联系人名字完全匹配
- 检查微信窗口是否被遮挡
- 调整 `CONFIG.listRegion` 区域设置

## Files
- `wechat-assistant.js` - 主程序
- `screenshot.swift` - Swift 截图工具
- `wechat-send-fixed.scpt` - AppleScript 脚本（备用）
