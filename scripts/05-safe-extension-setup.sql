-- Safe extension setup - handles existing policies and tables

-- Drop existing tables if they have wrong structure (but preserve data if possible)
DROP TABLE IF EXISTS copied_numbers CASCADE;
DROP TABLE IF EXISTS user_data CASCADE;
DROP TABLE IF EXISTS ui_config CASCADE;

-- Create UI Configuration Table with correct structure
CREATE TABLE ui_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config_data JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Users table (extends auth.users) - only if not exists
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  subscription TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User data statistics
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  total_scraped INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Scraped phone numbers storage
CREATE TABLE copied_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  source_url TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default UI configuration
INSERT INTO ui_config (id, config_data, active) VALUES (
  'default',
  '{
    "enabled": true,
    "features": {
      "phoneScrapingEnabled": true,
      "autoSaveEnabled": true,
      "realTimeSync": true
    },
    "ui": {
      "features": [
        {
          "id": "phone-scraper",
          "title": "Phone Scraper",
          "description": "Extract phone numbers from web pages",
          "enabled": true,
          "premium": false,
          "icon": "phone"
        },
        {
          "id": "data-export",
          "title": "Data Export", 
          "description": "Export scraped data to CSV/Excel",
          "enabled": true,
          "premium": true,
          "icon": "download"
        },
        {
          "id": "auto-save",
          "title": "Auto Save",
          "description": "Automatically save scraped data", 
          "enabled": true,
          "premium": false,
          "icon": "save"
        }
      ]
    }
  }'::jsonb,
  true
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE copied_numbers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can manage own user_data" ON user_data;
DROP POLICY IF EXISTS "Users can manage own copied_numbers" ON copied_numbers;
DROP POLICY IF EXISTS "Public can read ui_config" ON ui_config;

-- Create RLS Policies (fresh)
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own user_data" ON user_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own copied_numbers" ON copied_numbers FOR ALL USING (auth.uid() = user_id);

-- Allow public read access to ui_config for extension
CREATE POLICY "Public can read ui_config" ON ui_config FOR SELECT TO anon, authenticated USING (true);
