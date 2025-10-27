-- Add is_break column to timeslots table
ALTER TABLE public.timeslots 
ADD COLUMN is_break BOOLEAN NOT NULL DEFAULT false;

-- Add a comment to explain the column
COMMENT ON COLUMN public.timeslots.is_break IS 'Indicates if this timeslot is a break period where no classes should be scheduled';