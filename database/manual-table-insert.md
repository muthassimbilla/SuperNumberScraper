# Manual Table Insert - Step by Step

## Method 1: Supabase Table Editor (Recommended)

### Step 1: Go to Table Editor
1. Open your Supabase project dashboard
2. Go to **Table Editor** → **users** table
3. Click **"Insert"** button

### Step 2: Insert Admin User
Fill in these fields:
- **id:** `00000000-0000-0000-0000-000000000001`
- **email:** `admin@example.com`
- **subscription:** `premium`
- **subscription_expires_at:** `2025-12-31T23:59:59Z`
- **is_active:** `true`
- **role:** `admin`
- **metadata:** `{"name": "Admin User", "full_name": "Admin User", "registration_source": "demo"}`
- **created_at:** `NOW()`
- **updated_at:** `NOW()`

### Step 3: Insert Demo User
Fill in these fields:
- **id:** `00000000-0000-0000-0000-000000000002`
- **email:** `user@example.com`
- **subscription:** `free`
- **subscription_expires_at:** `NULL`
- **is_active:** `true`
- **role:** `user`
- **metadata:** `{"name": "Demo User", "full_name": "Demo User", "registration_source": "demo"}`
- **created_at:** `NOW()`
- **updated_at:** `NOW()`

## Method 2: SQL Editor with Constraint Disabled

### Step 1: Disable Foreign Key Constraint
Run this in SQL Editor:
```sql
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;
```

### Step 2: Insert Users
Run this in SQL Editor:
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

### Step 3: Re-enable Constraint (Optional)
```sql
ALTER TABLE users ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

## Method 3: Check Table Structure First

### Step 1: Check what columns exist
Run this query:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

### Step 2: Check constraints
Run this query:
```sql
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint 
WHERE conrelid::regclass = 'users'::regclass;
```

## Method 4: Use Different UUIDs

### Step 1: Generate new UUIDs
Use online UUID generator or run:
```sql
SELECT gen_random_uuid();
```

### Step 2: Insert with new UUIDs
Replace the UUIDs in the insert statements with the generated ones.

## Troubleshooting

### If still getting foreign key errors:
1. Check if the constraint exists
2. Try disabling it temporarily
3. Use different UUIDs
4. Check if auth.users table exists

### If users are created but can't login:
1. Verify the users are in the users table
2. Check if role is set to 'admin' for admin user
3. Verify is_active is true
4. Check if subscription is set correctly

## Test Login

After setup, test with:
- **Admin:** `admin@example.com` / `admin123`
- **User:** `user@example.com` / `user123`
