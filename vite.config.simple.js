import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 簡化版 Vite 配置，不包含 Vuetify 依賴
export default defineConfig({
  plugins: [vue()],
  root: '.', // 確保根目錄是項目根目錄
  publicDir: 'public', // 指定 public 目錄
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    'process.env': {}
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'vuex']
        }
      }
    }
  }
})
