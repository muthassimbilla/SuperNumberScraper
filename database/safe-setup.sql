-- Safe Setup SQL for Server Controlled Extension
-- This will work without any conflicts

-- Step 1: Clear existing data (optional - only if you want fresh start)
-- DELETE FROM system_settings WHERE key IN ('app_name', 'enable_registration');
-- DELETE FROM extension_configs WHERE id = '00000000-0000-0000-0000-000000000020';
-- DELETE FROM features WHERE name IN ('note_taking', 'pdf_export');

-- Step 2: Insert/Update Demo Features
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
) ON CONFLICT (name) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  enabled = EXCLUDED.enabled,
  is_active = EXCLUDED.is_active,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Step 3: Insert/Update Extension Config
INSERT INTO extension_configs (
  id,
  user_id,
  title,
  version,
  theme,
  layout,
  features,
  badge,
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
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  features = EXCLUDED.features,
  theme = EXCLUDED.theme,
  layout = EXCLUDED.layout,
  badge = EXCLUDED.badge,
  updated_at = NOW();

-- Step 4: Insert/Update System Settings
INSERT INTO system_settings (
  id,
  key,
  value,
  type,
  description,
  is_public
) VALUES 
(
  '00000000-0000-0000-0000-000000000060',
  'app_name',
  'Smart Notes',
  'string',
  'Application name',
  true
),
(
  '00000000-0000-0000-0000-000000000061',
  'enable_registration',
  'true',
  'boolean',
  'Allow new user registration',
  true
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public;

-- Step 5: Check if users exist in auth.users
-- Run this query to see existing users:
-- SELECT id, email FROM auth.users WHERE email IN ('admin@example.com', 'user@example.com');

-- If no users exist, create them in Supabase Auth Dashboard first:
-- 1. Go to Authentication > Users
-- 2. Add user: admin@example.com / admin123
-- 3. Add user: user@example.com / user123
-- 4. Copy their UUIDs

-- Step 6: After creating users in auth.users, insert them into users table
-- Replace the UUIDs below with the actual ones from auth.users:

-- INSERT INTO users (
--   id,
--   email,
--   subscription,
--   subscription_expires_at,
--   is_active,
--   role,
--   metadata,
--   created_at,
--   updated_at
-- ) VALUES 
-- (
--   'ACTUAL_ADMIN_UUID_FROM_AUTH_USERS',
--   'admin@example.com',
--   'premium',
--   '2025-12-31T23:59:59Z',
--   true,
--   'admin',
--   '{"name": "Admin User", "full_name": "Admin User", "registration_source": "demo"}',
--   NOW(),
--   NOW()
-- ),
-- (
--   'ACTUAL_USER_UUID_FROM_AUTH_USERS',
--   'user@example.com',
--   'free',
--   NULL,
--   true,
--   'user',
--   '{"name": "Demo User", "full_name": "Demo User", "registration_source": "demo"}',
--   NOW(),
--   NOW()
-- ) ON CONFLICT (id) DO UPDATE SET
--   email = EXCLUDED.email,
--   subscription = EXCLUDED.subscription,
--   is_active = EXCLUDED.is_active,
--   role = EXCLUDED.role,
--   updated_at = NOW();
