# NTPU Timetable

一頁式的國立臺北大學課程試排體驗，讓學生快速挑選想要參與的課程。

## 🚀 Migration to Vite + Vue 3

This project has been migrated from Vue CLI to Vite for better performance and modern development experience.

### ⚠️ Prerequisites

- **Node.js 18+** (Current system has v12.22.9 - needs upgrade)
- npm 8+ or yarn 1.22+

## 📦 Installation

### Step 1: Upgrade Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18
```

### Step 2: Install Dependencies

```bash
# Copy the full package.json
cp package.full.json package.json
cp vite.config.full.js vite.config.js

# Install dependencies
npm install
```

## 🛠 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Migration Status

### ✅ Completed
- [x] Vite configuration setup
- [x] Vue 3 migration foundation
- [x] Basic project structure
- [x] Modern tooling setup

### 🔄 In Progress
- [ ] Vuetify 3 integration
- [ ] Vue Router 4 setup
- [ ] State management (Pinia)
- [ ] Component migration to Vue 3
- [ ] PWA functionality restoration

### 📝 Next Steps

1. **Restore UI Framework**: Integrate Vuetify 3
2. **Migrate Components**: Update Home.vue for Vue 3 Composition API
3. **State Management**: Implement Pinia or Vuex 4
4. **Features**: Restore course search, filtering, and timetable display
5. **PWA**: Re-implement service worker and offline functionality

## 🔧 Technical Details

### Architecture Changes
- **Build Tool**: Vue CLI → Vite
- **Vue Version**: 2.6 → 3.4
- **UI Framework**: Vuetify 2 → Vuetify 3
- **State Management**: Vuex 3 → Pinia (recommended)
- **Routing**: Vue Router 3 → Vue Router 4

### Performance Improvements
- ⚡ Instant hot module replacement
- 📦 Optimized bundle splitting
- 🚀 Faster build times
- 💾 Better tree-shaking

## 📚 Documentation

- [Migration Guide](MIGRATION.md) - Detailed migration steps
- [Vue 3 Migration Guide](https://v3-migration.vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Vuetify 3 Documentation](https://vuetifyjs.com/)

## 🐛 Troubleshooting

### Node.js Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Issues
- Ensure Node.js 18+ is installed
- Check Vite configuration
- Verify Vue 3 syntax in components

## 📞 Support

For issues during migration:
- Email: ntpu-timetable-support@googlegroups.com
- Creator: [littlechintw.github.io](https://littlechintw.github.io)

## 📄 License

Copyright © 2024 littlechin. All rights reserved.
