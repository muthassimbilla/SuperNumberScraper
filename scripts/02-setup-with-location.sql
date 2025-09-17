-- Update existing table to add location column
ALTER TABLE copied_numbers ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- Create index on location for faster searching
CREATE INDEX IF NOT EXISTS idx_copied_numbers_location ON copied_numbers(location);

-- Update existing records with location data (you can run this after deploying the new extension)
-- This would need to be run manually or through a script since we can't extract area codes from stored numbers

-- Alternative: Create new table with location support
CREATE TABLE IF NOT EXISTS copied_numbers_with_location (
    id SERIAL PRIMARY KEY,
    number VARCHAR(20) NOT NULL UNIQUE,
    original_format VARCHAR(30), -- Store original format for reference
    location VARCHAR(100), -- Store city and state
    area_code VARCHAR(5), -- Store area code separately for indexing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_copied_numbers_location_number ON copied_numbers_with_location(number);
CREATE INDEX IF NOT EXISTS idx_copied_numbers_location_location ON copied_numbers_with_location(location);
CREATE INDEX IF NOT EXISTS idx_copied_numbers_location_area_code ON copied_numbers_with_location(area_code);
CREATE INDEX IF NOT EXISTS idx_copied_numbers_location_created_at ON copied_numbers_with_location(created_at);

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE copied_numbers_with_location ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
CREATE POLICY "Allow all operations on copied_numbers_with_location" ON copied_numbers_with_location
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
CREATE TRIGGER update_copied_numbers_with_location_updated_at
    BEFORE UPDATE ON copied_numbers_with_location
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- If you want to migrate existing data, you can use this query:
-- INSERT INTO copied_numbers_with_location (number, original_format, location, area_code, created_at)
-- SELECT number, original_format, 
--        CASE 
--            WHEN LEFT(number, 3) = '504' THEN 'New Orleans, LA'
--            WHEN LEFT(number, 3) = '985' THEN 'Houma, LA'
--            -- Add more cases as needed
--            ELSE 'Unknown Location'
--        END as location,
--        LEFT(number, 3) as area_code,
--        created_at
-- FROM copied_numbers
-- ON CONFLICT (number) DO NOTHING;
