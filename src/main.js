import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'

// JSON Viewer
import JsonViewer from 'vue-json-viewer'

// Google Analytics for Vue 3
import VueGtag from 'vue-gtag'

const app = createApp(App)

// 全域屬性設定 (Vue 3 方式)
app.config.globalProperties.$windowHeight = window.innerHeight

// 使用插件
app.use(store)
app.use(router)
app.use(vuetify)
app.use(JsonViewer)

// Google Analytics 設定
app.use(VueGtag, {
  config: {
    id: 'UA-167881827-3'
  }
}, router)

// 創建 Vue 實例並添加 window height 功能
const vueApp = app.mount('#app')

// 全域 window resize 處理
const windowHeightData = {
  windowHeight: window.innerHeight,
  txt: ''
}

const handleResize = () => {
  const newHeight = window.innerHeight
  const oldHeight = windowHeightData.windowHeight
  windowHeightData.windowHeight = newHeight
  windowHeightData.txt = `it changed to ${newHeight} from ${oldHeight}`
  
  // 更新 store 中的 windowHeight
  store.dispatch('updateWindowHeight', newHeight)
}

window.addEventListener('resize', handleResize)
console.log('Show Height!')
console.log(windowHeightData.windowHeight)

// 清理函數
window.addEventListener('beforeunload', () => {
  window.removeEventListener('resize', handleResize)
})