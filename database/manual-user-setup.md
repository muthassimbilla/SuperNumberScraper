# Manual User Setup - Step by Step

## Method 1: Supabase Auth Dashboard (Recommended)

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to **Authentication** → **Users**
3. Click **"Add user"**

### Step 2: Create Admin User
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Email Confirm:** ✅ Check this box
- Click **"Create user"**

### Step 3: Create Demo User
- **Email:** `user@example.com`
- **Password:** `user123`
- **Email Confirm:** ✅ Check this box
- Click **"Create user"**

### Step 4: Copy User IDs
1. After creating users, copy their UUIDs from the dashboard
2. Note down the UUIDs for both users

## Method 2: SQL Editor (Alternative)

### Step 1: Check if users already exist
Run this query in SQL Editor:
```sql
SELECT id, email FROM auth.users WHERE email IN ('admin@example.com', 'user@example.com');
```

### Step 2: If no users exist, create them manually
Go to Supabase Auth Dashboard and create users as described in Method 1.

### Step 3: After creating users, insert them into users table
Replace the UUIDs below with the actual ones from auth.users:

```sql
INSERT INTO users (
  id,
  email,
  subscription,
  subscription_expires_at,
  is_active,
  role,
  metadata,
  created_at,
  updated_at
) VALUES 
(
  'ACTUAL_ADMIN_UUID_FROM_AUTH_USERS',
  'admin@example.com',
  'premium',
  '2025-12-31T23:59:59Z',
  true,
  'admin',
  '{"name": "Admin User", "full_name": "Admin User", "registration_source": "demo"}',
  NOW(),
  NOW()
),
(
  'ACTUAL_USER_UUID_FROM_AUTH_USERS',
  'user@example.com',
  'free',
  NULL,
  true,
  'user',
  '{"name": "Demo User", "full_name": "Demo User", "registration_source": "demo"}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  subscription = EXCLUDED.subscription,
  is_active = EXCLUDED.is_active,
  role = EXCLUDED.role,
  updated_at = NOW();
```

## Method 3: Direct Database Insert (If Auth Dashboard fails)

### Step 1: Check your table structure
Run this query to see what columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

### Step 2: Insert users directly (if auth.users is not working)
```sql
-- Insert admin user directly
INSERT INTO users (
  id,
  email,
  subscription,
  subscription_expires_at,
  is_active,
  role,
  metadata,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@example.com',
  'premium',
  '2025-12-31T23:59:59Z',
  true,
  'admin',
  '{"name": "Admin User", "full_name": "Admin User", "registration_source": "demo"}',
  NOW(),
  NOW()
);

-- Insert demo user directly
INSERT INTO users (
  id,
  email,
  subscription,
  subscription_expires_at,
  is_active,
  role,
  metadata,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'user@example.com',
  'free',
  NULL,
  true,
  'user',
  '{"name": "Demo User", "full_name": "Demo User", "registration_source": "demo"}',
  NOW(),
  NOW()
);
```

## Troubleshooting

### If "Database error creating new user":
1. Check if your Supabase project is active
2. Verify your project settings
3. Check if there are any RLS policies blocking user creation
4. Try creating users with different emails
5. Check Supabase logs for more details

### If users exist but can't login:
1. Verify the users are in the `users` table
2. Check if `role` is set to `admin` for admin user
3. Verify `is_active` is `true`
4. Check if subscription is set correctly

### If still having issues:
1. Go to Supabase Dashboard → Settings → API
2. Check if your project is properly configured
3. Verify your environment variables are correct
4. Check the Supabase logs for detailed error messages

## Test Login

After setup, test with:
- **Admin:** `admin@example.com` / `admin123`
- **User:** `user@example.com` / `user123`
