// 🧪 Automated Integration Test Suite
// Server Controlled Chrome Extension - Automated Testing

const API_BASE = 'http://localhost:3000/api'

// Test Configuration
const TEST_CONFIG = {
  adminUser: {
    email: 'admin@example.com',
    password: 'admin123'
  },
  regularUser: {
    email: 'user@example.com', 
    password: 'user123'
  },
  testTimeout: 10000,
  apiDelay: 1000
}

// Test Results Storage
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
}

// Utility Functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString()
  const prefix = {
    info: '📋',
    success: '✅', 
    error: '❌',
    warning: '⚠️'
  }[type] || '📋'
  
  console.log(`${prefix} [${timestamp}] ${message}`)
}

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }
  
  try {
    const response = await fetch(url, config)
    const data = await response.json()
    return { success: response.ok, status: response.status, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Test Framework
class TestSuite {
  constructor(name) {
    this.name = name
    this.tests = []
  }
  
  test(name, testFn) {
    this.tests.push({ name, testFn })
  }
  
  async run() {
    log(`🚀 Starting Test Suite: ${this.name}`)
    
    for (const test of this.tests) {
      testResults.total++
      try {
        log(`Running: ${test.name}`)
        await test.testFn()
        testResults.passed++
        testResults.details.push({ name: test.name, status: 'PASS' })
        log(`✅ PASSED: ${test.name}`, 'success')
      } catch (error) {
        testResults.failed++
        testResults.details.push({ name: test.name, status: 'FAIL', error: error.message })
        log(`❌ FAILED: ${test.name} - ${error.message}`, 'error')
      }
      await delay(500) // Small delay between tests
    }
  }
}

// Assertion Functions
const assert = {
  isTrue: (condition, message) => {
    if (!condition) throw new Error(message || 'Expected true')
  },
  
  isFalse: (condition, message) => {
    if (condition) throw new Error(message || 'Expected false')
  },
  
  equals: (actual, expected, message) => {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`)
    }
  },
  
  exists: (value, message) => {
    if (value === null || value === undefined) {
      throw new Error(message || 'Expected value to exist')
    }
  },
  
  isArray: (value, message) => {
    if (!Array.isArray(value)) {
      throw new Error(message || 'Expected array')
    }
  },
  
  hasProperty: (obj, prop, message) => {
    if (!obj.hasOwnProperty(prop)) {
      throw new Error(message || `Expected property ${prop}`)
    }
  }
}

// Test Suites

// 🔐 Authentication Tests
const authTests = new TestSuite('Authentication Tests')

authTests.test('Admin Login Success', async () => {
  const result = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_CONFIG.adminUser)
  })
  
  assert.isTrue(result.success, 'Login request should succeed')
  assert.exists(result.data.token, 'Should return auth token')
  assert.equals(result.data.user.role, 'admin', 'User should have admin role')
  
  // Store token for subsequent tests
  global.adminToken = result.data.token
  global.adminUser = result.data.user
})

authTests.test('Regular User Login Success', async () => {
  const result = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_CONFIG.regularUser)
  })
  
  assert.isTrue(result.success, 'Login request should succeed')
  assert.exists(result.data.token, 'Should return auth token')
  assert.equals(result.data.user.role, 'user', 'User should have user role')
  
  // Store token for subsequent tests
  global.userToken = result.data.token
  global.regularUser = result.data.user
})

authTests.test('Invalid Login Credentials', async () => {
  const result = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'invalid@example.com',
      password: 'wrongpassword'
    })
  })
  
  assert.isFalse(result.success, 'Login should fail with invalid credentials')
  assert.equals(result.status, 401, 'Should return 401 status')
})

// 🔧 Configuration Tests
const configTests = new TestSuite('Configuration Tests')

configTests.test('Fetch Global Config (No Auth)', async () => {
  const result = await apiCall('/config')
  
  assert.isTrue(result.success, 'Should fetch global config without auth')
  assert.exists(result.data.title, 'Config should have title')
  assert.exists(result.data.features, 'Config should have features')
  assert.isArray(result.data.features, 'Features should be array')
})

configTests.test('Fetch User-Specific Config', async () => {
  const userId = global.regularUser?.id
  if (!userId) throw new Error('User ID not available from login test')
  
  const result = await apiCall(`/config?user_id=${userId}`, {
    headers: {
      'Authorization': `Bearer ${global.userToken}`
    }
  })
  
  assert.isTrue(result.success, 'Should fetch user config with auth')
  assert.exists(result.data.features, 'Config should have features')
})

configTests.test('Admin Can Create Config', async () => {
  const testConfig = {
    title: 'Test Config',
    version: '1.0.0',
    theme: 'light',
    layout: 'default',
    features: [
      {
        name: 'test_feature',
        title: 'Test Feature',
        type: 'button',
        premium: false,
        enabled: true
      }
    ]
  }
  
  const result = await apiCall('/config', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${global.adminToken}`
    },
    body: JSON.stringify({ config: testConfig })
  })
  
  assert.isTrue(result.success, 'Admin should be able to create config')
  assert.exists(result.data.id, 'Should return config ID')
})

// 🎯 Feature Execution Tests
const featureTests = new TestSuite('Feature Execution Tests')

featureTests.test('Execute Note Taking Feature', async () => {
  const userId = global.regularUser?.id
  if (!userId) throw new Error('User ID not available')
  
  const result = await apiCall('/run-feature', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${global.userToken}`
    },
    body: JSON.stringify({
      user_id: userId,
      feature: 'note_taking',
      action: 'save',
      input: 'Test note from automated test'
    })
  })
  
  assert.isTrue(result.success, 'Feature execution should succeed')
  assert.exists(result.data.output, 'Should return execution result')
})

featureTests.test('Premium Feature Access Control', async () => {
  const userId = global.regularUser?.id
  if (!userId) throw new Error('User ID not available')
  
  // Try to execute premium feature as free user
  const result = await apiCall('/run-feature', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${global.userToken}`
    },
    body: JSON.stringify({
      user_id: userId,
      feature: 'pdf_export',
      action: 'execute',
      input: 'Test content'
    })
  })
  
  // Should fail if user doesn't have premium access
  if (global.regularUser?.subscription !== 'premium') {
    assert.equals(result.status, 403, 'Should deny access to premium feature')
  }
})

featureTests.test('Invalid Feature Name', async () => {
  const userId = global.regularUser?.id
  if (!userId) throw new Error('User ID not available')
  
  const result = await apiCall('/run-feature', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${global.userToken}`
    },
    body: JSON.stringify({
      user_id: userId,
      feature: 'nonexistent_feature',
      action: 'execute',
      input: 'test'
    })
  })
  
  assert.isFalse(result.success, 'Should fail for invalid feature')
  assert.equals(result.status, 404, 'Should return 404 for unknown feature')
})

// 👤 User Management Tests
const userTests = new TestSuite('User Management Tests')

userTests.test('Get User Profile', async () => {
  const result = await apiCall('/users/me', {
    headers: {
      'Authorization': `Bearer ${global.userToken}`
    }
  })
  
  assert.isTrue(result.success, 'Should get user profile')
  assert.exists(result.data.email, 'Profile should have email')
  assert.exists(result.data.subscription, 'Profile should have subscription')
})

userTests.test('Admin Dashboard Access', async () => {
  const result = await apiCall('/admin/dashboard', {
    headers: {
      'Authorization': `Bearer ${global.adminToken}`
    }
  })
  
  assert.isTrue(result.success, 'Admin should access dashboard')
  assert.exists(result.data.stats, 'Dashboard should have stats')
})

userTests.test('User Cannot Access Admin Dashboard', async () => {
  const result = await apiCall('/admin/dashboard', {
    headers: {
      'Authorization': `Bearer ${global.userToken}`
    }
  })
  
  assert.equals(result.status, 403, 'Regular user should be denied admin access')
})

// 🔒 Security Tests
const securityTests = new TestSuite('Security Tests')

securityTests.test('API Requires Authentication', async () => {
  const result = await apiCall('/users/me')
  
  assert.equals(result.status, 401, 'Should require authentication')
})

securityTests.test('Invalid Token Rejected', async () => {
  const result = await apiCall('/users/me', {
    headers: {
      'Authorization': 'Bearer invalid-token-123'
    }
  })
  
  assert.equals(result.status, 401, 'Should reject invalid token')
})

securityTests.test('Token Format Validation', async () => {
  const result = await apiCall('/users/me', {
    headers: {
      'Authorization': 'InvalidFormat'
    }
  })
  
  assert.equals(result.status, 401, 'Should reject malformed authorization header')
})

// Main Test Runner
async function runAllTests() {
  log('🧪 Starting Automated Integration Tests', 'info')
  log(`Testing against: ${API_BASE}`, 'info')
  
  const startTime = Date.now()
  
  try {
    // Run test suites in order
    await authTests.run()
    await delay(TEST_CONFIG.apiDelay)
    
    await configTests.run()
    await delay(TEST_CONFIG.apiDelay)
    
    await featureTests.run()
    await delay(TEST_CONFIG.apiDelay)
    
    await userTests.run()
    await delay(TEST_CONFIG.apiDelay)
    
    await securityTests.run()
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error')
  }
  
  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000
  
  // Generate Report
  generateTestReport(duration)
}

function generateTestReport(duration) {
  log('\n📊 TEST RESULTS SUMMARY', 'info')
  log('=' .repeat(50), 'info')
  log(`Total Tests: ${testResults.total}`, 'info')
  log(`Passed: ${testResults.passed}`, 'success')
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info')
  log(`Duration: ${duration.toFixed(2)}s`, 'info')
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info')
  
  if (testResults.failed > 0) {
    log('\n❌ FAILED TESTS:', 'error')
    testResults.details
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        log(`  • ${test.name}: ${test.error}`, 'error')
      })
  }
  
  if (testResults.passed === testResults.total) {
    log('\n🎉 ALL TESTS PASSED! System is ready for production! 🚀', 'success')
  } else {
    log('\n⚠️  Some tests failed. Please review and fix issues before deployment.', 'warning')
  }
  
  // Save results to file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      duration: duration,
      successRate: (testResults.passed / testResults.total) * 100
    },
    details: testResults.details
  }
  
  console.log('\n📋 Full Test Report:')
  console.log(JSON.stringify(report, null, 2))
}

// Usage Instructions
if (typeof window === 'undefined') {
  // Node.js environment
  console.log(`
🧪 Server Controlled Extension - Automated Test Suite

Prerequisites:
1. Start the website server: npm run dev
2. Ensure test users exist in database
3. Run: node tests/automated-test.js

Or in browser console:
1. Open http://localhost:3000
2. Open browser DevTools (F12)
3. Copy and paste this script
4. Call: runAllTests()
`)
  
  // Auto-run if in Node.js with proper fetch polyfill
  if (typeof fetch !== 'undefined') {
    runAllTests()
  }
} else {
  // Browser environment
  log('🧪 Automated test suite loaded. Call runAllTests() to begin.', 'info')
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, TestSuite, assert }
}
