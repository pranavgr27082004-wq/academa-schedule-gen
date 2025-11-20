-- Drop existing permissive policies on all tables
DROP POLICY IF EXISTS "Allow all operations on teachers" ON public.teachers;
DROP POLICY IF EXISTS "Allow all operations on subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow all operations on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow all operations on batches" ON public.batches;
DROP POLICY IF EXISTS "Allow all operations on timeslots" ON public.timeslots;
DROP POLICY IF EXISTS "Allow all operations on teacher_subject_assignments" ON public.teacher_subject_assignments;
DROP POLICY IF EXISTS "Allow all operations on timetable" ON public.timetable;

-- Create secure RLS policies that require authentication
-- Teachers table policies
CREATE POLICY "Authenticated users can view teachers"
  ON public.teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert teachers"
  ON public.teachers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update teachers"
  ON public.teachers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete teachers"
  ON public.teachers FOR DELETE
  TO authenticated
  USING (true);

-- Subjects table policies
CREATE POLICY "Authenticated users can view subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert subjects"
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update subjects"
  ON public.subjects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete subjects"
  ON public.subjects FOR DELETE
  TO authenticated
  USING (true);

-- Rooms table policies
CREATE POLICY "Authenticated users can view rooms"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rooms"
  ON public.rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rooms"
  ON public.rooms FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rooms"
  ON public.rooms FOR DELETE
  TO authenticated
  USING (true);

-- Batches table policies
CREATE POLICY "Authenticated users can view batches"
  ON public.batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert batches"
  ON public.batches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update batches"
  ON public.batches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete batches"
  ON public.batches FOR DELETE
  TO authenticated
  USING (true);

-- Timeslots table policies
CREATE POLICY "Authenticated users can view timeslots"
  ON public.timeslots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert timeslots"
  ON public.timeslots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update timeslots"
  ON public.timeslots FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete timeslots"
  ON public.timeslots FOR DELETE
  TO authenticated
  USING (true);

-- Teacher subject assignments table policies
CREATE POLICY "Authenticated users can view teacher_subject_assignments"
  ON public.teacher_subject_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert teacher_subject_assignments"
  ON public.teacher_subject_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update teacher_subject_assignments"
  ON public.teacher_subject_assignments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete teacher_subject_assignments"
  ON public.teacher_subject_assignments FOR DELETE
  TO authenticated
  USING (true);

-- Timetable table policies
CREATE POLICY "Authenticated users can view timetable"
  ON public.timetable FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert timetable"
  ON public.timetable FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update timetable"
  ON public.timetable FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete timetable"
  ON public.timetable FOR DELETE
  TO authenticated
  USING (true);