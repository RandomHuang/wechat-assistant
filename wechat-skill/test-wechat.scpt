#!/usr/bin/env osascript

-- 测试微信控制脚本
-- 功能：打开微信，聚焦搜索框，不发送消息

tell application "System Events"
    tell application "WeChat"
        activate
    end tell
    delay 1
    
    tell process "WeChat"
        -- 检查微信窗口是否存在
        if not (exists window 1) then
            display dialog "微信窗口未打开" buttons {"OK"} default button 1
            return
        end if
        
        -- 测试 Cmd+F 聚焦搜索
        keystroke "f" using command down
        delay 0.5
        
        -- 显示提示
        display dialog "✅ 微信控制测试成功！\n\n搜索框已聚焦，可以输入联系人名字。\n\n按 OK 取消搜索（不发送消息）" buttons {"OK"} default button 1
        
        -- 按 ESC 取消搜索
        keystroke escape
    end tell
end tell

return "测试完成"
