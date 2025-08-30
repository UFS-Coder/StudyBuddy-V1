-- Fix RLS policies to allow both users and parents to view data

-- Drop existing restrictive policies for subjects
DROP POLICY IF EXISTS "Users can view their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Parents can view their children's subjects" ON public.subjects;

-- Create new policy that allows both users and parents
CREATE POLICY "Users and parents can view subjects" 
ON public.subjects 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = subjects.user_id
  )
);

-- Drop existing restrictive policies for grades
DROP POLICY IF EXISTS "Users can view their own grades" ON public.grades;
DROP POLICY IF EXISTS "Parents can view their children's grades" ON public.grades;

-- Create new policy that allows both users and parents
CREATE POLICY "Users and parents can view grades" 
ON public.grades 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = grades.user_id
  )
);

-- Drop existing restrictive policies for tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Parents can view their children's tasks" ON public.tasks;

-- Create new policy that allows both users and parents
CREATE POLICY "Users and parents can view tasks" 
ON public.tasks 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = tasks.user_id
  )
);

-- Drop existing restrictive policies for homework (if exists)
DROP POLICY IF EXISTS "Users can view their own homework" ON public.homework;
DROP POLICY IF EXISTS "Parents can view their children's homework" ON public.homework;

-- Create new policy that allows both users and parents
CREATE POLICY "Users and parents can view homework" 
ON public.homework 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = homework.user_id
  )
);

-- Drop existing restrictive policies for profiles
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Parents can view their children's profiles" ON public.profiles;

-- Create new policy that allows both users and parents
CREATE POLICY "Users and parents can view profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = profiles.user_id
  )
);