#!/bin/bash

# 監控構建狀態腳本
# 用於追蹤 GitHub Actions 構建過程中的問題

echo "🔍 NTPU-Timetable 構建監控"
echo "=========================="

# 檢查 Node.js 版本
echo "📊 環境信息:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "記憶體: $(free -h 2>/dev/null || echo '無法檢測')"
echo ""

# 檢查依賴安裝狀態
echo "📦 依賴檢查:"
if [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json 存在"
    lock_size=$(wc -c < package-lock.json)
    echo "   大小: ${lock_size} bytes"
else
    echo "⚠️ package-lock.json 不存在"
fi

if [ -d "node_modules" ]; then
    echo "✅ node_modules 存在"
    modules_count=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo "   模組數量: $((modules_count - 1))"
else
    echo "❌ node_modules 不存在"
fi
echo ""

# 檢查構建配置
echo "⚙️ 構建配置:"
if [ -f "vite.config.js" ]; then
    echo "✅ vite.config.js 存在"
    config_type=$(grep -q "simple" vite.config.js && echo "簡化版" || echo "完整版")
    echo "   類型: ${config_type}"
else
    echo "❌ vite.config.js 不存在"
fi

if [ -f "package.json" ]; then
    echo "✅ package.json 存在"
    # 檢查關鍵腳本
    if grep -q '"build"' package.json; then
        echo "   ✅ build 腳本存在"
    else
        echo "   ❌ build 腳本不存在"
    fi
else
    echo "❌ package.json 不存在"
fi
echo ""

# 檢查潛在問題
echo "🚨 潛在問題檢查:"
problems=0

# 檢查 peer dependencies
if npm ls --depth=0 2>&1 | grep -q "ERESOLVE\|peer dep"; then
    echo "⚠️ Peer dependency 衝突"
    problems=$((problems + 1))
fi

# 檢查安全漏洞
audit_output=$(npm audit --audit-level=moderate 2>/dev/null || echo "audit failed")
if echo "$audit_output" | grep -q "vulnerabilities"; then
    vuln_count=$(echo "$audit_output" | grep -o "[0-9]* vulnerabilities" | head -1)
    echo "⚠️ 安全漏洞: $vuln_count (不影響構建)"
    problems=$((problems + 1))
fi

# 檢查磁碟空間
available_space=$(df . | tail -1 | awk '{print $4}')
if [ "$available_space" -lt 1048576 ]; then  # 少於 1GB
    echo "⚠️ 磁碟空間不足: $(df -h . | tail -1 | awk '{print $4}') 可用"
    problems=$((problems + 1))
fi

if [ $problems -eq 0 ]; then
    echo "✅ 沒有發現明顯問題"
else
    echo "⚠️ 發現 $problems 個潛在問題"
fi
echo ""

# 提供修復建議
if [ $problems -gt 0 ]; then
    echo "🔧 修復建議:"
    echo "1. 執行: npm install --legacy-peer-deps"
    echo "2. 檢查漏洞: npm audit (不建議使用 --force)"
    echo "3. 清理快取: npm cache clean --force"
    echo "4. 如果問題持續，嘗試使用 Node.js 18+"
    echo "5. 安全漏洞通常不影響構建，可以稍後處理"
    echo ""
fi

echo "📝 完成時間: $(date)"
