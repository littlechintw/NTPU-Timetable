<template>
  <div class="home-container" :class="{ 'dark-mode': isDarkMode }">
    <CourseDetailModal :course="detailCourse" @close="detailCourse = null" />
    <CourseChangeNoticeModal :notices="changeNotices" @close="changeNotices = []" />

    <div class="warning-banner">
      <div class="warning-content">⚠️ 此為試排課程，請依然要到選課系統選課。</div>
    </div>

    <div class="main-layout">
      <div class="sidebar">
        <CourseSearchPanel />
        <SearchResultList @open="openDetail" />
        <SelectedCourseList @open="openDetail" />

        <div class="card">
          <div class="card-body text-center">
            <a
              class="btn btn-info"
              href="https://github.com/littlechintw/NTPU-Timetable/blob/main/docs/USAGE.md"
              target="_blank"
            >
              使用說明
            </a>
            <p class="support-text">
              問題回報請寄 Email 至<br />
              ntpu-timetable-support@googlegroups.com
            </p>
          </div>
        </div>
      </div>

      <div class="timetable-container">
        <TimetableGrid :courses="selection.courses" :dark="isDarkMode" @open="openDetail" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, onMounted, ref } from 'vue'
import CourseChangeNoticeModal from '@/components/home/CourseChangeNoticeModal.vue'
import CourseDetailModal from '@/components/home/CourseDetailModal.vue'
import CourseSearchPanel from '@/components/home/CourseSearchPanel.vue'
import SearchResultList from '@/components/home/SearchResultList.vue'
import SelectedCourseList from '@/components/home/SelectedCourseList.vue'
import TimetableGrid from '@/components/home/TimetableGrid.vue'
import { useCourseDataStore } from '@/stores/courseData'
import { useSelectionStore } from '@/stores/selection'

// 黑暗模式由 App.vue 統一管理，這裡只讀取同一份狀態
const isDarkMode = inject('isDarkMode', ref(false))

const courseData = useCourseDataStore()
const selection = useSelectionStore()

const detailCourse = ref(null) // 課程詳細資訊彈窗顯示的課程，null 表示關閉
const changeNotices = ref([]) // 課程異動通知，空陣列表示關閉

const openDetail = (courseID) => {
  const course = courseData.getCourse(courseID)
  if (course) detailCourse.value = course
}

onMounted(async () => {
  await courseData.load()
  // 課程資料是定期重新抓取的，先確認已選課程沒有被下架或改時間，有的話會被移出並列在通知裡
  changeNotices.value = selection.reconcile(courseData.getCourse)
})
</script>

<!-- 各元件共用的卡片／按鈕／標籤樣式（非 scoped） -->
<style src="@/assets/ui.css"></style>

<style scoped>
.home-container {
  padding: 0;
  background-color: transparent;
  min-height: calc(100vh - 120px);
}

/* 警示橫幅：低調的提醒色，不搶走版面焦點 */
.warning-banner {
  background: var(--warning-bg);
  color: var(--warning-text);
  padding: 0.35rem var(--container-pad);
  text-align: center;
  border-bottom: 1px solid var(--warning-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.warning-content {
  font-weight: 500;
  font-size: 0.8rem;
  max-width: var(--container-max);
  margin: 0 auto;
}

.dark-mode .warning-banner {
  background: #3a2f12 !important;
  border-bottom: 1px solid #5c4a1a !important;
}

.dark-mode .warning-content {
  color: #f0d78c !important;
}

.main-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.25rem;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 1.25rem var(--container-pad);
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timetable-container {
  min-height: 80vh;
  max-width: 100%;
  overflow: hidden;
}

.support-text {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #666;
}

.dark-mode .support-text {
  color: #cbd5e0 !important;
}

@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: 2;
  }

  .timetable-container {
    order: 1;
  }
}

@media (max-width: 768px) {
  .main-layout {
    padding: 0.5rem;
    gap: 0.5rem;
  }
}
</style>
