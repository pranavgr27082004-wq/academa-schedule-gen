INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'demo.admin@timetable-demo.app'
ON CONFLICT (user_id, role) DO NOTHING;