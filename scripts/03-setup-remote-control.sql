-- Remote control tables for server-driven configuration and commands

-- Table: remote_config
-- Holds configuration overrides. If client_id is NULL, the row is treated as global default.
CREATE TABLE IF NOT EXISTS remote_config (
    id BIGSERIAL PRIMARY KEY,
    client_id TEXT NULL,
    auto_tab_switch BOOLEAN,
    number_formatting BOOLEAN,
    us_only BOOLEAN,
    exclude_toll_free BOOLEAN,
    next_tab_delay_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_remote_config_client_id ON remote_config(client_id);
CREATE INDEX IF NOT EXISTS idx_remote_config_updated_at ON remote_config(updated_at DESC);

ALTER TABLE remote_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on remote_config" ON remote_config FOR ALL USING (true);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_remote_config_updated_at ON remote_config;
CREATE TRIGGER set_remote_config_updated_at
BEFORE UPDATE ON remote_config
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- Table: remote_commands
-- Commands waiting to be executed by clients. If client_id is NULL, applies to all.
CREATE TABLE IF NOT EXISTS remote_commands (
    id BIGSERIAL PRIMARY KEY,
    client_id TEXT NULL,
    command TEXT NOT NULL, -- e.g., 'set_settings', 'switch_tab', 'refresh_badge', 'ping'
    payload JSONB NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processed'
    result TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_remote_commands_client_id ON remote_commands(client_id);
CREATE INDEX IF NOT EXISTS idx_remote_commands_status ON remote_commands(status);
CREATE INDEX IF NOT EXISTS idx_remote_commands_created_at ON remote_commands(created_at);

ALTER TABLE remote_commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on remote_commands" ON remote_commands FOR ALL USING (true);
