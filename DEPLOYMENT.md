# Vercel Deployment Guide

## 🚀 Vercel এ Deploy করার জন্য Steps:

### 1. Environment Variables Setup
Vercel dashboard এ গিয়ে এই environment variables add করুন:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://nvsaxbxbgwmqlxpiixid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52c2F4YnhiZ3dtcWx4cGlpeGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjU2OTcsImV4cCI6MjA3MzYwMTY5N30.lyOk4nvT1bp0ZCfCTxyrup9lc-BuxEIfD5ge78row4I
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXTAUTH_SECRET=your_random_secret_here
\`\`\`

### 2. Database Setup
- Supabase dashboard এ গিয়ে SQL Editor এ `scripts/07-safe-extension-setup.sql` run করুন
- অথবা v0 থেকে script run করুন

### 3. Chrome Extension Update
Deploy হওয়ার পর Chrome extension এর `popup.js` file এ:
\`\`\`javascript
const API_BASE_URL = 'https://your-domain.vercel.app';
\`\`\`
এই URL টি আপনার actual Vercel domain দিয়ে replace করুন।

### 4. Domain Configuration
- Vercel এ deploy হওয়ার পর আপনার domain পাবেন
- Chrome extension এ সেই domain set করুন
- Supabase Auth settings এ redirect URL add করুন

### 5. Testing
- Extension install করুন Chrome এ
- "Sign In to Dashboard" button test করুন
- Web control panel access করুন
- Phone scraping functionality test করুন

## 🔧 Production Checklist:
- ✅ Environment variables configured
- ✅ Database tables created
- ✅ Chrome extension domain updated
- ✅ Supabase auth configured
- ✅ API endpoints working
- ✅ Real-time sync enabled

## 📱 Chrome Extension Installation:
1. Chrome এ `chrome://extensions/` যান
2. "Developer mode" enable করুন
3. "Load unpacked" click করুন
4. `chrome-extension` folder select করুন
5. Extension activate হবে

## 🌐 Web Control Panel Access:
- URL: `https://your-domain.vercel.app`
- Features: User management, Configuration, Statistics, Logs
- Real-time data sync with extension

## 🔒 Security Features:
- Row Level Security (RLS) enabled
- User authentication required
- API rate limiting
- Secure token-based communication
