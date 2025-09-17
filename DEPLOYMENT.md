# 🚀 Deployment Guide - Server Controlled Chrome Extension

এই guide অনুসরণ করে আপনি আপনার **Server Controlled Chrome Extension** production এ deploy করতে পারবেন।

## 📋 Pre-Deployment Checklist

### ✅ Code Ready
- [ ] সব tests pass হয়েছে
- [ ] Code review সম্পূর্ণ
- [ ] Environment variables configured
- [ ] Database schema updated
- [ ] Production secrets secured

### ✅ Infrastructure Ready
- [ ] Supabase project setup
- [ ] Domain registered (optional)
- [ ] SSL certificate ready
- [ ] CDN configured (optional)

## 🗄️ Database Deployment (Supabase)

### 1. Create Production Database
```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Note down the following:
#    - Database URL
#    - Anon Key
#    - Service Role Key
```

### 2. Run Database Schema
```sql
-- Copy content from website/database/schema.sql
-- Run in Supabase SQL Editor
-- ✅ All tables created
-- ✅ RLS policies applied
-- ✅ Functions and triggers active
```

### 3. Create Initial Admin User
```sql
-- Insert admin user
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  NOW(),
  NOW(),
  NOW()
);

-- Note the generated ID and create profile
INSERT INTO users (id, email, role, subscription, is_active)
VALUES (
  'ADMIN_ID_FROM_ABOVE',
  'admin@yourdomain.com',
  'admin',
  'premium',
  true
);
```

## 🌐 Website Deployment

### Option 1: Vercel Deployment (Recommended)

#### Setup
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from website directory
cd website
vercel
```

#### Environment Variables
```bash
# Add in Vercel Dashboard or via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
vercel env add NEXTAUTH_SECRET
```

#### Production Build
```bash
# Build and deploy
vercel --prod

# Your website will be available at:
# https://your-project.vercel.app
```

### Option 2: Netlify Deployment

#### Setup
```bash
# 1. Build the project
cd website
npm run build

# 2. Deploy to Netlify
# - Drag and drop 'out' folder to netlify.com
# - Or connect GitHub repo
```

#### Configuration
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "out"

[build.environment]
  NEXT_PUBLIC_SUPABASE_URL = "your-supabase-url"
  NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key"
  SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
  JWT_SECRET = "your-jwt-secret"
```

### Option 3: Custom Server Deployment

#### Using PM2 (Production Process Manager)
```bash
# 1. Install PM2
npm install -g pm2

# 2. Create ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'server-controlled-extension',
    script: 'npm',
    args: 'start',
    cwd: './website',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_SUPABASE_URL: 'your-supabase-url',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key',
      JWT_SECRET: 'your-jwt-secret'
    }
  }]
}

# 3. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔧 Chrome Extension Deployment

### 1. Prepare Extension for Production

#### Update Manifest
```json
// manifest.json
{
  "name": "Your Extension Name",
  "version": "1.0.0",
  "description": "Your extension description",
  "host_permissions": [
    "https://your-domain.com/*",
    "https://your-supabase-project.supabase.co/*"
  ]
}
```

#### Update API URLs
```javascript
// background.js
const CONFIG = {
  API_BASE_URL: 'https://your-domain.com/api', // Production URL
  SUPABASE_URL: 'https://your-supabase-project.supabase.co',
  SUPABASE_KEY: 'your-anon-key'
}
```

### 2. Chrome Web Store Submission

#### Prepare Submission Package
```bash
# 1. Create clean extension folder
mkdir extension-release
cp -r manifest.json background.js popup.* supabase.js icon/ extension-release/

# 2. Remove development files
# Remove console.log statements
# Remove debug code
# Minify if needed

# 3. Create ZIP file
cd extension-release
zip -r ../extension-v1.0.0.zip .
```

#### Chrome Web Store Process
```
1. Go to Chrome Web Store Developer Dashboard
2. Pay $5 one-time registration fee
3. Upload ZIP file
4. Fill out store listing:
   - Title: "Your Extension Name"
   - Description: Detailed description
   - Screenshots: 1280x800 or 640x400
   - Icon: 128x128 PNG
   - Category: Productivity/Tools
   - Privacy Policy URL (required)

5. Submit for review (1-3 days)
```

### 3. Privacy Policy & Terms

#### Create Privacy Policy
```html
<!DOCTYPE html>
<html>
<head>
    <title>Privacy Policy - Your Extension</title>
</head>
<body>
    <h1>Privacy Policy</h1>
    
    <h2>Data Collection</h2>
    <p>We collect:</p>
    <ul>
        <li>Email address for authentication</li>
        <li>User-generated content (notes, preferences)</li>
        <li>Usage analytics (anonymized)</li>
    </ul>
    
    <h2>Data Storage</h2>
    <p>Data is stored securely using Supabase with:</p>
    <ul>
        <li>Encryption at rest</li>
        <li>Row Level Security</li>
        <li>Regular backups</li>
    </ul>
    
    <h2>Data Sharing</h2>
    <p>We do not share personal data with third parties.</p>
    
    <h2>Contact</h2>
    <p>Email: privacy@yourdomain.com</p>
</body>
</html>
```

## 🔒 Security Configuration

### 1. Environment Variables
```bash
# Production .env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=super-secure-random-string
NEXTAUTH_SECRET=another-secure-random-string
```

### 2. CORS Configuration
```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'chrome-extension://*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
  ]
}
```

### 3. Rate Limiting
```javascript
// Add rate limiting middleware
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

## 📊 Monitoring & Analytics

### 1. Error Tracking
```bash
# Add Sentry for error tracking
npm install @sentry/nextjs

# sentry.config.js
import { init } from '@sentry/nextjs'

init({
  dsn: 'your-sentry-dsn',
  environment: process.env.NODE_ENV
})
```

### 2. Analytics
```javascript
// Add Google Analytics or similar
// pages/_app.js
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
```

### 3. Uptime Monitoring
```bash
# Setup monitoring with:
# - UptimeRobot (free)
# - Pingdom
# - StatusPage.io

# Monitor these endpoints:
# https://your-domain.com/api/health
# https://your-domain.com/admin/dashboard
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd website
        npm ci
        
    - name: Run tests
      run: |
        cd website
        npm test
        
    - name: Build
      run: |
        cd website
        npm run build
        
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## ✅ Post-Deployment Checklist

### 1. Functionality Testing
```bash
# Test all critical paths:
- [ ] User registration/login
- [ ] Extension authentication
- [ ] Feature execution
- [ ] Admin panel access
- [ ] Data persistence
- [ ] Error handling
```

### 2. Performance Testing
```bash
# Check:
- [ ] Page load times < 3s
- [ ] API response times < 2s
- [ ] Database query performance
- [ ] CDN cache hit rates
- [ ] Memory usage stable
```

### 3. Security Testing
```bash
# Verify:
- [ ] HTTPS everywhere
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting active
- [ ] Input validation working
```

## 🚨 Rollback Plan

### Emergency Rollback
```bash
# Vercel rollback
vercel rollback https://your-domain.com

# Or revert to previous deployment
vercel --prod --target previous

# Database rollback (if needed)
# Restore from Supabase backup
```

### Monitoring Alerts
```bash
# Setup alerts for:
- Error rate > 5%
- Response time > 5s
- Database connection failures
- Extension authentication failures
- User complaint volume
```

## 📈 Scaling Considerations

### Database Scaling
```sql
-- Add indexes for performance
CREATE INDEX idx_user_data_user_feature ON user_data(user_id, feature);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);

-- Consider read replicas for analytics
-- Implement database connection pooling
```

### API Scaling
```javascript
// Add caching layer
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Cache frequently accessed data
await redis.setex(`config:${userId}`, 300, JSON.stringify(config))
```

### CDN Configuration
```bash
# Cloudflare/AWS CloudFront for:
- Static assets
- API responses (with proper cache headers)
- Extension updates
- Image optimization
```

## 📞 Support & Maintenance

### User Support
```
- Support email: support@yourdomain.com
- Documentation: https://docs.yourdomain.com
- Status page: https://status.yourdomain.com
- Community forum (optional)
```

### Maintenance Schedule
```
- Daily: Error log review
- Weekly: Performance metrics review
- Monthly: Security updates
- Quarterly: Feature updates
- Yearly: Infrastructure review
```

## 🎉 Success Metrics

### Key Performance Indicators (KPIs)
```
- User Adoption Rate
- Daily/Monthly Active Users
- Feature Usage Statistics
- User Retention Rate
- Revenue (if applicable)
- Customer Satisfaction Score
```

### Business Metrics
```
- Extension Downloads
- User Conversion Rate (Free to Premium)
- Support Ticket Volume
- App Store Rating
- User Feedback Sentiment
```

---

## 🚀 **Congratulations!**

আপনার **Server Controlled Chrome Extension** এখন production-ready এবং deploy করার জন্য সম্পূর্ণ প্রস্তুত! 

### 📊 **Project Summary:**
- ✅ **১৫/১৫ Tasks Completed**
- ✅ **Full-stack application**
- ✅ **Production-ready code**
- ✅ **Security best practices**
- ✅ **Comprehensive testing**
- ✅ **Complete documentation**

### 🎯 **Next Steps:**
1. Follow deployment guide
2. Test in production environment
3. Submit extension to Chrome Store
4. Monitor and scale as needed

**Your server-controlled extension system is now ready to serve real users!** 🌟

Happy coding and congratulations on building a complete, scalable, and production-ready application! 🎊
