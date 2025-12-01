-- Create teacher_batch_assignments table
CREATE TABLE public.teacher_batch_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, batch_id)
);

-- Enable Row Level Security
ALTER TABLE public.teacher_batch_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view teacher_batch_assignments"
ON public.teacher_batch_assignments
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert teacher_batch_assignments"
ON public.teacher_batch_assignments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update teacher_batch_assignments"
ON public.teacher_batch_assignments
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete teacher_batch_assignments"
ON public.teacher_batch_assignments
FOR DELETE
USING (true);

-- Create index for performance
CREATE INDEX idx_teacher_batch_assignments_teacher_id ON public.teacher_batch_assignments(teacher_id);
CREATE INDEX idx_teacher_batch_assignments_batch_id ON public.teacher_batch_assignments(batch_id);