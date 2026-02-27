#!/usr/bin/env osascript

-- 在 Cursor 中打开文件/项目
-- 用法：
--   osascript open-in-cursor.scpt "/path/to/file.js"
--   osascript open-in-cursor.scpt "/path/to/project"

on run argv
    if length of argv < 1 then
        display dialog "用法：osascript open-in-cursor.scpt \"文件路径或项目路径\"" buttons {"OK"} default button 1
        return
    end if
    
    set targetPath to item 1 of argv
    
    tell application "System Events"
        -- 检查 Cursor 是否运行
        set cursorRunning to (name of processes) contains "Cursor"
        
        if not cursorRunning then
            -- 启动 Cursor
            tell application "Cursor"
                activate
            end tell
            delay 2
        else
            tell application "Cursor"
                activate
            end tell
            delay 0.5
        end if
        
        -- 使用命令行打开（更可靠）
        do shell script "/usr/local/bin/code -a Cursor \"" & targetPath & "\""
    end tell
    
    return "已在 Cursor 中打开：" & targetPath
end run
