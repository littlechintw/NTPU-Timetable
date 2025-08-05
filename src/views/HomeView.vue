<template>
  <div class="home-container" :class="{ 'dark-mode': isDarkMode }">

    <!-- 課程詳細資訊對話框 -->
    <div v-if="overlay" class="modal-overlay" @click="overlay = false">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <h3>課程詳細資訊</h3>
          <button class="modal-close" @click="overlay = false">×</button>
        </div>
        
        <div class="modal-body">
          <div class="course-chips">
            <span class="chip">{{ overlayData.courseID }}</span>
            <span class="chip chip-green">{{ overlayData.department }}</span>
            <span 
              class="chip chip-blue"
              v-for="data in overlayData.department_level" 
              :key="data.original"
            >
              {{ data.original }} ({{ getCompulsory(overlayData, data.original) }})
            </span>
          </div>

          <div class="course-title">
            <h2>{{ overlayData.title?.ch }} | {{ overlayData.title?.en }}</h2>
            <h4 v-if="overlayData.title?.other">{{ overlayData.title.other }}</h4>
          </div>
          
          <div class="course-info">
            <p><strong>時數:</strong> {{ overlayData.hours }}</p>
            <p><strong>學分數:</strong> {{ overlayData.credit }}</p>
            <p><strong>老師:</strong> {{ overlayData.teacher?.join(', ') }}</p>
            <p><strong>課程時間:</strong></p>
            <div v-for="detail in overlayData.course_detail" :key="detail.original" class="course-time">
              {{ detail.original }}
            </div>
          </div>

          <div class="course-actions">
            <a 
              class="btn btn-info"
              :href="`https://sea.cc.ntpu.edu.tw/pls/dev_stud/course_query.queryGuide?g_serial=${overlayData.courseID}&g_year=${overlayData.year}&g_term=${overlayData.semester}&show_info=all`"
              target="_blank"
            >
              課程資訊
            </a>
            <a 
              class="btn btn-info"
              :href="`https://google.com/search?q=${overlayData.title?.ch} ${overlayData.teacher?.join(' ')} 課程`"
              target="_blank"
            >
              Google 搜尋
            </a>
          </div>

          <div class="json-viewer">
            <h4>原始資料</h4>
            <pre class="json-content">{{ JSON.stringify(overlayData, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 警示文字 -->
    <div class="warning-banner">
      <div class="warning-content">
        ⚠️ 此為試排課程，請依然要到選課系統選課。
      </div>
    </div>

    <div class="main-layout">
      <!-- 左側：搜尋和選課區域 -->
      <div class="sidebar">
        <!-- 搜尋區域 -->
        <div class="card">
          <div class="card-header">
            <h3>課程搜尋</h3>
          </div>
          <div class="card-body">
            <div class="search-form">
              <input
                v-model="searchInput"
                type="text"
                placeholder="課程編號 / 課程名稱 / 老師 / 關鍵字"
                class="search-input"
                @keyup.enter="searchCourse"
              />
              <button class="btn btn-primary" @click="searchCourse">搜尋</button>
            </div>

            <div class="filter-section">
              <label>篩選條件:</label>
              <div class="filter-chips">
                <span 
                  v-for="(chip, index) in filterChips" 
                  :key="index"
                  class="chip chip-removable"
                >
                  {{ chip }}
                  <button @click="filterRemove(chip)">×</button>
                </span>
              </div>
              <select v-model="selectedFilter" @change="addFilter" class="filter-select">
                <option value="">選擇篩選條件</option>
                <option v-for="item in filterItems" :key="item" :value="item">
                  {{ item }}
                </option>
              </select>
            </div>

            <div class="course-info-text">
              <p><small>課程資料更新時間: {{ courseData.start_time }}</small></p>
              <p>{{ searchResult }}</p>
            </div>
          </div>
        </div>

        <!-- 搜尋結果 -->
        <div class="card">
          <div class="card-header">
            <h3>搜尋結果</h3>
          </div>
          <div class="card-body search-results">
            <div
              v-for="course in searchList"
              :key="course.courseID"
              class="course-item"
              :class="course.color ? `bg-${course.color}` : ''"
              @click="showCourseDetail(course.courseID)"
            >
              <button
                class="status-btn"
                :class="getStatusIcon(course.courseID).color"
                @click.stop="changeCourseSelectStatus(course.courseID)"
              >
                {{ getStatusIcon(course.courseID).icon }}
              </button>
              
              <div class="course-content">
                <div class="course-title-text">{{ course.title }}</div>
                <div class="course-subtitle">{{ course.department }}</div>
                <div class="course-subtitle">{{ course.subtitle }}</div>
                
                <div v-for="detail in course.course_detail" :key="detail.original">
                  <div class="course-detail">{{ detail.original }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 已選課程 -->
        <div class="card">
          <div class="card-header">
            <h3>已選課程</h3>
            <span class="credit-info">學分/時數: {{ showCredit }} / {{ showHours }}</span>
          </div>
          <div class="card-body">
            <div class="selected-courses">
              <div
                v-for="course in selectList"
                :key="course.courseID"
                class="course-item"
                @click="showCourseDetail(course.courseID)"
              >
                <button
                  class="status-btn red"
                  @click.stop="changeCourseSelectStatus(course.courseID)"
                >
                  ×
                </button>
                
                <div class="course-content">
                  <div class="course-title-text">{{ course.title }}</div>
                  <div class="course-subtitle">{{ course.subtitle }}</div>
                </div>
              </div>
            </div>
            
            <button 
              v-if="selectList.length > 0"
              class="btn btn-danger btn-full" 
              @click="resetAll"
            >
              清除所有課程
            </button>
          </div>
        </div>

        <!-- 支援資訊 -->
        <div class="card">
          <div class="card-body text-center">
            <a
              class="btn btn-info"
              href="https://hackmd.io/@littlechin/rJYHHfeiK"
              target="_blank"
            >
              使用說明
            </a>
            <p class="support-text">
              問題回報請寄 Email 至<br>
              ntpu-timetable-support@googlegroups.com
            </p>
          </div>
        </div>
      </div>

      <!-- 右側：課表 -->
      <div class="timetable-container">
        <div class="card">
          <div class="card-header">
            <h3>課表</h3>
          </div>
          <div class="card-body">
            <div class="timetable">
              <table class="timetable-table">
                <thead>
                  <tr>
                    <th v-for="day in daysData" :key="day" class="day-header">
                      {{ day }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIndex) in bodyData" :key="rowIndex">
                    <td 
                      v-for="(cell, cellIndex) in row" 
                      :key="cellIndex" 
                      class="time-cell"
                      :style="{ backgroundColor: cell.color }"
                    >
                      <div class="cell-content" :class="{ 'conflict': cell.color === 'red' }">
                        <!-- 時間欄 -->
                        <div v-if="cell.show_title" class="time-info">
                          <div class="time-period">{{ cell.title }}</div>
                          <div class="time-range">{{ cell.subtitle }}</div>
                        </div>
                        
                        <!-- 課程欄 -->
                        <div v-else-if="cell.show_chip" class="course-chips-cell">
                          <div
                            v-for="chip in cell.chip"
                            :key="chip.courseID"
                            class="course-chip"
                            :style="{ backgroundColor: chip.color }"
                            @click="showCourseDetail(chip.courseID)"
                          >
                            <div class="course-id">{{ chip.courseID }}</div>
                            <div class="course-name">{{ chip.courseName }}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, provide } from 'vue'

// 黑暗模式
const isDarkMode = ref(false)

// 檢測黑暗模式
const checkDarkMode = () => {
  const prevMode = isDarkMode.value
  
  // 多種方式檢測黑暗模式
  const appElement = document.getElementById('app')
  const hasAppDarkClass = appElement?.classList.contains('dark-mode')
  const hasDocDarkClass = document.documentElement.classList.contains('dark-mode')
  const hasBodyDarkClass = document.body.classList.contains('dark-mode')
  
  isDarkMode.value = hasAppDarkClass || hasDocDarkClass || hasBodyDarkClass
  
  console.log('黑暗模式檢測:', {
    prevMode,
    currentMode: isDarkMode.value,
    appElement: !!appElement,
    hasAppDarkClass,
    hasDocDarkClass,
    hasBodyDarkClass
  })
  
  // 如果模式改變了，重新計算顏色
  if (prevMode !== isDarkMode.value && courseData.data && courseData.data.length > 0) {
    console.log('模式改變，重新計算顏色')
    setTimeout(() => {
      recalculateColors()
    }, 100) // 延遲一點以確保 DOM 更新完成
  }
}

// 監聽黑暗模式變化
const observeDarkMode = () => {
  // 監聽 app 元素的 class 變化
  const appElement = document.getElementById('app')
  if (appElement) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkDarkMode()
        }
      })
    })
    
    observer.observe(appElement, {
      attributes: true,
      attributeFilter: ['class']
    })
  }
  
  // 監聽 body 和 documentElement 的變化
  const bodyObserver = new MutationObserver(() => checkDarkMode())
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] })
  bodyObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  
  // 監聽 localStorage 變化（從其他標籤頁）
  window.addEventListener('storage', (e) => {
    if (e.key === 'darkMode') {
      setTimeout(checkDarkMode, 50)
    }
  })
  
  // 定期檢查（作為後備方案）
  setInterval(checkDarkMode, 1000)
}

// 重新計算課程顏色（用於黑暗模式切換）
const recalculateColors = () => {
  console.log('開始重新計算顏色，當前黑暗模式:', isDarkMode.value)
  
  const tmpList = getCourseSelectStatus()
  
  // 只更新顏色，不重新初始化時間表
  for (let i = 0; i < tmpList.length; i++) {
    const course = tmpList[i]
    course.index = i // 更新索引
    
    // 重新設置課程在時間表中的顏色
    const convertSessions = convertTimeToSession(course.course_detail)
    for (let j = 0; j < convertSessions.length; j++) {
      const convertTime = convertSessionToTime(convertSessions[j])
      const r = convertTime[0]
      const c = convertTime[1]
      
      // 更新時間表中對應格子的顏色
      for (let k = 0; k < bodyData.value[r][c].chip.length; k++) {
        if (bodyData.value[r][c].chip[k].courseID === course.courseID) {
          bodyData.value[r][c].chip[k].color = getColorTable()[course.index % 14]
        }
      }
    }
  }
  
  // 重新計算搜尋結果和選課列表
  if (searchInput.value || filterChips.value.length > 0) {
    searchCourse()
  }
  selectListMaker()
  
  console.log('顏色重新計算完成')
}

// 計算當前學年學期
const currentSemesterInfo = computed(() => {
  if (!courseData.data || courseData.data.length === 0) {
    return '資料載入中...'
  }
  
  // 從第一門課程獲取學年學期資訊
  const firstCourse = courseData.data[0]
  const year = firstCourse.year
  const semester = firstCourse.semester
  
  // 轉換學期數字為中文
  const semesterText = semester === '1' ? '上學期' : semester === '2' ? '下學期' : `第${semester}學期`
  
  return `${year}學年 ${semesterText}`
})

// 提供學年學期資訊給父組件
provide('semesterInfo', currentSemesterInfo)

// 取得適當的調色盤
const getColorTable = () => {
  return isDarkMode.value ? darkColorTable : colorTable
}

// 切換黑暗模式
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value.toString())
}

// 課程資料
const courseData = reactive({
  start_time: "載入中...",
  data: [],
  fliter_item: []
})

// 響應式資料
const searchInput = ref('')
const searchResult = ref('')
const searchList = ref([])

const filterChips = ref([])
const filterItems = ref([])
const selectedFilter = ref('')
const filterTime = [
  "週一上午", "週一下午", "週二上午", "週二下午", "週三上午", "週三下午",
  "週四上午", "週四下午", "週五上午", "週五下午", "週六上午", "週六下午",
  "週日上午", "週日下午"
]

const selectList = ref([])
const colorTable = [
  "#E6B0AA", "#FFE181", "#D2B4DE", "#A9CCE3", "#AED6F1", "#A3E4D7",
  "#A2D9CE", "#E2BDD6", "#A9DFBF", "#ABEBC6", "#F9E79F", "#FAD7A0",
  "#F5CBA7", "#EDBB99"
]

// 黑暗模式調色盤
const darkColorTable = [
  "#8B4B5C", "#B8860B", "#6B4C85", "#4682B4", "#5F9EA0", "#2E8B57",
  "#5A6B5D", "#8B5A82", "#4F7942", "#3E8E6B", "#9A7C3A", "#8B6914",
  "#8B5A42", "#8B6339"
]

const overlay = ref(false)
const overlayData = ref({
  year: "",
  semester: "",
  courseID: "",
  department: "",
  department_level: [],
  compulsory: [],
  title: { ch: "", en: "", limit: false, other: "" },
  teacher: [""],
  category: "",
  credit: "",
  hours: "",
  language: "",
  course_detail: [{ courseTime: 1, time_category: "", sessions: [], place: "", original: "" }],
  sign: "",
  sign_people: "",
  max_people: "",
  url: ""
})

const daysData = ["時間", "日", "一", "二", "三", "四", "五", "六"]
const bodyData = ref([])

// 計算屬性
const showCredit = computed(() => {
  const selectedCourses = selectList.value
  return selectedCourses.reduce((sum, course) => {
    const courseData = getCourseIDData(course.courseID)
    return sum + parseInt(courseData.credit || 0)
  }, 0)
})

const showHours = computed(() => {
  const selectedCourses = selectList.value
  return selectedCourses.reduce((sum, course) => {
    const courseData = getCourseIDData(course.courseID)
    return sum + parseInt(courseData.hours || 0)
  }, 0)
})

// 載入課程資料
const loadCourseData = async () => {
  try {
    const response = await fetch('/clawer/all_course_list.json')
    if (response.ok) {
      const data = await response.json()
      Object.assign(courseData, data)
      console.log('課程資料載入成功:', courseData.data.length, '門課程')
    } else {
      console.error('無法載入課程資料:', response.status)
    }
  } catch (error) {
    console.error('載入課程資料時發生錯誤:', error)
  }
}

// 新增篩選條件
const addFilter = () => {
  if (selectedFilter.value && !filterChips.value.includes(selectedFilter.value)) {
    filterChips.value.push(selectedFilter.value)
    selectedFilter.value = ''
  }
}

// 移除篩選條件
const filterRemove = (item) => {
  const index = filterChips.value.indexOf(item)
  if (index > -1) {
    filterChips.value.splice(index, 1)
  }
}

// 初始化課表
const initTable = () => {
  bodyData.value = []
  
  for (let i = 0; i < 11; i++) {
    const row = []
    for (let j = 0; j < 8; j++) {
      row.push({
        title: "",
        subtitle: "",
        chip: [],
        color: "white",
        show_title: false,
        show_chip: true
      })
    }
    
    // 中午時段設置淺灰色背景，不顯示任何文字
    if (i === 4) {
      for (let k = 1; k < 8; k++) { // 跳過第一欄（時間欄）
        row[k].color = "#f8f9fa" // 設置淺灰色背景
        row[k].show_chip = false // 不顯示任何內容
      }
    }
    
    row[0].show_title = true
    row[0].show_chip = false
    
    const timeTable = ["1", "2", "3", "4", "中午", "5", "6", "7", "8", "9", "晚上"]
    const timeTableTime = [
      "08:10 ~ 09:00", "09:10 ~ 10:00", "10:10 ~ 11:00", "11:10 ~ 12:00",
      "12:10 ~ 13:00", "13:10 ~ 14:00", "14:10 ~ 15:00", "15:10 ~ 16:00",
      "16:10 ~ 17:00", "17:10 ~ 18:00", "18:30 ~ 22:10"
    ]
    
    row[0].title = timeTable[i]
    row[0].subtitle = timeTableTime[i]
    bodyData.value.push(row)
  }
  
  // 載入已選課程
  const selectCourse = getCourseSelectStatus()
  for (let i = 0; i < selectCourse.length; i++) {
    const tmpCourseDetail = selectCourse[i].course_detail
    for (let j = 0; j < tmpCourseDetail.length; j++) {
      const tmpTime = tmpCourseDetail[j].courseTime
      const tmpSessions = tmpCourseDetail[j].sessions
      for (let k = 0; k < tmpSessions.length; k++) {
        let convertTime = -1
        let convertSessions = -1
        
        if (tmpTime === 7) {
          convertTime = 1  // 週日 -> 第1欄 (索引1)
        } else {
          convertTime = tmpTime + 1  // 週一~週六 -> 第2~7欄 (索引2-7)
        }
        
        if (tmpSessions[k] >= 1 && tmpSessions[k] <= 4) {
          convertSessions = tmpSessions[k] - 1
        } else if (tmpSessions[k] >= 5 && tmpSessions[k] <= 9) {
          convertSessions = tmpSessions[k]
        } else {
          convertSessions = 10
          k += 10
        }
        
        changeBodyChip(true, convertSessions, convertTime, {
          title: selectCourse[i].courseID + " " + selectCourse[i].title.ch,
          color: colorTable[selectCourse[i].index % 14],
          courseID: selectCourse[i].courseID,
          courseName: selectCourse[i].title.ch
        })
      }
    }
  }
}

// 修改課表格子
const changeBodyChip = (mode, r, c, chipData) => {
  if (mode) {
    bodyData.value[r][c].chip.push({
      title: chipData.title,
      color: chipData.color,
      courseID: chipData.courseID,
      courseName: chipData.courseName
    })
  } else {
    bodyData.value[r][c].chip = bodyData.value[r][c].chip.filter(
      chip => chip.courseID !== chipData.courseID
    )
  }
  bodyData.value[r][c].color = getTableCardColor(bodyData.value[r][c].chip)
}

// 取得課表格子顏色
const getTableCardColor = (chip) => {
  if (chip.length > 1) {
    return "red"
  }
  return "white"
}

// 搜尋課程
const searchCourse = () => {
  if (searchInput.value === "" && filterChips.value.length === 0) return
  if (!courseData.data || courseData.data.length === 0) return
  
  searchList.value = []
  let flag = 0
  
  for (let i = 0; i < courseData.data.length; i++) {
    searchResult.value = "找到 " + flag + " 門課程"
    if (flag >= 150) {
      searchResult.value = "找到 " + flag + "+ 筆資料，僅顯示前 " + flag + " 筆資料"
      return
    }
    
    const tmp = courseData.data[i]
    const tmpJson = [
      tmp.courseID,
      tmp.title.ch,
      tmp.title.en,
      tmp.teacher,
      tmp.department
    ]
    
    if (String(tmpJson).indexOf(searchInput.value) !== -1) {
      const filterFlag = verifySearchItem(tmp)
      if (filterFlag.result === true) {
        searchList.value.push({
          title: tmp.courseID + " " + tmp.title.ch,
          subtitle: tmp.teacher + " | 學分 / 時數: " + tmp.credit + " / " + tmp.hours,
          courseID: tmp.courseID,
          department: tmp.department,
          course_detail: tmp.course_detail,
          color: filterFlag.color
        })
        flag += 1
      }
    }
  }
  
  if (searchList.value.length === 0) {
    searchList.value.push({
      title: "404 Not Found!",
      subtitle: "Please change the key word and search again!",
      courseID: "0000",
      color: "orange"
    })
  }
}

// 驗證搜尋項目
const verifySearchItem = (item) => {
  return { result: true, color: "" }
}

// 取得課程選擇狀態圖標
const getStatusIcon = (ID) => {
  if (ID === "0000") {
    return { icon: "×", color: "red" }
  }
  
  const tmpList = getCourseSelectStatus()
  for (let i = 0; i < tmpList.length; i++) {
    if (tmpList[i].courseID === ID) {
      return { icon: "×", color: "red" }
    }
  }
  return { icon: "+", color: "blue" }
}

// 取得課程選擇狀態
const getCourseSelectStatus = () => {
  const stored = localStorage.getItem("SelectCourse")
  return stored ? JSON.parse(stored) : []
}

// 修改課程選擇狀態
const changeCourseSelectStatus = (ID) => {
  if (ID === "0000") return
  
  let tmpList = getCourseSelectStatus()
  const existingIndex = tmpList.findIndex(course => course.courseID === ID)
  const tmpData = getCourseIDData(ID)
  
  if (existingIndex !== -1) {
    // 移除課程
    tmpList.splice(existingIndex, 1)
    writeCourse(false, tmpData)
  } else {
    // 添加課程
    tmpData.index = tmpList.length
    tmpList.push(tmpData)
    writeCourse(true, tmpData)
  }
  
  localStorage.setItem("SelectCourse", JSON.stringify(tmpList))
  searchCourse()
  selectListMaker()
}

// 寫入課程到課表
const writeCourse = (mode, chipData) => {
  const detail = chipData.course_detail
  for (let i = 0; i < detail.length; i++) {
    const tmpTime = detail[i].courseTime
    const tmpSessions = detail[i].sessions
    for (let j = 0; j < tmpSessions.length; j++) {
      let convertTime = -1
      let convertSessions = -1
      
      if (tmpTime === 7) {
        convertTime = 1  // 週日 -> 第1欄 (索引1)
      } else {
        convertTime = tmpTime + 1  // 週一~週六 -> 第2~7欄 (索引2-7)
      }
      
      if (tmpSessions[j] >= 1 && tmpSessions[j] <= 4) {
        convertSessions = tmpSessions[j] - 1
      } else if (tmpSessions[j] >= 5 && tmpSessions[j] <= 9) {
        convertSessions = tmpSessions[j]
      } else {
        convertSessions = 10
        j += 10
      }
      
      changeBodyChip(mode, convertSessions, convertTime, {
        title: chipData.courseID + " " + chipData.title.ch,
        color: getColorTable()[chipData.index % 14],
        courseID: chipData.courseID,
        courseName: chipData.title.ch
      })
    }
  }
}

// 建立選課列表
const selectListMaker = () => {
  selectList.value = []
  const tmpList = getCourseSelectStatus()
  for (let i = 0; i < tmpList.length; i++) {
    selectList.value.push({
      title: tmpList[i].courseID + " " + tmpList[i].title.ch,
      subtitle: tmpList[i].teacher + " | 學分 / 時數: " + tmpList[i].credit + " / " + tmpList[i].hours,
      courseID: tmpList[i].courseID,
      department: tmpList[i].department,
      course_detail: tmpList[i].course_detail
    })
  }
}

// 重置所有資料
const resetAll = () => {
  localStorage.setItem("SelectCourse", JSON.stringify([]))
  selectListMaker()
  initTable()
}

// 取得課程資料
const getCourseIDData = (ID) => {
  for (let i = 0; i < courseData.data.length; i++) {
    if (courseData.data[i].courseID === ID) {
      return courseData.data[i]
    }
  }
  return {
    year: "", semester: "", courseID: ID, department: "",
    department_level: [], compulsory: [],
    title: { ch: "Error", en: "Cannot get data", limit: false, other: "" },
    teacher: [""], category: "", credit: "", hours: "", language: "",
    course_detail: [{ courseTime: 1, time_category: "", sessions: [], place: "", original: "" }],
    sign: "", sign_people: "", max_people: "", url: ""
  }
}

// 顯示課程詳細資訊
const showCourseDetail = (courseID) => {
  if (courseID === "0000" || courseID === "lunch-break") return
  overlayData.value = getCourseIDData(courseID)
  overlay.value = true
}

// 取得必修選修資訊
const getCompulsory = (course, departmentLevel) => {
  const flag = course.department_level.findIndex(dept => dept.original === departmentLevel)
  if (flag === -1) return "Error!"
  
  const compulsoryLen = course.compulsory.length
  if (flag >= compulsoryLen) {
    return course.compulsory[compulsoryLen - 1]
  }
  return course.compulsory[flag]
}

// 初始化
onMounted(async () => {
  if (!localStorage.getItem("SelectCourse")) {
    localStorage.setItem("SelectCourse", JSON.stringify([]))
  }
  
  // 載入課程資料
  await loadCourseData()
  
  // 初始化黑暗模式檢測（在資料載入後）
  checkDarkMode()
  observeDarkMode()
  
  // 初始化篩選項目
  filterItems.value = [...filterTime, ...courseData.fliter_item]
  
  selectListMaker()
  initTable()
  
  // 確保初始顏色正確
  setTimeout(() => {
    recalculateColors()
  }, 100)
})
</script>

<style scoped>
.home-container {
  padding: 0;
  background-color: transparent;
  min-height: calc(100vh - 120px);
}

/* 頂部導航欄 */
.top-navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 200;
}

.dark-mode .top-navbar {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.navbar-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-toggle {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

/* 警示橫幅樣式 */
.warning-banner {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  padding: 0.8rem 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.warning-content {
  font-weight: 500;
  font-size: 0.95rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Modal 樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-dialog {
  background: white;
  border-radius: 8px;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* 黑暗模式下的彈窗對話框 */
.dark-mode .modal-dialog {
  background: #2d3748 !important;
  border: 1px solid #4a5568 !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6) !important;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

/* 黑暗模式下的彈窗標題 */
.dark-mode .modal-header {
  border-bottom: 1px solid #4a5568 !important;
  color: #e2e8f0 !important;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
}

/* 黑暗模式下的彈窗關閉按鈕 */
.dark-mode .modal-close {
  color: #e2e8f0 !important;
}

.modal-body {
  padding: 1.5rem;
}

/* 黑暗模式下的彈窗內容 */
.dark-mode .modal-body {
  color: #e2e8f0 !important;
}

/* 黑暗模式下的彈窗內所有文字元素 */
.dark-mode .modal-body h2,
.dark-mode .modal-body h4,
.dark-mode .modal-body p,
.dark-mode .modal-body strong,
.dark-mode .course-title,
.dark-mode .course-info,
.dark-mode .course-time {
  color: #e2e8f0 !important;
}

.course-chips {
  margin-bottom: 1rem;
}

.chip {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  margin: 0.2rem;
  background: #e0e0e0;
  border-radius: 16px;
  font-size: 0.85rem;
}

/* 黑暗模式下的基本標籤 */
.dark-mode .chip {
  background: #4a5568 !important;
  color: #e2e8f0 !important;
}

.chip-green { background: #81c784; color: white; }
.chip-blue { background: #64b5f6; color: white; }

/* 黑暗模式下的標籤顏色 */
.dark-mode .chip-green { 
  background: #68b26f !important; 
  color: #000 !important; 
}
.dark-mode .chip-blue { 
  background: #5a9fd4 !important; 
  color: #000 !important; 
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

.course-actions {
  margin: 1rem 0;
}

.json-viewer {
  margin-top: 1rem;
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

/* 黑暗模式下的 JSON 檢視器 */
.dark-mode .json-viewer {
  border-top: 1px solid #4a5568 !important;
}

.dark-mode .json-viewer h4 {
  color: #e2e8f0 !important;
}

.json-content {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.8rem;
  max-height: 300px;
  overflow-y: auto;
}

/* 黑暗模式下的 JSON 內容 */
.dark-mode .json-content {
  background: #4a5568 !important;
  color: #e2e8f0 !important;
  border: 1px solid #666 !important;
}

/* 主布局 */
.main-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1rem;
  padding: 1rem;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timetable-container {
  min-height: 80vh;
}

/* 卡片樣式 */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 黑暗模式下的卡片 */
.dark-mode .card {
  background: #2d3748 !important;
  border: 1px solid #4a5568;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 黑暗模式下的卡片標題 */
.dark-mode .card-header {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%) !important;
  border-bottom: 1px solid #4a5568;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.card-body {
  padding: 1rem;
}

/* 黑暗模式下的卡片內容 */
.dark-mode .card-body {
  background: #2d3748 !important;
  color: #e2e8f0;
}

.credit-info {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
}

/* 搜尋表單 */
.search-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* 黑暗模式下的搜尋輸入框 */
.dark-mode .search-input {
  background: #4a5568 !important;
  border: 1px solid #666 !important;
  color: #e2e8f0 !important;
}

.dark-mode .search-input::placeholder {
  color: #a0a0a0 !important;
}

.filter-section {
  margin: 1rem 0;
}

.filter-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.filter-chips {
  margin: 0.5rem 0;
}

.chip-removable {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  margin: 0.2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.chip-removable button {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-weight: bold;
}

.filter-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* 黑暗模式下的過濾選擇器 */
.dark-mode .filter-select {
  background: #4a5568 !important;
  border: 1px solid #666 !important;
  color: #e2e8f0 !important;
}

.course-info-text {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #666;
}

/* 黑暗模式下的課程資訊文字 */
.dark-mode .course-info-text {
  color: #cbd5e0 !important;
}

/* 按鈕樣式 */
.btn {
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-primary { background: #2196f3; color: white; }

/* 黑暗模式下的主要按鈕 */
.dark-mode .btn-primary { 
  background: #1976d2 !important; 
  color: #e2e8f0 !important; 
}
.btn-primary:hover { background: #1976d2; }

.btn-info { background: #17a2b8; color: white; }

/* 黑暗模式下的資訊按鈕 */
.dark-mode .btn-info { 
  background: #138496 !important; 
  color: #e2e8f0 !important; 
}
.btn-info:hover { background: #138496; }

.btn-danger { background: #dc3545; color: white; }

/* 黑暗模式下的危險按鈕 */
.dark-mode .btn-danger { 
  background: #c82333 !important; 
  color: #e2e8f0 !important; 
}
.btn-danger:hover { background: #c82333; }

.btn-full { width: 100%; margin-top: 1rem; }

/* 課程項目 */
.search-results, .selected-courses {
  max-height: 400px;
  overflow-y: auto;
}

/* 黑暗模式下的搜尋結果和已選課程 */
.dark-mode .search-results,
.dark-mode .selected-courses {
  background: #2d3748 !important;
}

.course-item {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

/* 黑暗模式下的課程項目 */
.dark-mode .course-item {
  border-bottom: 1px solid #4a5568 !important;
  color: #e2e8f0 !important;
}

.course-item:hover {
  background-color: #f8f9fa;
}

/* 黑暗模式下的課程項目 hover */
.dark-mode .course-item:hover {
  background-color: #4a5568 !important;
}

.bg-orange { background-color: #fff3cd; }

/* 黑暗模式下的橘色背景 */
.dark-mode .bg-orange { 
  background-color: #744210 !important; 
  color: #fbb040 !important; 
}

.status-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
}

.status-btn.blue { background: #2196f3; color: white; }
.status-btn.red { background: #dc3545; color: white; }

/* 黑暗模式下的狀態按鈕 */
.dark-mode .status-btn.blue { 
  background: #1976d2 !important; 
  color: #e2e8f0 !important; 
}
.dark-mode .status-btn.red { 
  background: #c82333 !important; 
  color: #e2e8f0 !important; 
}

.course-content {
  flex: 1;
}

.course-title-text {
  font-weight: 500;
  margin-bottom: 0.3rem;
}

.course-subtitle {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.2rem;
}

/* 黑暗模式下的課程副標題 */
.dark-mode .course-subtitle {
  color: #cbd5e0 !important;
}

.course-detail {
  font-size: 0.8rem;
  color: #999;
}

/* 黑暗模式下的課程詳情 */
.dark-mode .course-detail {
  color: #a0aec0 !important;
}

.text-center { text-align: center; }

.support-text {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #666;
}

/* 黑暗模式下的支援文字 */
.dark-mode .support-text {
  color: #cbd5e0 !important;
}

/* 課表樣式 */
.timetable {
  overflow-x: auto;
}

.timetable-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

/* 黑暗模式下的課表 */
.dark-mode .timetable-table {
  border: 1px solid #4a5568;
  background: #2d3748;
}

.day-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.8rem;
  text-align: center;
  font-weight: 500;
}

/* 黑暗模式下的日期標題 */
.dark-mode .day-header {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%) !important;
  border: 1px solid #4a5568;
}

.time-cell {
  border: 1px solid #e0e0e0;
  padding: 0;
  vertical-align: top;
  width: 12.5%;
}

/* 黑暗模式下的時間格子 */
.dark-mode .time-cell {
  border: 1px solid #4a5568 !important;
  background: #2d3748 !important;
}

.cell-content {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.cell-content.conflict {
  background-color: #ffebee;
  border: 2px solid #f44336;
}

/* 黑暗模式下的衝突格子 */
.dark-mode .cell-content.conflict {
  background-color: #5d2a2a !important;
  border: 2px solid #ef5350 !important;
}

/* 黑暗模式下衝突格子中的課程籌碼 */
.dark-mode .cell-content.conflict .course-chip {
  background-color: #7d4f4f !important;
  color: #ffcccb !important;
  border: 1px solid #ef5350 !important;
}

/* 中午時段淺灰色背景 */
.time-cell:has(.cell-content[style*="background-color"]) {
  background-color: #f8f9fa;
}

.time-info {
  text-align: center;
}

.time-period {
  font-weight: 600;
  font-size: 1rem;
}

.time-range {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.2rem;
}

/* 黑暗模式下的時間範圍 */
.dark-mode .time-range {
  color: #cbd5e0 !important;
}

.course-chips-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  justify-content: center;
}

.course-chip {
  padding: 0.4rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s;
  max-width: 90px;
  overflow: hidden;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

/* 黑暗模式下的課程籌碼 */
.dark-mode .course-chip {
  color: #e2e8f0 !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid #4a5568 !important;
}

.course-id {
  font-size: 0.65rem;
  opacity: 0.8;
  font-weight: 500;
  line-height: 1;
}

/* 黑暗模式下的課程 ID */
.dark-mode .course-id {
  color: #cbd5e0 !important;
  opacity: 0.9 !important;
}

.course-name {
  font-size: 0.7rem;
  font-weight: 400;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 黑暗模式下的課程名稱 */
.dark-mode .course-name {
  color: #e2e8f0 !important;
}

.course-chip:hover {
  transform: scale(1.05);
}

/* 午休時段特殊樣式 */
.course-chip[style*="#f5f5f5"] {
  background-color: #f5f5f5 !important;
  color: #999;
  border: 1px dashed #ddd;
  cursor: default;
  font-style: italic;
}

/* 黑暗模式下的午休時段 */
.dark-mode .course-chip[style*="#f5f5f5"] {
  background-color: #4a5568 !important;
  color: #a0a0a0 !important;
  border: 1px dashed #666 !important;
}

.course-chip[style*="#f5f5f5"]:hover {
  transform: none;
}

/* 響應式設計 */
@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    order: 2;
  }
  
  .timetable-container {
    order: 1;
  }
}

@media (max-width: 768px) {
  .main-layout {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  
  .modal-dialog {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
  
  .search-form {
    flex-direction: column;
  }
  
  .timetable-table {
    font-size: 0.8rem;
  }
  
  .course-chip {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }
}

/* HomeView 黑暗模式樣式覆蓋 */
:deep(.dark-mode) .modal-close {
  color: #cbd5e0 !important;
}

:deep(.dark-mode) .course-info-text {
  color: #cbd5e0 !important;
}

:deep(.dark-mode) .course-info-text small {
  color: #e2e8f0 !important;
}

:deep(.dark-mode) .course-subtitle {
  color: #cbd5e0 !important;
}

:deep(.dark-mode) .course-detail {
  color: #a0aec0 !important;
}

:deep(.dark-mode) .support-text {
  color: #cbd5e0 !important;
}

:deep(.dark-mode) .time-range {
  color: #cbd5e0 !important;
}

:deep(.dark-mode) .chip {
  background: #4a5568 !important;
  color: #e2e8f0 !important;
}

:deep(.dark-mode) .chip-removable {
  background: #2b6cb0 !important;
  color: #e2e8f0 !important;
  border: 1px solid #4299e1 !important;
}

:deep(.dark-mode) .chip-removable button {
  color: #e2e8f0 !important;
}

/* 修復所有灰色文字 */
:deep(.dark-mode) * {
  color: inherit;
}

:deep(.dark-mode) .course-info-text,
:deep(.dark-mode) .course-subtitle,
:deep(.dark-mode) .course-detail,
:deep(.dark-mode) .support-text,
:deep(.dark-mode) .time-range {
  color: #cbd5e0 !important;
}

:deep(.dark-mode) .course-title-text {
  color: #f7fafc !important;
}

:deep(.dark-mode) p,
:deep(.dark-mode) small {
  color: #cbd5e0 !important;
}
</style>
