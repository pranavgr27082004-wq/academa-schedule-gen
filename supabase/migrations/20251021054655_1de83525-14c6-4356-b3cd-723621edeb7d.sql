-- Create teachers table
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  hours_per_week INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Lecture', 'Lab')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Lecture Hall', 'Lab')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batches table
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  semester INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timeslots table
CREATE TABLE public.timeslots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teacher_subject_assignments table
CREATE TABLE public.teacher_subject_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, subject_id)
);

-- Create timetable table
CREATE TABLE public.timetable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  timeslot_id UUID NOT NULL REFERENCES public.timeslots(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeslots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (admin-only app, no auth required)
CREATE POLICY "Allow all operations on teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on batches" ON public.batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on timeslots" ON public.timeslots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on teacher_subject_assignments" ON public.teacher_subject_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on timetable" ON public.timetable FOR ALL USING (true) WITH CHECK (true);

-- Insert default timeslots (9 AM to 5 PM, 1-hour slots)
INSERT INTO public.timeslots (day, start_time, end_time) VALUES
  ('Monday', '09:00', '10:00'),
  ('Monday', '10:00', '11:00'),
  ('Monday', '11:00', '12:00'),
  ('Monday', '12:00', '13:00'),
  ('Monday', '14:00', '15:00'),
  ('Monday', '15:00', '16:00'),
  ('Monday', '16:00', '17:00'),
  ('Tuesday', '09:00', '10:00'),
  ('Tuesday', '10:00', '11:00'),
  ('Tuesday', '11:00', '12:00'),
  ('Tuesday', '12:00', '13:00'),
  ('Tuesday', '14:00', '15:00'),
  ('Tuesday', '15:00', '16:00'),
  ('Tuesday', '16:00', '17:00'),
  ('Wednesday', '09:00', '10:00'),
  ('Wednesday', '10:00', '11:00'),
  ('Wednesday', '11:00', '12:00'),
  ('Wednesday', '12:00', '13:00'),
  ('Wednesday', '14:00', '15:00'),
  ('Wednesday', '15:00', '16:00'),
  ('Wednesday', '16:00', '17:00'),
  ('Thursday', '09:00', '10:00'),
  ('Thursday', '10:00', '11:00'),
  ('Thursday', '11:00', '12:00'),
  ('Thursday', '12:00', '13:00'),
  ('Thursday', '14:00', '15:00'),
  ('Thursday', '15:00', '16:00'),
  ('Thursday', '16:00', '17:00'),
  ('Friday', '09:00', '10:00'),
  ('Friday', '10:00', '11:00'),
  ('Friday', '11:00', '12:00'),
  ('Friday', '12:00', '13:00'),
  ('Friday', '14:00', '15:00'),
  ('Friday', '15:00', '16:00'),
  ('Friday', '16:00', '17:00'),
  ('Saturday', '09:00', '10:00'),
  ('Saturday', '10:00', '11:00'),
  ('Saturday', '11:00', '12:00'),
  ('Saturday', '12:00', '13:00');