# NTPU Timetable - Vite Migration

This project has been refined and migrated from Vue CLI to Vite for better performance and development experience.

## Migration Summary

### Changes Made

1. **Build System**: Migrated from Vue CLI to Vite
2. **Vue Version**: Upgraded from Vue 2 to Vue 3
3. **Package Management**: Updated all dependencies to modern versions
4. **Configuration**: Replaced Vue CLI config files with Vite config

### Updated Files

- `package.json` - Updated with Vite dependencies
- `vite.config.js` - New Vite configuration file
- `src/main.js` - Updated for Vue 3 API
- `src/App.vue` - Simplified for initial setup
- `public/index.html` - Updated for Vite
- Removed: `babel.config.js`, `vue.config.js`, `src/registerServiceWorker.js`

## Prerequisites

⚠️ **Important**: This project requires Node.js 14+ to run properly with Vite.

Current system has Node.js v12.22.9, which is not compatible with modern Vite.

## Installation Steps

### Step 1: Update Node.js

You need to upgrade Node.js to version 18 or later. Choose one method:

#### Option A: Using Node Version Manager (nvm) - Recommended
```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.bashrc

# Install and use Node.js 18
nvm install 18
nvm use 18
nvm alias default 18
```

#### Option B: Manual Installation
Download and install Node.js 18+ from [nodejs.org](https://nodejs.org/)

### Step 2: Install Dependencies

```bash
cd /path/to/NTPU-Timetable
npm install
```

### Step 3: Development Server

```bash
npm run dev
```

### Step 4: Build for Production

```bash
npm run build
```

## Next Steps for Full Migration

The current setup provides a basic Vue 3 + Vite foundation. To restore full functionality:

### 1. Restore Vue Router
```bash
npm install vue-router@4
```

### 2. Restore Vuex (or migrate to Pinia)
```bash
npm install vuex@4
# or for modern state management:
npm install pinia
```

### 3. Restore Vuetify
```bash
npm install vuetify@3 @mdi/font
npm install -D vite-plugin-vuetify
```

### 4. Migrate Vue 2 Components to Vue 3

The main `Home.vue` component needs significant refactoring:

- Update template syntax for Vuetify 3
- Migrate from Options API to Composition API (recommended)
- Update lifecycle hooks (`created` → `onMounted`)
- Update event handling

### 5. Add PWA Support
```bash
npm install -D vite-plugin-pwa
```

### 6. Restore Additional Features
- JSON Viewer: `npm install vue-json-viewer@3`
- HTML2Canvas: `npm install html2canvas`
- Analytics: Replace vue-analytics with gtag

## Benefits of Migration

1. **Faster Development**: Vite provides instant hot module replacement
2. **Better Performance**: Optimized build process and smaller bundle sizes
3. **Modern Tooling**: Latest Vue 3 features and ecosystem
4. **Future-Proof**: Better long-term support and updates

## Troubleshooting

### Node.js Version Issues
- Ensure Node.js 14+ is installed
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then reinstall

### Build Issues
- Check Vite configuration in `vite.config.js`
- Verify all imports use correct Vue 3 syntax

## Original Features to Restore

1. Course search and filtering
2. Timetable grid display
3. Course selection management
4. Local storage integration
5. Course detail overlay
6. Export functionality
7. PWA capabilities

## Development Notes

- The project uses ES modules (`"type": "module"` in package.json)
- Vite uses native ES modules in development
- All imports should be explicit (no auto-imports initially)
- Vue 3 Composition API is recommended for new components

## Contact

For issues during migration, contact: ntpu-timetable-support@googlegroups.com
