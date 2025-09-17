# 🎯 আপনার Exact Environment Variables 

## 📋 Vercel Dashboard এ এই Values গুলো Copy-Paste করুন

### ✅ Ready to Use Variables:

**1. NEXT_PUBLIC_SUPABASE_URL**
```
https://nvsaxbxbgwmqlxpiixid.supabase.co
```

**2. NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52c2F4YnhiZ3dtcWx4cGlpeGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjU2OTcsImV4cCI6MjA3MzYwMTY5N30.lyOk4nvT1bp0ZCfCTxyrup9lc-BuxEIfD5ge78row4I
```

**3. NEXTAUTH_URL**
```
https://super-number-scraper.vercel.app
```

**4. EXTENSION_DOMAIN**
```
https://super-number-scraper.vercel.app
```

---

## ⚠️ এই 2টি আপনাকে generate/collect করতে হবে:

### 🔑 SUPABASE_SERVICE_ROLE_KEY
**🔗 কিভাবে পাবেন:**
1. Supabase Dashboard এ যান: https://app.supabase.com
2. আপনার project (`nvsaxbxbgwmqlxpiixid`) select করুন
3. Settings → API যান
4. **service_role** key copy করুন (এটা anon key থেকে আলাদা এবং অনেক লম্বা)

### 🎲 NEXTAUTH_SECRET
**🔗 Generate করুন:**

**Option 1:** Terminal এ run করুন:
```bash
openssl rand -base64 32
```

**Option 2:** অনলাইনে generate করুন: https://generate-secret.vercel.app/32

**Option 3:** এই random string ব্যবহার করুন:
```
Kd8fJ9sL2mN4pQ6rS8tV0wX2yZ4aB6cD8eF0gH2jK4lM6nO8pR0sT2uV4wX6yZ8a
```

---

## 🚀 Vercel Dashboard এ Setup Steps:

### Step 1: Vercel Dashboard এ যান
- URL: https://vercel.com/dashboard
- আপনার `super-number-scraper` project select করুন

### Step 2: Environment Variables Add করুন
- **Settings** tab ক্লিক করুন
- **Environment Variables** section এ যান
- **Add New** button ক্লিক করুন

### Step 3: এক এক করে Variables Add করুন

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nvsaxbxbgwmqlxpiixid.supabase.co` | ✅ Production ✅ Preview ✅ Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Production ✅ Preview ✅ Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `[Supabase থেকে copy করুন]` | ✅ Production ✅ Preview ✅ Development |
| `NEXTAUTH_URL` | `https://super-number-scraper.vercel.app` | ✅ Production ✅ Preview ✅ Development |
| `NEXTAUTH_SECRET` | `[Generated secret]` | ✅ Production ✅ Preview ✅ Development |
| `EXTENSION_DOMAIN` | `https://super-number-scraper.vercel.app` | ✅ Production ✅ Preview ✅ Development |

### Step 4: Redeploy
- **Deployments** tab এ যান
- Latest deployment এর **...** menu ক্লিক করুন
- **Redeploy** select করুন

---

## ✅ Success Check

Deploy complete হওয়ার পর:
1. `https://super-number-scraper.vercel.app` visit করুন
2. Browser console check করুন (F12 → Console)
3. Environment variable errors না থাকলে ✅ success!

---

## 🎉 সব শেষ!

এই setup complete করার পর আপনার:
- ✅ Vercel deployment working হবে
- ✅ Supabase connection established হবে  
- ✅ Chrome extension properly connect হবে
- ✅ আর কোন environment variable error আসবে না

**Happy Coding! 🚀**
