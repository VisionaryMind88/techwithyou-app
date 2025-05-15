-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  provider TEXT,
  provider_id TEXT,
  remember_token TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  budget TEXT,
  target_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create files table if it doesn't exist
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  path TEXT NOT NULL,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  project_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  project_id INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create session store table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

-- Insert test admin user
INSERT INTO users (email, password, first_name, last_name, role, provider, provider_id)
VALUES (
  'admin@techwithyou.com',
  '$2b$10$36gEJ1fGXMadVgxCH7KNp.7MF.hFxgAuOjYyLCsTsCJu9p72ZJrUu', -- Admin@123
  'Admin',
  'User',
  'admin',
  'local',
  NULL
)
ON CONFLICT (email) DO NOTHING;

-- Insert test customer user
INSERT INTO users (email, password, first_name, last_name, role, provider, provider_id)
VALUES (
  'customer@techwithyou.com',
  '$2b$10$C2iQOGkLuQHKOjHwTVnrO.5Obw0sV6yMYXLutVTiLRU7wC3qP5d/q', -- Customer@123
  'Customer',
  'User',
  'customer',
  'local',
  NULL
)
ON CONFLICT (email) DO NOTHING;

-- Insert demo project for customer
INSERT INTO projects (name, description, type, budget, target_date, status, user_id)
VALUES (
  'Website Redesign',
  'Need a complete redesign of our company website using modern technologies',
  'Web Development',
  '$5,000 - $10,000',
  '2025-08-01',
  'in_progress',
  (SELECT id FROM users WHERE email = 'customer@techwithyou.com')
)
ON CONFLICT DO NOTHING;

-- Insert demo message for the project
INSERT INTO messages (content, project_id, sender_id, recipient_id, is_read)
VALUES (
  'Welcome to your project! We''ll be starting work on this shortly.',
  1,
  (SELECT id FROM users WHERE email = 'admin@techwithyou.com'),
  (SELECT id FROM users WHERE email = 'customer@techwithyou.com'),
  false
)
ON CONFLICT DO NOTHING;