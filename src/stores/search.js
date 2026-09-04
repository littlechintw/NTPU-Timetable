// 搜尋與篩選狀態；結果的衝堂標記由已選課程推導，已選課程改變時自動更新

import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { createEmptyFilters, matchesFilters, parseKeywords, matchesKeywords } from '@/utils/courseFilter'
import { hasTimeConflict } from '@/utils/courseTime'
import { toListItem } from '@/utils/courseFormat'
import { useCourseDataStore } from './courseData'
import { useSelectionStore } from './selection'

const PAGE_SIZE = 50

export const useSearchStore = defineStore('search', () => {
  const courseData = useCourseDataStore()
  const selection = useSelectionStore()

  const keyword = ref('')
  const filters = ref(createEmptyFilters())
  const results = shallowRef([]) // 符合條件的原始課程資料，已依課號排序
  const hasSearched = ref(false)
  const undeterminedCount = ref(0) // 通過其他條件、但因上課時間未定而被時間篩選排除的課程數
  const visibleCount = ref(PAGE_SIZE)

  const hasActiveFilters = computed(() => Object.values(filters.value).some((list) => list.length > 0))
  const activeFilterCount = computed(() => Object.values(filters.value).reduce((n, list) => n + list.length, 0))
  const notFound = computed(() => hasSearched.value && results.value.length === 0)
  const hiddenCount = computed(() => Math.max(0, results.value.length - visibleCount.value))

  // 一次只渲染 PAGE_SIZE 筆；與已選課程撞課的列標成紅色（不與自己比對）
  const visibleResults = computed(() =>
    results.value.slice(0, visibleCount.value).map((course) => {
      const conflict = selection.courses.some(
        (selected) => selected.courseID !== course.courseID && hasTimeConflict(course, selected)
      )
      return { ...toListItem(course), color: conflict ? 'red' : '' }
    })
  )

  const message = computed(() => {
    if (!hasSearched.value) return ''
    if (results.value.length === 0) {
      let text = '沒有找到符合條件的課程'
      if (undeterminedCount.value > 0) {
        text += `（另有 ${undeterminedCount.value} 門符合其他條件但上課時間未定的課程，取消時間篩選即可顯示）`
      }
      return text
    }
    const filterText = activeFilterCount.value > 0 ? ` (已套用 ${activeFilterCount.value} 個篩選條件)` : ''
    let text = `找到 ${results.value.length} 門課程${filterText}`
    if (undeterminedCount.value > 0) text += `，另有 ${undeterminedCount.value} 門上課時間未定的課程未列出`
    return text
  })

  function reset() {
    results.value = []
    hasSearched.value = false
    undeterminedCount.value = 0
  }

  function run() {
    visibleCount.value = PAGE_SIZE
    const keywords = parseKeywords(keyword.value)
    if ((keywords.length === 0 && !hasActiveFilters.value) || !courseData.isLoaded) {
      reset()
      return
    }

    const matched = []
    let undetermined = 0
    for (const course of courseData.courses) {
      if (!matchesKeywords(course, keywords)) continue
      const verdict = matchesFilters(course, filters.value)
      if (!verdict.ok) {
        if (verdict.reason === 'time-undetermined') undetermined += 1
        continue
      }
      matched.push(course)
    }
    matched.sort((a, b) => a.courseID.localeCompare(b.courseID))

    results.value = matched
    undeterminedCount.value = undetermined
    hasSearched.value = true
  }

  function showMore() {
    visibleCount.value += PAGE_SIZE
  }

  function toggleFilter(category, value) {
    const list = filters.value[category]
    const index = list.indexOf(value)
    if (index > -1) list.splice(index, 1)
    else list.push(value)
    run()
  }

  function removeFilter(category, value) {
    const list = filters.value[category]
    const index = list.indexOf(value)
    if (index === -1) return
    list.splice(index, 1)
    run()
  }

  function clearFilters() {
    filters.value = createEmptyFilters()
    if (keyword.value.trim()) run()
    else reset()
  }

  // 只接受完全符合系所清單的名稱，避免打錯字或打到一半就套用篩選；回傳是否成功
  function addDepartment(name) {
    const value = name.trim()
    if (!value || !courseData.departments.includes(value)) return false
    if (!filters.value.departments.includes(value)) {
      filters.value.departments.push(value)
      run()
    }
    return true
  }

  return {
    keyword, filters, hasSearched, notFound, hiddenCount, visibleResults, message,
    hasActiveFilters, activeFilterCount,
    run, showMore, toggleFilter, removeFilter, clearFilters, addDepartment
  }
})
