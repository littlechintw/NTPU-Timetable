// 課程資料的顯示格式與比對用的純函式

import { isValidCourseDetail } from './courseTime.js'

export const semesterLabel = (semester) => {
  const value = String(semester)
  if (value === '1') return '上學期'
  if (value === '2') return '下學期'
  return `第${semester}學期`
}

// 搜尋結果／已選課程列表共用的一列資料
export const toListItem = (course) => ({
  courseID: course.courseID,
  title: `${course.courseID} ${course.title?.ch ?? ''}`,
  subtitle: `${course.teacher} | 學分 / 時數: ${course.credit} / ${course.hours}`,
  department: course.department,
  course_detail: course.course_detail || []
})

// 某個開放修課系所（department_level.original）對應的必選修代碼
export const getCompulsoryForLevel = (course, original) => {
  const index = (course.department_level || []).findIndex((level) => level.original === original)
  if (index === -1) return 'Error!'
  const compulsory = course.compulsory || []
  if (compulsory.length === 0) return ''
  return compulsory[Math.min(index, compulsory.length - 1)]
}

// 課程內容的簽章：用來判斷課程從上次選課到現在，學年期／時間／學分／時數／教師／名稱是否有變動。
// 一定要比對學年期：課號在不同學期可能被重新編給完全不同的課程，光比對其他欄位可能剛好都相同而漏判。
export const courseSignature = (course) =>
  JSON.stringify({
    year: course.year,
    semester: course.semester,
    title: course.title?.ch,
    teacher: course.teacher,
    credit: course.credit,
    hours: course.hours,
    detail: (course.course_detail || []).map((d) => d.original)
  })

// 把課程摘要成一行文字，用於異動通知的「異動前 / 異動後」對照
export const summarizeCourseForNotice = (course) => {
  if (!course) return '（查無資料）'
  const teacher = Array.isArray(course.teacher) ? course.teacher.join('、') : course.teacher
  const times = (course.course_detail || [])
    .filter(isValidCourseDetail)
    .map((d) => d.original?.replace(/\t/g, ' '))
    .join('；')
  const term = course.year ? `${course.year} 學年 ${semesterLabel(course.semester)} | ` : ''
  return `${term}${teacher || '教師未定'} | ${course.credit ?? '?'} 學分 / ${course.hours ?? '?'} 時數 | ${times || '時間未定'}`
}
