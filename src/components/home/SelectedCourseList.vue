<template>
  <div class="card">
    <div class="card-header">
      <h3>已選課程</h3>
      <span class="credit-info">學分/時數: {{ selection.totalCredits }} / {{ selection.totalHours }}</span>
    </div>
    <div class="card-body">
      <div class="selected-courses">
        <CourseListItem
          v-for="item in selection.listItems"
          :key="item.courseID"
          :item="item"
          selected
          @open="$emit('open', item.courseID)"
          @toggle="selection.remove(item.courseID)"
        />
      </div>

      <button v-if="selection.listItems.length > 0" class="btn btn-danger btn-full" @click="selection.clear()">
        清除所有課程
      </button>
    </div>
  </div>
</template>

<script setup>
import CourseListItem from './CourseListItem.vue'
import { useSelectionStore } from '@/stores/selection'

defineEmits(['open'])

const selection = useSelectionStore()
</script>

<style scoped>
.credit-info {
  background: var(--brand-tint-strong);
  color: var(--brand-2);
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.dark-mode .credit-info {
  background: rgba(108, 99, 214, 0.22) !important;
  color: #d8d3f5 !important;
}

.selected-courses {
  max-height: 400px;
  overflow-y: auto;
}

.dark-mode .selected-courses {
  background: #2d3748 !important;
}
</style>
