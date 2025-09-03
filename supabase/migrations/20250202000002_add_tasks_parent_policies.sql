-- Add RLS policies to allow parents to create tasks for their children

-- Drop existing restrictive policy for tasks creation
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;

-- Create new policy that allows both users and parents to create tasks
CREATE POLICY "Users and parents can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = tasks.user_id
  )
);

-- Drop existing restrictive policy for tasks updates
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;

-- Create new policy that allows both users and parents to update tasks
CREATE POLICY "Users and parents can update tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = tasks.user_id
  )
);

-- Drop existing restrictive policy for tasks deletion
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

-- Create new policy that allows both users and parents to delete tasks
CREATE POLICY "Users and parents can delete tasks" 
ON public.tasks 
FOR DELETE 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = tasks.user_id
  )
);

-- Note: The SELECT policy for tasks should already allow parents to view children's tasks
-- from the existing parent access policies migration