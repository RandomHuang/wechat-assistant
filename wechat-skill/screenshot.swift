#!/usr/bin/env swift

import ScreenCaptureKit
import Cocoa

@available(macOS 12.0, *)
func captureScreen(output: String) async {
    do {
        let content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)
        
        // 获取主显示器
        guard let display = content.displays.first else {
            print("No display found")
            exit(1)
        }
        
        let image = try await CGSCreateScreenshotFromSurface(
            .main,
            .init(displayID: display.displayID, rect: nil)
        )
        
        guard let cgImage = image else {
            print("Failed to capture")
            exit(1)
        }
        
        let bitmap = NSBitmapImageRep(cgImage: cgImage)
        guard let data = bitmap.representation(using: .png, properties: [:]) else {
            print("Failed to encode")
            exit(1)
        }
        
        try data.write(to: URL(fileURLWithPath: output))
        print("Screenshot saved: \(output)")
    } catch {
        print("Error: \(error)")
        exit(1)
    }
}

// 解析命令行参数
var output = "/tmp/screenshot.png"
let args = CommandLine.arguments
var i = 1
while i < args.count {
    if args[i] == "-o", i + 1 < args.count {
        output = args[i + 1]
        i += 2
    } else {
        i += 1
    }
}

if #available(macOS 12.0, *) {
    let group = DispatchGroup()
    group.enter()
    
    DispatchQueue.main.async {
        Task {
            await captureScreen(output: output)
            group.leave()
        }
    }
    
    group.wait()
} else {
    print("macOS 12+ required")
    exit(1)
}
