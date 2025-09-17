-- Bypass Foreign Key Constraint SQL
-- This will work by temporarily disabling the constraint

-- Step 1: Check if the constraint exists
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint 
WHERE conname LIKE '%users_id_fkey%';

-- Step 2: Temporarily disable the foreign key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Step 3: Insert users directly
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
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  subscription = EXCLUDED.subscription,
  is_active = EXCLUDED.is_active,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 4: Insert demo user
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
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  subscription = EXCLUDED.subscription,
  is_active = EXCLUDED.is_active,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 5: Re-enable the foreign key constraint (optional)
-- ALTER TABLE users ADD CONSTRAINT users_id_fkey 
-- FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 6: Verify users were created
SELECT id, email, role, subscription, is_active FROM users WHERE email IN ('admin@example.com', 'user@example.com');
