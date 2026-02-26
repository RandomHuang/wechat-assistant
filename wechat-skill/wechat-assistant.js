#!/usr/bin/env node

/**
 * WeChat Assistant - 微信消息发送工具
 * 
 * 功能：
 * - 发送消息给指定联系人
 * - 批量发送消息
 * - 状态持久化（断点续传）
 * - 防重复机制
 * - 重试机制
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(__dirname, 'wechat-state.json');
const LOG_FILE = path.join(__dirname, 'wechat-log.json');
const SCRIPT_FILE = path.join(__dirname, 'wechat-send-fixed.scpt');

// 配置
const CONFIG = {
    maxRetries: 3,
    retryDelay: 1000, // 毫秒
    scriptTimeout: 15000 // 毫秒
};

// 状态管理
class WeChatState {
    constructor() {
        this.state = this.loadState();
    }
    
    loadState() {
        try {
            if (fs.existsSync(STATE_FILE)) {
                return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
            }
        } catch (e) {
            console.error('⚠️  加载状态失败:', e.message);
        }
        return {
            lastContact: null,
            sentCount: 0,
            failedCount: 0,
            lastUpdated: Date.now()
        };
    }
    
    save() {
        this.state.lastUpdated = Date.now();
        fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    }
    
    update(contact, success = true) {
        this.state.lastContact = contact;
        if (success) {
            this.state.sentCount++;
        } else {
            this.state.failedCount++;
        }
        this.save();
    }
}

// 日志管理
class WeChatLog {
    constructor() {
        this.log = this.loadLog();
    }
    
    loadLog() {
        try {
            if (fs.existsSync(LOG_FILE)) {
                return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
            }
        } catch (e) {
            console.error('⚠️  加载日志失败:', e.message);
        }
        return {
            messages: [],
            contacts: {}
        };
    }
    
    save() {
        fs.writeFileSync(LOG_FILE, JSON.stringify(this.log, null, 2), 'utf-8');
    }
    
    record(contact, message, status = 'sent', error = null) {
        this.log.messages.push({
            contact,
            message,
            status,
            error,
            timestamp: Date.now()
        });
        
        if (!this.log.contacts[contact]) {
            this.log.contacts[contact] = [];
        }
        this.log.contacts[contact].push({
            message,
            status,
            error,
            timestamp: Date.now()
        });
        
        // 只保留最近 100 条记录
        if (this.log.messages.length > 100) {
            this.log.messages = this.log.messages.slice(-100);
        }
        if (this.log.contacts[contact] && this.log.contacts[contact].length > 20) {
            this.log.contacts[contact] = this.log.contacts[contact].slice(-20);
        }
        
        this.save();
    }
    
    hasSent(contact, message) {
        if (!this.log.contacts[contact]) return false;
        return this.log.contacts[contact].some(
            record => record.message === message && record.status === 'sent'
        );
    }
    
    getRecent(contact, limit = 3) {
        if (!this.log.contacts[contact]) return [];
        return this.log.contacts[contact].slice(-limit);
    }
}

// 检查微信是否运行
function isWeChatRunning() {
    try {
        execSync('pgrep -x "WeChat"', { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

// 检查微信窗口是否可用
function isWeChatWindowAvailable() {
    try {
        const script = `
            tell application "System Events"
                if not (exists process "WeChat") then
                    return false
                end if
                if not (exists window 1 of process "WeChat") then
                    return false
                end if
                return true
            end tell
        `;
        const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' }).trim();
        return result === 'true';
    } catch (e) {
        return false;
    }
}

// 发送消息（通过 AppleScript）- 带重试
function sendMessage(contact, message, retries = 0) {
    if (!fs.existsSync(SCRIPT_FILE)) {
        console.error(`❌ 脚本文件不存在：${SCRIPT_FILE}`);
        return false;
    }
    
    // 转义特殊字符
    const escapedContact = contact.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
    const escapedMessage = message.replace(/"/g, '\\"').replace(/\n/g, ' ').replace(/\\/g, '\\\\');
    
    try {
        const result = execSync(
            `osascript "${SCRIPT_FILE}" "${escapedContact}" "${escapedMessage}"`,
            { 
                encoding: 'utf-8',
                timeout: CONFIG.scriptTimeout,
                stdio: ['pipe', 'pipe', 'pipe']
            }
        );
        
        console.log('📝 脚本输出:', result.trim());
        return true;
    } catch (e) {
        const errorMsg = e.message || e.stderr || '未知错误';
        
        if (retries < CONFIG.maxRetries) {
            console.log(`⚠️  发送失败，${CONFIG.maxRetries - retries} 次后重试...`);
            sleep(CONFIG.retryDelay);
            return sendMessage(contact, message, retries + 1);
        }
        
        console.error('❌ 发送失败:', errorMsg.split('\n')[0]);
        return false;
    }
}

// 睡眠函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const state = new WeChatState();
    const log = new WeChatLog();
    
    if (command === 'send' && args.length >= 3) {
        const contact = args[1];
        const message = args.slice(2).join(' ');
        
        // 检查微信是否运行
        if (!isWeChatRunning()) {
            console.log('⚠️  微信未运行，正在启动...');
            try {
                execSync('open -a WeChat', { stdio: 'pipe' });
                await sleep(3000);
            } catch (e) {
                console.error('❌ 无法启动微信');
                return;
            }
        }
        
        // 检查窗口
        if (!isWeChatWindowAvailable()) {
            console.log('⚠️  微信窗口未就绪，等待...');
            await sleep(2000);
        }
        
        // 防重复检查
        if (log.hasSent(contact, message)) {
            console.log(`⚠️  已给 ${contact} 发送过此消息，跳过`);
            console.log('💡 提示：可以稍微修改消息内容再发送');
            return;
        }
        
        console.log(`📤 发送消息给 ${contact}: ${message}`);
        const success = sendMessage(contact, message);
        
        if (success) {
            log.record(contact, message, 'sent');
            state.update(contact, true);
            console.log(`✅ 发送成功！累计发送：${state.state.sentCount} 条`);
        } else {
            log.record(contact, message, 'failed', 'AppleScript error');
            state.update(contact, false);
            console.log(`❌ 发送失败。失败次数：${state.state.failedCount}`);
        }
        
    } else if (command === 'status') {
        console.log('📊 当前状态:');
        console.log(`   最后联系人：${state.state.lastContact || '无'}`);
        console.log(`   成功发送：${state.state.sentCount} 条`);
        console.log(`   失败次数：${state.state.failedCount} 条`);
        console.log(`   更新时间：${new Date(state.state.lastUpdated).toLocaleString('zh-CN')}`);
        
    } else if (command === 'log') {
        const contact = args[1];
        if (contact && log.log.contacts[contact]) {
            console.log(`📝 ${contact} 的发送记录 (最近 3 条):`);
            const recent = log.getRecent(contact, 3);
            recent.forEach((record, i) => {
                const status = record.status === 'sent' ? '✅' : '❌';
                console.log(`   ${i + 1}. ${status} ${record.message}`);
            });
        } else {
            console.log(`📝 总记录数：${log.log.messages.length} 条`);
            const recent = log.log.messages.slice(-5);
            if (recent.length > 0) {
                console.log('   最近 5 条:');
                recent.forEach((record, i) => {
                    const status = record.status === 'sent' ? '✅' : '❌';
                    console.log(`   ${i + 1}. ${status} ${record.contact}: ${record.message}`);
                });
            }
        }
        
    } else if (command === 'clear') {
        // 清除状态和日志
        if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
        if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
        console.log('✅ 状态和日志已清除');
        
    } else {
        console.log(`
🤖 WeChat Assistant - 微信助手

用法:
  node wechat-assistant.js send <联系人> <消息>   - 发送消息
  node wechat-assistant.js status                - 查看状态
  node wechat-assistant.js log [联系人]          - 查看日志
  node wechat-assistant.js clear                 - 清除状态

示例:
  node wechat-assistant.js send "张三" "新年快乐！"
  node wechat-assistant.js status
  node wechat-assistant.js log "张三"
  node wechat-assistant.js clear

配置:
  最大重试：${CONFIG.maxRetries} 次
  重试间隔：${CONFIG.retryDelay}ms
  超时时间：${CONFIG.scriptTimeout}ms
        `);
    }
}

main().catch(console.error);
