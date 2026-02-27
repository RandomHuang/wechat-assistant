#!/usr/bin/env osascript

-- 微信发送消息脚本
-- 用法：osascript wechat-send-fixed.scpt "联系人名字" "消息内容"

on run argv
    if length of argv < 2 then
        display dialog "用法：osascript wechat-send-fixed.scpt \"联系人\" \"消息\"" buttons {"OK"} default button 1
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
        
        -- 等待微信窗口
        delay 1.5
        
        tell process "WeChat"
            -- 聚焦搜索框 (Cmd+F)
            keystroke "f" using command down
            delay 0.5
            
            -- 输入联系人名字
            try
                set searchField to text field 1 of group 1 of window 1
                set value of searchField to contactName
            end try
            delay 1
            
            -- 回车选择第一个联系人
            keystroke return
            delay 1.5
            
            -- 输入消息到消息框
            try
                set messageField to text area 1 of scroll area 1 of group 1 of window 1
                set value of messageField to messageText
            end try
            delay 0.5
            
            -- Cmd+Enter 发送
            keystroke return using command down
        end tell
    end tell
    
    return "✅ 消息已发送给：" & contactName & "：" & messageText
end run
