#!/bin/bash

# Kill any process running on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Start the server
echo "🚀 Starting FoodOrder Backend..."
node src/server.js















