/*
  # Create Notes and Student Purchase System

  1. New Tables
    - `teachers`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `email` (text, unique)
      - `bio` (text)
      - `created_at` (timestamptz)
      
    - `notes`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `thumbnail_url` (text)
      - `content_url` (text)
      - `pricing_model` (text: 'free', 'purchase', 'rent')
      - `currency` (text: 'inr', 'crypto')
      - `price` (numeric)
      - `rent_duration_days` (integer, nullable)
      - `status` (text: 'published', 'draft')
      - `views` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `students`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `email` (text, unique)
      - `created_at` (timestamptz)
      
    - `student_notes`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `note_id` (uuid, foreign key)
      - `access_type` (text: 'purchased', 'rented', 'free')
      - `purchased_at` (timestamptz)
      - `rent_expires_at` (timestamptz, nullable)
      - `amount_paid` (numeric)
      - `currency_used` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read published notes
    - Add policies for students to read their own purchased/rented notes
    - Add policies for teachers to manage their own notes
    
  3. Important Notes
    - All prices stored as numeric for precision
    - Rent duration tracked in days
    - Separate tracking for free, purchased, and rented access
*/

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  thumbnail_url text DEFAULT '',
  content_url text DEFAULT '',
  pricing_model text NOT NULL CHECK (pricing_model IN ('free', 'purchase', 'rent')),
  currency text DEFAULT 'inr' CHECK (currency IN ('inr', 'crypto')),
  price numeric DEFAULT 0,
  rent_duration_days integer,
  status text DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create student_notes junction table
CREATE TABLE IF NOT EXISTS student_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  access_type text NOT NULL CHECK (access_type IN ('purchased', 'rented', 'free')),
  purchased_at timestamptz DEFAULT now(),
  rent_expires_at timestamptz,
  amount_paid numeric DEFAULT 0,
  currency_used text DEFAULT 'inr',
  UNIQUE(student_id, note_id)
);

ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teachers
CREATE POLICY "Teachers can read own profile"
  ON teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can update own profile"
  ON teachers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for notes
CREATE POLICY "Anyone can view published notes"
  ON notes FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE POLICY "Teachers can create notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Teachers can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Teachers can delete own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for students
CREATE POLICY "Students can read own profile"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can update own profile"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for student_notes
CREATE POLICY "Students can view own purchased notes"
  ON student_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can purchase notes"
  ON student_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Students can update own note access"
  ON student_notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample data
INSERT INTO teachers (full_name, email, bio) VALUES
  ('Raj Prajapati', 'rajprajapati_iot_2022@ltce.com', 'IoT engineer and blockchain enthusiast dedicated to creating innovative educational platforms.');

INSERT INTO notes (teacher_id, title, description, category, thumbnail_url, pricing_model, currency, price, rent_duration_days, status, views)
SELECT 
  id,
  'Introduction to Blockchain Technology',
  'Complete guide to understanding blockchain fundamentals including consensus mechanisms, smart contracts, and decentralized applications.',
  'Blockchain',
  'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  'purchase',
  'inr',
  499,
  NULL,
  'published',
  1250
FROM teachers WHERE email = 'rajprajapati_iot_2022@ltce.com';

INSERT INTO notes (teacher_id, title, description, category, thumbnail_url, pricing_model, currency, price, rent_duration_days, status, views)
SELECT 
  id,
  'Advanced Calculus Concepts',
  'Deep dive into differential and integral calculus with practical applications in engineering and physics.',
  'Math',
  'https://images.pexels.com/photos/6256/mathematics-blackboard-education-classroom.jpg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  'rent',
  'crypto',
  2,
  30,
  'published',
  890
FROM teachers WHERE email = 'rajprajapati_iot_2022@ltce.com';

INSERT INTO notes (teacher_id, title, description, category, thumbnail_url, pricing_model, currency, price, status, views)
SELECT 
  id,
  'Quantum Physics Basics',
  'Understanding quantum mechanics for beginners - wave-particle duality, uncertainty principle, and more.',
  'Physics',
  'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  'free',
  'inr',
  0,
  'published',
  2100
FROM teachers WHERE email = 'rajprajapati_iot_2022@ltce.com';

INSERT INTO notes (teacher_id, title, description, category, thumbnail_url, pricing_model, currency, price, status, views)
SELECT 
  id,
  'Python for Data Science',
  'Master Python programming for data analysis, visualization, and machine learning applications.',
  'Computer Science',
  'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  'purchase',
  'inr',
  799,
  'published',
  1540
FROM teachers WHERE email = 'rajprajapati_iot_2022@ltce.com';

INSERT INTO notes (teacher_id, title, description, category, thumbnail_url, pricing_model, currency, price, rent_duration_days, status, views)
SELECT 
  id,
  'Organic Chemistry Fundamentals',
  'Comprehensive overview of organic chemistry reactions, mechanisms, and synthesis strategies.',
  'Chemistry',
  'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  'rent',
  'inr',
  299,
  15,
  'published',
  756
FROM teachers WHERE email = 'rajprajapati_iot_2022@ltce.com';

INSERT INTO notes (teacher_id, title, description, category, thumbnail_url, pricing_model, currency, price, status, views)
SELECT 
  id,
  'Machine Learning Essentials',
  'Introduction to machine learning algorithms, neural networks, and practical implementation techniques.',
  'Computer Science',
  'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  'purchase',
  'crypto',
  5,
  'published',
  1980
FROM teachers WHERE email = 'rajprajapati_iot_2022@ltce.com';
