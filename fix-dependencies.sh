#!/bin/bash

# 快速修復 Dependencies 問題的腳本
echo "🔧 快速修復 Dependencies 問題"
echo "=============================="

# 清理
echo "🧹 清理舊文件..."
rm -rf node_modules package-lock.json dist/ || true

# 檢查 Node.js 版本並選擇適當配置
NODE_VERSION=$(node --version)
echo "📋 Node.js 版本: $NODE_VERSION"

if [[ "$NODE_VERSION" =~ ^v1[2-7]\. ]]; then
    echo "🔧 使用 Node.js 12-17 相容配置"
    
    # 使用簡化的 package.json
    if [ -f "package.node12.json" ]; then
        cp package.node12.json package.json
        echo "✅ 套用 package.node12.json"
    fi
    
    # 使用簡化的 vite.config.js
    if [ -f "vite.config.simple.js" ]; then
        cp vite.config.simple.js vite.config.js
        echo "✅ 套用 vite.config.simple.js"
    fi
else
    echo "🔧 使用 Node.js 18+ 完整配置"
fi

# 選擇合適的 npm
NPM_CMD="npm"
if command -v /usr/bin/npm &> /dev/null; then
    NPM_CMD="/usr/bin/npm"
    echo "🔧 使用系統 npm: $NPM_CMD"
fi

# 安裝依賴
echo "📦 安裝依賴 (使用 --legacy-peer-deps)..."
if $NPM_CMD install --legacy-peer-deps; then
    echo "✅ 依賴安裝成功！"
    
    # 嘗試 build
    echo "🏗️ 測試 Build..."
    if $NPM_CMD run build; then
        echo "🎉 Build 成功！專案已準備就緒。"
        echo ""
        echo "📋 接下來你可以："
        echo "   • $NPM_CMD run dev    - 開發模式"
        echo "   • $NPM_CMD run build  - 建置專案"
        echo "   • $NPM_CMD run preview - 預覽建置結果"
    else
        echo "⚠️ Build 失敗，但依賴已安裝。請檢查程式碼。"
    fi
else
    echo "❌ 依賴安裝失敗"
    echo ""
    echo "💡 建議："
    echo "1. 確保 Node.js 版本 >= 12"
    echo "2. 嘗試清除 npm cache: npm cache clean --force"
    echo "3. 手動安裝: npm install --force"
    exit 1
fi
