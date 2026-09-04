// 由已選課程建立課表格子資料（純函式）

import { convertTimeToCell, isValidCourseDetail } from './courseTime.js'

export const lightPalette = [
  '#E6B0AA', '#FFE181', '#D2B4DE', '#A9CCE3', '#AED6F1', '#A3E4D7',
  '#A2D9CE', '#E2BDD6', '#A9DFBF', '#ABEBC6', '#F9E79F', '#FAD7A0',
  '#F5CBA7', '#EDBB99'
]

export const darkPalette = [
  '#8B4B5C', '#B8860B', '#6B4C85', '#4682B4', '#5F9EA0', '#2E8B57',
  '#5A6B5D', '#8B5A82', '#4F7942', '#3E8E6B', '#9A7C3A', '#8B6914',
  '#8B5A42', '#8B6339'
]

export const dayHeaders = ['時間', '日', '一', '二', '三', '四', '五', '六']

const rowTitles = ['1', '2', '3', '4', '中午', '5', '6', '7', '8', '9', '晚上']
const rowTimes = [
  '08:10 ~ 09:00', '09:10 ~ 10:00', '10:10 ~ 11:00', '11:10 ~ 12:00',
  '12:10 ~ 13:00', '13:10 ~ 14:00', '14:10 ~ 15:00', '15:10 ~ 16:00',
  '16:10 ~ 17:00', '17:10 ~ 18:00', '18:30 ~ 22:10'
]
const LUNCH_ROW = 4
const COLUMNS = dayHeaders.length

const createEmptyRows = () =>
  rowTitles.map((title, rowIndex) =>
    Array.from({ length: COLUMNS }, (_, col) => {
      if (col === 0) {
        return { title, subtitle: rowTimes[rowIndex], chip: [], color: 'white', show_title: true, show_chip: false }
      }
      if (rowIndex === LUNCH_ROW) {
        // 中午時段：淺灰底、不顯示任何內容
        return { title: '', subtitle: '', chip: [], color: '#f8f9fa', show_title: false, show_chip: false }
      }
      return { title: '', subtitle: '', chip: [], color: 'white', show_title: false, show_chip: true }
    })
  )

// courses：已選課程（含 index，用來決定顏色）；palette：目前的調色盤
// 同一格有兩門以上課程時標為紅色（衝堂）
export const buildTimetableRows = (courses, palette) => {
  const rows = createEmptyRows()

  courses.forEach((course, position) => {
    const colorIndex = typeof course.index === 'number' ? course.index : position
    const chip = {
      title: `${course.courseID} ${course.title?.ch ?? ''}`,
      color: palette[colorIndex % palette.length],
      courseID: course.courseID,
      courseName: course.title?.ch ?? ''
    }

    for (const detail of course.course_detail || []) {
      if (!isValidCourseDetail(detail)) continue // 課程時間未定，無法排入課表
      const placed = new Set() // 晚上場次已併成一格，同一格只放一次
      for (const session of detail.sessions) {
        const { row, col } = convertTimeToCell(detail.courseTime, session)
        const key = `${row}-${col}`
        if (placed.has(key)) continue
        placed.add(key)
        rows[row][col].chip.push({ ...chip })
      }
    }
  })

  for (const row of rows) {
    for (let col = 1; col < COLUMNS; col++) {
      if (row[col].chip.length > 1) row[col].color = 'red'
    }
  }
  return rows
}
