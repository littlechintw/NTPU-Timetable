<template>
  <div class="card">
    <div class="card-header">
      <h3>課表</h3>
      <span class="mobile-scroll-hint">← 左右滑動 →</span>
    </div>
    <div class="card-body">
      <div class="timetable">
        <table class="timetable-table">
          <thead>
            <tr>
              <th v-for="day in dayHeaders" :key="day" class="day-header">{{ day }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
              <td
                v-for="(cell, cellIndex) in row"
                :key="cellIndex"
                class="time-cell"
                :style="{ backgroundColor: cell.color }"
              >
                <div class="cell-content" :class="{ conflict: cell.color === 'red' }">
                  <div v-if="cell.show_title" class="time-info">
                    <div class="time-period">{{ cell.title }}</div>
                    <div class="time-range">{{ cell.subtitle }}</div>
                  </div>

                  <div v-else-if="cell.show_chip" class="course-chips-cell">
                    <div
                      v-for="chip in cell.chip"
                      :key="chip.courseID"
                      class="course-chip"
                      :style="{ backgroundColor: chip.color }"
                      @click="$emit('open', chip.courseID)"
                    >
                      <div class="course-id">{{ chip.courseID }}</div>
                      <div class="course-name">{{ chip.courseName }}</div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { buildTimetableRows, darkPalette, dayHeaders, lightPalette } from '@/utils/timetable'

const props = defineProps({
  courses: { type: Array, default: () => [] }, // 已選課程（含 index）
  dark: { type: Boolean, default: false }
})
defineEmits(['open'])

const rows = computed(() => buildTimetableRows(props.courses, props.dark ? darkPalette : lightPalette))
</script>

<style scoped>
.card-body {
  padding: 1rem;
}

.mobile-scroll-hint {
  background: var(--brand-tint-strong);
  color: var(--brand-2);
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  display: none; /* 只在手機上顯示 */
}

.dark-mode .mobile-scroll-hint {
  background: rgba(108, 99, 214, 0.22) !important;
  color: #d8d3f5 !important;
}

.timetable {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--radius-md);
  max-width: 100%;
  box-shadow: 0 0 0 1px #e0e0e0; /* 以 box-shadow 作為外框 */
}

.timetable-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
  table-layout: fixed;
  border: none;
}

.dark-mode .timetable {
  box-shadow: 0 0 0 1px #4a5568;
}

.dark-mode .timetable-table {
  background: #2d3748;
}

/* 標頭用素色，讓課程色塊當視覺焦點 */
.day-header {
  background: #f8f9fc;
  color: #3a3f52;
  padding: 0.8rem;
  text-align: center;
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  border-bottom: 2px solid var(--brand-tint-strong);
}

.day-header:first-child {
  background: #eef0f6;
  color: #6b7280;
  font-weight: 600;
}

.dark-mode .day-header {
  background: #232735 !important;
  color: #e2e8f0 !important;
  border-bottom: 2px solid rgba(108, 99, 214, 0.3) !important;
}

.dark-mode .day-header:first-child {
  background: #1a1d29 !important;
  color: #9aa1b5 !important;
}

.time-cell {
  border: none;
  padding: 0;
  vertical-align: top;
  width: 12.5%;
  border-bottom: 1px solid #e0e0e0; /* 只保留底邊框作為水平分隔 */
}

.time-cell:first-child {
  background-color: #f8f9fa;
}

.dark-mode .time-cell {
  background: #2d3748 !important;
  border-bottom: 1px solid #4a5568 !important;
}

.dark-mode .time-cell:first-child {
  background-color: #1a202c !important;
}

.cell-content {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.cell-content.conflict {
  background-color: #ffebee;
  border: 2px solid #f44336;
}

.dark-mode .cell-content.conflict {
  background-color: #5d2a2a !important;
  border: 2px solid #ef5350 !important;
}

.dark-mode .cell-content.conflict .course-chip {
  background-color: #7d4f4f !important;
  color: #ffcccb !important;
  border: 1px solid #ef5350 !important;
}

.time-info {
  text-align: center;
}

.time-period {
  font-weight: 600;
  font-size: 1rem;
}

.time-range {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.2rem;
}

.dark-mode .time-range {
  color: #cbd5e0 !important;
}

.course-chips-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  justify-content: center;
}

.course-chip {
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  max-width: 90px;
  overflow: hidden;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
}

/* 深色模式只調整文字／邊框，背景維持各課程自己的顏色（見 darkPalette），才保有辨識度 */
.dark-mode .course-chip {
  color: #e2e8f0 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
}

.course-chip:hover {
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.22);
}

.course-id {
  font-size: 0.65rem;
  opacity: 0.8;
  font-weight: 500;
  line-height: 1;
}

.dark-mode .course-id {
  color: #cbd5e0 !important;
  opacity: 0.9 !important;
}

.course-name {
  font-size: 0.7rem;
  font-weight: 400;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark-mode .course-name {
  color: #e2e8f0 !important;
}

@media (max-width: 768px) {
  .mobile-scroll-hint {
    display: inline-block;
  }

  .card-body {
    padding: 0.5rem;
  }

  .timetable {
    border-radius: 4px;
    margin: 0;
  }

  .timetable-table {
    font-size: 0.8rem;
    min-width: 700px;
  }

  .course-chip {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
    max-width: 80px;
  }

  .day-header {
    padding: 0.6rem 0.3rem;
    font-size: 0.9rem;
  }

  .cell-content {
    min-height: 50px;
    padding: 0.3rem;
  }

  .time-period {
    font-size: 0.9rem;
  }

  .time-range {
    font-size: 0.7rem;
  }
}
</style>
