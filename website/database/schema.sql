-- Server Controlled Extension Database Schema
-- This schema defines all tables needed for the server-controlled Chrome extension system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    subscription TEXT DEFAULT 'free' CHECK (subscription IN ('free', 'premium')),
    subscription_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User data table (stores user-specific data for each feature)
CREATE TABLE IF NOT EXISTS user_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extension configurations table
CREATE TABLE IF NOT EXISTS extension_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for global config
    title TEXT NOT NULL DEFAULT 'Extension',
    version TEXT NOT NULL DEFAULT '1.0.0',
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    layout TEXT DEFAULT 'default',
    features JSONB NOT NULL DEFAULT '[]',
    badge JSONB DEFAULT '{"enabled": false}',
    supabase_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Features table (master list of available features)
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('button', 'editor', 'display', 'input', 'toggle')),
    premium BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('free', 'premium')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    payment_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System logs table
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
    message TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    feature TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks configuration table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    type TEXT DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for global notifications
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Themes table
CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    colors JSONB NOT NULL DEFAULT '{}',
    components JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Layouts table
CREATE TABLE IF NOT EXISTS layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    structure JSONB NOT NULL DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics/Usage tracking table
CREATE TABLE IF NOT EXISTS usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_feature ON user_data(feature);
CREATE INDEX IF NOT EXISTS idx_user_data_created_at ON user_data(created_at);

CREATE INDEX IF NOT EXISTS idx_extension_configs_user_id ON extension_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_configs_is_active ON extension_configs(is_active);

CREATE INDEX IF NOT EXISTS idx_features_name ON features(name);
CREATE INDEX IF NOT EXISTS idx_features_premium ON features(premium);
CREATE INDEX IF NOT EXISTS idx_features_enabled ON features(enabled);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);

CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_feature ON usage_analytics(feature);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_timestamp ON usage_analytics(timestamp);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_user_data BEFORE UPDATE ON user_data FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_extension_configs BEFORE UPDATE ON extension_configs FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_features BEFORE UPDATE ON features FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_subscriptions BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_webhooks BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_themes BEFORE UPDATE ON themes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_layouts BEFORE UPDATE ON layouts FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Row Level Security (RLS) Policies

-- Users table RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);

-- Users can update their own data (except sensitive fields)
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- User data table RLS
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can manage own data" ON user_data FOR ALL USING (auth.uid() = user_id);

-- Admins can view all user data
CREATE POLICY "Admins can view all user data" ON user_data FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Extension configs table RLS
ALTER TABLE extension_configs ENABLE ROW LEVEL SECURITY;

-- Users can view their own configs and global configs
CREATE POLICY "Users can view configs" ON extension_configs FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL
);

-- Only admins can modify configs
CREATE POLICY "Admins can manage configs" ON extension_configs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Features table RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Everyone can read active features
CREATE POLICY "Users can view active features" ON features FOR SELECT USING (is_active = true);

-- Only admins can modify features
CREATE POLICY "Admins can manage features" ON features FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Subscriptions table RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions" ON subscriptions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Logs table RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view own logs" ON logs FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all logs" ON logs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Notifications table RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications and global notifications
CREATE POLICY "Users can view notifications" ON notifications FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL
);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications" ON notifications FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Public read access for some tables
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to active themes" ON themes FOR SELECT USING (is_active = true);

ALTER TABLE layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to active layouts" ON layouts FOR SELECT USING (is_active = true);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to public settings" ON system_settings FOR SELECT USING (is_public = true);

-- Admin-only tables
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only webhooks" ON webhooks FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- File uploads RLS
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own files" ON file_uploads FOR ALL USING (auth.uid() = user_id);

-- Usage analytics RLS
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own analytics" ON usage_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all analytics" ON usage_analytics FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Insert default data

-- Default admin user (will be created via API)
-- INSERT INTO users (id, email, role, subscription, is_active)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'admin', 'premium', true)
-- ON CONFLICT (id) DO NOTHING;

-- Default global extension config
INSERT INTO extension_configs (user_id, title, version, theme, layout, features, badge, supabase_config, is_active)
VALUES (
    NULL, -- Global config
    'Server Controlled Extension',
    '1.0.0',
    'light',
    'default',
    '[
        {
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
            "name": "pdf_export",
            "title": "PDF Export",
            "type": "button",
            "premium": true,
            "enabled": true,
            "description": "Export content as PDF",
            "label": "Export PDF"
        }
    ]'::jsonb,
    '{"enabled": true, "text": "", "color": "#2196F3"}'::jsonb,
    '{}'::jsonb,
    true
) ON CONFLICT (id) DO NOTHING;

-- Default features
INSERT INTO features (name, title, description, type, premium, enabled, settings)
VALUES 
    ('note_taking', 'Note Taking', 'Take and save notes', 'editor', false, true, '{"maxLength": 10000}'::jsonb),
    ('pdf_export', 'PDF Export', 'Export content as PDF', 'button', true, true, '{"format": "A4"}'::jsonb),
    ('data_sync', 'Data Sync', 'Sync data across devices', 'toggle', false, true, '{}'::jsonb),
    ('custom_themes', 'Custom Themes', 'Customize appearance', 'button', true, true, '{}'::jsonb),
    ('analytics', 'Analytics', 'View usage analytics', 'display', true, true, '{}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Default themes
INSERT INTO themes (name, colors, components, is_active)
VALUES 
    ('light', '{"primary": "#2196F3", "secondary": "#FFC107", "background": "#FFFFFF", "text": "#212121"}'::jsonb, '{}'::jsonb, true),
    ('dark', '{"primary": "#2196F3", "secondary": "#FFC107", "background": "#121212", "text": "#FFFFFF"}'::jsonb, '{}'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- Default layouts
INSERT INTO layouts (name, description, structure, is_active)
VALUES 
    ('default', 'Default layout with header and content', '[{"type": "header"}, {"type": "content"}, {"type": "footer"}]'::jsonb, true),
    ('minimal', 'Minimal layout with just content', '[{"type": "content"}]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- Default system settings
INSERT INTO system_settings (key, value, type, description, is_public)
VALUES 
    ('app_name', 'Server Controlled Extension', 'string', 'Application name', true),
    ('app_version', '1.0.0', 'string', 'Application version', true),
    ('maintenance_mode', 'false', 'boolean', 'Maintenance mode status', true),
    ('max_users', '1000', 'number', 'Maximum number of users', false),
    ('default_subscription', 'free', 'string', 'Default subscription type', false)
ON CONFLICT (key) DO NOTHING;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, subscription, is_active, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        'free', 
        true,
        CASE WHEN NEW.email = 'admin@example.com' THEN 'admin' ELSE 'user' END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Create function to check subscription status
CREATE OR REPLACE FUNCTION check_premium_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_subscription TEXT;
    subscription_expires TIMESTAMPTZ;
BEGIN
    SELECT subscription, subscription_expires_at
    INTO user_subscription, subscription_expires
    FROM users
    WHERE id = user_uuid;
    
    IF user_subscription = 'premium' THEN
        IF subscription_expires IS NULL OR subscription_expires > NOW() THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_feature TEXT,
    p_action TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_analytics (user_id, feature, action, metadata)
    VALUES (p_user_id, p_feature, p_action, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
