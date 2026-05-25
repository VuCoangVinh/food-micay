#!/bin/bash

echo "🧪 Test API Endpoints"
echo "===================="
echo ""

API_URL="http://localhost:3001/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Test 1: Health Check
echo "1. Testing Health Check..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check OK (200)${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Health check FAILED ($HTTP_CODE)${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 2: Get Menu (Public)
echo "2. Testing Get Menu (Public)..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/menu")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    ITEM_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ Get menu OK (200) - Found $ITEM_COUNT items${NC}"
else
    echo -e "${RED}❌ Get menu FAILED ($HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 3: Login
echo "3. Testing Login..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@foodorder.com","password":"admin123"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    if echo "$BODY" | grep -q "token"; then
        TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Login OK (200) - Token received${NC}"
        echo "   Token: ${TOKEN:0:20}..."
        
        # Save token for next tests
        export TEST_TOKEN="$TOKEN"
    else
        echo -e "${RED}❌ Login OK but no token in response${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ Login FAILED ($HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 4: Get Menu with Auth (should work without auth too)
echo "4. Testing Get Menu with Auth..."
if [ -n "$TEST_TOKEN" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/menu" \
      -H "Authorization: Bearer $TEST_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Get menu with auth OK (200)${NC}"
    else
        echo -e "${RED}❌ Get menu with auth FAILED ($HTTP_CODE)${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Skipping (no token from login)${NC}"
fi
echo ""

# Test 5: Create Menu Item (Admin only)
echo "5. Testing Create Menu Item (Admin)..."
if [ -n "$TEST_TOKEN" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/menu" \
      -H "Authorization: Bearer $TEST_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"name":"Test Món","description":"Món ăn test để kiểm tra","price":50000,"category":"main","image":null}')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "201" ]; then
        ITEM_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        echo -e "${GREEN}✅ Create menu item OK (201) - ID: $ITEM_ID${NC}"
        
        # Clean up - delete test item
        curl -s -X DELETE "$API_URL/menu/$ITEM_ID" \
          -H "Authorization: Bearer $TEST_TOKEN" > /dev/null
        echo "   (Test item deleted)"
    elif [ "$HTTP_CODE" = "401" ]; then
        echo -e "${RED}❌ Create menu item FAILED (401 Unauthorized)${NC}"
        echo "   Token may be invalid or expired"
        ERRORS=$((ERRORS + 1))
    elif [ "$HTTP_CODE" = "403" ]; then
        echo -e "${RED}❌ Create menu item FAILED (403 Forbidden)${NC}"
        echo "   User is not admin"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${RED}❌ Create menu item FAILED ($HTTP_CODE)${NC}"
        echo "   Response: $BODY"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Skipping (no token from login)${NC}"
fi
echo ""

# Summary
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Tất cả tests đều PASS!${NC}"
    echo ""
    echo "API đang hoạt động bình thường."
    echo "Nếu frontend vẫn không hoạt động, kiểm tra:"
    echo "  1. Frontend Console (F12)"
    echo "  2. Network tab (F12)"
    echo "  3. CORS configuration"
else
    echo -e "${RED}❌ Tìm thấy $ERRORS lỗi${NC}"
    echo ""
    echo "Hãy kiểm tra:"
    echo "  1. Backend có đang chạy không?"
    echo "  2. Database có dữ liệu không?"
    echo "  3. .env file có đúng không?"
fi
echo ""









