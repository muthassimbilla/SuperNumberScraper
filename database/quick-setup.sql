-- Quick Setup SQL for Server Controlled Extension
-- Run this in Supabase SQL Editor step by step

-- IMPORTANT: First create users in Supabase Auth Dashboard, then run this SQL
-- Step 1: Create users in Supabase Auth Dashboard first:
-- 1. Go to Authentication > Users
-- 2. Add user: admin@example.com / admin123
-- 3. Add user: user@example.com / user123
-- 4. Copy their UUIDs from the dashboard
-- 5. Replace the UUIDs below with the actual ones from auth.users

-- Step 2: Insert Admin User (replace UUID with actual one from auth.users)
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
  'REPLACE_WITH_ADMIN_UUID_FROM_AUTH_USERS',
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

-- Step 3: Insert Demo User (replace UUID with actual one from auth.users)
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
  'REPLACE_WITH_USER_UUID_FROM_AUTH_USERS',
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

-- Step 3: Insert Demo Features
INSERT INTO features (
  id,
  name,
  title,
  description,
  type,
  premium,
  enabled,
  is_active,
  settings,
  created_at,
  updated_at
) VALUES 
(
  '00000000-0000-0000-0000-000000000010',
  'note_taking',
  'Note Taking',
  'Take and save notes with rich text editor',
  'editor',
  false,
  true,
  true,
  '{"maxLength": 10000, "placeholder": "Enter your notes here..."}',
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000011',
  'pdf_export',
  'PDF Export',
  'Export content as PDF with custom formatting',
  'button',
  true,
  true,
  true,
  '{"format": "A4", "quality": "high"}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  enabled = EXCLUDED.enabled,
  updated_at = NOW();

-- Step 4: Insert Extension Config
INSERT INTO extension_configs (
  id,
  user_id,
  title,
  version,
  theme,
  layout,
  features,
  badge,
  supabase,
  is_active,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000020',
  NULL, -- Global config
  'Smart Notes - Server Controlled Extension',
  '1.0.0',
  'light',
  'default',
  '[
    {
      "id": "00000000-0000-0000-0000-000000000010",
      "name": "note_taking",
      "title": "Note Taking",
      "type": "editor",
      "premium": false,
      "enabled": true,
      "description": "Take and save notes",
      "placeholder": "Enter your notes here...",
      "buttonLabel": "Save Note"
    },
    {
      "id": "00000000-0000-0000-0000-000000000011",
      "name": "pdf_export",
      "title": "PDF Export",
      "type": "button",
      "premium": true,
      "enabled": true,
      "description": "Export as PDF",
      "buttonLabel": "Export PDF"
    }
  ]',
  '{"enabled": true, "text": "", "color": "#2196F3"}',
  '{"url": "", "anonKey": ""}',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Step 5: Insert Demo User Data
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

-- Step 6: Insert Demo Subscriptions
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

-- Step 7: Insert System Settings
INSERT INTO system_settings (
  id,
  key,
  value,
  type,
  description,
  is_public,
  created_at,
  updated_at
) VALUES 
(
  '00000000-0000-0000-0000-000000000060',
  'app_name',
  'Smart Notes',
  'string',
  'Application name',
  true,
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000061',
  'enable_registration',
  'true',
  'boolean',
  'Allow new user registration',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
