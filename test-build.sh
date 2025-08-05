#!/bin/bash

# 本地 Build 測試腳本
# 使用方法: ./test-build.sh

echo "🧪 NTPU Timetable - 本地 Build 測試"
echo "=================================="

# 檢查 Node.js 版本
echo "📋 檢查環境..."
echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version || /usr/bin/npm --version)"

# 清理舊的構建
echo ""
echo "🧹 清理舊文件..."
rm -rf node_modules package-lock.json dist/ || true

# 檢查 package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json 不存在！"
    exit 1
fi

echo "✅ package.json 存在"

# 選擇適當的 npm 指令
NPM_CMD="npm"
if command -v /usr/bin/npm &> /dev/null; then
    NPM_CMD="/usr/bin/npm"
    echo "🔧 使用系統 npm: $NPM_CMD"
else
    echo "🔧 使用預設 npm: $NPM_CMD"
fi

# 安裝依賴
echo ""
echo "📦 安裝依賴..."

# 檢查是否需要使用簡化版配置
NODE_VERSION=$(node --version)
if [[ "$NODE_VERSION" =~ ^v1[2-7]\. ]]; then
    echo "🔧 檢測到 Node.js 12-17，使用相容配置"
    if [ -f "package.node12.json" ]; then
        cp package.node12.json package.json
        echo "✅ 使用 package.node12.json"
    fi
    if [ -f "vite.config.simple.js" ]; then
        cp vite.config.simple.js vite.config.js
        echo "✅ 使用 vite.config.simple.js"
    fi
fi

if $NPM_CMD install --legacy-peer-deps --no-package-lock; then
    echo "✅ 依賴安裝成功"
else
    echo "❌ 依賴安裝失敗"
    exit 1
fi

# 檢查關鍵依賴
echo ""
echo "🔍 檢查關鍵依賴..."
$NPM_CMD list vue --depth=0 || echo "⚠️ Vue 未找到"
$NPM_CMD list vite --depth=0 || echo "⚠️ Vite 未找到"

# 執行 build
echo ""
echo "🏗️ 開始 Build..."
if $NPM_CMD run build; then
    echo "✅ Build 成功！"
else
    echo "❌ Build 失敗"
    exit 1
fi

# 檢查 build 結果
echo ""
echo "📁 檢查 Build 結果..."
if [ -d "dist" ]; then
    echo "✅ dist 目錄已創建"
    echo "📊 Build 大小: $(du -sh dist/)"
    echo "📄 主要文件:"
    find dist/ -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" \) | head -10
    
    # 檢查 index.html
    if [ -f "dist/index.html" ]; then
        echo "✅ index.html 存在"
    else
        echo "❌ index.html 不存在"
        exit 1
    fi
    
else
    echo "❌ dist 目錄未創建"
    exit 1
fi

echo ""
echo "🎉 所有測試通過！"
echo "💡 你可以用以下指令預覽:"
echo "   npx serve dist"
echo "   或"
echo "   $NPM_CMD run preview"
