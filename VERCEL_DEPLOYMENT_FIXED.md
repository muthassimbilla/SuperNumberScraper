# ✅ Vercel Deployment Guide (সমস্যা সমাধান সহ)

## 🚨 Environment Variable সমস্যার সমাধান

**সমস্যা:** `Environment Variable "NEXT_PUBLIC_SUPABASE_URL" references Secret "supabase-url", which does not exist.`

**সমাধান:** আমি `vercel.json` থেকে env section টি remove করেছি। এখন environment variables গুলো **অবশ্যই** Vercel Dashboard থেকে manually set করতে হবে।

---

## 🚀 Step-by-Step Deployment Process

### ধাপ ১: Vercel Dashboard এ Environment Variables Set করুন

**🔗 যান:** Vercel Dashboard → আপনার Project → Settings → Environment Variables

নিচের variables গুলো **একে একে** add করুন:

| Variable Name | Example Value | কোথা থেকে পাবেন |
|---------------|---------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | Supabase Dashboard → Settings → API (anon public) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | Supabase Dashboard → Settings → API (service_role) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | আপনার Vercel domain |
| `NEXTAUTH_SECRET` | `your_random_secret_here` | Random string generate করুন |

### ধাপ ২: Environment Settings

প্রতিটি variable এর জন্য:
- ✅ **Production** চেক করুন
- ✅ **Preview** চেক করুন  
- ✅ **Development** চেক করুন

### ধাপ ৩: Supabase Keys কিভাবে পাবেন

1. **Supabase Dashboard** এ যান: https://app.supabase.com
2. আপনার **Project** select করুন
3. বাম পাশে **Settings** ক্লিক করুন
4. **API** page এ যান
5. **Project URL** copy করুন → `NEXT_PUBLIC_SUPABASE_URL`
6. **anon public** key copy করুন → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. **service_role** key copy করুন → `SUPABASE_SERVICE_ROLE_KEY`

### ধাপ ৪: NEXTAUTH_SECRET Generate করুন

**Terminal এ run করুন:**
```bash
openssl rand -base64 32
```

**অথবা** অনলাইনে generate করুন: https://generate-secret.vercel.app/32

### ধাপ ৫: Deploy & Test

1. **Deployments** tab এ যান
2. **Redeploy** করুন latest deployment টি
3. Deploy complete হওয়ার পর site visit করুন
4. Console check করুন errors এর জন্য

---

## 🔧 Troubleshooting

### ❌ Still getting environment variable errors?

**Check করুন:**
1. ✅ Variables সঠিকভাবে named হয়েছে কিনা
2. ✅ Values এ extra spaces নেই কিনা  
3. ✅ All environments (Production/Preview/Development) selected আছে কিনা
4. ✅ Redeploy করেছেন কিনা

### ❌ Supabase connection issues?

**Verify করুন:**
1. ✅ Supabase URL format: `https://xxxxx.supabase.co`
2. ✅ Keys contain proper JWT format (শুরু হয় `eyJ` দিয়ে)
3. ✅ Service role key ≠ Anon key
4. ✅ Supabase project active আছে কিনা

### ❌ Chrome Extension not working?

**Update করুন:**
1. `chrome-extension/popup.js` file এ
2. `API_BASE_URL` কে আপনার Vercel domain দিয়ে replace করুন
3. Extension reload করুন Chrome এ

---

## 📁 Reference Files

- `environment-variables-example.txt` - Environment variables এর complete list
- `vercel.json` - Updated configuration (env section removed)
- এই guide - সম্পূর্ণ deployment process

---

## ✅ Success Checklist

Deploy করার পর check করুন:

- [ ] ✅ Site loads without errors
- [ ] ✅ Supabase connection working  
- [ ] ✅ Authentication working
- [ ] ✅ Chrome extension connects properly
- [ ] ✅ Database operations working
- [ ] ✅ No console errors

---

**🎉 সব কিছু ঠিক হয়ে গেলে আপনার app Vercel এ successfully deployed হবে!**
