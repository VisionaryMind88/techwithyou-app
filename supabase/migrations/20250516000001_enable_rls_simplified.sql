-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Add an auth_id column to users table to store the uuid from auth.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Create a secure function to get current user's ID from the integer-based system
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS INTEGER AS $$
DECLARE
  current_user_id INTEGER;
BEGIN
  SELECT id INTO current_user_id FROM public.users WHERE auth_id = auth.uid();
  RETURN current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE auth_id = auth.uid();
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Enable real-time subscriptions for all tables
-- First try to create the publication if it doesn't exist
DO $$
BEGIN
  CREATE PUBLICATION supabase_realtime;
EXCEPTION
  WHEN duplicate_object THEN
    -- Publication already exists, do nothing
    RAISE NOTICE 'Publication supabase_realtime already exists';
END
$$;

-- Now add tables to the publication (whether it was just created or already existed)
-- These statements will not error if a table is already part of the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;

