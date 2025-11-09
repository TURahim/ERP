#!/usr/bin/env node

/**
 * Backend Connectivity Test Script
 * 
 * Tests if the backend API is running and accessible.
 * 
 * Usage:
 *   npm run test:backend
 *   or
 *   node scripts/test-backend-connection.js
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8080'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY || 'demo-api-key-12345'

async function testBackendConnection() {
  console.log('🔍 Testing backend connection...\n')
  console.log(`Backend URL: ${API_BASE_URL}`)
  console.log(`API Key: ${API_KEY.substring(0, 10)}...\n`)

  const tests = [
    {
      name: 'Health Check',
      url: `${API_BASE_URL}/actuator/health`,
      method: 'GET',
      requiresAuth: false,
    },
    {
      name: 'List Customers',
      url: `${API_BASE_URL}/api/customers?page=0&size=10`,
      method: 'GET',
      requiresAuth: true,
    },
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      }

      if (test.requiresAuth) {
        headers['X-API-Key'] = API_KEY
      }

      const response = await fetch(test.url, {
        method: test.method,
        headers,
      })

      if (response.ok) {
        console.log(`✅ ${test.name}: PASSED (${response.status})`)
        passed++
      } else {
        console.log(`❌ ${test.name}: FAILED (${response.status})`)
        const text = await response.text()
        console.log(`   Response: ${text.substring(0, 100)}`)
        failed++
      }
    } catch (error: any) {
      console.log(`❌ ${test.name}: ERROR`)
      console.log(`   ${error.message}`)
      failed++
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)

  if (failed === 0) {
    console.log('\n🎉 Backend is running and accessible!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Backend connection issues detected.')
    console.log('\nTroubleshooting:')
    console.log('1. Make sure the backend is running: cd backend && mvn spring-boot:run')
    console.log('2. Check if port 8080 is available: lsof -i :8080')
    console.log('3. Verify API key matches in backend configuration')
    console.log('4. Check CORS settings in backend')
    process.exit(1)
  }
}

testBackendConnection().catch((error) => {
  console.error('❌ Test script error:', error)
  process.exit(1)
})


