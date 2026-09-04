// 搜尋與篩選的純函式：關鍵字比對、篩選條件比對、篩選選項的抽取

import { hasAnyValidTime, matchesTimeSlot } from './courseTime.js'

// 課程性質對應到資料中 compulsory 欄位的實際值（教育學程的 教必/教選 併入 必修/選修）
export const courseTypeMapping = {
  必修: ['必', '教必'],
  選修: ['選', '教選'],
  通識: ['通']
}
export const courseTypeOptions = Object.keys(courseTypeMapping)
export const gradeOptions = ['1', '2', '3', '4', '5']
export const creditOptions = ['0', '1', '2', '3', '4+']

// 各類篩選：同類別內是 OR，不同類別之間是 AND
export const createEmptyFilters = () => ({
  departments: [], // 系所，值為 department_level.category
  grades: [], // 年級，值為 department_level.grade
  dimensions: [], // 通識向度，值為 department_level.original（例如「105-向度二」）
  courseTypes: [], // 必修 / 選修 / 通識
  credits: [], // '0' ~ '3' 或 '4+'
  timeSlots: [] // 例如「週三下午」
})

// 通識向度在資料裡是 department_level 的一筆，original 形如「105-向度二」
export const isDimensionLevel = (level) => /向度/.test(level?.original || '')
export const dimensionLabel = (original) => original.replace(/^\d+-/, '')

// 系所篩選用的名稱：以 category（不含年級班別，如「資工系」）為主；
// 少數資料 category 為 N/A（多為學程），退回使用 original 全名
export const getLevelDepartment = (level) => {
  if (level.category && level.category !== 'N/A') return level.category
  return level.original || ''
}

export const listDepartments = (courses) => {
  const names = new Set()
  for (const course of courses) {
    for (const level of course.department_level || []) {
      const name = getLevelDepartment(level)
      if (name) names.add(name)
    }
  }
  return Array.from(names).sort()
}

// 向度以國字數字排序（一、二、三…），單純字串排序會變成「一三二五六四」
const CHINESE_NUMERALS = '一二三四五六七八九十'
const dimensionOrder = (original) => {
  const match = original.match(/向度(.)/)
  const index = match ? CHINESE_NUMERALS.indexOf(match[1]) : -1
  return index === -1 ? 99 : index
}

export const listDimensions = (courses) => {
  const names = new Set()
  for (const course of courses) {
    for (const level of course.department_level || []) {
      if (isDimensionLevel(level)) names.add(level.original)
    }
  }
  return Array.from(names).sort((a, b) => dimensionOrder(a) - dimensionOrder(b) || a.localeCompare(b))
}

// 關鍵字以空白切成多個詞，全部都要出現（AND），例如「資工 演算法」
export const parseKeywords = (input) => input.trim().toLowerCase().split(/\s+/).filter(Boolean)

const keywordHaystack = (course) =>
  [
    course.courseID,
    course.title?.ch,
    course.title?.en,
    (course.teacher || []).join(' '),
    course.department,
    ...(course.department_level || []).map((level) => `${level.category || ''} ${level.original || ''}`)
  ]
    .join(' ')
    .toLowerCase()

export const matchesKeywords = (course, keywords) => {
  if (keywords.length === 0) return true
  const haystack = keywordHaystack(course)
  return keywords.every((word) => haystack.includes(word))
}

const matchesCredit = (course, ranges) => {
  const credits = course.credit ? parseInt(course.credit) : 0
  return ranges.some((range) =>
    range.endsWith('+') ? credits >= parseInt(range) : credits === parseInt(range)
  )
}

// 系所、年級、課程性質要針對「同一筆開放修課資訊」一起判斷：
// department_level[i] 與 compulsory[i] 一一對應，同一門課對甲系可能是必修、對乙系是選修。
// （通識向度會多出 department_level 但沒有對應的 compulsory，配對時略過即可）
const matchesDepartmentPair = (course, filters) => {
  const { departments, grades, courseTypes } = filters
  if (departments.length === 0 && grades.length === 0 && courseTypes.length === 0) return true

  const levels = course.department_level || []
  const compulsory = course.compulsory || []
  const acceptedCodes = courseTypes.flatMap((type) => courseTypeMapping[type] || [])
  const pairCount = Math.max(levels.length, compulsory.length)

  for (let i = 0; i < pairCount; i++) {
    const level = levels[i]
    const code = compulsory[i]
    const deptOk =
      departments.length === 0 || (level !== undefined && departments.includes(getLevelDepartment(level)))
    const gradeOk = grades.length === 0 || (level !== undefined && grades.includes(String(level.grade)))
    const typeOk = courseTypes.length === 0 || (code !== undefined && acceptedCodes.includes(code))
    if (deptOk && gradeOk && typeOk) return true
  }
  return false
}

// 回傳 { ok: true } 或 { ok: false, reason }
// reason 為 'time-undetermined' 時，代表課程通過其他條件、只因上課時間未定而被時間篩選排除
export const matchesFilters = (course, filters) => {
  if (!matchesDepartmentPair(course, filters)) return { ok: false, reason: 'department' }

  if (filters.dimensions.length > 0) {
    const levels = course.department_level || []
    if (!levels.some((level) => filters.dimensions.includes(level.original))) {
      return { ok: false, reason: 'dimension' }
    }
  }

  if (filters.credits.length > 0 && !matchesCredit(course, filters.credits)) {
    return { ok: false, reason: 'credit' }
  }

  if (filters.timeSlots.length > 0) {
    const timeOk = filters.timeSlots.some((slot) => matchesTimeSlot(course, slot))
    if (!timeOk) return { ok: false, reason: hasAnyValidTime(course) ? 'time' : 'time-undetermined' }
  }

  return { ok: true }
}
