import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 穩定版 Vite 配置，包含基本的 Vuetify 支援但避免插件問題
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('v-')
        }
      }
    })
  ],
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
      external: [],
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'vuex']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['vuetify', 'vuetify/lib/**']
  }
})
