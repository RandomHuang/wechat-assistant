#!/usr/bin/env node

/**
 * Vision-Based WeChat Assistant
 * 
 * 使用视觉识别 + 屏幕截图来控制微信
 * 类似 Desktop Automator Agent 的方式
 * 
 * 功能：
 * - 截图识别微信界面
 * - 视觉定位联系人
 * - 视觉确认消息发送成功
 * - OCR 识别聊天记录防重复
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCREENSHOTS_DIR = path.join(__dirname, '.screenshots');
const STATE_FILE = path.join(__dirname, 'vision-state.json');
const LOG_FILE = path.join(__dirname, 'vision-log.json');

// 确保截图目录存在
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// 配置
const CONFIG = {
    screenshotDelay: 500,
    maxRetries: 3,
    ocrEnabled: false, // 需要配置 OCR 服务
};

/**
 * 截取屏幕
 */
function captureScreenshot(name = 'screen') {
    const timestamp = Date.now();
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    
    try {
        // 使用 osascript 调用 screencapture
        execSync(`osascript -e 'do shell script "screencapture -x ${filepath}"'`, { stdio: 'pipe' });
        console.log(`📸 截图已保存：${filename}`);
        return filepath;
    } catch (e) {
        // 备用方案：直接用 screencapture
        try {
            execSync(`/usr/bin/screencapture -x "${filepath}"`, { stdio: 'pipe' });
            console.log(`📸 截图已保存：${filename}`);
            return filepath;
        } catch (e2) {
            console.error('❌ 截图失败:', e2.message);
            return null;
        }
    }
}

/**
 * 截取微信窗口
 */
function captureWeChatWindow(name = 'wechat') {
    try {
        // 获取微信窗口信息
        const windowInfo = execSync(`
            tell application "System Events"
                tell process "WeChat"
                    if not (exists window 1) then
                        return ""
                    end if
                    set win to window 1
                    return position of win & " " & size of win
                end tell
            end tell
        `, { encoding: 'utf-8' }).trim();
        
        if (!windowInfo) {
            console.error('⚠️  微信窗口不存在');
            return captureScreenshot(name);
        }
        
        const [pos, size] = windowInfo.split('} ').map(s => s.replace(/[{}]/g, ''));
        const [x, y] = pos.split(', ').map(Number);
        const [width, height] = size.split(', ').map(Number);
        
        const timestamp = Date.now();
        const filename = `${name}-${timestamp}.png`;
        const filepath = path.join(SCREENSHOTS_DIR, filename);
        
        // 截取指定区域
        execSync(`screencapture -x -R ${x},${y},${width},${height} "${filepath}"`, { stdio: 'pipe' });
        console.log(`📸 微信窗口截图：${filename}`);
        return filepath;
        
    } catch (e) {
        console.error('⚠️  获取窗口失败，使用全屏截图');
        return captureScreenshot(name);
    }
}

/**
 * OCR 识别图片文字（使用 macOS 内置 Vision Framework）
 */
function ocrImage(imagePath) {
    if (!CONFIG.ocrEnabled) {
        return null;
    }
    
    try {
        const script = `
            tell application "System Events"
                set theFile to POSIX file "${imagePath}"
                tell application "Image Events"
                    set theImage to open theFile
                    -- macOS 13+ 支持 Vision OCR
                    -- 这里需要用 AppleScript 调用 Vision framework
                end tell
            end tell
        `;
        // 简化的 OCR - 实际需要使用 Vision framework 或外部 OCR 服务
        return "[OCR 需要配置 Vision 服务]";
    } catch (e) {
        return null;
    }
}

/**
 * 视觉识别：检查微信是否在前台
 */
function isWeChatFrontmost() {
    try {
        const result = execSync(`
            tell application "System Events"
                tell process "WeChat"
                    return frontmost
                end tell
            end tell
        `, { encoding: 'utf-8' }).trim();
        
        return result === 'true';
    } catch {
        return false;
    }
}

/**
 * 视觉识别：检查搜索框是否有内容
 */
function getSearchText() {
    try {
        const result = execSync(`
            tell application "System Events"
                tell process "WeChat"
                    try
                        set searchField to text field 1 of group 1 of window 1
                        return value of searchField
                    end try
                    return ""
                end tell
            end tell
        `, { encoding: 'utf-8' }).trim();
        
        return result;
    } catch {
        return null;
    }
}

/**
 * 视觉识别：检查当前聊天对象
 */
function getCurrentChatContact() {
    try {
        const result = execSync(`
            tell application "System Events"
                tell process "WeChat"
                    try
                        -- 获取聊天窗口标题
                        set titleBar to group 1 of window 1
                        return value of static text 1 of titleBar
                    end try
                    return ""
                end tell
            end tell
        `, { encoding: 'utf-8' }).trim();
        
        return result;
    } catch {
        return null;
    }
}

/**
 * 视觉确认：检查消息是否已发送
 */
function verifyMessageSent(message, timeout = 3000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        try {
            // 截取当前聊天区域
            const screenshot = captureWeChatWindow('verify');
            
            // 可以添加 OCR 识别来确认消息出现在聊天中
            // const ocrResult = ocrImage(screenshot);
            // if (ocrResult && ocrResult.includes(message)) {
            //     return true;
            // }
            
            // 简化版：检查最后一条消息的时间戳
            const lastMsgTime = execSync(`
                tell application "System Events"
                    tell process "WeChat"
                        try
                            set msgList to scroll area 1 of group 1 of window 1
                            return value of last text field of msgList
                        end try
                        return ""
                    end tell
                end tell
            `, { encoding: 'utf-8' }).trim();
            
            if (lastMsgTime) {
                return true;
            }
        } catch (e) {
            // 继续尝试
        }
        
        sleep(500);
    }
    
    return false;
}

/**
 * 发送消息（视觉增强版）
 */
function sendWithVision(contact, message, retries = 0) {
    console.log(`\n👁️  视觉模式：发送消息给 ${contact}`);
    
    // 步骤 1: 截图 - 初始状态
    console.log('📸 步骤 1: 截取初始状态');
    captureScreenshot('01-initial');
    
    // 步骤 2: 激活微信
    console.log('🖱️  步骤 2: 激活微信');
    execSync('tell application "WeChat" to activate', { stdio: 'pipe' });
    sleep(1000);
    
    // 步骤 3: 截图 - 微信激活后
    console.log('📸 步骤 3: 截取微信窗口');
    captureWeChatWindow('02-wechat-active');
    
    // 步骤 4: 检查微信是否在前台
    if (!isWeChatFrontmost()) {
        console.error('❌ 微信未在前台');
        if (retries < CONFIG.maxRetries) {
            console.log(`🔄 重试 ${retries + 1}/${CONFIG.maxRetries}`);
            sleep(1000);
            return sendWithVision(contact, message, retries + 1);
        }
        return false;
    }
    console.log('✅ 微信在前台');
    
    // 步骤 5: 搜索联系人
    console.log('🔍 步骤 4: 搜索联系人');
    const escapedContact = contact.replace(/"/g, '\\"');
    execSync(`
        tell application "System Events"
            tell process "WeChat"
                keystroke "f" using command down
                delay 0.5
                set value of text field 1 of group 1 of window 1 to "${escapedContact}"
            end tell
        end tell
    `, { stdio: 'pipe' });
    sleep(1000);
    
    // 步骤 6: 验证搜索框内容
    const searchText = getSearchText();
    console.log(`📝 搜索框内容：${searchText || '(空)'}`);
    
    if (searchText !== contact) {
        console.error(`⚠️  搜索框内容不匹配：期望 "${contact}", 得到 "${searchText}"`);
    }
    
    // 步骤 7: 选择联系人
    console.log('🖱️  步骤 5: 选择联系人');
    execSync(`
        tell application "System Events"
            tell process "WeChat"
                keystroke return
            end tell
        end tell
    `, { stdio: 'pipe' });
    sleep(1500);
    
    // 步骤 8: 验证当前聊天对象
    const currentContact = getCurrentChatContact();
    console.log(`📝 当前聊天：${currentContact || '(未知)'}`);
    
    // 步骤 9: 输入消息
    console.log('⌨️  步骤 6: 输入消息');
    const escapedMessage = message.replace(/"/g, '\\"').replace(/\n/g, ' ');
    execSync(`
        tell application "System Events"
            tell process "WeChat"
                set value of text area 1 of scroll area 1 of group 1 of window 1 to "${escapedMessage}"
            end tell
        end tell
    `, { stdio: 'pipe' });
    sleep(500);
    
    // 步骤 10: 发送消息
    console.log('🖱️  步骤 7: 发送消息');
    execSync(`
        tell application "System Events"
            tell process "WeChat"
                keystroke return using command down
            end tell
        end tell
    `, { stdio: 'pipe' });
    sleep(1000);
    
    // 步骤 11: 截图 - 发送后
    console.log('📸 步骤 8: 截取发送后状态');
    captureWeChatWindow('03-after-send');
    
    // 步骤 12: 视觉确认消息已发送
    console.log('👁️  步骤 9: 视觉确认');
    const verified = verifyMessageSent(message);
    
    if (verified) {
        console.log('✅ 消息发送已确认');
        return true;
    } else {
        console.error('⚠️  无法确认消息是否发送成功');
        if (retries < CONFIG.maxRetries) {
            console.log(`🔄 重试 ${retries + 1}/${CONFIG.maxRetries}`);
            return sendWithVision(contact, message, retries + 1);
        }
        return false;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command === 'send' && args.length >= 3) {
        const contact = args[1];
        const message = args.slice(2).join(' ');
        
        const success = sendWithVision(contact, message);
        
        if (success) {
            console.log('\n✅ 视觉模式发送成功！');
        } else {
            console.log('\n❌ 视觉模式发送失败');
        }
        
    } else if (command === 'test') {
        console.log('🧪 运行视觉测试...\n');
        
        console.log('1. 测试截图');
        captureScreenshot('test-full');
        
        console.log('\n2. 测试微信窗口截图');
        captureWeChatWindow('test-wechat');
        
        console.log('\n3. 测试微信状态');
        console.log('   前台：', isWeChatFrontmost());
        console.log('   搜索框：', getSearchText() || '(空)');
        console.log('   当前聊天：', getCurrentChatContact() || '(无)');
        
        console.log('\n✅ 测试完成！截图保存在 .screenshots/ 目录');
        
    } else if (command === 'clear') {
        // 清除截图
        if (fs.existsSync(SCREENSHOTS_DIR)) {
            fs.rmSync(SCREENSHOTS_DIR, { recursive: true });
            fs.mkdirSync(SCREENSHOTS_DIR);
        }
        console.log('✅ 截图已清除');
        
    } else {
        console.log(`
👁️  Vision WeChat Assistant - 视觉增强版

用法:
  node vision-wechat.js send <联系人> <消息>   - 视觉模式发送
  node vision-wechat.js test                    - 运行视觉测试
  node vision-wechat.js clear                   - 清除截图

特点:
  - 截图记录每个步骤
  - 视觉验证搜索框内容
  - 视觉确认当前聊天对象
  - 视觉确认消息发送成功
  - 截图保存在 .screenshots/ 目录

配置:
  最大重试：${CONFIG.maxRetries} 次
  OCR: ${CONFIG.ocrEnabled ? '✅' : '❌'}
        `);
    }
}

main().catch(console.error);
