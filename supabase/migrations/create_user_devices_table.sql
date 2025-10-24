-- Create user_devices table to track logged-in devices
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  user_agent TEXT,
  platform TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one device per user (single device policy)
  CONSTRAINT unique_user_device UNIQUE (user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON user_devices(device_fingerprint);

-- Enable Row Level Security
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own device records
CREATE POLICY "Users can read own devices"
  ON user_devices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own device records
CREATE POLICY "Users can insert own devices"
  ON user_devices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own device records
CREATE POLICY "Users can update own devices"
  ON user_devices
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own device records
CREATE POLICY "Users can delete own devices"
  ON user_devices
  FOR DELETE
  USING (auth.uid() = user_id);
