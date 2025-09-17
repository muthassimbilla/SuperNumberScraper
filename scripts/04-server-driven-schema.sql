-- Server-driven extension database schema
-- This creates the core tables for user management, UI configuration, and user data

-- Users table for authentication and subscription management
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL, -- Supabase Auth UID
  email TEXT UNIQUE NOT NULL,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UI configuration table for server-driven interface
CREATE TABLE IF NOT EXISTS ui_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  layout TEXT DEFAULT 'dashboard',
  features JSONB NOT NULL DEFAULT '[]',
  theme TEXT DEFAULT 'light',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User data table for storing per-user feature data
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(auth_id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL, -- Supabase Auth UID
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth_id = auth.uid());

-- User data policies
CREATE POLICY "Users can view own user_data" ON user_data
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own user_data" ON user_data
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own user_data" ON user_data
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own user_data" ON user_data
  FOR DELETE USING (user_id = auth.uid());

-- UI config is readable by all authenticated users
CREATE POLICY "Authenticated users can view active UI config" ON ui_config
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Admin policies
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage UI config" ON ui_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE auth_id = auth.uid()
    )
  );

-- Insert default UI configuration
INSERT INTO ui_config (version, layout, features, theme, is_active) VALUES (
  1,
  'dashboard',
  '[
    {
      "name": "phone_scraper",
      "title": "Phone Number Scraper",
      "type": "button",
      "premium": false,
      "icon": "phone"
    },
    {
      "name": "advanced_search",
      "title": "Advanced Search",
      "type": "search",
      "premium": true,
      "icon": "search"
    },
    {
      "name": "ai_assistant",
      "title": "AI Assistant",
      "type": "chat",
      "premium": true,
      "icon": "bot"
    },
    {
      "name": "export_data",
      "title": "Export Data",
      "type": "button",
      "premium": true,
      "icon": "download"
    }
  ]'::jsonb,
  'light',
  true
) ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_feature ON user_data(feature);
CREATE INDEX IF NOT EXISTS idx_ui_config_active ON ui_config(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_roles_auth_id ON admin_roles(auth_id);
