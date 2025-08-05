<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <!-- 頂部導航欄 -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-left">
          <h1 class="app-title">NTPU 課程試排</h1>
          <span class="semester-info">{{ semesterInfo || '載入中...' }}</span>
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
import { ref, onMounted } from 'vue'

// 黑暗模式狀態
const isDarkMode = ref(false)

// 學年學期資訊
const semesterInfo = ref('載入中...')

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
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
  color: #333;
  transition: background-color 0.3s ease, color 0.3s ease;
}

body.dark-mode {
  background-color: #1a1a1a;
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

/* 底部版權資訊 */
.app-footer {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 2rem;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.dark-mode .app-footer {
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border-top: 1px solid #4a5568;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.footer-left p,
.footer-right p {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.footer-right a {
  color: rgba(255, 255, 255, 0.95);
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

/* 頂部導航欄 */
.top-navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.dark-mode .top-navbar {
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  color: white;
}

.semester-info {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.15);
  padding: 0.3rem 0.8rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  white-space: nowrap;
}

.navbar-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-toggle-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  backdrop-filter: blur(10px);
}

.theme-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.theme-icon {
  font-size: 1.1rem;
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

.dark-mode .card-header {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  border-bottom: 1px solid #4a5568;
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

.dark-mode .day-header {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
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

/* 警示橫幅 */
.dark-mode .warning-banner {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  border-bottom: 1px solid #742a2a;
}

/* 支援文字 */
.dark-mode .support-text {
  color: #cbd5e0;
}

/* 學分資訊 */
.dark-mode .credit-info {
  background: rgba(255, 255, 255, 0.15);
  color: #f7fafc;
  font-weight: 500;
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
    font-size: 1.5rem;
  }
  
  .top-navbar {
    padding: 1rem;
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
