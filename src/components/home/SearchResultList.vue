<template>
  <div class="card">
    <div class="card-header">
      <h3>搜尋結果</h3>
    </div>
    <div class="card-body search-results">
      <CourseListItem v-if="search.notFound" :item="notFoundItem" selected color="orange" />

      <CourseListItem
        v-for="item in search.visibleResults"
        :key="item.courseID"
        :item="item"
        :color="item.color"
        :selected="selection.isSelected(item.courseID)"
        show-department
        show-details
        @open="$emit('open', item.courseID)"
        @toggle="toggleSelection(item.courseID)"
      />

      <button v-if="search.hiddenCount > 0" class="btn btn-outline load-more-btn" @click="search.showMore()">
        顯示更多（尚有 {{ search.hiddenCount }} 筆）
      </button>
    </div>
  </div>
</template>

<script setup>
import CourseListItem from './CourseListItem.vue'
import { useCourseDataStore } from '@/stores/courseData'
import { useSearchStore } from '@/stores/search'
import { useSelectionStore } from '@/stores/selection'

defineEmits(['open'])

const courseData = useCourseDataStore()
const search = useSearchStore()
const selection = useSelectionStore()

const notFoundItem = {
  courseID: '0000',
  title: '404 Not Found!',
  subtitle: '請修改搜尋條件或篩選條件後重試',
  course_detail: []
}

const toggleSelection = (courseID) => {
  selection.toggle(courseData.getCourse(courseID))
}
</script>

<style scoped>
.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.dark-mode .search-results {
  background: #2d3748 !important;
}

.load-more-btn {
  width: 100%;
  margin-top: 0.5rem;
}
</style>
