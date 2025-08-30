-- Add RLS policies to allow parents to view their children's syllabus data

-- Allow parents to view their children's syllabus topics
CREATE POLICY "Parents can view their children's syllabus topics" 
ON public.syllabus_topics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = syllabus_topics.user_id
  )
);

-- Allow parents to view their children's subtopics
CREATE POLICY "Parents can view their children's subtopics" 
ON public.subtopics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = subtopics.user_id
  )
);

-- Allow parents to view their children's learning objectives (if exists)
CREATE POLICY "Parents can view their children's learning objectives" 
ON public.learning_objectives 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = learning_objectives.user_id
  )
);

-- Allow parents to view their children's resource attachments (if exists)
CREATE POLICY "Parents can view their children's resource attachments" 
ON public.resource_attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = resource_attachments.user_id
  )
);

-- Allow parents to view their children's syllabus milestones (if exists)
CREATE POLICY "Parents can view their children's syllabus milestones" 
ON public.syllabus_milestones 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = syllabus_milestones.user_id
  )
);