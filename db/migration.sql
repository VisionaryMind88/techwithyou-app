-- Complete migration file for Replit PostgreSQL database
-- Compatible with PostgreSQL 15 and 16
-- This file creates all tables, security policies, and test data

-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Function to simulate auth.uid() from Supabase
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
BEGIN
  -- Return the UUID stored in the session variable (this will need to be set in your application)
  RETURN coalesce(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID);
END;
$$ LANGUAGE plpgsql;

-- Drop existing tables if they exist (uncommit if you want to start fresh)
-- DROP TABLE IF EXISTS public.project_updates CASCADE;
-- DROP TABLE IF EXISTS public.projects CASCADE;
-- DROP TABLE IF EXISTS public.chat_messages CASCADE;
-- DROP TABLE IF EXISTS public.contact_messages CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    firstname TEXT,
    lastname TEXT,
    bedrijf TEXT,
    telefoon TEXT,
    role TEXT DEFAULT 'customer',
    isactive BOOLEAN DEFAULT TRUE,
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW(),
    lastlogin TIMESTAMPTZ,
    auth_id UUID UNIQUE
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_username_idx ON public.users (username);
CREATE INDEX IF NOT EXISTS users_auth_id_idx ON public.users (auth_id);

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for chat_messages
CREATE INDEX IF NOT EXISTS chat_messages_sender_idx ON public.chat_messages (sender_id);
CREATE INDEX IF NOT EXISTS chat_messages_receiver_idx ON public.chat_messages (receiver_id);

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.projects (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for projects
CREATE INDEX IF NOT EXISTS projects_customer_idx ON public.projects (customer_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects (status);

-- Create project_updates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.project_updates (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    update_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for project_updates
CREATE INDEX IF NOT EXISTS project_updates_project_idx ON public.project_updates (project_id);
CREATE INDEX IF NOT EXISTS project_updates_user_idx ON public.project_updates (user_id);
CREATE INDEX IF NOT EXISTS project_updates_type_idx ON public.project_updates (update_type);

-- Create contact_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    ipaddress TEXT,
    isanswered BOOLEAN DEFAULT FALSE,
    createdat TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for contact_messages
CREATE INDEX IF NOT EXISTS contact_messages_email_idx ON public.contact_messages (email);
CREATE INDEX IF NOT EXISTS contact_messages_answered_idx ON public.contact_messages (isanswered);

-- Create a function to update timestamp on update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON public.chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a secure function to get current user's ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS INTEGER AS $$
DECLARE
  current_user_id INTEGER;
BEGIN
  SELECT id INTO current_user_id FROM public.users WHERE auth_id = auth.uid();
  RETURN current_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE auth_id = auth.uid();
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (public.get_current_user_id() = id OR auth_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (public.get_current_user_id() = id OR auth_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
ON public.users
FOR UPDATE
USING (public.is_admin());

-- Set up RLS policies for chat_messages
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;
CREATE POLICY "Users can insert their own messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (public.get_current_user_id() = sender_id);

DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
CREATE POLICY "Users can view their own messages"
ON public.chat_messages
FOR SELECT
USING (public.get_current_user_id() = sender_id OR public.get_current_user_id() = receiver_id);

DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
CREATE POLICY "Users can update their own messages"
ON public.chat_messages
FOR UPDATE
USING (public.get_current_user_id() = sender_id);

DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_messages;
CREATE POLICY "Admins can view all messages"
ON public.chat_messages
FOR SELECT
USING (public.is_admin());

-- Set up RLS policies for projects
DROP POLICY IF EXISTS "Customers can create their own projects" ON public.projects;
CREATE POLICY "Customers can create their own projects"
ON public.projects
FOR INSERT
WITH CHECK (public.get_current_user_id() = customer_id);

DROP POLICY IF EXISTS "Customers can view their own projects" ON public.projects;
CREATE POLICY "Customers can view their own projects"
ON public.projects
FOR SELECT
USING (public.get_current_user_id() = customer_id);

DROP POLICY IF EXISTS "Customers can update their own projects" ON public.projects;
CREATE POLICY "Customers can update their own projects"
ON public.projects
FOR UPDATE
USING (public.get_current_user_id() = customer_id);

DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
CREATE POLICY "Admins can view all projects"
ON public.projects
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all projects" ON public.projects;
CREATE POLICY "Admins can update all projects"
ON public.projects
FOR UPDATE
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create projects for customers" ON public.projects;
CREATE POLICY "Admins can create projects for customers"
ON public.projects
FOR INSERT
WITH CHECK (public.is_admin());

-- Set up RLS policies for project_updates
DROP POLICY IF EXISTS "Users can create their own updates" ON public.project_updates;
CREATE POLICY "Users can create their own updates"
ON public.project_updates
FOR INSERT
WITH CHECK (public.get_current_user_id() = user_id);

DROP POLICY IF EXISTS "Customers can view updates on their projects" ON public.project_updates;
CREATE POLICY "Customers can view updates on their projects"
ON public.project_updates
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_updates.project_id 
        AND projects.customer_id = public.get_current_user_id()
    )
);

DROP POLICY IF EXISTS "Admins can view all project updates" ON public.project_updates;
CREATE POLICY "Admins can view all project updates"
ON public.project_updates
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create updates on any project" ON public.project_updates;
CREATE POLICY "Admins can create updates on any project"
ON public.project_updates
FOR INSERT
WITH CHECK (
    public.is_admin()
    AND public.get_current_user_id() = user_id
);

-- Set up RLS policies for contact_messages
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can create contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages"
ON public.contact_messages
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
USING (public.is_admin());

-- Insert test users with mock auth_ids (UUIDs)
INSERT INTO public.users (username, email, password, firstname, lastname, role, auth_id)
VALUES 
('testadmin', 'testadmin@test.com', 'password123', 'Admin', 'User', 'admin', '550e8400-e29b-41d4-a716-446655440000'),
('testcustomer', 'testcustomer@test.com', 'password123', 'Customer', 'User', 'customer', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (username) DO UPDATE SET 
    auth_id = EXCLUDED.auth_id,
    email = EXCLUDED.email,
    firstname = EXCLUDED.firstname,
    lastname = EXCLUDED.lastname,
    role = EXCLUDED.role;

-- Create test projects for the customer
DO $$
DECLARE
    customer_id INTEGER;
BEGIN
    SELECT id INTO customer_id FROM public.users WHERE username = 'testcustomer';
    
    IF customer_id IS NOT NULL THEN
        INSERT INTO public.projects (customer_id, title, description, status)
        VALUES 
        (customer_id, 'Website Development', 'Creating a new e-commerce website', 'in_progress'),
        (customer_id, 'Mobile App', 'Developing iOS and Android apps', 'pending')
        ON CONFLICT DO NOTHING;
    END IF;
END
$$;

-- Create test chat messages between admin and customer
DO $$
DECLARE
    admin_id INTEGER;
    customer_id INTEGER;
BEGIN
    SELECT id INTO admin_id FROM public.users WHERE username = 'testadmin';
    SELECT id INTO customer_id FROM public.users WHERE username = 'testcustomer';
    
    IF admin_id IS NOT NULL AND customer_id IS NOT NULL THEN
        INSERT INTO public.chat_messages (sender_id, receiver_id, message_text, is_read)
        VALUES 
        (admin_id, customer_id, 'Hello! How can I help you with your project?', true),
        (customer_id, admin_id, 'I need help with the website development.', false)
        ON CONFLICT DO NOTHING;
    END IF;
END
$$;

-- Create project updates
DO $$
DECLARE
    project_id INTEGER;
    admin_id INTEGER;
    customer_id INTEGER;
BEGIN
    SELECT id INTO project_id FROM public.projects WHERE title = 'Website Development' LIMIT 1;
    SELECT id INTO admin_id FROM public.users WHERE username = 'testadmin';
    SELECT id INTO customer_id FROM public.users WHERE username = 'testcustomer';
    
    IF project_id IS NOT NULL AND admin_id IS NOT NULL AND customer_id IS NOT NULL THEN
        INSERT INTO public.project_updates (project_id, user_id, update_type, content)
        VALUES
        (project_id, admin_id, 'status_change', 'Project is now in progress'),
        (project_id, customer_id, 'comment', 'Looking forward to seeing the first prototype')
        ON CONFLICT DO NOTHING;
    END IF;
END
$$;

-- Create a test contact message
INSERT INTO public.contact_messages (name, email, message, phone)
VALUES ('Potential Client', 'potential@test.com', 'I would like to discuss a new project', '+31612345678')
ON CONFLICT DO NOTHING;

-- Add comment explaining how to test the policies
COMMENT ON TABLE public.users IS 'User accounts with auth_id linking to authentication';
COMMENT ON TABLE public.projects IS 'Customer projects with RLS policies for access control';
COMMENT ON TABLE public.chat_messages IS 'Realtime chat messages between users';
COMMENT ON TABLE public.project_updates IS 'Updates and activity on projects';
COMMENT ON TABLE public.contact_messages IS 'Contact form submissions';

-- Instructions for using the auth.uid() in

