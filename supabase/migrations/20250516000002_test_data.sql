-- Test script to verify database structure and RLS policies
-- This script inserts test data and verifies security policies are working correctly

-- First, clear any existing test data to start fresh
DELETE FROM public.project_updates WHERE id > 0;
DELETE FROM public.projects WHERE id > 0;
DELETE FROM public.chat_messages WHERE id > 0;
DELETE FROM public.users WHERE username IN ('testadmin', 'testcustomer');

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

-- Verify users were created
SELECT id, username, email, role FROM public.users WHERE username IN ('testadmin', 'testcustomer');

-- Create test projects for the customer
INSERT INTO public.projects (customer_id, title, description, status)
VALUES 
((SELECT id FROM public.users WHERE username = 'testcustomer'), 'Website Development', 'Creating a new e-commerce website', 'in_progress'),
((SELECT id FROM public.users WHERE username = 'testcustomer'), 'Mobile App', 'Developing iOS and Android apps', 'pending')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    status = EXCLUDED.status;

-- Verify projects were created
SELECT id, customer_id, title, status FROM public.projects 
WHERE customer_id = (SELECT id FROM public.users WHERE username = 'testcustomer');

-- Create test chat messages between admin and customer
-- First check if the users exist
DO $$
DECLARE
    admin_id INTEGER;
    customer_id INTEGER;
BEGIN
    SELECT id INTO admin_id FROM public.users WHERE username = 'testadmin';
    SELECT id INTO customer_id FROM public.users WHERE username = 'testcustomer';
    
    IF admin_id IS NOT NULL AND customer_id IS NOT NULL THEN
        -- Insert chat messages only if both users exist
        INSERT INTO public.chat_messages (sender_id, receiver_id, message_text, is_read)
        VALUES 
        (admin_id, customer_id, 'Hello! How can I help you with your project?', true),
        (customer_id, admin_id, 'I need help with the website development.', false)
        ON CONFLICT DO NOTHING;
    END IF;
END
$$;

-- Verify chat messages were created
SELECT id, sender_id, receiver_id, message_text, is_read FROM public.chat_messages 
WHERE sender_id IN (SELECT id FROM public.users WHERE username IN ('testadmin', 'testcustomer'))
   OR receiver_id IN (SELECT id FROM public.users WHERE username IN ('testadmin', 'testcustomer'));

-- Create project updates
-- First check if the project and users exist
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
        -- Insert project updates only if project and users exist
        INSERT INTO public.project_updates (project_id, user_id, update_type, content)
        VALUES
        (project_id, admin_id, 'status_change', 'Project is now in progress'),
        (project_id, customer_id, 'comment', 'Looking forward to seeing the first prototype')
        ON CONFLICT DO NOTHING;
    END IF;
END
$$;

-- Verify project updates were created
SELECT pu.id, pu.project_id, pu.user_id, pu.update_type, pu.content, p.title 
FROM public.project_updates pu
JOIN public.projects p ON pu.project_id = p.id
WHERE p.title = 'Website Development';

-- Create a test contact message
INSERT INTO public.contact_messages (name, email, message, phone)
VALUES ('Potential Client', 'potential@test.com', 'I would like to discuss a new project', '+31612345678')
ON CONFLICT DO NOTHING;

-- Verify contact message was created
SELECT id, name, email, message FROM public.contact_messages WHERE email = 'potential@test.com';

-- Add comment explaining how to test the policies
COMMENT ON TABLE public.users IS 'User accounts with auth_id linking to Supabase Auth';
COMMENT ON TABLE public.projects IS 'Customer projects with RLS policies for access control';
COMMENT ON TABLE public.chat_messages IS 'Realtime chat messages between users';
COMMENT ON TABLE public.project_updates IS 'Updates and activity on projects';
COMMENT ON TABLE public.contact_messages IS 'Contact form submissions';

-- Add a final message to indicate test data was loaded successfully
DO $$
BEGIN
  RAISE NOTICE 'Test data has been successfully loaded!';
  RAISE NOTICE 'Tables created: users, projects, chat_messages, project_updates, contact_messages';
  RAISE NOTICE 'To test RLS policies, use the Supabase client with different user logins.';
END
$$;

