#!/bin/bash
set -e

# Build server first
echo "🔨 Building Express server..."
cd server
npm install
npm run build
cd ..
echo "✅ Server build completed!"

# Then build frontend
echo "🔨 Building Next.js frontend..."
npm run build
echo "✅ Frontend build completed!"
