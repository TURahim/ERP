#!/bin/bash
# Production Smoke Test

set -e

BACKEND_URL="${BACKEND_URL:-https://your-backend-url.com}"
API_KEY="${API_KEY:-your-production-api-key}"
FRONTEND_URL="${FRONTEND_URL:-https://your-frontend-url.com}"

echo "🧪 Running Production Smoke Tests"
echo "=================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Backend Health
echo "1. Backend Health Check..."
HEALTH=$(curl -sf $BACKEND_URL/actuator/health 2>&1 || echo "FAIL")
if [[ $HEALTH == *"UP"* ]]; then
  echo "✅ Backend is healthy"
else
  echo "❌ Backend health check failed"
  echo "   Response: $HEALTH"
  exit 1
fi

# API Authentication
echo ""
echo "2. API Authentication..."
CUSTOMERS=$(curl -sf -H "X-API-Key: $API_KEY" $BACKEND_URL/api/customers 2>&1 || echo "FAIL")
if [[ $CUSTOMERS == *"data"* ]]; then
  echo "✅ API authentication works"
else
  echo "❌ API authentication failed"
  echo "   Response: $CUSTOMERS"
  exit 1
fi

# Frontend Accessibility
echo ""
echo "3. Frontend Accessibility..."
FRONTEND=$(curl -sf -I $FRONTEND_URL 2>&1 | head -n 1 || echo "FAIL")
if [[ $FRONTEND == *"200"* ]] || [[ $FRONTEND == *"301"* ]] || [[ $FRONTEND == *"302"* ]]; then
  echo "✅ Frontend is accessible"
else
  echo "❌ Frontend accessibility failed"
  echo "   Response: $FRONTEND"
  exit 1
fi

# Test CRUD Operations
echo ""
echo "4. CRUD Operations Test..."

# Create customer
CREATE_RESPONSE=$(curl -sf -X POST $BACKEND_URL/api/customers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"name":"Smoke Test Customer","email":"smoke@test.com","billingAddress":"123 Test St"}' 2>&1)

if [[ $CREATE_RESPONSE == *"id"* ]]; then
  CUSTOMER_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//')
  echo "✅ Customer created: $CUSTOMER_ID"
  
  # Read customer
  READ_RESPONSE=$(curl -sf -H "X-API-Key: $API_KEY" $BACKEND_URL/api/customers/$CUSTOMER_ID 2>&1 || echo "FAIL")
  if [[ $READ_RESPONSE == *"$CUSTOMER_ID"* ]]; then
    echo "✅ Customer read successfully"
  else
    echo "⚠️  Customer read failed (non-critical)"
  fi
else
  echo "⚠️  Customer creation failed (may be expected if DB is read-only)"
fi

echo ""
echo "🎉 Core smoke tests passed!"
echo ""
echo "Next steps:"
echo "  - Verify frontend manually at: $FRONTEND_URL"
echo "  - Check CloudWatch logs for any errors"
echo "  - Monitor performance metrics"
echo "  - Run full test suite if available"

