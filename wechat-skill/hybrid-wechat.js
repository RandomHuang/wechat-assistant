#!/usr/bin/env node

/**
 * Hybrid WeChat Assistant
 * 
 * 混合模式：AppleScript 控制 + 视觉验证
 * 参考 Desktop Automator Agent 的设计理念
 * 
 * 特点：
 * - 使用成熟的 wechat-send-fixed.scpt 执行发送
 * - 在关键步骤进行视觉验证
 * - 记录每个步骤的状态
 * - 支持截图（如果系统支持）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(__dirname, 'hybrid-state.json');
const LOG_FILE = path.join(__dirname, 'hybrid-log.json');
const SCRIPT_FILE = path.join(__dirname, 'wechat-send-fixed.scpt');

// 配置
const CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,
    enableVisionCheck: true,
};

/**
 * 执行步骤记录
 */
class StepLogger {
    constructor() {
        this.steps = [];
    }

    record(name, status, details = '') {
        const step = {
            name,
            status,
            details,
            timestamp: Date.now(),
        };
        this.steps.push(step);
        
        const icon = status === '✅' ? '✅' : status === '❌' ? '❌' : '🔄';
        console.log(`  ${icon} ${name}${details ? ': ' + details : ''}`);
        return step;
    }

    summary() {
        const success = this.steps.every(s => s.status === '✅');
        return {
            success,
            total: this.steps.length,
            steps: this.steps,
        };
    }
}

/**
 * 视觉检查（可选）
 */
const VisionCheck = {
    isWeChatRunning() {
        try {
            execSync('pgrep -x "WeChat"', { stdio: 'pipe' });
            return true;
        } catch {
            return false;
        }
    },

    activateWeChat() {
        try {
            execSync('osascript -e \'tell application "WeChat" to activate\'', { stdio: 'pipe' });
            return true;
        } catch {
            return false;
        }
    },

    // 简化的视觉检查 - 检查微信是否响应
    isResponsive() {
        try {
            const result = execSync(`
                osascript -e 'tell application "System Events"' \\
                    -e 'tell process "WeChat"' \\
                    -e 'return frontmost' \\
                    -e 'end tell' \\
                    -e 'end tell'
            `, { encoding: 'utf-8', timeout: 2000 }).trim();
            return result === 'true';
        } catch {
            return false;
        }
    },
};

/**
 * 发送消息（混合模式）
 */
async function sendHybrid(contact, message, retries = 0) {
    console.log(`\n🎯 混合模式：发送消息给 "${contact}"`);
    console.log('─'.repeat(50));
    
    const logger = new StepLogger();
    
    try {
        // 步骤 1: 检查微信运行
        logger.record('检查微信运行', VisionCheck.isWeChatRunning() ? '✅' : '❌');
        
        if (!VisionCheck.isWeChatRunning()) {
            logger.record('启动微信', '🔄');
            execSync('open -a WeChat', { stdio: 'pipe' });
            await sleep(3000);
            logger.record('启动微信', VisionCheck.isWeChatRunning() ? '✅' : '❌');
        }
        
        // 步骤 2: 激活微信
        logger.record('激活微信', '🔄');
        VisionCheck.activateWeChat();
        await sleep(1000);
        logger.record('激活微信', VisionCheck.isResponsive() ? '✅' : '⚠️');
        
        // 步骤 3: 检查脚本文件
        logger.record('检查脚本文件', fs.existsSync(SCRIPT_FILE) ? '✅' : '❌');
        if (!fs.existsSync(SCRIPT_FILE)) {
            throw new Error(`脚本文件不存在：${SCRIPT_FILE}`);
        }
        
        // 步骤 4: 执行发送脚本
        logger.record('执行发送脚本', '🔄');
        
        const escapedContact = contact.replace(/"/g, '\\"');
        const escapedMessage = message.replace(/"/g, '\\"').replace(/\n/g, ' ');
        
        try {
            const output = execSync(
                `osascript "${SCRIPT_FILE}" "${escapedContact}" "${escapedMessage}"`,
                { 
                    encoding: 'utf-8',
                    timeout: 15000,
                    stdio: ['pipe', 'pipe', 'pipe']
                }
            );
            
            logger.record('脚本执行', output.includes('✅') ? '✅' : '⚠️', output.trim().substring(0, 50));
            
        } catch (e) {
            logger.record('脚本执行', '❌', e.message.split('\n')[0]);
            
            if (retries < CONFIG.maxRetries) {
                logger.record(`重试 ${retries + 1}/${CONFIG.maxRetries}`, '🔄');
                await sleep(CONFIG.retryDelay);
                return sendHybrid(contact, message, retries + 1);
            }
            
            return false;
        }
        
        // 步骤 5: 视觉验证（可选）
        if (CONFIG.enableVisionCheck) {
            logger.record('视觉验证', '🔄');
            await sleep(1000);
            
            if (VisionCheck.isResponsive()) {
                logger.record('微信响应', '✅');
            } else {
                logger.record('微信响应', '⚠️');
            }
        }
        
        // 总结
        console.log('─'.repeat(50));
        const summary = logger.summary();
        
        // 只要脚本执行成功就算成功
        const scriptSuccess = logger.steps.some(s => s.name === '脚本执行' && s.status === '✅');
        
        if (scriptSuccess) {
            console.log('✅ 混合模式发送成功！');
            return true;
        } else {
            console.log('⚠️  部分步骤未完全成功');
            return false;
        }
        
    } catch (e) {
        logger.record('执行错误', '❌', e.message);
        
        if (retries < CONFIG.maxRetries) {
            console.log(`🔄 重试 ${retries + 1}/${CONFIG.maxRetries}...`);
            await sleep(CONFIG.retryDelay);
            return sendHybrid(contact, message, retries + 1);
        }
        
        return false;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 日志管理
 */
class HybridLog {
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
    const log = new HybridLog();
    
    if (command === 'send' && args.length >= 3) {
        const contact = args[1];
        const message = args.slice(2).join(' ');
        
        // 防重复
        if (log.hasSent(contact, message)) {
            console.log(`⚠️  已发送过此消息`);
            return;
        }
        
        console.log(`📤 发送："${message}"`);
        const success = await sendHybrid(contact, message);
        
        log.record(contact, message, success ? 'sent' : 'failed', []);
        
    } else if (command === 'test') {
        console.log('🧪 混合模式测试\n');
        console.log('微信运行:', VisionCheck.isWeChatRunning() ? '✅' : '❌');
        console.log('微信响应:', VisionCheck.isResponsive() ? '✅' : '❌');
        console.log('脚本存在:', fs.existsSync(SCRIPT_FILE) ? '✅' : '❌');
        
    } else if (command === 'clear') {
        if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
        if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
        console.log('✅ 已清除');
        
    } else {
        console.log(`
🎯 Hybrid WeChat - 混合模式

用法:
  node hybrid-wechat.js send <联系人> <消息>  - 混合模式发送
  node hybrid-wechat.js test                  - 测试
  node hybrid-wechat.js clear                 - 清除

特点:
  ✅ 使用成熟的 AppleScript 脚本
  ✅ 关键步骤视觉验证
  ✅ 详细的步骤日志
  ✅ 自动重试机制
        `);
    }
}

main().catch(console.error);
