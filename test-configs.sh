#!/bin/bash

# 本地構建測試腳本
echo "🧪 本地構建測試"
echo "================"

# 確保在正確目錄
cd "$(dirname "$0")"

# 檢查 Node.js 版本
echo "📊 環境檢查:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo ""

# 清理環境
echo "🧹 清理環境..."
rm -rf node_modules package-lock.json dist/ || true

# 安裝依賴
echo "📦 安裝依賴..."
if npm install --legacy-peer-deps; then
    echo "✅ 依賴安裝成功"
else
    echo "❌ 依賴安裝失敗"
    exit 1
fi

# 測試不同配置
configs=("vite.config.js" "vite.config.simple.js" "vite.config.stable.js")

for config in "${configs[@]}"; do
    if [ -f "$config" ]; then
        echo ""
        echo "🏗️ 測試配置: $config"
        cp "$config" vite.config.js
        
        if npm run build; then
            echo "✅ $config 構建成功"
            # 檢查構建結果
            if [ -d "dist" ]; then
                echo "   📁 dist/ 目錄存在"
                echo "   📊 構建大小: $(du -sh dist/)"
            fi
            rm -rf dist/
        else
            echo "❌ $config 構建失敗"
        fi
    else
        echo "⚠️ $config 不存在"
    fi
done

echo ""
echo "✅ 測試完成"
