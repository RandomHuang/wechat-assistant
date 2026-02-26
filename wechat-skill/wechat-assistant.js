#!/usr/bin/env node

/**
 * WeChat Assistant - 微信消息发送工具
 * 
 * 功能：
 * - 发送消息给指定联系人
 * - 批量发送消息
 * - 状态持久化（断点续传）
 * - 防重复机制
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(__dirname, 'wechat-state.json');
const LOG_FILE = path.join(__dirname, 'wechat-log.json');

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
            console.error('加载状态失败:', e.message);
        }
        return {
            lastContact: null,
            sentCount: 0,
            lastUpdated: Date.now()
        };
    }
    
    save() {
        this.state.lastUpdated = Date.now();
        fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
    }
    
    update(contact) {
        this.state.lastContact = contact;
        this.state.sentCount++;
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
            console.error('加载日志失败:', e.message);
        }
        return {
            messages: [],
            contacts: {}
        };
    }
    
    save() {
        fs.writeFileSync(LOG_FILE, JSON.stringify(this.log, null, 2));
    }
    
    record(contact, message, status = 'sent') {
        this.log.messages.push({
            contact,
            message,
            status,
            timestamp: Date.now()
        });
        
        if (!this.log.contacts[contact]) {
            this.log.contacts[contact] = [];
        }
        this.log.contacts[contact].push({
            message,
            status,
            timestamp: Date.now()
        });
        
        this.save();
    }
    
    hasSent(contact, message) {
        if (!this.log.contacts[contact]) return false;
        return this.log.contacts[contact].some(
            record => record.message === message
        );
    }
}

// 发送消息（通过 AppleScript 文件）
function sendMessage(contact, message) {
    const scriptPath = path.join(__dirname, 'wechat-send-fixed.scpt');
    
    try {
        execSync(`osascript "${scriptPath}" "${contact}" "${message}"`, { 
            stdio: 'pipe',
            timeout: 10000 
        });
        return true;
    } catch (e) {
        console.error('发送失败:', e.message);
        return false;
    }
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
        
        // 防重复检查
        if (log.hasSent(contact, message)) {
            console.log(`⚠️  已给 ${contact} 发送过此消息，跳过`);
            return;
        }
        
        console.log(`📤 发送消息给 ${contact}: ${message}`);
        const success = sendMessage(contact, message);
        
        if (success) {
            log.record(contact, message, 'sent');
            state.update(contact);
            console.log(`✅ 发送成功！累计发送：${state.state.sentCount} 条`);
        } else {
            log.record(contact, message, 'failed');
            console.log('❌ 发送失败');
        }
    } else if (command === 'status') {
        console.log('📊 当前状态:');
        console.log(`   最后联系人：${state.state.lastContact || '无'}`);
        console.log(`   累计发送：${state.state.sentCount} 条`);
        console.log(`   更新时间：${new Date(state.state.lastUpdated).toLocaleString('zh-CN')}`);
    } else if (command === 'log') {
        const contact = args[1];
        if (contact && log.log.contacts[contact]) {
            console.log(`📝 ${contact} 的发送记录:`);
            log.log.contacts[contact].forEach((record, i) => {
                console.log(`   ${i + 1}. [${record.status}] ${record.message}`);
            });
        } else {
            console.log(`📝 总记录数：${log.log.messages.length} 条`);
        }
    } else {
        console.log(`
🤖 WeChat Assistant

用法:
  node wechat-assistant.js send <联系人> <消息>   - 发送消息
  node wechat-assistant.js status                - 查看状态
  node wechat-assistant.js log [联系人]          - 查看日志

示例:
  node wechat-assistant.js send "张三" "新年快乐！"
  node wechat-assistant.js status
  node wechat-assistant.js log "张三"
        `);
    }
}

main().catch(console.error);
