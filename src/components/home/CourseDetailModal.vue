<template>
  <BaseModal v-if="course" title="課程詳細資訊" @close="$emit('close')">
    <div class="course-chips">
      <span class="chip">{{ course.courseID }}</span>
      <span class="chip chip-green">{{ course.department }}</span>
      <span v-for="level in course.department_level" :key="level.original" class="chip chip-blue">
        {{ level.original }} ({{ getCompulsoryForLevel(course, level.original) }})
      </span>
    </div>

    <div class="course-title">
      <h2>{{ course.title?.ch }} | {{ course.title?.en }}</h2>
      <h4 v-if="course.title?.other">{{ course.title.other }}</h4>
    </div>

    <div class="course-info">
      <p><strong>時數:</strong> {{ course.hours }}</p>
      <p><strong>學分數:</strong> {{ course.credit }}</p>
      <p><strong>老師:</strong> {{ course.teacher?.join(', ') }}</p>
      <p><strong>課程時間:</strong></p>
      <div v-for="detail in course.course_detail" :key="detail.original" class="course-time">
        {{ detail.original }}
      </div>
    </div>

    <div class="course-actions">
      <a class="btn btn-info" :href="courseInfoUrl" target="_blank">課程資訊</a>
      <a class="btn btn-info" :href="googleSearchUrl" target="_blank">Google 搜尋</a>
    </div>

    <div class="json-viewer">
      <h4>原始資料</h4>
      <pre class="json-content">{{ JSON.stringify(course, null, 2) }}</pre>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { getCompulsoryForLevel } from '@/utils/courseFormat'

const props = defineProps({
  course: { type: Object, default: null }
})
defineEmits(['close'])

// 課程資料含使用者無法控制的特殊字元（& # 空白等），需編碼避免產生錯誤的網址
const courseInfoUrl = computed(() => {
  const params = new URLSearchParams({
    g_serial: props.course.courseID,
    g_year: props.course.year,
    g_term: props.course.semester,
    show_info: 'all'
  })
  return `https://sea.cc.ntpu.edu.tw/pls/dev_stud/course_query.queryGuide?${params.toString()}`
})

const googleSearchUrl = computed(() => {
  const query = `${props.course.title?.ch || ''} ${props.course.teacher?.join(' ') || ''} 課程`
  return `https://google.com/search?q=${encodeURIComponent(query)}`
})
</script>

<style scoped>
.course-chips {
  margin-bottom: 1rem;
}

.course-title {
  margin: 1rem 0;
}

.course-info p {
  margin: 0.5rem 0;
}

.course-time {
  margin-left: 1rem;
  color: #666;
}

.dark-mode h2,
.dark-mode h4,
.dark-mode p,
.dark-mode strong,
.dark-mode .course-title,
.dark-mode .course-info,
.dark-mode .course-time {
  color: #e2e8f0 !important;
}

.course-actions {
  margin: 1rem 0;
}

.json-viewer {
  margin-top: 1rem;
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

.dark-mode .json-viewer {
  border-top: 1px solid #4a5568 !important;
}

.json-content {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.8rem;
  max-height: 300px;
  overflow-y: auto;
}

.dark-mode .json-content {
  background: #4a5568 !important;
  color: #e2e8f0 !important;
  border: 1px solid #666 !important;
}
</style>
