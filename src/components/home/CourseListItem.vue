<template>
  <div class="course-item" :class="color ? `bg-${color}` : ''" @click="$emit('open')">
    <button class="status-btn" :class="selected ? 'red' : 'blue'" @click.stop="$emit('toggle')">
      {{ selected ? '×' : '+' }}
    </button>

    <div class="course-content">
      <div class="course-title-text">{{ item.title }}</div>
      <div v-if="showDepartment" class="course-subtitle">{{ item.department }}</div>
      <div class="course-subtitle">{{ item.subtitle }}</div>
      <template v-if="showDetails">
        <div v-for="detail in item.course_detail" :key="detail.original" class="course-detail">
          {{ detail.original }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: { type: Object, required: true }, // { courseID, title, subtitle, department, course_detail }
  selected: { type: Boolean, default: false },
  color: { type: String, default: '' }, // 'red' 衝堂、'orange' 查無資料
  showDepartment: { type: Boolean, default: false },
  showDetails: { type: Boolean, default: false }
})
defineEmits(['open', 'toggle'])
</script>

<style scoped>
.course-item {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dark-mode .course-item {
  border-bottom: 1px solid #4a5568 !important;
  color: #e2e8f0 !important;
}

.course-item:hover {
  background-color: #f8f9fa;
}

.dark-mode .course-item:hover {
  background-color: #4a5568 !important;
}

.bg-orange { background-color: #fff3cd; }

.dark-mode .bg-orange {
  background-color: #744210 !important;
  color: #fbb040 !important;
}

/* 與已選課程時間衝突：柔和的紅色提示，呼應課表上的衝突樣式 */
.bg-red {
  background-color: #ffebee;
  border-left: 3px solid #f44336;
}

.dark-mode .bg-red {
  background-color: #5d2a2a !important;
  border-left: 3px solid #ef5350 !important;
  color: #ffcdd2 !important;
}

.status-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.status-btn:hover {
  transform: scale(1.08);
  box-shadow: var(--shadow-sm);
}

.status-btn.blue { background: var(--brand-1); color: white; }
.status-btn.red { background: var(--danger); color: white; }

.dark-mode .status-btn.blue {
  background: var(--brand-1) !important;
  color: #f7fafc !important;
}
.dark-mode .status-btn.red {
  background: var(--danger-strong) !important;
  color: #e2e8f0 !important;
}

.course-content {
  flex: 1;
}

.course-title-text {
  font-weight: 500;
  margin-bottom: 0.3rem;
}

.course-subtitle {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.2rem;
}

.dark-mode .course-subtitle {
  color: #cbd5e0 !important;
}

.course-detail {
  font-size: 0.8rem;
  color: #999;
}

.dark-mode .course-detail {
  color: #a0aec0 !important;
}
</style>
