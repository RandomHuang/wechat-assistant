#!/usr/bin/env node

/**
 * Vision-Enhanced WeChat Assistant
 * 
 * 使用视觉验证的微信自动化（不需要截图）
 * 类似 Desktop Automator Agent 的方式：
 * - 验证 UI 状态
 * - 确认操作结果
 * - 自动重试
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(__dirname, 'vision-state.json');
const LOG_FILE = path.join(__dirname, 'vision-log.json');

// 配置
const CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,
    stepDelay: 500,
};

/**
 * 执行 AppleScript 并返回结果
 */
function runAppleScript(script) {
    try {
        const result = execSync(`osascript -e '${script.replace(/\n/g, "' -e '")}'`, {
            encoding: 'utf-8',
            timeout: 10000,
        });
        return result.trim();
    } catch (e) {
        return null;
    }
}

/**
 * 执行 AppleScript（无返回值）
 */
function runAppleScriptVoid(script) {
    try {
        execSync(`osascript -e '${script.replace(/\n/g, "' -e '")}'`, {
            stdio: 'pipe',
            timeout: 10000,
        });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 睡眠
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 视觉状态检查
 */
const Vision = {
    /**
     * 检查微信是否运行
     */
    isWeChatRunning() {
        try {
            execSync('pgrep -x "WeChat"', { stdio: 'pipe' });
            return true;
        } catch {
            return false;
        }
    },

    /**
     * 检查微信是否在前台
     */
    isFrontmost() {
        const script = `
            tell application "System Events"
                tell process "WeChat"
                    return frontmost
                end tell
            end tell
        `;
        const result = runAppleScript(script);
        return result === 'true';
    },

    /**
     * 获取搜索框内容
     */
    getSearchText() {
        const script = `
            tell application "System Events"
                tell process "WeChat"
                    try
                        return value of text field 1 of group 1 of window 1
                    end try
                    return ""
                end tell
            end tell
        `;
        return runAppleScript(script) || '';
    },

    /**
     * 获取当前聊天对象
     */
    getCurrentChat() {
        const script = `
            tell application "System Events"
                tell process "WeChat"
                    try
                        return value of static text 1 of group 1 of window 1
                    end try
                    return ""
                end tell
            end tell
        `;
        return runAppleScript(script) || '';
    },

    /**
     * 获取消息输入框内容
     */
    getMessageText() {
        const script = `
            tell application "System Events"
                tell process "WeChat"
                    try
                        return value of text area 1 of scroll area 1 of group 1 of window 1
                    end try
                    return ""
                end tell
            end tell
        `;
        return runAppleScript(script) || '';
    },

    /**
     * 检查最后一条消息（验证发送）
     */
    getLastMessage() {
        const script = `
            tell application "System Events"
                tell process "WeChat"
                    try
                        set msgArea to scroll area 1 of group 1 of window 1
                        return value of last text field of msgArea
                    end try
                    return ""
                end tell
            end tell
        `;
        return runAppleScript(script) || '';
    },
};

/**
 * 视觉步骤记录
 */
class VisionStep {
    constructor() {
        this.steps = [];
    }

    record(step, status, details = '') {
        this.steps.push({
            step,
            status,
            details,
            timestamp: Date.now(),
        });
        console.log(`  ${status} ${step}${details ? ': ' + details : ''}`);
    }

    getAll() {
        return this.steps;
    }
}

/**
 * 发送消息（视觉增强版）
 */
async function sendWithVision(contact, message, retries = 0) {
    console.log(`\n👁️  视觉模式：发送消息给 "${contact}"`);
    console.log('─'.repeat(50));
    
    const vision = new VisionStep();
    
    try {
        // 步骤 1: 检查微信运行状态
        vision.record('检查微信运行', Vision.isWeChatRunning() ? '✅' : '❌');
        if (!Vision.isWeChatRunning()) {
            console.log('  🚀 启动微信...');
            execSync('open -a WeChat', { stdio: 'pipe' });
            await sleep(3000);
            vision.record('启动微信', Vision.isWeChatRunning() ? '✅' : '❌');
        }
        
        // 步骤 2: 激活微信窗口
        vision.record('激活微信窗口', '🔄');
        runAppleScriptVoid('tell application "WeChat" to activate');
        await sleep(CONFIG.stepDelay);
        vision.record('激活微信窗口', Vision.isFrontmost() ? '✅' : '⚠️');
        
        // 步骤 3: 聚焦搜索框
        vision.record('聚焦搜索框 (Cmd+F)', '🔄');
        runAppleScriptVoid(`
            tell application "System Events"
                tell process "WeChat"
                    keystroke "f" using command down
                end tell
            end tell
        `);
        await sleep(CONFIG.stepDelay);
        
        // 步骤 4: 输入联系人
        vision.record('输入联系人名字', '🔄');
        const escapedContact = contact.replace(/"/g, '\\"');
        runAppleScriptVoid(`
            tell application "System Events"
                tell process "WeChat"
                    set value of text field 1 of group 1 of window 1 to "${escapedContact}"
                end tell
            end tell
        `);
        await sleep(CONFIG.stepDelay);
        
        // 视觉验证：搜索框内容
        const searchText = Vision.getSearchText();
        const searchMatch = searchText === contact;
        vision.record('验证搜索框', searchMatch ? '✅' : '⚠️', `期望:"${contact}" 实际:"${searchText}"`);
        
        // 步骤 5: 选择联系人
        vision.record('选择联系人 (Enter)', '🔄');
        runAppleScriptVoid(`
            tell application "System Events"
                tell process "WeChat"
                    keystroke return
                end tell
            end tell
        `);
        await sleep(CONFIG.stepDelay + 500);
        
        // 视觉验证：当前聊天对象
        const currentChat = Vision.getCurrentChat();
        const chatMatch = currentChat.includes(contact);
        vision.record('验证聊天对象', chatMatch ? '✅' : '⚠️', `期望:"${contact}" 实际:"${currentChat}"`);
        
        // 步骤 6: 输入消息
        vision.record('输入消息', '🔄');
        const escapedMessage = message.replace(/"/g, '\\"').replace(/\n/g, ' ');
        runAppleScriptVoid(`
            tell application "System Events"
                tell process "WeChat"
                    set value of text area 1 of scroll area 1 of group 1 of window 1 to "${escapedMessage}"
                end tell
            end tell
        `);
        await sleep(CONFIG.stepDelay);
        
        // 视觉验证：消息输入框内容
        const messageText = Vision.getMessageText();
        const messageMatch = messageText.includes(message);
        vision.record('验证消息内容', messageMatch ? '✅' : '⚠️', `"${messageText.substring(0, 20)}..."`);
        
        // 步骤 7: 发送消息
        vision.record('发送消息 (Cmd+Enter)', '🔄');
        runAppleScriptVoid(`
            tell application "System Events"
                tell process "WeChat"
                    keystroke return using command down
                end tell
            end tell
        `);
        await sleep(CONFIG.stepDelay + 500);
        
        // 视觉验证：消息已发送
        const lastMsg = Vision.getLastMessage();
        const sentConfirmed = lastMsg.length > 0;
        vision.record('验证消息发送', sentConfirmed ? '✅' : '⚠️', lastMsg ? `"${lastMsg.substring(0, 20)}..."` : '无消息');
        
        // 总结
        console.log('─'.repeat(50));
        const success = searchMatch && chatMatch && messageMatch && sentConfirmed;
        
        if (success) {
            console.log('✅ 视觉模式发送成功！');
            return true;
        } else {
            console.log('⚠️  部分验证失败');
            if (retries < CONFIG.maxRetries) {
                console.log(`🔄 重试 ${retries + 1}/${CONFIG.maxRetries}...`);
                await sleep(CONFIG.retryDelay);
                return sendWithVision(contact, message, retries + 1);
            }
            console.log('❌ 达到最大重试次数');
            return false;
        }
        
    } catch (e) {
        console.error('❌ 错误:', e.message);
        vision.record('执行错误', '❌', e.message);
        
        if (retries < CONFIG.maxRetries) {
            console.log(`🔄 重试 ${retries + 1}/${CONFIG.maxRetries}...`);
            await sleep(CONFIG.retryDelay);
            return sendWithVision(contact, message, retries + 1);
        }
        return false;
    }
}

// 日志管理
class VisionLog {
    constructor() {
        this.log = this.loadLog();
    }
    
    loadLog() {
        try {
            if (fs.existsSync(LOG_FILE)) {
                return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
            }
        } catch {}
        return { messages: [], contacts: {} };
    }
    
    save() {
        fs.writeFileSync(LOG_FILE, JSON.stringify(this.log, null, 2));
    }
    
    record(contact, message, status, steps = []) {
        this.log.messages.push({ contact, message, status, steps, timestamp: Date.now() });
        if (!this.log.contacts[contact]) this.log.contacts[contact] = [];
        this.log.contacts[contact].push({ message, status, steps, timestamp: Date.now() });
        this.save();
    }
    
    hasSent(contact, message) {
        return this.log.contacts[contact]?.some(r => r.message === message && r.status === 'sent');
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const log = new VisionLog();
    
    if (command === 'send' && args.length >= 3) {
        const contact = args[1];
        const message = args.slice(2).join(' ');
        
        // 防重复检查
        if (log.hasSent(contact, message)) {
            console.log(`⚠️  已发送过此消息，跳过`);
            return;
        }
        
        console.log(`📤 发送："${message}"`);
        const success = await sendWithVision(contact, message);
        
        log.record(contact, message, success ? 'sent' : 'failed', []);
        console.log(success ? '✅ 完成' : '❌ 失败');
        
    } else if (command === 'test') {
        console.log('🧪 视觉测试\n');
        console.log('微信运行:', Vision.isWeChatRunning() ? '✅' : '❌');
        console.log('微信前台:', Vision.isFrontmost() ? '✅' : '❌');
        console.log('搜索框:', Vision.getSearchText() || '(空)');
        console.log('当前聊天:', Vision.getCurrentChat() || '(无)');
        console.log('消息框:', Vision.getMessageText() || '(空)');
        
    } else if (command === 'clear') {
        if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
        if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
        console.log('✅ 已清除');
        
    } else {
        console.log(`
👁️  Vision WeChat - 视觉增强版

用法:
  node vision-wechat-simple.js send <联系人> <消息>  - 视觉模式发送
  node vision-wechat-simple.js test                 - 视觉测试
  node vision-wechat-simple.js clear                - 清除数据

特点:
  ✅ 视觉验证搜索框内容
  ✅ 视觉验证聊天对象
  ✅ 视觉验证消息内容
  ✅ 视觉验证发送结果
  ✅ 自动重试机制
        `);
    }
}

main().catch(console.error);
