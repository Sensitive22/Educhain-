/*
  # Create lectures table for storing teacher uploads

  1. New Tables
    - `lectures`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `thumbnail_cid` (text, IPFS CID - optional)
      - `video_cid` (text, IPFS CID - required)
      - `pricing_model` (text: 'free', 'subscription', 'rent')
      - `currency` (text: 'inr', 'crypto')
      - `price` (numeric - optional)
      - `rent_duration` (integer - optional, in days)
      - `status` (text: 'draft', 'published' - default 'draft')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `lectures` table
    - Add policy for users to read all lectures (public view)
    - Add policy for users to insert their own lectures
    - Add policy for users to update/delete their own lectures
*/

CREATE TABLE IF NOT EXISTS lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  category text,
  thumbnail_cid text,
  video_cid text NOT NULL,
  pricing_model text DEFAULT 'free' CHECK (pricing_model IN ('free', 'subscription', 'rent')),
  currency text DEFAULT 'inr' CHECK (currency IN ('inr', 'crypto')),
  price numeric DEFAULT 0,
  rent_duration integer DEFAULT 30,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lectures_user_id ON lectures(user_id);
CREATE INDEX IF NOT EXISTS idx_lectures_created_at ON lectures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lectures_category ON lectures(category);

ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published lectures"
  ON lectures FOR SELECT
  USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own lectures"
  ON lectures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lectures"
  ON lectures FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lectures"
  ON lectures FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
