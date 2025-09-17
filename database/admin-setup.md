# Admin User Setup Instructions

## Method 1: Supabase Dashboard (Recommended)

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to **Authentication** → **Users**
3. Click **"Add user"**

### Step 2: Create Admin User
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Email Confirm:** ✅ Check this box
- Click **"Create user"**

### Step 3: Update User Role
1. Go to **Table Editor** → **users** table
2. Find the user you just created
3. Update the **role** field to `admin`
4. Set **subscription** to `premium`
5. Set **is_active** to `true`

## Method 2: SQL Editor

### Step 1: Run Demo Data SQL
1. Go to **SQL Editor** in Supabase
2. Copy and paste the content from `demo-data.sql`
3. Click **"Run"**

### Step 2: Create Auth Users
Run this SQL in the SQL Editor:

```sql
-- Create admin user in auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  'admin-user-id-123',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin User", "full_name": "Admin User"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create demo user in auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  'demo-user-id-456',
  'user@example.com',
  crypt('user123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Demo User", "full_name": "Demo User"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;
```

## Method 3: Environment Variables

Add these to your Vercel environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
```

## Test Login

After setup, test with:
- **Admin:** `admin@example.com` / `admin123`
- **User:** `user@example.com` / `user123`

## Troubleshooting

### If still getting "Invalid login credentials":
1. Check if user exists in **Authentication** → **Users**
2. Verify email is confirmed
3. Check if user exists in **users** table with correct role
4. Verify Supabase environment variables are set correctly

### If getting "User profile not found":
1. Make sure user exists in **users** table
2. Check if **role** field is set to `admin`
3. Verify **is_active** is `true`
