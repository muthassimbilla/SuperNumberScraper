# 🔐 User Authentication Flow Testing Guide

এই guide ব্যবহার করে আপনি **Server Controlled Extension** এর authentication system test করতে পারবেন।

## 📋 Pre-requisites

### 1. Environment Setup
```bash
# Website running
cd website
npm run dev
# Server: http://localhost:3000

# Extension loaded in Chrome
# Chrome -> Extensions -> Developer mode -> Load unpacked
```

### 2. Test Accounts
```javascript
// Admin Account
Email: admin@example.com
Password: admin123

// Regular User Account  
Email: user@example.com
Password: user123
```

## 🧪 Authentication Flow Tests

### ✅ Test 1: Admin Login Flow
**Objective:** Verify admin can login and access admin panel

**Steps:**
1. Open `http://localhost:3000/auth/login`
2. Enter admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
3. Click "Sign in"

**Expected Results:**
- ✅ Login successful message appears
- ✅ Redirected to `/admin/dashboard`
- ✅ Admin panel UI loads correctly
- ✅ User role displayed as "Admin Account"
- ✅ Admin navigation menu visible

**Success Criteria:**
- [ ] Login form validates input
- [ ] Authentication API call succeeds
- [ ] JWT token stored in localStorage
- [ ] Admin dashboard loads with stats
- [ ] Navigation sidebar shows admin options

---

### ✅ Test 2: Regular User Login Flow
**Objective:** Verify regular user can login and access user dashboard

**Steps:**
1. Open `http://localhost:3000/auth/login`
2. Enter user credentials:
   - Email: `user@example.com`
   - Password: `user123`
3. Click "Sign in"

**Expected Results:**
- ✅ Login successful message appears
- ✅ Redirected to `/dashboard` (user dashboard)
- ✅ User interface loads correctly
- ✅ No admin options visible

**Success Criteria:**
- [ ] User authentication succeeds
- [ ] User-specific dashboard loads
- [ ] Admin features not accessible
- [ ] User permissions properly enforced

---

### ✅ Test 3: Invalid Credentials
**Objective:** Verify proper error handling for wrong credentials

**Steps:**
1. Open `http://localhost:3000/auth/login`
2. Enter invalid credentials:
   - Email: `wrong@example.com`
   - Password: `wrongpass`
3. Click "Sign in"

**Expected Results:**
- ❌ Error message displayed
- ❌ No redirect occurs
- ❌ No token stored
- ❌ User remains on login page

**Success Criteria:**
- [ ] Error message: "Invalid credentials"
- [ ] Form doesn't submit
- [ ] No localStorage token
- [ ] Rate limiting works after multiple attempts

---

### ✅ Test 4: Extension Authentication
**Objective:** Verify Chrome extension can authenticate users

**Steps:**
1. Open Chrome extension popup
2. Extension should show login screen
3. Login with valid credentials
4. Check if extension UI loads

**Expected Results:**
- ✅ Extension shows login form
- ✅ Login API call succeeds
- ✅ Extension UI renders dynamically
- ✅ Server config fetched successfully

**Success Criteria:**
- [ ] Extension detects no auth token
- [ ] Login form appears in extension
- [ ] Authentication works from extension
- [ ] Dynamic UI loads after login

---

### ✅ Test 5: Token Validation
**Objective:** Verify JWT token validation works correctly

**Steps:**
1. Login successfully and get token
2. Open browser DevTools
3. Check localStorage for token
4. Try API call with token
5. Modify token and retry

**Expected Results:**
- ✅ Valid token allows API access
- ❌ Invalid token returns 401 error
- ✅ Token expiry handled properly

**Success Criteria:**
- [ ] Token stored in localStorage
- [ ] Valid token grants API access  
- [ ] Invalid token rejected
- [ ] Token expiry triggers re-login

---

### ✅ Test 6: Role-Based Access Control
**Objective:** Verify admin vs user access permissions

**Steps:**
1. Login as regular user
2. Try to access `/admin/dashboard`
3. Check if redirected or blocked
4. Login as admin and retry

**Expected Results:**
- ❌ User cannot access admin routes
- ✅ Admin can access all routes
- ✅ Proper error messages shown

**Success Criteria:**
- [ ] User role permissions enforced
- [ ] Admin role grants full access
- [ ] Unauthorized access blocked
- [ ] Proper error handling

---

### ✅ Test 7: Logout Flow
**Objective:** Verify logout clears authentication

**Steps:**
1. Login successfully
2. Click logout button
3. Check token removal
4. Try accessing protected route

**Expected Results:**
- ✅ Logout button works
- ✅ Token removed from storage
- ✅ Redirected to login page
- ❌ Protected routes inaccessible

**Success Criteria:**
- [ ] Logout clears localStorage
- [ ] User redirected to login
- [ ] Session completely terminated
- [ ] Extension resets to login state

---

### ✅ Test 8: Session Persistence
**Objective:** Verify login session persists across browser refresh

**Steps:**
1. Login successfully
2. Refresh the page
3. Check if user remains logged in
4. Close browser and reopen

**Expected Results:**
- ✅ Page refresh maintains login
- ✅ Browser restart maintains session
- ✅ Token still valid after refresh

**Success Criteria:**
- [ ] Refresh doesn't require re-login
- [ ] Token persists across sessions
- [ ] Auto-login on page load
- [ ] Extension remembers login state

## 🔍 Debugging Guide

### Common Issues & Solutions

#### ❌ "Network Error" 
**Cause:** Server not running or wrong URL
**Solution:** Check if `npm run dev` is running on port 3000

#### ❌ "Invalid Token"
**Cause:** Token expired or corrupted
**Solution:** Clear localStorage and login again

#### ❌ "Admin Access Required"
**Cause:** User trying to access admin routes
**Solution:** Login with admin account

#### ❌ Extension Not Loading
**Cause:** Chrome extension not properly loaded
**Solution:** Reload extension in Chrome dev mode

### Debug Commands

```javascript
// Check stored token
console.log(localStorage.getItem('admin_token'))

// Clear token
localStorage.removeItem('admin_token')

// Test API call
fetch('/api/users/me', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
}).then(r => r.json()).then(console.log)
```

## 📊 Test Results Template

```
🧪 Authentication Flow Test Results
Date: ___________
Tester: ___________

✅ Test 1: Admin Login Flow          [ PASS / FAIL ]
✅ Test 2: Regular User Login        [ PASS / FAIL ]  
✅ Test 3: Invalid Credentials       [ PASS / FAIL ]
✅ Test 4: Extension Authentication   [ PASS / FAIL ]
✅ Test 5: Token Validation          [ PASS / FAIL ]
✅ Test 6: Role-Based Access         [ PASS / FAIL ]
✅ Test 7: Logout Flow               [ PASS / FAIL ]
✅ Test 8: Session Persistence       [ PASS / FAIL ]

Overall Status: [ PASS / FAIL ]
Notes: _________________________
```

## 🚀 Next Steps

After completing authentication tests:
1. ✅ All tests should PASS
2. 🔧 Fix any failing tests
3. 📝 Document any issues found
4. 🎯 Proceed to integration testing

---

**Note:** এই test guide production-ready authentication system এর জন্য তৈরি। সব tests pass হলে আপনার authentication system fully functional! 🎉
