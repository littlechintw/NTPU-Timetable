<template>
  <div class="card">
    <div class="card-header">
      <h3>課程搜尋</h3>
    </div>
    <div class="card-body">
      <div class="search-form">
        <input
          v-model="search.keyword"
          type="text"
          placeholder="課程編號 / 課程名稱 / 老師 / 關鍵字"
          class="search-input"
          @keyup.enter="search.run()"
        />
        <button class="btn btn-primary" @click="search.run()">搜尋</button>
      </div>

      <div class="filter-section">
        <label>篩選條件:</label>

        <!-- 已套用的篩選條件 -->
        <div v-if="search.hasActiveFilters" class="selected-filters">
          <div
            v-for="group in chipGroups"
            v-show="search.filters[group.key].length > 0"
            :key="group.key"
            class="filter-category"
          >
            <span class="category-label">{{ group.label }}：</span>
            <span
              v-for="value in search.filters[group.key]"
              :key="value"
              class="chip chip-removable"
              :class="group.chipClass"
            >
              {{ group.format(value) }}
              <button @click="search.removeFilter(group.key, value)">×</button>
            </span>
          </div>
        </div>

        <div class="filter-controls">
          <!-- 系所：輸入文字即可從清單中挑選，選定或按 Enter 即加入篩選；年級另外用按鈕篩選 -->
          <div class="filter-group">
            <label class="filter-group-title">系所（開放修課的系所）</label>
            <input
              v-model="departmentInput"
              type="text"
              list="department-options"
              class="filter-select"
              placeholder="輸入系所名稱搜尋..."
              autocomplete="off"
              @change="addDepartment"
              @keyup.enter="addDepartment"
            />
            <datalist id="department-options">
              <option v-for="dept in courseData.departments" :key="dept" :value="dept" />
            </datalist>
          </div>

          <div class="quick-filters">
            <div v-for="group in buttonGroups" v-show="group.options.length > 0" :key="group.key" class="filter-group">
              <label class="filter-group-title">{{ group.label }}</label>
              <div class="filter-buttons">
                <button
                  v-for="value in group.options"
                  :key="value"
                  class="filter-btn"
                  :class="{ active: search.filters[group.key].includes(value) }"
                  @click="search.toggleFilter(group.key, value)"
                >
                  {{ group.format(value) }}
                </button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-group-title">上課時間</label>
              <div class="time-filter-grid">
                <div v-for="(dayLabel, index) in dayLabels" :key="dayLabel" class="time-day-group">
                  <div class="time-day-label">{{ dayLabel }}</div>
                  <div class="time-period-buttons">
                    <button
                      v-for="period in timePeriods"
                      :key="period.key"
                      class="time-btn"
                      :class="{ active: search.filters.timeSlots.includes(getTimeSlot(index + 1, period.key)) }"
                      @click="search.toggleFilter('timeSlots', getTimeSlot(index + 1, period.key))"
                    >
                      {{ period.label }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="filter-actions">
            <button v-if="search.hasActiveFilters" class="btn btn-outline" @click="search.clearFilters()">
              清除所有篩選
            </button>
          </div>
        </div>
      </div>

      <div class="course-info-text">
        <p><small>課程資料更新時間: {{ courseData.updatedAt }}</small></p>
        <p>{{ search.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCourseDataStore } from '@/stores/courseData'
import { useSearchStore } from '@/stores/search'
import { courseTypeOptions, creditOptions, dimensionLabel, gradeOptions } from '@/utils/courseFilter'
import { getTimeSlot, shortTimeSlotLabel, timeDays, timePeriods } from '@/utils/courseTime'

const courseData = useCourseDataStore()
const search = useSearchStore()

const departmentInput = ref('')
const dayLabels = timeDays.map((day) => day.replace('週', ''))

const formatGrade = (grade) => `${grade}年級`
const formatCredit = (credit) => (credit === '4+' ? credit : `${credit}學分`)
const identity = (value) => value

// 已套用篩選的標籤列（依類別分組）
const chipGroups = [
  { key: 'departments', label: '系所', chipClass: 'chip-department', format: identity },
  { key: 'grades', label: '年級', chipClass: 'chip-grade', format: formatGrade },
  { key: 'dimensions', label: '向度', chipClass: 'chip-dimension', format: dimensionLabel },
  { key: 'courseTypes', label: '性質', chipClass: 'chip-coursetype', format: identity },
  { key: 'credits', label: '學分', chipClass: 'chip-credit', format: formatCredit },
  { key: 'timeSlots', label: '時間', chipClass: 'chip-time', format: shortTimeSlotLabel }
]

// 按鈕式的快速篩選（通識向度的選項來自資料，沒有資料時整組隱藏）
const buttonGroups = computed(() => [
  { key: 'grades', label: '年級', options: gradeOptions, format: formatGrade },
  { key: 'dimensions', label: '通識向度', options: courseData.dimensions, format: dimensionLabel },
  { key: 'courseTypes', label: '課程性質', options: courseTypeOptions, format: identity },
  { key: 'credits', label: '學分數', options: creditOptions, format: formatCredit }
])

// 只有成功加入（或已在清單中）才清空輸入框；打到一半就失焦時保留文字，不會被 change 事件吃掉
const addDepartment = () => {
  if (search.addDepartment(departmentInput.value)) departmentInput.value = ''
}
</script>

<style scoped>
.search-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--brand-1);
  box-shadow: 0 0 0 3px var(--brand-ring);
}

.dark-mode .search-input {
  background: #4a5568 !important;
  border: 1px solid #666 !important;
  color: #e2e8f0 !important;
}

.dark-mode .search-input::placeholder {
  color: #a0a0a0 !important;
}

.filter-section {
  margin: 1rem 0;
}

.filter-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

/* 已套用的篩選標籤 */
.selected-filters {
  margin: 1rem 0;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: var(--radius-sm);
  border: 1px solid #e0e0e0;
}

.dark-mode .selected-filters {
  background: #2d3748 !important;
  border: 1px solid #4a5568 !important;
}

.filter-category {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  gap: 0.3rem;
}

.filter-category:last-child {
  margin-bottom: 0;
}

.category-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #666;
  min-width: 50px;
  margin-right: 0.5rem;
}

.dark-mode .category-label {
  color: #a0aec0 !important;
}

.chip-removable {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  margin: 0.2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
}

.dark-mode .chip-removable {
  background: #2b6cb0 !important;
  color: #e2e8f0 !important;
  border: 1px solid #4299e1 !important;
}

.chip-removable button {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-weight: bold;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.dark-mode .chip-removable button {
  color: #e2e8f0 !important;
}

.chip-removable button:hover {
  background: rgba(0, 0, 0, 0.1);
}

.dark-mode .chip-removable button:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

/* 各類篩選標籤的顏色 */
.chip-department {
  background: #e8f5e8 !important;
  color: #2e7d32 !important;
  border: 1px solid #4caf50;
}

.dark-mode .chip-department {
  background: #1b5e20 !important;
  color: #c8e6c9 !important;
}

.chip-grade {
  background: #f3e5f5 !important;
  color: #7b1fa2 !important;
  border: 1px solid #9c27b0;
}

.dark-mode .chip-grade {
  background: #4a148c !important;
  color: #e1bee7 !important;
}

.chip-dimension {
  background: #fce4ec !important;
  color: #c2185b !important;
  border: 1px solid #e91e63;
}

.dark-mode .chip-dimension {
  background: #880e4f !important;
  color: #f8bbd0 !important;
}

.chip-coursetype {
  background: #fff3e0 !important;
  color: #ef6c00 !important;
  border: 1px solid #ff9800;
}

.dark-mode .chip-coursetype {
  background: #e65100 !important;
  color: #ffcc02 !important;
}

.chip-credit {
  background: #e0f2f1 !important;
  color: #00695c !important;
  border: 1px solid #009688;
}

.dark-mode .chip-credit {
  background: #004d40 !important;
  color: #b2dfdb !important;
}

.chip-time {
  background: #e1f5fe !important;
  color: #0277bd !important;
  border: 1px solid #03a9f4;
}

.dark-mode .chip-time {
  background: #01579b !important;
  color: #b3e5fc !important;
}

/* 篩選控制 */
.filter-controls {
  margin: 1rem 0;
}

.filter-select {
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  background: white;
}

.filter-select:focus {
  outline: none;
  border-color: var(--brand-1);
  box-shadow: 0 0 0 3px var(--brand-ring);
}

.dark-mode .filter-select {
  background: #2d3748 !important;
  border: 1px solid #4a5568 !important;
  color: #e2e8f0 !important;
}

.quick-filters {
  margin: 1rem 0;
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-group-title {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #666;
}

.dark-mode .filter-group-title {
  color: #cbd5e0 !important;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.filter-btn {
  padding: 0.4rem 0.8rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
  color: #333;
}

.dark-mode .filter-btn {
  background: #4a5568 !important;
  border: 1px solid #666 !important;
  color: #e2e8f0 !important;
}

.filter-btn:hover {
  background: #e0e0e0;
  border-color: #bbb;
}

.dark-mode .filter-btn:hover {
  background: #5a6578 !important;
  border-color: #777 !important;
}

.filter-btn.active {
  background: var(--brand-1);
  color: white;
  border-color: var(--brand-1);
}

.dark-mode .filter-btn.active {
  background: var(--brand-1) !important;
  color: #f7fafc !important;
  border-color: var(--brand-1) !important;
}

/* 上課時間格子 */
.time-filter-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.time-day-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.time-day-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #666;
  text-align: center;
}

.dark-mode .time-day-label {
  color: #a0aec0 !important;
}

.time-period-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 100%;
}

.time-btn {
  padding: 0.3rem 0.2rem;
  white-space: nowrap; /* 側欄較窄時仍讓「上午／下午／晚上」維持一行 */
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
  color: #333;
  text-align: center;
  width: 100%;
}

.dark-mode .time-btn {
  background: #4a5568 !important;
  border: 1px solid #666 !important;
  color: #e2e8f0 !important;
}

.time-btn:hover {
  background: #e0e0e0;
  border-color: #bbb;
}

.dark-mode .time-btn:hover {
  background: #5a6578 !important;
  border-color: #777 !important;
}

.time-btn.active {
  background: var(--brand-1);
  color: white;
  border-color: var(--brand-1);
}

.dark-mode .time-btn.active {
  background: var(--brand-1) !important;
  color: #f7fafc !important;
  border-color: var(--brand-1) !important;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.course-info-text {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.dark-mode .course-info-text {
  color: #cbd5e0 !important;
}

.dark-mode .course-info-text small {
  color: #e2e8f0 !important;
}

@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
  }
}
</style>
