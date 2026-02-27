#!/usr/bin/env node

/**
 * WeChat Assistant
 *
 * Flow: open WeChat -> search contact -> OCR left panel -> peekaboo click -> send
 *
 * Usage:
 *   node wechat-assistant.js send "联系人" "消息内容"
 *
 * Dependencies: peekaboo, swift (macOS built-in), osascript, screencapture
 */

const { execSync } = require('child_process');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function log(msg) {
    const ts = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    console.log(`[${ts}] [WeChat] ${msg}`);
}

function getScreenSize() {
    try {
        const result = execSync(
            `osascript -e 'tell application "Finder" to get bounds of window of desktop'`,
            { encoding: 'utf-8' }
        ).trim();
        const parts = result.split(',').map(s => parseInt(s.trim()));
        return { w: parts[2], h: parts[3] };
    } catch (e) {
        return { w: 1470, h: 956 };
    }
}

function ensureFocus() {
    execSync('open -a WeChat');
    try {
        execSync(`osascript -e 'tell application "System Events" to tell process "WeChat"
            set frontmost to true
            set position of window 1 to {0, 0}
            set size of window 1 to {1000, 900}
        end tell'`);
    } catch (e) {}
}

function ocrScreen(region) {
    const img = '/tmp/wechat_ocr.png';
    try { execSync(`rm -f "${img}"`); } catch (e) {}
    if (region) {
        execSync(`/usr/sbin/screencapture -R${region.x},${region.y},${region.w},${region.h} "${img}"`);
    } else {
        execSync(`/usr/sbin/screencapture -x "${img}"`);
    }

    const swiftScript = `
import Vision
import AppKit
let url = URL(fileURLWithPath: "${img}")
if let image = NSImage(contentsOf: url), let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) {
    let request = VNRecognizeTextRequest { (request, error) in
        guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
        for observation in observations {
            if let text = observation.topCandidates(1).first?.string, text.count > 0 {
                let box = observation.boundingBox
                let x = box.origin.x + box.size.width/2
                let y = 1 - (box.origin.y + box.size.height/2)
                print("\\(text)|\\(x),\\(y)")
            }
        }
    }
    request.recognitionLanguages = ["zh-Hans", "en-US"]
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try? handler.perform([request])
}
    `;

    try {
        const output = execSync(`swift -e '${swiftScript}'`, { encoding: 'utf-8', timeout: 30000 }).trim();
        if (!output) return [];
        return output.split('\n').map(line => {
            const parts = line.split('|');
            if (parts.length < 2) return null;
            const [nx, ny] = parts[1].split(',').map(Number);
            let screenX, screenY;
            if (region) {
                screenX = region.x + Math.round(nx * region.w);
                screenY = region.y + Math.round(ny * region.h);
            } else {
                screenX = nx;
                screenY = ny;
            }
            return { text: parts[0].trim(), x: screenX, y: screenY };
        }).filter(Boolean);
    } catch (e) {
        log('OCR Error: ' + e.message.substring(0, 100));
        return [];
    }
}

function findContact(results, contactName) {
    const SKIP_HEADERS = ['联系人', '群聊', '聊天记录', '功能', '搜索网络结果', '查看全部', '公众号'];
    
    // First pass: exact match
    for (const r of results) {
        if (r.text === contactName) return r;
    }
    
    // Second pass: partial match, skip headers
    for (const r of results) {
        if (r.text.startsWith('Q ') || r.text.startsWith('Q ')) continue;
        if (SKIP_HEADERS.includes(r.text)) continue;
        if (r.text.includes('包含') || r.text.includes('搜索')) continue;
        if (r.text.includes(contactName) || contactName.includes(r.text)) {
            return r;
        }
    }
    
    return null;
}

function sendViaAppleScript(text) {
    const escapedText = text.replace(/"/g, '\\"').replace(/`/g, '\\`');
    const delayBeforeEnter = (Math.random() * 0.8 + 0.5).toFixed(2);
    
    const script = `
        set the clipboard to "${escapedText}"
        tell application "System Events" to tell process "WeChat"
            set frontmost to true
            keystroke "v" using command down
            delay ${delayBeforeEnter}
            key code 36 -- Enter
        end tell
    `;
    
    try {
        execSync(`osascript -e '${script}'`);
    } catch (e) {}
}

async function main() {
    const args = process.argv.slice(2);
    if (args[0] !== 'send' || args.length < 3) {
        console.log(`
🤖 WeChat Assistant

用法:
  node wechat-assistant.js send <联系人> <消息>

示例:
  node wechat-assistant.js send "张三" "你好！"
  node wechat-assistant.js send "文件传输助手" "测试消息"
`);
        return;
    }

    const contact = args[1];
    const message = args.slice(2).join(' ');
    const screen = getScreenSize();

    log(`📤 准备发送消息给 "${contact}"...`);
    log(`🖥️  屏幕：${screen.w}x${screen.h} 点`);

    // 1. Focus WeChat
    ensureFocus();
    await sleep(1000);

    // 2. Reset state: Escape twice
    log('🔄 重置微信状态...');
    execSync(`osascript -e 'tell application "System Events" to tell process "WeChat"
        set frontmost to true
        key code 53
    end tell'`);
    await sleep(500);
    execSync(`osascript -e 'tell application "System Events" to tell process "WeChat"
        key code 53
    end tell'`);
    await sleep(500);

    // 3. Open search (Cmd+F)
    log('🔍 打开搜索...');
    execSync(`osascript -e 'tell application "System Events" to tell process "WeChat"
        set frontmost to true
        keystroke "f" using command down
    end tell'`);
    await sleep(800);

    // 4. Cmd+A to select all, then paste contact name
    log(`🔍 搜索 "${contact}"...`);
    const escapedContact = contact.replace(/"/g, '\\"');
    execSync(`osascript -e 'tell application "System Events" to tell process "WeChat"
        keystroke "a" using command down
    end tell'`);
    await sleep(200);
    execSync(`osascript -e 'set the clipboard to "${escapedContact}"
        tell application "System Events" to tell process "WeChat"
            keystroke "v" using command down
        end tell'`);
    await sleep(3000);

    // 5. OCR left sidebar only (skip search box at top, skip chat area on right)
    const searchRegion = { x: 0, y: 100, w: 450, h: 600 };
    log(`👁️ OCR 左侧搜索面板 (${searchRegion.w}x${searchRegion.h})...`);
    const results = ocrScreen(searchRegion);
    log(`   识别到 ${results.length} 条文字`);
    results.forEach(r => log(`   "${r.text}" → (${r.x}, ${r.y})`));

    // 6. Find target contact
    const target = findContact(results, contact);

    if (!target) {
        log('❌ 搜索结果中未找到：' + contact);
        return;
    }

    log(`✅ 找到 "${target.text}" → 屏幕坐标 (${target.x}, ${target.y})`);

    // 7. Click on contact via peekaboo
    log('🖱️ peekaboo 点击...');
    try {
        execSync(`peekaboo click --coords ${target.x},${target.y}`, { encoding: 'utf-8', timeout: 10000 });
    } catch (e) {
        log('⚠️ peekaboo click error: ' + e.message.split('\n')[0]);
    }
    await sleep(2000);

    // 8. Check if on profile page (need "发消息" button)
    log('🔎 检查是否需要点击"发消息"...');
    const fullResults = ocrScreen(null);
    const MSG_KEYWORDS = ['发消息', 'Messages', 'Message', 'Send Message', '發消息'];
    let msgBtn = null;
    for (const r of fullResults) {
        if (MSG_KEYWORDS.some(k => r.text.includes(k))) {
            msgBtn = r;
            break;
        }
    }

    if (msgBtn) {
        const btnX = Math.round(msgBtn.x * screen.w);
        const btnY = Math.round(msgBtn.y * screen.h);
        log(`🖱️ 找到"${msgBtn.text}" → (${btnX}, ${btnY})，点击...`);
        try {
            execSync(`peekaboo click --coords ${btnX},${btnY}`, { encoding: 'utf-8', timeout: 10000 });
        } catch (e) {}
        await sleep(2000);
    } else {
        log('   已在聊天界面');
    }

    // 9. Click input area to ensure focus
    log('🖱️ 点击输入框获取焦点...');
    try {
        execSync('peekaboo click --coords 675,800', { encoding: 'utf-8', timeout: 10000 });
    } catch (e) {}
    await sleep(500);

    // 10. Send message
    log(`📝 发送消息：${message}`);
    sendViaAppleScript(message);
    await sleep(1000);

    log('✅ 发送完成！');
}

main();
