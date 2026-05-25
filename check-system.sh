#!/bin/bash

echo "🔍 Kiểm Tra Hệ Thống FoodOrder"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check 1: Backend directory
echo "1. Kiểm tra thư mục backend..."
if [ -d "backend" ]; then
    echo -e "${GREEN}✅ Backend directory exists${NC}"
else
    echo -e "${RED}❌ Backend directory not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: Frontend directory
echo "2. Kiểm tra thư mục frontend..."
if [ -d "frontend" ]; then
    echo -e "${GREEN}✅ Frontend directory exists${NC}"
else
    echo -e "${RED}❌ Frontend directory not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 3: Backend node_modules
echo "3. Kiểm tra backend dependencies..."
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✅ Backend node_modules exists${NC}"
else
    echo -e "${YELLOW}⚠️  Backend node_modules not found. Run: cd backend && npm install${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: Frontend node_modules
echo "4. Kiểm tra frontend dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✅ Frontend node_modules exists${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend node_modules not found. Run: cd frontend && npm install${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: Backend .env file
echo "5. Kiểm tra backend .env file..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅ Backend .env file exists${NC}"
    
    # Check important env vars
    if grep -q "PORT=" backend/.env && grep -q "JWT_SECRET=" backend/.env; then
        echo -e "${GREEN}✅ .env has required variables${NC}"
    else
        echo -e "${YELLOW}⚠️  .env may be missing some variables${NC}"
    fi
else
    echo -e "${RED}❌ Backend .env file not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: Database file
echo "6. Kiểm tra database..."
if [ -f "backend/database.sqlite" ]; then
    echo -e "${GREEN}✅ Database file exists${NC}"
else
    echo -e "${YELLOW}⚠️  Database file not found (will be created on first run)${NC}"
fi

# Check 7: Uploads directory
echo "7. Kiểm tra uploads directory..."
if [ -d "backend/uploads/images" ]; then
    echo -e "${GREEN}✅ Uploads directory exists${NC}"
else
    echo -e "${YELLOW}⚠️  Uploads directory not found (will be created if needed)${NC}"
fi

# Check 8: Backend server running
echo "8. Kiểm tra backend server..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running on port 3001${NC}"
    
    # Test health endpoint
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend API is responding${NC}"
    else
        echo -e "${RED}❌ Backend API is not responding${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ Backend server is NOT running${NC}"
    echo -e "${YELLOW}   Start it with: cd backend && npm run dev${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 9: Frontend server running
echo "9. Kiểm tra frontend server..."
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend server is running on port 5173${NC}"
else
    echo -e "${RED}❌ Frontend server is NOT running${NC}"
    echo -e "${YELLOW}   Start it with: cd frontend && npm run dev${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Tất cả kiểm tra đều PASS!${NC}"
    echo ""
    echo "Hệ thống sẵn sàng sử dụng:"
    echo "  - Backend: http://localhost:3001"
    echo "  - Frontend: http://localhost:5173"
    echo ""
    echo "Nếu vẫn gặp lỗi, kiểm tra:"
    echo "  1. Console trong trình duyệt (F12)"
    echo "  2. Backend logs trong terminal"
    echo "  3. Network tab trong trình duyệt (F12)"
else
    echo -e "${RED}❌ Tìm thấy $ERRORS vấn đề${NC}"
    echo ""
    echo "Hãy sửa các vấn đề trên trước khi tiếp tục."
    echo "Xem DEBUG_GUIDE.md để biết cách sửa."
fi
echo ""









