-- Demo Data for Server Controlled Extension
-- Run this SQL in your Supabase SQL Editor

-- Insert Admin User
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

-- Insert Demo Regular User
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

-- Insert Demo Features
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
),
(
  '00000000-0000-0000-0000-000000000012',
  'data_sync',
  'Data Sync',
  'Synchronize data across devices',
  'toggle',
  false,
  true,
  true,
  '{"autoSync": true}',
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000013',
  'custom_themes',
  'Custom Themes',
  'Customize appearance with themes',
  'button',
  true,
  false,
  true,
  '{"themes": ["light", "dark", "auto"]}',
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000014',
  'analytics',
  'Analytics',
  'View usage analytics and insights',
  'display',
  true,
  true,
  true,
  '{"showCharts": true}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  enabled = EXCLUDED.enabled,
  updated_at = NOW();

-- Insert Demo Extension Config
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
    },
    {
      "id": "00000000-0000-0000-0000-000000000012",
      "name": "data_sync",
      "title": "Data Sync",
      "type": "toggle",
      "premium": false,
      "enabled": true,
      "description": "Sync across devices"
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

-- Insert Demo User Data
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
  '00000000-0000-0000-0000-000000000002',
  'note_taking',
  '{"content": "You can organize your thoughts, ideas, and important information here.", "type": "note", "timestamp": "2025-01-15T11:00:00Z"}',
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000032',
  '00000000-0000-0000-0000-000000000001',
  'note_taking',
  '{"content": "Admin note: System is running smoothly.", "type": "note", "timestamp": "2025-01-15T09:00:00Z"}',
  NOW(),
  NOW()
);

-- Insert Demo Logs
INSERT INTO logs (
  id,
  level,
  message,
  user_id,
  feature,
  metadata,
  timestamp
) VALUES 
(
  '00000000-0000-0000-0000-000000000040',
  'info',
  'User registered successfully',
  '00000000-0000-0000-0000-000000000002',
  'auth',
  '{"ip": "127.0.0.1", "user_agent": "Mozilla/5.0"}',
  NOW()
),
(
  '00000000-0000-0000-0000-000000000041',
  'info',
  'Admin logged in',
  '00000000-0000-0000-0000-000000000001',
  'auth',
  '{"ip": "127.0.0.1", "user_agent": "Mozilla/5.0"}',
  NOW()
),
(
  '00000000-0000-0000-0000-000000000042',
  'info',
  'Feature executed: note_taking',
  '00000000-0000-0000-0000-000000000002',
  'note_taking',
  '{"action": "save", "success": true}',
  NOW()
),
(
  '00000000-0000-0000-0000-000000000043',
  'info',
  'Extension config requested',
  '00000000-0000-0000-0000-000000000002',
  'config',
  '{"config_id": "00000000-0000-0000-0000-000000000020", "version": "1.0.0"}',
  NOW()
);

-- Insert Demo Subscriptions
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

-- Insert Demo System Settings
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
  'max_notes_per_user',
  '1000',
  'number',
  'Maximum notes per user',
  false,
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000062',
  'enable_registration',
  'true',
  'boolean',
  'Allow new user registration',
  true,
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000063',
  'maintenance_mode',
  'false',
  'boolean',
  'Enable maintenance mode',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Create Admin User in Supabase Auth (if not exists)
-- Note: You need to create this user manually in Supabase Auth dashboard
-- Email: admin@example.com
-- Password: admin123
-- Or use this SQL to create via Supabase Admin API:

-- Insert admin user in auth.users (if you have access)
-- INSERT INTO auth.users (
--   id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   raw_app_meta_data,
--   raw_user_meta_data,
--   is_super_admin,
--   role
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'admin@example.com',
--   crypt('admin123', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW(),
--   '{"provider": "email", "providers": ["email"]}',
--   '{"name": "Admin User", "full_name": "Admin User"}',
--   false,
--   'authenticated'
-- ) ON CONFLICT (id) DO NOTHING;

-- Insert demo user in auth.users (if you have access)
-- INSERT INTO auth.users (
--   id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   raw_app_meta_data,
--   raw_user_meta_data,
--   is_super_admin,
--   role
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000002',
--   'user@example.com',
--   crypt('user123', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW(),
--   '{"provider": "email", "providers": ["email"]}',
--   '{"name": "Demo User", "full_name": "Demo User"}',
--   false,
--   'authenticated'
-- ) ON CONFLICT (id) DO NOTHING;

-- Update RLS policies to allow access
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for user_data table
CREATE POLICY "Users can view their own data" ON user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data" ON user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data" ON user_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data" ON user_data
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for extension_configs table
CREATE POLICY "Anyone can view global configs" ON extension_configs
  FOR SELECT USING (user_id IS NULL);

CREATE POLICY "Users can view their own configs" ON extension_configs
  FOR SELECT USING (auth.uid() = user_id);

-- Create policies for features table
CREATE POLICY "Anyone can view active features" ON features
  FOR SELECT USING (is_active = true);

-- Create policies for subscriptions table
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Create policies for logs table (admin only)
CREATE POLICY "Admins can view all logs" ON logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for system_settings table
CREATE POLICY "Anyone can view public settings" ON system_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can view all settings" ON system_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
