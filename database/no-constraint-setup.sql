-- No Constraint Setup SQL
-- This will work without foreign key constraints

-- Step 1: Insert users directly (assuming constraint is already disabled)
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

-- Step 2: Insert demo user
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

-- Step 3: Insert demo features
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

-- Step 4: Insert extension config
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

-- Step 5: Insert system settings
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

-- Step 6: Insert demo user data
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

-- Step 7: Insert demo subscriptions
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

-- Step 8: Verify everything was created
SELECT 'Users created:' as status;
SELECT id, email, role, subscription, is_active FROM users WHERE email IN ('admin@example.com', 'user@example.com');

SELECT 'Features created:' as status;
SELECT name, title, enabled FROM features WHERE name IN ('note_taking', 'pdf_export');

SELECT 'Config created:' as status;
SELECT title, version, is_active FROM extension_configs WHERE id = '00000000-0000-0000-0000-000000000020';
