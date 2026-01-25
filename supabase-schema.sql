-- Word of Tomorrow Database Schema
-- Run this in your Supabase SQL Editor

-- Create words table
CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  pronunciation TEXT,
  part_of_speech TEXT,
  definition TEXT,
  example TEXT,
  origin TEXT,
  illustration_url TEXT,
  audio_base64 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  votes INTEGER DEFAULT 0
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  definition TEXT,
  "user" TEXT,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_words_scheduled_date ON words(scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_words_status ON words(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Allow public read access to published words" ON words
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow public read access to submissions" ON submissions
  FOR SELECT USING (true);

-- Create policies to allow authenticated insert/update/delete (you can adjust based on your auth setup)
-- For now, allowing all operations for testing - ADJUST THIS FOR PRODUCTION
CREATE POLICY "Allow all operations on words" ON words
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on submissions" ON submissions
  FOR ALL USING (true);
