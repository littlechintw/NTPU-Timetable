<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <!-- 頂部導航欄 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="brand">
          <h1 class="app-title">北大課程試排</h1>
          <div
            class="brand-subtitle tooltip-container"
            @mouseenter="showTooltip = true"
            @mouseleave="showTooltip = false"
          >
            <span class="brand-tag">NTPU</span>
            <span>非官方課程試排工具</span>
            <div class="custom-tooltip" v-show="showTooltip">
              此網頁非北大官方網站，資料來源為北大官網，但不可保證完全正確
            </div>
          </div>
        </div>
        <div class="navbar-controls">
          <button
            class="theme-toggle-btn"
            @click="toggleDarkMode"
            :title="isDarkMode ? '切換至淺色模式' : '切換至深色模式'"
          >
            <span class="theme-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
            {{ isDarkMode ? '淺色' : '深色' }}
          </button>
          <span class="navbar-divider">·</span>
          <span class="semester-info">{{ semesterInfo || '載入中...' }}</span>
        </div>
      </div>
    </nav>

    <RouterView />
    
    <!-- 底部版權資訊 -->
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-left">
          <p>&copy; {{ new Date().getFullYear() }} <a href="https://littlechin.tw" target="_blank" rel="noopener noreferrer">littlechin.tw</a>. All Rights Reserved.</p>
        </div>
        <div class="footer-right">
          
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { ref, onMounted, provide } from 'vue'

// 黑暗模式狀態（提供給子路由頁面，避免各自維護一份、再靠 DOM 觀察同步）
const isDarkMode = ref(false)
provide('isDarkMode', isDarkMode)

// 學年學期資訊
const semesterInfo = ref('載入中...')

// Tooltip 顯示狀態
const showTooltip = ref(false)

// 載入學年學期資訊
const loadSemesterInfo = async () => {
  try {
    const response = await fetch('/config.json')
    if (response.ok) {
      const config = await response.json()
      const year = config.year
      const semester = config.semester
      
      // 轉換學期數字為中文
      const semesterText = semester === 1 ? '上學期' : semester === 2 ? '下學期' : `第${semester}學期`
      
      semesterInfo.value = `${year} 學年 ${semesterText}`
    } else {
      console.error('無法載入 config.json:', response.status)
      semesterInfo.value = '學期資訊載入失敗'
    }
  } catch (error) {
    console.error('載入學期資訊時發生錯誤:', error)
    semesterInfo.value = '學期資訊載入失敗'
  }
}

// 切換黑暗模式
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value.toString())
  
  // 更新 body class 以便全局樣式生效
  if (isDarkMode.value) {
    document.body.classList.add('dark-mode')
  } else {
    document.body.classList.remove('dark-mode')
  }
}

// 初始化時讀取用戶偏好
onMounted(async () => {
  // 載入學年學期資訊
  await loadSemesterInfo()
  
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode) {
    isDarkMode.value = savedDarkMode === 'true'
  } else {
    // 檢測系統偏好
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  // 設置初始 body class
  if (isDarkMode.value) {
    document.body.classList.add('dark-mode')
  }
})
</script>

<style>
:root {
  /* 品牌色：--brand-2（深）只用在頂部導覽列，其餘互動元件一律用 --brand-1 的實色，不用漸層 */
  --brand-1: #6c63d6;
  --brand-2: #4a3b8c;
  --brand-tint: rgba(108, 99, 214, 0.08);
  --brand-tint-strong: rgba(108, 99, 214, 0.16);
  --brand-ring: rgba(108, 99, 214, 0.35);

  --danger: #e53e3e;
  --danger-strong: #c53030;
  --warning-bg: #fff8e6;
  --warning-border: #f0c96b;
  --warning-text: #8a6109;

  --container-max: 1400px;
  --container-pad: 1.5rem;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 1px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.05);
  --shadow-lg: 0 16px 40px rgba(15, 23, 42, 0.14);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC",
    "Noto Sans TC", "Microsoft JhengHei", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f0f2f8;
  color: #333;
  transition: background-color 0.3s ease, color 0.3s ease;
  -webkit-font-smoothing: antialiased;
}

body.dark-mode {
  background-color: #16181d;
  color: #e0e0e0;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 讓 RouterView 佔滿剩餘空間 */
.router-view-container {
  flex: 1;
}

/* 底部版權資訊：用中性色，避免品牌色在頁面首尾重複出現 */
.app-footer {
  background: #2d3142;
  color: rgba(255, 255, 255, 0.75);
  padding: 1.25rem var(--container-pad);
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.dark-mode .app-footer {
  background: #14161d;
  border-top: 1px solid #2a2d38;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: var(--container-max);
  margin: 0 auto;
}

.footer-left p,
.footer-right p {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.footer-left a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
}

.footer-left a:hover {
  text-decoration: underline;
}

.footer-right a {
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.footer-right a:hover {
  color: white;
  background: rgba(255, 255, 255, 0.15);
  text-decoration: underline;
}

/* 頂部導航欄：整站唯一使用飽和品牌色的地方，其餘元件維持素色 */
.top-navbar {
  background: var(--brand-2);
  color: white;
  padding: 0.5rem var(--container-pad);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.dark-mode .top-navbar {
  background: #232735;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: var(--container-max);
  margin: 0 auto;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  line-height: 1;
}

.app-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  color: white;
  letter-spacing: 0.02em;
}

.brand-subtitle {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.68);
  cursor: help;
}

.brand-tag {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.05rem 0.4rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.9);
}

.tooltip-container {
  position: relative;
  display: inline-flex;
}

.custom-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  white-space: nowrap;
  z-index: 1001;
  margin-top: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.custom-tooltip::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: rgba(0, 0, 0, 0.9);
}

.dark-mode .custom-tooltip {
  background: rgba(255, 255, 255, 0.95);
  color: #1a202c !important;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.dark-mode .custom-tooltip::after {
  border-bottom-color: rgba(255, 255, 255, 0.95);
}

/* 學期資訊、深色模式切換都不用膠囊底色包住，維持素色、輕量 */
.semester-info {
  font-size: 0.8rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.75);
  white-space: nowrap;
}

.navbar-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navbar-divider {
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.8rem;
}

.theme-toggle-btn {
  background: transparent;
  border: none;
  color: white;
  padding: 0.3rem 0.5rem;
  line-height: 1;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.15s ease;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
}

.theme-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.14);
}

.theme-icon {
  font-size: 1rem;
}

/* 黑暗模式全局樣式 */
.dark-mode {
  background-color: #1a1a1a;
  color: #f7fafc;
}

/* 確保所有文字都有足夠對比度 */
.dark-mode * {
  color: inherit;
}

.dark-mode p, 
.dark-mode span, 
.dark-mode div:not(.course-chip):not(.btn) {
  color: #e2e8f0;
}

.dark-mode small {
  color: #cbd5e0;
}

/* 卡片樣式 */
.dark-mode .card {
  background: #2d3748;
  border: 1px solid #4a5568;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 表單元素 */
.dark-mode .search-input,
.dark-mode .filter-select {
  background: #4a5568;
  border: 1px solid #718096;
  color: #e0e0e0;
}

.dark-mode .search-input::placeholder {
  color: #a0aec0;
}

.dark-mode .search-input:focus,
.dark-mode .filter-select:focus {
  border-color: #63b3ed;
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
}

/* 按鈕樣式 */
.dark-mode .btn-primary {
  background: #4299e1;
  border-color: #4299e1;
}

.dark-mode .btn-primary:hover {
  background: #3182ce;
  border-color: #3182ce;
}

.dark-mode .btn-info {
  background: #38b2ac;
  border-color: #38b2ac;
}

.dark-mode .btn-info:hover {
  background: #319795;
  border-color: #319795;
}

.dark-mode .btn-danger {
  background: #e53e3e;
  border-color: #e53e3e;
}

.dark-mode .btn-danger:hover {
  background: #c53030;
  border-color: #c53030;
}

/* 課程項目 */
.dark-mode .course-item {
  border-bottom: 1px solid #4a5568;
  background: transparent;
}

.dark-mode .course-item:hover {
  background-color: #4a5568;
}

.dark-mode .course-title-text {
  color: #f7fafc;
  font-weight: 500;
}

.dark-mode .course-subtitle {
  color: #cbd5e0;
}

/* 狀態按鈕 */
.dark-mode .status-btn.blue {
  background: #4299e1;
  border-color: #4299e1;
}

.dark-mode .status-btn.red {
  background: #e53e3e;
  border-color: #e53e3e;
}

/* 課表樣式 */
.dark-mode .timetable-table {
  border: 1px solid #4a5568;
}

.dark-mode .time-cell {
  border: 1px solid #4a5568;
  background: #2d3748;
}

.dark-mode .cell-content {
  color: #f7fafc;
}

.dark-mode .time-period {
  color: #f7fafc;
  font-weight: 500;
}

.dark-mode .time-range {
  color: #e2e8f0;
}

.dark-mode .course-chip {
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dark-mode .course-id {
  color: rgba(255, 255, 255, 0.9);
}

.dark-mode .course-name {
  color: rgba(255, 255, 255, 0.8);
}

/* 模態框樣式 */
.dark-mode .modal-overlay {
  background: rgba(0, 0, 0, 0.8);
}

.dark-mode .modal-dialog {
  background: #2d3748;
  color: #e0e0e0;
  border: 1px solid #4a5568;
}

.dark-mode .modal-header {
  border-bottom: 1px solid #4a5568;
}

.dark-mode .modal-close {
  color: #a0aec0;
}

.dark-mode .modal-close:hover {
  color: #e2e8f0;
}

/* 標籤樣式 */
.dark-mode .chip {
  background: #4a5568;
  color: #e2e8f0;
}

.dark-mode .chip-green {
  background: #38a169;
  color: white;
}

.dark-mode .chip-blue {
  background: #4299e1;
  color: white;
}

.dark-mode .chip-removable {
  background: #2b6cb0;
  color: #e2e8f0;
  border: 1px solid #4299e1;
}

.dark-mode .chip-removable button {
  color: #e2e8f0;
}

/* JSON 查看器 */
.dark-mode .json-content {
  background: #1a202c;
  color: #e2e8f0;
  border: 1px solid #4a5568;
}

/* 支援文字 */
.dark-mode .support-text {
  color: #cbd5e0;
}

/* 課程資訊文字 */
.dark-mode .course-info-text {
  color: #cbd5e0;
}

.dark-mode .course-info-text small {
  color: #e2e8f0;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .navbar-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .app-title {
    font-size: 1.1rem;
  }

  .top-navbar {
    padding: 0.6rem 1rem;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .footer-left,
  .footer-right {
    width: 100%;
  }
  
  .app-footer {
    padding: 1rem;
  }
}
</style>
