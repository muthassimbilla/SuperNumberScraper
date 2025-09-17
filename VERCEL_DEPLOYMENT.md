# Vercel Deployment Guide

## Environment Variables Setup

Vercel Dashboard এ গিয়ে আপনার project এর Settings > Environment Variables এ যান এবং নিচের variables add করুন:

### Required Environment Variables:

**1. NEXT_PUBLIC_SUPABASE_URL**
\`\`\`
https://nvsaxbxbgwmqlxpiixid.supabase.co
\`\`\`

**2. NEXT_PUBLIC_SUPABASE_ANON_KEY**
\`\`\`
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52c2F4YnhiZ3dtcWx4cGlpeGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjU2OTcsImV4cCI6MjA3MzYwMTY5N30.lyOk4nvT1bp0ZCfCTxyrup9lc-BuxEIfD5ge78row4I
\`\`\`

**3. SUPABASE_SERVICE_ROLE_KEY**
\`\`\`
[আপনার Supabase Service Role Key এখানে দিন]
\`\`\`

**4. NEXTAUTH_URL**
\`\`\`
https://your-project-name.vercel.app
\`\`\`
(আপনার actual Vercel domain দিন)

**5. NEXTAUTH_SECRET**
\`\`\`
[একটি random secret generate করুন]
\`\`\`

**6. EXTENSION_DOMAIN**
\`\`\`
https://your-project-name.vercel.app
\`\`\`

## Deployment Steps:

1. **GitHub Repository তৈরি করুন**
   - আপনার code GitHub এ push করুন

2. **Vercel এ Import করুন**
   - Vercel Dashboard এ যান
   - "New Project" ক্লিক করুন
   - GitHub repository select করুন

3. **Environment Variables Set করুন**
   - Project Settings > Environment Variables
   - উপরের সব variables add করুন
   - Environment: Production, Preview, Development সব select করুন

4. **Deploy করুন**
   - "Deploy" button ক্লিক করুন

## Chrome Extension Update:

Deploy হওয়ার পর Chrome Extension এর popup.js file এ domain update করুন:

\`\`\`javascript
const API_BASE_URL = 'https://your-actual-domain.vercel.app';
\`\`\`

## Troubleshooting:

- যদি environment variable error আসে, Vercel Dashboard এ variables check করুন
- Build error হলে, logs check করুন
- Database connection issue হলে, Supabase credentials verify করুন

## Service Role Key পেতে:

1. Supabase Dashboard এ যান
2. Settings > API
3. "service_role" key copy করুন
4. Vercel environment variables এ add করুন
\`\`\`

```tsx file="" isHidden
