-- Direct User Insert SQL
-- Use this if Supabase Auth Dashboard is not working

-- Step 1: Insert admin user directly into users table
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

-- Step 2: Insert demo user directly into users table
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

-- Step 3: Insert demo user data
INSERT INTO user_data (
  id,
  user_id,
  feature,
  data,
  created_at,
  updated_at
) VALUES 
(
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000002',
  'note_taking',
  '{"content": "Welcome to Smart Notes! This is your first note.", "type": "note", "timestamp": "2025-01-15T10:30:00Z"}',
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000031',
  '00000000-0000-0000-0000-000000000001',
  'note_taking',
  '{"content": "Admin note: System is running smoothly.", "type": "note", "timestamp": "2025-01-15T09:00:00Z"}',
  NOW(),
  NOW()
);

-- Step 4: Insert demo subscriptions
INSERT INTO subscriptions (
  id,
  user_id,
  plan,
  status,
  starts_at,
  expires_at,
  created_at,
  updated_at
) VALUES 
(
  '00000000-0000-0000-0000-000000000050',
  '00000000-0000-0000-0000-000000000001',
  'premium',
  'active',
  '2025-01-01T00:00:00Z',
  '2025-12-31T23:59:59Z',
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000051',
  '00000000-0000-0000-0000-000000000002',
  'free',
  'active',
  '2025-01-15T00:00:00Z',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- Step 5: Verify users were created
SELECT id, email, role, subscription, is_active FROM users WHERE email IN ('admin@example.com', 'user@example.com');
