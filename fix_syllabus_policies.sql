-- Run this SQL in Supabase dashboard to fix syllabus management in parent view
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

-- Allow parents to view their children's learning objectives (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'learning_objectives') THEN
        EXECUTE 'CREATE POLICY "Parents can view their children''s learning objectives" 
        ON public.learning_objectives 
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM parent_child_relationships pcr 
            WHERE pcr.parent_id = auth.uid() 
            AND pcr.child_id = learning_objectives.user_id
          )
        )';
    END IF;
END
$$;

-- Allow parents to view their children's resource attachments (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resource_attachments') THEN
        EXECUTE 'CREATE POLICY "Parents can view their children''s resource attachments" 
        ON public.resource_attachments 
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM parent_child_relationships pcr 
            WHERE pcr.parent_id = auth.uid() 
            AND pcr.child_id = resource_attachments.user_id
          )
        )';
    END IF;
END
$$;

-- Allow parents to view their children's syllabus milestones (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'syllabus_milestones') THEN
        EXECUTE 'CREATE POLICY "Parents can view their children''s syllabus milestones" 
        ON public.syllabus_milestones 
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM parent_child_relationships pcr 
            WHERE pcr.parent_id = auth.uid() 
            AND pcr.child_id = syllabus_milestones.user_id
          )
        )';
    END IF;
END
$$;