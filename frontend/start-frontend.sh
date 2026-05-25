#!/bin/bash

echo "🚀 Starting Frontend..."
echo ""

# Kill any existing vite process
pkill -f vite 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

sleep 1

# Start frontend
cd "$(dirname "$0")"
npm run dev


