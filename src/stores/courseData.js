// 課程資料（由爬蟲產生的 all_course_list.json）

import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { listDepartments, listDimensions } from '@/utils/courseFilter'

export const useCourseDataStore = defineStore('courseData', () => {
  // 課程資料不會被修改，用 shallowRef 避免對兩千多筆資料做深層響應式追蹤
  const courses = shallowRef([])
  const updatedAt = ref('載入中...')

  const isLoaded = computed(() => courses.value.length > 0)
  const indexByID = computed(() => new Map(courses.value.map((course) => [course.courseID, course])))
  const departments = computed(() => listDepartments(courses.value))
  const dimensions = computed(() => listDimensions(courses.value))

  const getCourse = (courseID) => indexByID.value.get(courseID) || null

  async function load() {
    try {
      const response = await fetch('/clawer/all_course_list.json')
      if (!response.ok) {
        console.error('無法載入課程資料:', response.status)
        return
      }
      const data = await response.json()
      // 爬蟲偶爾會抓到完全相同的課兩次，依課號去重
      const seen = new Set()
      courses.value = (data.data || []).filter((course) => {
        if (seen.has(course.courseID)) return false
        seen.add(course.courseID)
        return true
      })
      updatedAt.value = data.start_time || ''
    } catch (error) {
      console.error('載入課程資料時發生錯誤:', error)
    }
  }

  return { courses, updatedAt, isLoaded, departments, dimensions, getCourse, load }
})
