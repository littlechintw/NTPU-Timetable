#!/bin/bash

# NTPU Timetable - Node.js Upgrade and Migration Script
# This script helps upgrade Node.js and complete the Vite migration

echo "🚀 NTPU Timetable - Vite Migration Setup"
echo "========================================"

# Check current Node.js version
echo "📋 Current Node.js version:"
node --version

# Install NVM if not present
if ! command -v nvm &> /dev/null; then
    echo "📦 Installing Node Version Manager (nvm)..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
fi

# Install Node.js 18
echo "⬆️  Installing Node.js 18..."
nvm install 18
nvm use 18
nvm alias default 18

echo "✅ Node.js updated to:"
node --version
npm --version

# Copy full configuration files
echo "📄 Setting up full Vite configuration..."
cp package.full.json package.json
cp vite.config.full.js vite.config.js

# Clean and install dependencies
echo "🧹 Cleaning old dependencies..."
rm -rf node_modules package-lock.json

echo "📦 Installing new dependencies..."
npm install

echo "🎉 Migration setup complete!"
echo ""
echo "Next steps:"
echo "1. npm run dev  - Start development server"
echo "2. Update Home.vue component for Vue 3"
echo "3. Restore Vuetify components"
echo "4. Test all functionality"
echo ""
echo "🔗 See MIGRATION.md for detailed next steps"
