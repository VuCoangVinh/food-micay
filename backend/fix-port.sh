#!/bin/bash

echo "🔍 Checking port 3001..."

# Find process using port 3001
PID=$(lsof -ti:3001)

if [ -z "$PID" ]; then
    echo "✅ Port 3001 is free"
else
    echo "⚠️  Port 3001 is in use by process $PID"
    echo "🛑 Killing process..."
    kill -9 $PID
    sleep 1
    echo "✅ Process killed"
fi

echo ""
echo "🚀 Starting backend server..."
cd "$(dirname "$0")"
node src/server.js















