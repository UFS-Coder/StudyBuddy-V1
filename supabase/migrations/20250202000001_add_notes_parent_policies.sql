-- Add RLS policies to allow parents to view their children's notes

-- Drop existing restrictive policy for notes
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;

-- Create new policy that allows both users and parents to view notes
CREATE POLICY "Users and parents can view notes" 
ON public.notes 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = notes.user_id
  )
);

-- Note: Keep existing policies for INSERT, UPDATE, DELETE as they should remain user-only
-- Parents should only be able to view notes, not modify them