#!/usr/bin/env osascript

-- WeChat Message Sender for macOS
-- 用法：osascript wechat-send.scpt "联系人名字" "消息内容"

on run argv
    if length of argv < 2 then
        display dialog "用法：osascript wechat-send.scpt \"联系人\" \"消息\"" buttons {"OK"} default button 1
        return
    end if
    
    set contactName to item 1 of argv
    set messageText to item 2 of argv
    
    tell application "System Events"
        -- 激活微信
        tell application "WeChat"
            activate
            delay 1
        end tell
        
        -- 等待微信窗口出现
        delay 2
        
        -- 搜索联系人
        tell process "WeChat"
            -- 点击搜索框 (需要调整坐标或使用 accessibility)
            -- 这里用 keyboard 方式更可靠
            
            -- Cmd+F 聚焦搜索
            keystroke "f" using command down
            delay 0.5
            
            -- 输入联系人名字
            set text of text field 1 of scroll area 1 of group 1 of window 1 to contactName
            delay 1
            
            -- 回车选择第一个结果
            keystroke return
            delay 1
            
            -- 输入消息
            set value of text area 1 of scroll area 2 of group 1 of window 1 to messageText
            delay 0.5
            
            -- Cmd+Enter 发送
            keystroke return using command down
        end tell
    end tell
    
    return "消息已发送给：" & contactName
end run
