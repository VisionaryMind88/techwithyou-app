-- Simplified migration to create basic tables for VisionaryMind88 project

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
    lastlogin TIMESTAMPTZ
);

-- Create basic indexes for users
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_username_idx ON public.users (username);

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

-- Create basic indexes for chat_messages
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

-- Create basic indexes for projects
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

-- Create basic indexes for project_updates
CREATE INDEX IF NOT EXISTS project_updates_project_idx ON public.project_updates (project_id);
CREATE INDEX IF NOT EXISTS project_updates_user_idx ON public.project_updates (user_id);

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

-- Create basic indexes for contact_messages
CREATE INDEX IF NOT EXISTS contact_messages_email_idx ON public.contact_messages (email);
CREATE INDEX IF NOT EXISTS contact_messages_answered_idx ON public.contact_messages (isanswered);

-- Create a demo admin user if no users exist (password: 'admin123')
INSERT INTO public.users (username, email, password, role)
SELECT 'admin', 'admin@example.com', '$2a$10$PnPnw8oP5XJXi1kt2PAj.e2U8YCGxhR0gFrwXw6TnWlJDvl0m6qMe', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.users);

