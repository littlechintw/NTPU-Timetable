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
              :href="courseInfoUrl"
              target="_blank"
            >
              課程資訊
            </a>
            <a
              class="btn btn-info"
              :href="googleSearchUrl"
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

    <!-- 課程異動通知：已選課程被下架或改內容時提醒使用者 -->
    <div v-if="changeNoticeVisible" class="modal-overlay" @click="changeNoticeVisible = false">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <h3>⚠️ 課程異動通知</h3>
          <button class="modal-close" @click="changeNoticeVisible = false">×</button>
        </div>

        <div class="modal-body">
          <p class="change-notice-intro">
            課程資料更新後，你原本已選的以下 {{ courseChangeNotices.length }} 門課程有異動，已自動從課表移除，請重新搜尋確認後再加入：
          </p>

          <div v-for="notice in courseChangeNotices" :key="notice.courseID" class="change-notice-item">
            <div class="change-notice-title">
              <span class="chip" :class="notice.type === 'removed' ? 'chip-removed' : 'chip-changed'">
                {{ notice.type === 'removed' ? '已停開／下架' : '內容異動' }}
              </span>
              <strong>{{ notice.courseID }} {{ notice.title }}</strong>
            </div>
            <div class="change-notice-diff">
              <div class="change-notice-before">異動前：{{ notice.before }}</div>
              <div v-if="notice.after" class="change-notice-after">異動後：{{ notice.after }}</div>
              <div v-else class="change-notice-after">此課程已從課程資料中移除，可能是停開或課號變動</div>
            </div>
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
              
              <!-- 已選擇的篩選條件顯示 -->
              <div class="selected-filters" v-if="hasActiveFilters">
                <div v-if="activeFilters.departments.length > 0" class="filter-category">
                  <span class="category-label">系所：</span>
                  <span 
                    v-for="dept in activeFilters.departments" 
                    :key="dept"
                    class="chip chip-removable chip-department"
                  >
                    {{ dept }}
                    <button @click="removeFilter('departments', dept)">×</button>
                  </span>
                </div>
                
                <div v-if="activeFilters.courseTypes.length > 0" class="filter-category">
                  <span class="category-label">性質：</span>
                  <span 
                    v-for="type in activeFilters.courseTypes" 
                    :key="type"
                    class="chip chip-removable chip-coursetype"
                  >
                    {{ type }}
                    <button @click="removeFilter('courseTypes', type)">×</button>
                  </span>
                </div>
                
                <div v-if="activeFilters.credits.length > 0" class="filter-category">
                  <span class="category-label">學分：</span>
                  <span 
                    v-for="credit in activeFilters.credits" 
                    :key="credit"
                    class="chip chip-removable chip-credit"
                  >
                    {{ credit }}{{ credit === '4+' ? '' : '學分' }}
                    <button @click="removeFilter('credits', credit)">×</button>
                  </span>
                </div>
                
                <div v-if="activeFilters.timeSlots.length > 0" class="filter-category">
                  <span class="category-label">時間：</span>
                  <span 
                    v-for="time in activeFilters.timeSlots" 
                    :key="time"
                    class="chip chip-removable chip-time"
                  >
                    {{ time.replace('週', '').replace('上午', '上').replace('下午', '下') }}
                    <button @click="removeFilter('timeSlots', time)">×</button>
                  </span>
                </div>
              </div>
              
              <!-- 篩選控制區域 -->
              <div class="filter-controls">
                <!-- 系所篩選：輸入文字即可從系所清單中篩選，選定或按 Enter 即加入篩選 -->
                <div class="filter-group">
                  <label class="filter-group-title">系所</label>
                  <input
                    v-model="departmentInput"
                    type="text"
                    list="department-options"
                    class="filter-select"
                    placeholder="輸入系所名稱搜尋..."
                    autocomplete="off"
                    @change="addDepartmentFilter"
                    @keyup.enter="addDepartmentFilter"
                  />
                  <datalist id="department-options">
                    <option v-for="dept in availableDepartments" :key="dept" :value="dept" />
                  </datalist>
                </div>
                
                <!-- 快速篩選按鈕 -->
                <div class="quick-filters">
                  <div class="filter-group">
                    <label class="filter-group-title">課程性質</label>
                    <div class="filter-buttons">
                      <button 
                        v-for="type in filterOptions.courseTypes"
                        :key="type"
                        class="filter-btn"
                        :class="{ active: activeFilters.courseTypes.includes(type) }"
                        @click="toggleCategoryFilter('courseTypes', type)"
                      >
                        {{ type }}
                      </button>
                    </div>
                  </div>
                  
                  <div class="filter-group">
                    <label class="filter-group-title">學分數</label>
                    <div class="filter-buttons">
                      <button 
                        v-for="credit in filterOptions.credits"
                        :key="credit"
                        class="filter-btn"
                        :class="{ active: activeFilters.credits.includes(credit) }"
                        @click="toggleCategoryFilter('credits', credit)"
                      >
                        {{ credit }}{{ credit === '4+' ? '' : '學分' }}
                      </button>
                    </div>
                  </div>
                  
                  <div class="filter-group">
                    <label class="filter-group-title">上課時間</label>
                    <div class="time-filter-grid">
                      <div class="time-day-group" v-for="day in 7" :key="day">
                        <div class="time-day-label">
                          {{ ['一', '二', '三', '四', '五', '六', '日'][day - 1] }}
                        </div>
                        <div class="time-period-buttons">
                          <button 
                            class="time-btn"
                            :class="{ active: activeFilters.timeSlots.includes(getTimeSlot(day, 'morning')) }"
                            @click="toggleCategoryFilter('timeSlots', getTimeSlot(day, 'morning'))"
                          >
                            上午
                          </button>
                          <button 
                            class="time-btn"
                            :class="{ active: activeFilters.timeSlots.includes(getTimeSlot(day, 'afternoon')) }"
                            @click="toggleCategoryFilter('timeSlots', getTimeSlot(day, 'afternoon'))"
                          >
                            下午
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="filter-actions">
                  <button 
                    v-if="hasActiveFilters"
                    class="btn btn-outline" 
                    @click="clearAllFilters"
                  >
                    清除所有篩選
                  </button>
                </div>
              </div>
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
              href="https://github.com/littlechintw/NTPU-Timetable/blob/main/docs/USAGE.md"
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
            <span class="mobile-scroll-hint">← 左右滑動 →</span>
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
import { ref, reactive, onMounted, computed, provide, inject, watch } from 'vue'

// 黑暗模式（由 App.vue 提供並統一管理，這裡只讀取／共用同一份狀態）
const isDarkMode = inject('isDarkMode', ref(false))

// 重新計算課程顏色（用於黑暗模式切換）：直接以目前的調色盤重建課表，
// 比逐格修補顏色更不容易出錯，且效能影響可忽略（已選課程數量很少）
const recalculateColors = () => {
  initTable()

  if (searchInput.value || hasActiveFilters.value) {
    searchCourse()
  }
  selectListMaker()
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

const filterTime = [
  "週一上午", "週一下午", "週二上午", "週二下午", "週三上午", "週三下午",
  "週四上午", "週四下午", "週五上午", "週五下午", "週六上午", "週六下午",
  "週日上午", "週日下午"
]

// 新的分類篩選系統
const activeFilters = ref({
  departments: [],     // 系所篩選 (OR 關係)
  courseTypes: [],     // 必選修篩選 (OR 關係) 
  credits: [],         // 學分數篩選 (OR 關係)
  timeSlots: []        // 時間篩選 (OR 關係)
})

// 篩選選項
const filterOptions = ref({
  departments: [],
  courseTypes: ['必修', '選修'],
  credits: ['1', '2', '3', '4+'],
  timeSlots: filterTime
})

// 額外的篩選相關變數
const departmentInput = ref('')

// 計算屬性
const hasActiveFilters = computed(() => {
  return activeFilters.value.departments.length > 0 ||
         activeFilters.value.courseTypes.length > 0 ||
         activeFilters.value.credits.length > 0 ||
         activeFilters.value.timeSlots.length > 0
})

const availableDepartments = computed(() => {
  // 從 department_level 的 original 中提取選項
  const departments = new Set()
  
  if (courseData.data && courseData.data.length > 0) {
    courseData.data.forEach(course => {
      if (course.department_level && course.department_level.length > 0) {
        course.department_level.forEach(level => {
          if (level.original) {
            departments.add(level.original)
          }
        })
      }
    })
  }
  
  return Array.from(departments).sort()
})

// 輔助函數：產生時間篩選字串
const getTimeSlot = (day, period) => {
  const days = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']
  const periods = { morning: '上午', afternoon: '下午' }
  return `${days[day - 1]}${periods[period]}`
}

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

// 課程資訊/搜尋連結：課程資料含使用者無法控制的特殊字元（& # 空白等），需編碼避免產生錯誤的網址
const courseInfoUrl = computed(() => {
  const d = overlayData.value
  const params = new URLSearchParams({
    g_serial: d.courseID,
    g_year: d.year,
    g_term: d.semester,
    show_info: 'all'
  })
  return `https://sea.cc.ntpu.edu.tw/pls/dev_stud/course_query.queryGuide?${params.toString()}`
})

const googleSearchUrl = computed(() => {
  const d = overlayData.value
  const query = `${d.title?.ch || ''} ${d.teacher?.join(' ') || ''} 課程`
  return `https://google.com/search?q=${encodeURIComponent(query)}`
})

// 課程異動通知：已選課程若在新抓取的資料中被移除或內容變動，會被移出課表並列在這裡告知使用者
const changeNoticeVisible = ref(false)
const courseChangeNotices = ref([])

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
    } else {
      console.error('無法載入課程資料:', response.status)
    }
  } catch (error) {
    console.error('載入課程資料時發生錯誤:', error)
  }
}

// 新增篩選條件：輸入的文字須完全符合系所清單中的一個選項才會加入（避免打錯字或打到一半就套用篩選）
const addDepartmentFilter = () => {
  const value = departmentInput.value.trim()
  if (value && availableDepartments.value.includes(value) && !activeFilters.value.departments.includes(value)) {
    activeFilters.value.departments.push(value)
    searchCourse()
  }
  departmentInput.value = ''
}

// 切換分類篩選條件
const toggleCategoryFilter = (category, value) => {
  const index = activeFilters.value[category].indexOf(value)
  if (index > -1) {
    activeFilters.value[category].splice(index, 1)
  } else {
    activeFilters.value[category].push(value)
  }
  searchCourse()
}

// 移除單個篩選條件
const removeFilter = (category, value) => {
  const index = activeFilters.value[category].indexOf(value)
  if (index > -1) {
    activeFilters.value[category].splice(index, 1)
    searchCourse()
  }
}

// 清除所有篩選條件
const clearAllFilters = () => {
  activeFilters.value.departments = []
  activeFilters.value.courseTypes = []
  activeFilters.value.credits = []
  activeFilters.value.timeSlots = []
  
  if (searchInput.value) {
    searchCourse()
  } else {
    searchList.value = []
    searchResult.value = ''
  }
}

// 部分課程時間尚未確定（例如 courseTime/sessions 為 "N/A"），無法排入課表，須先過濾掉
const isValidCourseDetail = (detail) => {
  return typeof detail.courseTime === 'number' && Array.isArray(detail.sessions)
}

// 將「星期、節次」轉換成課表格子的 [row, col]
const convertTimeToCell = (courseTime, session) => {
  const col = courseTime === 7 ? 1 : courseTime + 1 // 週日 -> 第1欄；週一~週六 -> 第2~7欄
  let row = 10 // 超出範圍的場次（例如延伸的晚間課程）一律併入「晚上」那一格
  if (session >= 1 && session <= 4) {
    row = session - 1
  } else if (session >= 5 && session <= 9) {
    row = session
  }
  return { row, col }
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
      if (!isValidCourseDetail(tmpCourseDetail[j])) continue // 課程時間未定，無法排入課表

      const tmpTime = tmpCourseDetail[j].courseTime
      const tmpSessions = tmpCourseDetail[j].sessions
      for (let k = 0; k < tmpSessions.length; k++) {
        const { row, col } = convertTimeToCell(tmpTime, tmpSessions[k])

        changeBodyChip(true, row, col, {
          title: selectCourse[i].courseID + " " + selectCourse[i].title.ch,
          color: getColorTable()[selectCourse[i].index % 14],
          courseID: selectCourse[i].courseID,
          courseName: selectCourse[i].title.ch
        })

        if (row === 10) break // 晚上場次已併成一格，不需重複記錄
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
  // 清空之前的搜尋結果
  searchList.value = []
  searchResult.value = ''
  
  if (searchInput.value === "" && !hasActiveFilters.value) {
    return
  }
  if (!courseData.data || courseData.data.length === 0) return
  
  let flag = 0
  const maxResults = 150
  const selectedCourses = getCourseSelectStatus() // 只讀取一次 localStorage，避免在迴圈中對每個候選課程重複解析

  for (let i = 0; i < courseData.data.length; i++) {
    if (flag >= maxResults) {
      searchResult.value = `找到 ${flag}+ 筆資料，僅顯示前 ${maxResults} 筆資料`
      break
    }
    
    const tmp = courseData.data[i]
    
    // 檢查搜尋關鍵字
    let keywordMatch = true
    if (searchInput.value.trim() !== "") {
      const tmpJson = [
        tmp.courseID,
        tmp.title.ch,
        tmp.title.en,
        tmp.teacher.join(' '),
        tmp.department
      ]
      keywordMatch = String(tmpJson).toLowerCase().indexOf(searchInput.value.toLowerCase()) !== -1
    }
    
    if (keywordMatch) {
      const filterFlag = verifySearchItem(tmp, selectedCourses)
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
  
  // 更新搜尋結果提示
  if (flag === 0) {
    searchResult.value = "沒有找到符合條件的課程"
    searchList.value = [{
      title: "404 Not Found!",
      subtitle: "請修改搜尋條件或篩選條件後重試",
      courseID: "0000",
      color: "orange"
    }]
  } else {
    const activeFilterCount = Object.values(activeFilters.value).reduce((total, arr) => total + arr.length, 0)
    const filterText = activeFilterCount > 0 ? ` (已套用 ${activeFilterCount} 個篩選條件)` : ''
    searchResult.value = `找到 ${flag} 門課程${filterText}`
  }
}

// 驗證搜尋項目 - 新的篩選邏輯 (同類 OR，不同類 AND)
// 注意：時間衝突一律要檢查（不論是否有套用篩選條件），才能正確標示紅色衝突提示
const verifySearchItem = (item, selectedCourses) => {
  // 檢查系所篩選 (OR 關係)
  if (activeFilters.value.departments.length > 0) {
    const departmentMatch = activeFilters.value.departments.some(dept => {
      // 檢查 department_level 中的 original
      if (item.department_level && item.department_level.length > 0) {
        return item.department_level.some(level => 
          level.original && level.original === dept
        )
      }
      return false
    })
    if (!departmentMatch) return { result: false, color: "" }
  }
  
  // 檢查必選修篩選 (OR 關係)  
  if (activeFilters.value.courseTypes.length > 0) {
    const courseTypeMatch = activeFilters.value.courseTypes.some(type => {
      // 檢查 item 的必選修資訊
      if (item.compulsory && item.compulsory.length > 0) {
        return item.compulsory.some(comp => {
          // 將篩選條件轉換為對應的簡寫形式
          if (type === '必修' && comp === '必') return true
          if (type === '選修' && comp === '選') return true
          return false
        })
      }
      return false
    })
    if (!courseTypeMatch) return { result: false, color: "" }
  }
  
  // 檢查學分數篩選 (OR 關係)
  if (activeFilters.value.credits.length > 0) {
    const courseCredits = item.credit ? parseInt(item.credit) : 0
    const creditMatch = activeFilters.value.credits.some(creditRange => {
      if (creditRange === '1') return courseCredits === 1
      if (creditRange === '2') return courseCredits === 2
      if (creditRange === '3') return courseCredits === 3
      if (creditRange === '4+') return courseCredits >= 4
      return false
    })
    if (!creditMatch) return { result: false, color: "" }
  }
  
  // 檢查時間篩選 (OR 關係)
  if (activeFilters.value.timeSlots.length > 0) {
    const timeMatch = activeFilters.value.timeSlots.some(timeSlot => 
      checkTimeFilter(item, timeSlot)
    )
    if (!timeMatch) return { result: false, color: "" }
  }

  // 檢查時間衝突（所有篩選條件都通過後，一律檢查）
  let hasConflict = false
  for (const selectedCourse of selectedCourses) {
    if (hasTimeConflict(item, selectedCourse)) {
      hasConflict = true
      break
    }
  }

  return { result: true, color: hasConflict ? "red" : "" }
}

// 檢查時間篩選
const checkTimeFilter = (course, timeFilter) => {
  const timeMapping = {
    "週一上午": { day: 1, sessions: [1, 2, 3, 4] },
    "週一下午": { day: 1, sessions: [5, 6, 7, 8, 9] },
    "週二上午": { day: 2, sessions: [1, 2, 3, 4] },
    "週二下午": { day: 2, sessions: [5, 6, 7, 8, 9] },
    "週三上午": { day: 3, sessions: [1, 2, 3, 4] },
    "週三下午": { day: 3, sessions: [5, 6, 7, 8, 9] },
    "週四上午": { day: 4, sessions: [1, 2, 3, 4] },
    "週四下午": { day: 4, sessions: [5, 6, 7, 8, 9] },
    "週五上午": { day: 5, sessions: [1, 2, 3, 4] },
    "週五下午": { day: 5, sessions: [5, 6, 7, 8, 9] },
    "週六上午": { day: 6, sessions: [1, 2, 3, 4] },
    "週六下午": { day: 6, sessions: [5, 6, 7, 8, 9] },
    "週日上午": { day: 7, sessions: [1, 2, 3, 4] },
    "週日下午": { day: 7, sessions: [5, 6, 7, 8, 9] }
  }
  
  const filter = timeMapping[timeFilter]
  if (!filter) return false
  
  for (const detail of course.course_detail) {
    if (detail.courseTime === filter.day && isValidCourseDetail(detail)) {
      // 檢查是否有任何時段重疊
      const hasOverlap = detail.sessions.some(session => filter.sessions.includes(session))
      if (hasOverlap) return true
    }
  }
  return false
}

// 檢查時間衝突
const hasTimeConflict = (course1, course2) => {
  for (const detail1 of course1.course_detail) {
    if (!isValidCourseDetail(detail1)) continue // 課程時間未定，無法比較是否衝突
    for (const detail2 of course2.course_detail) {
      if (!isValidCourseDetail(detail2)) continue
      if (detail1.courseTime === detail2.courseTime) {
        // 檢查時段是否有重疊
        const hasOverlap = detail1.sessions.some(session => detail2.sessions.includes(session))
        if (hasOverlap) return true
      }
    }
  }
  return false
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
    // 重新分配索引
    tmpList.forEach((course, index) => {
      course.index = index
    })
    writeCourse(false, tmpData)
  } else {
    // 添加課程
    tmpData.index = tmpList.length
    tmpList.push(tmpData)
    writeCourse(true, tmpData)
  }
  
  localStorage.setItem("SelectCourse", JSON.stringify(tmpList))
  
  // 強制更新已選課程列表
  selectListMaker()
  
  // 更新搜尋結果（重新計算顏色和衝突狀態）
  searchCourse()
}

// 寫入課程到課表
const writeCourse = (mode, chipData) => {
  const detail = chipData.course_detail
  for (let i = 0; i < detail.length; i++) {
    if (!isValidCourseDetail(detail[i])) continue // 課程時間未定，無法排入課表

    const tmpTime = detail[i].courseTime
    const tmpSessions = detail[i].sessions
    for (let j = 0; j < tmpSessions.length; j++) {
      const { row, col } = convertTimeToCell(tmpTime, tmpSessions[j])

      changeBodyChip(mode, row, col, {
        title: chipData.courseID + " " + chipData.title.ch,
        color: getColorTable()[chipData.index % 14],
        courseID: chipData.courseID,
        courseName: chipData.title.ch
      })

      if (row === 10) break // 晚上場次已併成一格，不需重複記錄
    }
  }
}

// 建立選課列表
const selectListMaker = () => {
  // 清空現有列表
  selectList.value.splice(0)
  
  const tmpList = getCourseSelectStatus()

  for (let i = 0; i < tmpList.length; i++) {
    const courseItem = {
      title: tmpList[i].courseID + " " + tmpList[i].title.ch,
      subtitle: tmpList[i].teacher + " | 學分 / 時數: " + tmpList[i].credit + " / " + tmpList[i].hours,
      courseID: tmpList[i].courseID,
      department: tmpList[i].department,
      course_detail: tmpList[i].course_detail
    }
    selectList.value.push(courseItem)
  }
}

// 重置所有資料
const resetAll = () => {
  localStorage.setItem("SelectCourse", JSON.stringify([]))
  selectListMaker()
  initTable()
}

// 課程編號 -> 課程資料的索引，避免每次查詢都線性掃過全部課程（目前約 2500+ 筆）
const courseIndexByID = computed(() => {
  const map = new Map()
  for (const course of courseData.data) {
    map.set(course.courseID, course)
  }
  return map
})

// 取得課程資料
const getCourseIDData = (ID) => {
  const course = courseIndexByID.value.get(ID)
  if (course) return course

  return {
    year: "", semester: "", courseID: ID, department: "",
    department_level: [], compulsory: [],
    title: { ch: "Error", en: "Cannot get data", limit: false, other: "" },
    teacher: [""], category: "", credit: "", hours: "", language: "",
    course_detail: [{ courseTime: 1, time_category: "", sessions: [], place: "", original: "" }],
    sign: "", sign_people: "", max_people: "", url: ""
  }
}

// 課程內容的簽章：用來判斷課程從上次選課到現在，學年期／時間／學分／時數／教師／名稱是否有變動。
// 一定要比對學年期：課號在不同學期可能被重新編給完全不同的課程，光比對其他欄位可能剛好都相同而漏判。
const courseSignature = (course) => JSON.stringify({
  year: course.year,
  semester: course.semester,
  title: course.title?.ch,
  teacher: course.teacher,
  credit: course.credit,
  hours: course.hours,
  detail: (course.course_detail || []).map(d => d.original)
})

// 把課程摘要成一行文字，用於異動通知的「異動前 / 異動後」對照
const summarizeCourseForNotice = (course) => {
  if (!course) return '（查無資料）'
  const teacher = Array.isArray(course.teacher) ? course.teacher.join('、') : course.teacher
  const times = (course.course_detail || [])
    .filter(isValidCourseDetail)
    .map(d => d.original?.replace(/\t/g, ' '))
    .join('；')
  const semesterText = String(course.semester) === '1' ? '上學期' : String(course.semester) === '2' ? '下學期' : `第${course.semester}學期`
  const term = course.year ? `${course.year} 學年 ${semesterText} | ` : ''
  return `${term}${teacher || '教師未定'} | ${course.credit ?? '?'} 學分 / ${course.hours ?? '?'} 時數 | ${times || '時間未定'}`
}

// 比對已選課程與最新抓取的課程資料：課程被下架或內容變動時，從課表移除並記錄下來告知使用者
const reconcileSelectedCourses = () => {
  const stored = getCourseSelectStatus()
  if (stored.length === 0) return

  const notices = []
  const kept = []

  for (const oldCourse of stored) {
    const fresh = courseIndexByID.value.get(oldCourse.courseID)

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

  if (notices.length === 0) return

  kept.forEach((course, i) => { course.index = i })
  localStorage.setItem("SelectCourse", JSON.stringify(kept))
  courseChangeNotices.value = notices
  changeNoticeVisible.value = true
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

  // 課程資料是定期重新抓取的，先確認已選課程沒有被下架或改時間，有的話會被移出並記錄下來
  reconcileSelectedCourses()

  selectListMaker()
  initTable()
})

// 黑暗模式切換時，以正確的調色盤重建課表
watch(isDarkMode, () => {
  recalculateColors()
})
</script>

<style scoped>
.home-container {
  padding: 0;
  background-color: transparent;
  min-height: calc(100vh - 120px);
}

/* 警示橫幅樣式：低調的提醒色，不用飽和漸層搶走版面焦點 */
.warning-banner {
  background: var(--warning-bg);
  color: var(--warning-text);
  padding: 0.35rem var(--container-pad);
  text-align: center;
  border-bottom: 1px solid var(--warning-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.warning-content {
  font-weight: 500;
  font-size: 0.8rem;
  max-width: var(--container-max);
  margin: 0 auto;
}

/* 黑暗模式下的警示橫幅（用 !important 蓋過 App.vue 全域的 div 文字顏色規則） */
.dark-mode .warning-banner {
  background: #3a2f12 !important;
  border-bottom: 1px solid #5c4a1a !important;
}

.dark-mode .warning-content {
  color: #f0d78c !important;
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
  border-radius: var(--radius-lg);
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
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
  font-size: 1.6rem;
  line-height: 1;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #333;
}

/* 黑暗模式下的彈窗關閉按鈕 */
.dark-mode .modal-close {
  color: #e2e8f0 !important;
}

.dark-mode .modal-close:hover {
  background: rgba(255, 255, 255, 0.08) !important;
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

/* 課程異動通知 */
.change-notice-intro {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.change-notice-item {
  padding: 0.8rem;
  margin-bottom: 0.8rem;
  border-radius: var(--radius-sm);
  border: 1px solid #eee;
  background: #fafafa;
}

.dark-mode .change-notice-item {
  border: 1px solid #4a5568 !important;
  background: #333c4d !important;
}

.change-notice-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.chip-removed {
  background: #fdecea !important;
  color: var(--danger-strong) !important;
  border: 1px solid #f5b6ae;
}

.dark-mode .chip-removed {
  background: #5d2a2a !important;
  color: #ffcdd2 !important;
}

.chip-changed {
  background: var(--warning-bg) !important;
  color: var(--warning-text) !important;
  border: 1px solid var(--warning-border);
}

.dark-mode .chip-changed {
  background: #3a2f12 !important;
  color: #f0d78c !important;
}

.change-notice-diff {
  font-size: 0.85rem;
  line-height: 1.6;
  color: #555;
}

.dark-mode .change-notice-diff {
  color: #cbd5e0 !important;
}

.change-notice-before {
  text-decoration: line-through;
  opacity: 0.75;
}

.change-notice-after {
  color: var(--brand-2);
  font-weight: 500;
}

.dark-mode .change-notice-after {
  color: #c9c2f0 !important;
}

/* 主布局 */
.main-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.25rem;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 1.25rem var(--container-pad);
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timetable-container {
  min-height: 80vh;
  max-width: 100%;
  overflow: hidden; /* 防止容器本身產生滾動條 */
}

/* 確保卡片內容的 padding 對稱 */
.timetable-container .card-body {
  padding: 1rem;
}

/* 卡片樣式 */
.card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.05);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

/* 黑暗模式下的卡片 */
.dark-mode .card {
  background: #2d3748 !important;
  border: 1px solid #4a5568;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.card-header {
  background: var(--brand-tint);
  color: var(--brand-2);
  padding: 0.8rem 1.1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--brand-tint-strong);
}

/* 黑暗模式下的卡片標題 */
.dark-mode .card-header {
  background: rgba(108, 99, 214, 0.12) !important;
  color: #c9c2f0 !important;
  border-bottom: 1px solid #4a5568;
}

.card-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
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

/* 手機滑動提示 */
.mobile-scroll-hint {
  background: var(--brand-tint-strong);
  color: var(--brand-2);
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  display: none; /* 預設隱藏 */
}

.dark-mode .mobile-scroll-hint {
  background: rgba(108, 99, 214, 0.22) !important;
  color: #d8d3f5 !important;
}

@media (max-width: 768px) {
  .mobile-scroll-hint {
    display: inline-block; /* 只在手機上顯示 */
  }
}

/* 搜尋表單 */
.search-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--brand-1);
  box-shadow: 0 0 0 3px var(--brand-ring);
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
  min-height: 2rem;
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
  font-size: 0.85rem;
}

/* 黑暗模式下的可移除標籤 */
.dark-mode .chip-removable {
  background: #2b6cb0 !important;
  color: #e2e8f0 !important;
  border: 1px solid #4299e1 !important;
}

.chip-removable button {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-weight: bold;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.dark-mode .chip-removable button {
  color: #e2e8f0 !important;
}

.chip-removable button:hover {
  background: rgba(0, 0, 0, 0.1);
}

.dark-mode .chip-removable button:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.quick-filters {
  margin: 1rem 0;
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-group-title {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #666;
}

.dark-mode .filter-group-title {
  color: #cbd5e0 !important;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.filter-btn {
  padding: 0.4rem 0.8rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
  color: #333;
}

.dark-mode .filter-btn {
  background: #4a5568 !important;
  border: 1px solid #666 !important;
  color: #e2e8f0 !important;
}

.filter-btn:hover {
  background: #e0e0e0;
  border-color: #bbb;
}

.dark-mode .filter-btn:hover {
  background: #5a6578 !important;
  border-color: #777 !important;
}

.filter-btn.active {
  background: var(--brand-1);
  color: white;
  border-color: var(--brand-1);
}

.dark-mode .filter-btn.active {
  background: var(--brand-1) !important;
  color: #f7fafc !important;
  border-color: var(--brand-1) !important;
}

/* 新的篩選系統樣式 */
.selected-filters {
  margin: 1rem 0;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: var(--radius-sm);
  border: 1px solid #e0e0e0;
}

.dark-mode .selected-filters {
  background: #2d3748 !important;
  border: 1px solid #4a5568 !important;
}

.filter-category {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  gap: 0.3rem;
}

.filter-category:last-child {
  margin-bottom: 0;
}

.category-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #666;
  min-width: 50px;
  margin-right: 0.5rem;
}

.dark-mode .category-label {
  color: #a0aec0 !important;
}

/* 不同類型的篩選標籤顏色 */
.chip-department {
  background: #e8f5e8 !important;
  color: #2e7d32 !important;
  border: 1px solid #4caf50;
}

.dark-mode .chip-department {
  background: #1b5e20 !important;
  color: #c8e6c9 !important;
}

.chip-coursetype {
  background: #fff3e0 !important;
  color: #ef6c00 !important;
  border: 1px solid #ff9800;
}

.dark-mode .chip-coursetype {
  background: #e65100 !important;
  color: #ffcc02 !important;
}

.chip-grade {
  background: #f3e5f5 !important;
  color: #7b1fa2 !important;
  border: 1px solid #9c27b0;
}

.dark-mode .chip-grade {
  background: #4a148c !important;
  color: #e1bee7 !important;
}

.chip-credit {
  background: #e0f2f1 !important;
  color: #00695c !important;
  border: 1px solid #009688;
}

.dark-mode .chip-credit {
  background: #004d40 !important;
  color: #b2dfdb !important;
}

.chip-time {
  background: #e1f5fe !important;
  color: #0277bd !important;
  border: 1px solid #03a9f4;
}

.dark-mode .chip-time {
  background: #01579b !important;
  color: #b3e5fc !important;
}

.filter-controls {
  margin: 1rem 0;
}

.filter-select {
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  background: white;
}

.filter-select:focus {
  outline: none;
  border-color: var(--brand-1);
  box-shadow: 0 0 0 3px var(--brand-ring);
}

.dark-mode .filter-select {
  background: #2d3748 !important;
  border: 1px solid #4a5568 !important;
  color: #e2e8f0 !important;
}

/* 時間篩選格子樣式 */
.time-filter-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.time-day-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.time-day-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #666;
  text-align: center;
}

.dark-mode .time-day-label {
  color: #a0aec0 !important;
}

.time-period-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 100%;
}

.time-btn {
  padding: 0.3rem 0.5rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
  color: #333;
  text-align: center;
  width: 100%;
}

.dark-mode .time-btn {
  background: #4a5568 !important;
  border: 1px solid #666 !important;
  color: #e2e8f0 !important;
}

.time-btn:hover {
  background: #e0e0e0;
  border-color: #bbb;
}

.dark-mode .time-btn:hover {
  background: #5a6578 !important;
  border-color: #777 !important;
}

.time-btn.active {
  background: var(--brand-1);
  color: white;
  border-color: var(--brand-1);
}

.dark-mode .time-btn.active {
  background: var(--brand-1) !important;
  color: #f7fafc !important;
  border-color: var(--brand-1) !important;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-outline {
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.dark-mode .btn-outline {
  color: #cbd5e0 !important;
  border: 1px solid #666 !important;
}

.btn-outline:hover {
  background: #f5f5f5;
}

.dark-mode .btn-outline:hover {
  background: #4a5568 !important;
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
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary { background: var(--brand-1); color: white; }

/* 黑暗模式下的主要按鈕 */
.dark-mode .btn-primary {
  background: var(--brand-1) !important;
  color: #f7fafc !important;
}
.btn-primary:hover { filter: brightness(1.1); box-shadow: var(--shadow-sm); }

.btn-info { background: #17a2b8; color: white; }

/* 黑暗模式下的資訊按鈕 */
.dark-mode .btn-info {
  background: #138496 !important;
  color: #e2e8f0 !important;
}
.btn-info:hover { background: #138496; }

.btn-danger { background: var(--danger); color: white; }

/* 黑暗模式下的危險按鈕 */
.dark-mode .btn-danger {
  background: var(--danger-strong) !important;
  color: #e2e8f0 !important;
}
.btn-danger:hover { background: var(--danger-strong); }

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

/* 與已選課程時間衝突的搜尋結果：柔和的紅色提示，呼應課表上的衝突樣式 */
.bg-red {
  background-color: #ffebee;
  border-left: 3px solid #f44336;
}

.dark-mode .bg-red {
  background-color: #5d2a2a !important;
  border-left: 3px solid #ef5350 !important;
  color: #ffcdd2 !important;
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
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.status-btn:hover {
  transform: scale(1.08);
  box-shadow: var(--shadow-sm);
}

.status-btn.blue { background: var(--brand-1); color: white; }
.status-btn.red { background: var(--danger); color: white; }

/* 黑暗模式下的狀態按鈕 */
.dark-mode .status-btn.blue {
  background: var(--brand-1) !important;
  color: #f7fafc !important;
}
.dark-mode .status-btn.red {
  background: var(--danger-strong) !important;
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
  -webkit-overflow-scrolling: touch; /* iOS 滑動優化 */
  border-radius: var(--radius-md);
  max-width: 100%;
  box-shadow: 0 0 0 1px #e0e0e0; /* 使用 box-shadow 作為外框 */
}

.timetable-table {
  width: 100%;
  border-collapse: collapse; /* 改回 collapse 以統一處理邊框 */
  min-width: 800px;
  table-layout: fixed;
  border: none; /* 移除表格本身的邊框 */
}

/* 黑暗模式下的課表 */
.dark-mode .timetable {
  box-shadow: 0 0 0 1px #4a5568; /* 使用 box-shadow 作為外框 */
}

.dark-mode .timetable-table {
  background: #2d3748;
}

/* 課表標頭改用素色，讓真正需要辨識的課程色塊當視覺焦點，標頭不再搶戲 */
.day-header {
  background: #f8f9fc;
  color: #3a3f52;
  padding: 0.8rem;
  text-align: center;
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  border-bottom: 2px solid var(--brand-tint-strong);
}

/* 時間欄標題特殊樣式 */
.day-header:first-child {
  background: #eef0f6;
  color: #6b7280;
  font-weight: 600;
}

/* 黑暗模式下的日期標題 */
.dark-mode .day-header {
  background: #232735 !important;
  color: #e2e8f0 !important;
  border-bottom: 2px solid rgba(108, 99, 214, 0.3) !important;
}

.dark-mode .day-header:first-child {
  background: #1a1d29 !important;
  color: #9aa1b5 !important;
}

.time-cell {
  border: none; /* 完全移除邊框 */
  padding: 0;
  vertical-align: top;
  width: 12.5%;
  border-bottom: 1px solid #e0e0e0; /* 只保留底邊框作為水平分隔 */
}

/* 時間欄（第一欄）特殊背景 */
.time-cell:first-child {
  background-color: #f8f9fa;
}

/* 黑暗模式下的時間格子 */
.dark-mode .time-cell {
  background: #2d3748 !important;
  border-bottom: 1px solid #4a5568 !important;
}

.dark-mode .time-cell:first-child {
  background-color: #1a202c !important;
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
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  max-width: 90px;
  overflow: hidden;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
}

/* 黑暗模式下的課程籌碼：只調整文字/邊框，背景維持各課程自己的顏色（見 darkColorTable），
   之前這裡用 !important 蓋掉背景色，導致深色模式下所有課程籌碼都變成同一種顏色，失去辨識度 */
.dark-mode .course-chip {
  color: #e2e8f0 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
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
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.22);
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
  
  /* 課表手機版優化 */
  .timetable {
    border-radius: 4px;
    margin: 0; /* 移除負邊距以確保對稱 */
  }
  
  .timetable-table {
    font-size: 0.8rem;
    min-width: 700px; /* 稍微減少最小寬度 */
  }
  
  .course-chip {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
    max-width: 80px; /* 減少課程籌碼寬度 */
  }
  
  .day-header {
    padding: 0.6rem 0.3rem;
    font-size: 0.9rem;
  }
  
  .time-cell {
    padding: 0;
  }
  
  .cell-content {
    min-height: 50px; /* 減少格子高度 */
    padding: 0.3rem;
  }
  
  .time-period {
    font-size: 0.9rem;
  }
  
  .time-range {
    font-size: 0.7rem;
  }
  
  /* 課表卡片在手機上的特殊處理 */
  .timetable-container .card-body {
    padding: 0.5rem;
  }
}

</style>
