// 已選課程：存在 localStorage，內容是完整的課程資料加上 index（決定課表顏色）

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { courseSignature, summarizeCourseForNotice, toListItem } from '@/utils/courseFormat'

const STORAGE_KEY = 'SelectCourse'

const readStorage = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const useSelectionStore = defineStore('selection', () => {
  const courses = ref(readStorage())

  const selectedIDs = computed(() => new Set(courses.value.map((course) => course.courseID)))
  const listItems = computed(() => courses.value.map(toListItem))
  const totalCredits = computed(() => courses.value.reduce((sum, c) => sum + (parseInt(c.credit) || 0), 0))
  const totalHours = computed(() => courses.value.reduce((sum, c) => sum + (parseInt(c.hours) || 0), 0))

  const isSelected = (courseID) => selectedIDs.value.has(courseID)

  const persist = () => {
    courses.value.forEach((course, index) => {
      course.index = index
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses.value))
  }

  function add(course) {
    if (!course || isSelected(course.courseID)) return
    courses.value.push({ ...course, index: courses.value.length })
    persist()
  }

  function remove(courseID) {
    courses.value = courses.value.filter((course) => course.courseID !== courseID)
    persist()
  }

  function toggle(course) {
    if (!course) return
    if (isSelected(course.courseID)) remove(course.courseID)
    else add(course)
  }

  function clear() {
    courses.value = []
    persist()
  }

  // 比對已選課程與最新抓取的課程資料：課程被下架或內容變動時，從課表移除並回傳異動清單告知使用者
  function reconcile(getFreshCourse) {
    const notices = []
    const kept = []

    for (const oldCourse of courses.value) {
      const fresh = getFreshCourse(oldCourse.courseID)
      if (!fresh) {
        notices.push({
          courseID: oldCourse.courseID,
          title: oldCourse.title?.ch || oldCourse.courseID,
          type: 'removed',
          before: summarizeCourseForNotice(oldCourse),
          after: null
        })
        continue
      }
      if (courseSignature(oldCourse) !== courseSignature(fresh)) {
        notices.push({
          courseID: oldCourse.courseID,
          title: fresh.title?.ch || oldCourse.title?.ch,
          type: 'changed',
          before: summarizeCourseForNotice(oldCourse),
          after: summarizeCourseForNotice(fresh)
        })
        continue
      }
      kept.push(oldCourse)
    }

    if (notices.length > 0) {
      courses.value = kept
      persist()
    }
    return notices
  }

  return { courses, listItems, totalCredits, totalHours, isSelected, add, remove, toggle, clear, reconcile }
})
