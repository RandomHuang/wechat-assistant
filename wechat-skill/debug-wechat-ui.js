#!/usr/bin/env node

/**
 * 微信 UI 调试工具
 * 打印微信窗口的完整 UI 树
 */

const { execSync } = require('child_process');

function runAppleScript(script) {
    try {
        return execSync(`osascript -e '${script.replace(/\n/g, "' -e '")}'`, {
            encoding: 'utf-8',
            timeout: 5000,
        }).trim();
    } catch (e) {
        return `ERROR: ${e.message.split('\n')[0]}`;
    }
}

console.log('🔍 微信 UI 调试工具\n');
console.log('='.repeat(60));

// 1. 激活微信
console.log('\n1️⃣  激活微信...');
execSync('osascript -e \'tell application "WeChat" to activate\'', { stdio: 'pipe' });

// 2. 获取窗口信息
console.log('\n2️⃣  窗口信息:');
const windowInfo = runAppleScript(`
    tell application "System Events"
        tell process "WeChat"
            if not (exists window 1) then
                return "无窗口"
            end if
            set win to window 1
            return {
                "标题：" & (name of win),
                "位置：" & (position of win),
                "大小：" & (size of win),
                "元素数量：" & (count of UI elements of win)
            }
        end tell
    end tell
`);
console.log(windowInfo);

// 3. 获取窗口的 UI 元素
console.log('\n3️⃣  窗口 UI 元素:');
const elements = runAppleScript(`
    tell application "System Events"
        tell process "WeChat"
            if not (exists window 1) then return "无窗口"
            set win to window 1
            set elemList to {}
            repeat with elem in UI elements of win
                set end of elemList to (role of elem & ": " & (description of elem))
            end repeat
            return elemList
        end tell
    end tell
`);
console.log(elements);

// 4. 获取 group 信息
console.log('\n4️⃣  Group 元素:');
const groups = runAppleScript(`
    tell application "System Events"
        tell process "WeChat"
            if not (exists window 1) then return "无窗口"
            set win to window 1
            set groupList to {}
            repeat with g in groups of win
                set end of groupList to (role of g & ": " & (description of g))
            end repeat
            return groupList
        end tell
    end tell
`);
console.log(groups);

// 5. 获取 text field 信息
console.log('\n5️⃣  Text Field 元素:');
const textFields = runAppleScript(`
    tell application "System Events"
        tell process "WeChat"
            if not (exists window 1) then return "无窗口"
            set win to window 1
            set tfList to {}
            try
                repeat with tf in text fields of win
                    set end of tfList to (value of tf)
                end repeat
            end try
            return tfList
        end tell
    end tell
`);
console.log(textFields);

// 6. 获取 scroll area 信息
console.log('\n6️⃣  Scroll Area 元素:');
const scrollAreas = runAppleScript(`
    tell application "System Events"
        tell process "WeChat"
            if not (exists window 1) then return "无窗口"
            set win to window 1
            set saList to {}
            try
                repeat with sa in scroll areas of win
                    set end of saList to (count of UI elements of sa)
                end repeat
            end try
            return saList
        end tell
    end tell
`);
console.log(scrollAreas);

// 7. 尝试不同的路径
console.log('\n7️⃣  尝试不同的 UI 路径:\n');

const paths = [
    'text field 1 of window 1',
    'text field 1 of group 1 of window 1',
    'text field 1 of group 2 of window 1',
    'text field 1 of scroll area 1 of window 1',
    'text area 1 of window 1',
    'text area 1 of group 1 of window 1',
    'text area 1 of scroll area 1 of group 1 of window 1',
];

paths.forEach((path, i) => {
    const result = runAppleScript(`
        tell application "System Events"
            tell process "WeChat"
                try
                    set elem to ${path}
                    return "✅ 存在：" & (role of elem) & " = " & (value of elem)
                catch
                    return "❌ 不存在"
                end try
            end tell
        end tell
    `);
    console.log(`  ${i + 1}. ${path}`);
    console.log(`     ${result}\n`);
});

console.log('='.repeat(60));
console.log('\n💡 提示：把上面的输出发给 Cursor，让它帮你找出正确的 UI 路径');
