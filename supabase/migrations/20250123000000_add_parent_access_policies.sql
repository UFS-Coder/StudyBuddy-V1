-- Add RLS policies to allow parents to view their children's data

-- Allow parents to view their children's subjects
CREATE POLICY "Parents can view their children's subjects" 
ON public.subjects 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = subjects.user_id
  )
);

-- Allow parents to view their children's grades
CREATE POLICY "Parents can view their children's grades" 
ON public.grades 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = grades.user_id
  )
);

-- Allow parents to view their children's tasks
CREATE POLICY "Parents can view their children's tasks" 
ON public.tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = tasks.user_id
  )
);

-- Allow parents to view their children's homework (if exists)
CREATE POLICY "Parents can view their children's homework" 
ON public.homework 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = homework.user_id
  )
);

-- Allow parents to view their children's profiles
CREATE POLICY "Parents can view their children's profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = profiles.user_id
  )
);