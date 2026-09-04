// 課程時間相關的純函式：節次／時段定義、時間篩選、衝堂判斷、課表格子座標。
// 這裡不碰任何 Vue 狀態，方便直接用 node 對真實資料驗證。

export const timeDays = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

// 北大節次：1~4 為上午、5~9 為下午、10~14 為晚上（進修部／碩專班多為晚上）
export const timePeriods = [
  { key: 'morning', label: '上午', sessions: [1, 2, 3, 4] },
  { key: 'afternoon', label: '下午', sessions: [5, 6, 7, 8, 9] },
  { key: 'evening', label: '晚上', sessions: [10, 11, 12, 13, 14] }
]

// 產生時間篩選字串，例如 getTimeSlot(3, 'afternoon') => '週三下午'
export const getTimeSlot = (day, periodKey) => {
  const period = timePeriods.find((p) => p.key === periodKey)
  return `${timeDays[day - 1]}${period ? period.label : ''}`
}

export const timeSlotOptions = timeDays.flatMap((day) => timePeriods.map((p) => `${day}${p.label}`))

const timeSlotMapping = Object.fromEntries(
  timeDays.flatMap((day, idx) =>
    timePeriods.map((p) => [`${day}${p.label}`, { day: idx + 1, sessions: p.sessions }])
  )
)

// 篩選標籤的縮寫：「週三下午」→「三下」
export const shortTimeSlotLabel = (slot) =>
  slot.replace('週', '').replace('上午', '上').replace('下午', '下').replace('晚上', '晚')

// 部分課程時間尚未確定（courseTime / sessions 為 "N/A"），無法排入課表也無法比對時間
export const isValidCourseDetail = (detail) =>
  typeof detail.courseTime === 'number' && Array.isArray(detail.sessions)

export const hasAnyValidTime = (course) => (course.course_detail || []).some(isValidCourseDetail)

// 課程是否有任何一段時間落在指定時段（例如「週三下午」）
export const matchesTimeSlot = (course, slot) => {
  const target = timeSlotMapping[slot]
  if (!target) return false
  return (course.course_detail || []).some(
    (detail) =>
      isValidCourseDetail(detail) &&
      detail.courseTime === target.day &&
      detail.sessions.some((session) => target.sessions.includes(session))
  )
}

// 單週(O)與雙週(E)的課在同一時段不會真的撞到；每週(A)則與兩者都衝突
const isAlternatingWeeks = (a, b) => (a === 'O' && b === 'E') || (a === 'E' && b === 'O')

export const hasTimeConflict = (courseA, courseB) => {
  for (const detailA of courseA.course_detail || []) {
    if (!isValidCourseDetail(detailA)) continue
    for (const detailB of courseB.course_detail || []) {
      if (!isValidCourseDetail(detailB)) continue
      if (detailA.courseTime !== detailB.courseTime) continue
      if (isAlternatingWeeks(detailA.time_category, detailB.time_category)) continue
      if (detailA.sessions.some((session) => detailB.sessions.includes(session))) return true
    }
  }
  return false
}

// 將「星期、節次」轉成課表格子的 { row, col }
// 欄：週日 -> 第 1 欄；週一~週六 -> 第 2~7 欄（第 0 欄是時間標題）
// 列：第 1~4 節 -> 0~3；中午 -> 4；第 5~9 節 -> 5~9；第 10 節以後一律併入「晚上」(10)
export const EVENING_ROW = 10
export const convertTimeToCell = (courseTime, session) => {
  const col = courseTime === 7 ? 1 : courseTime + 1
  let row = EVENING_ROW
  if (session >= 1 && session <= 4) row = session - 1
  else if (session >= 5 && session <= 9) row = session
  return { row, col }
}
