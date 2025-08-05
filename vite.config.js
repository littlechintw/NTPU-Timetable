import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 穩定配置，不使用 vite-plugin-vuetify（避免版本衝突）
export default defineConfig({
  plugins: [vue()],
  root: '.', // 確保根目錄是項目根目錄
  publicDir: 'public', // 指定 public 目錄
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@root': resolve(__dirname, '.')
    }
  },
  assetsInclude: ['**/*.json'],
  define: {
    'process.env': {}
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'vuex'],
          vuetify: ['vuetify']
        }
      }
    }
  },
  server: {
    host: true,
    port: 8080
  }
})
