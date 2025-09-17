-- Create the table for storing copied phone numbers
CREATE TABLE copied_numbers (
    id SERIAL PRIMARY KEY,
    number VARCHAR(20) NOT NULL UNIQUE,
    original_format VARCHAR(30), -- Store original format for reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the number column for faster lookups
CREATE INDEX idx_copied_numbers_number ON copied_numbers(number);

-- Create an index on created_at for sorting
CREATE INDEX idx_copied_numbers_created_at ON copied_numbers(created_at);

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE copied_numbers ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- You can modify this based on your security requirements
CREATE POLICY "Allow all operations on copied_numbers" ON copied_numbers
    FOR ALL USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_copied_numbers_updated_at
    BEFORE UPDATE ON copied_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
-- INSERT INTO copied_numbers (number) VALUES 
-- ('(555) 123-4567'),
-- ('555-987-6543'),
-- ('+1 (555) 555-5555');
