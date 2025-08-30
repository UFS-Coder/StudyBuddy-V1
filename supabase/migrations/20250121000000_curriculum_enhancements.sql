-- Create tables for enhanced curriculum tracking features

-- Learning objectives table
CREATE TABLE public.learning_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID,
  subtopic_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT learning_objectives_topic_or_subtopic_check CHECK (
    (topic_id IS NOT NULL AND subtopic_id IS NULL) OR 
    (topic_id IS NULL AND subtopic_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.learning_objectives ENABLE ROW LEVEL SECURITY;

-- Create policies for learning_objectives
CREATE POLICY "Users can view their own learning objectives" 
ON public.learning_objectives 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own learning objectives" 
ON public.learning_objectives 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning objectives" 
ON public.learning_objectives 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning objectives" 
ON public.learning_objectives 
FOR DELETE 
USING (auth.uid() = user_id);

-- Resource attachments table
CREATE TABLE public.resource_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID,
  subtopic_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'link', 'document')),
  resource_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT resource_attachments_topic_or_subtopic_check CHECK (
    (topic_id IS NOT NULL AND subtopic_id IS NULL) OR 
    (topic_id IS NULL AND subtopic_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.resource_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for resource_attachments
CREATE POLICY "Users can view their own resource attachments" 
ON public.resource_attachments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resource attachments" 
ON public.resource_attachments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resource attachments" 
ON public.resource_attachments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resource attachments" 
ON public.resource_attachments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Syllabus milestones table
CREATE TABLE public.syllabus_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  milestone_type TEXT DEFAULT 'general' CHECK (milestone_type IN ('exam', 'project', 'assignment', 'general')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.syllabus_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies for syllabus_milestones
CREATE POLICY "Users can view their own syllabus milestones" 
ON public.syllabus_milestones 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own syllabus milestones" 
ON public.syllabus_milestones 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own syllabus milestones" 
ON public.syllabus_milestones 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabus milestones" 
ON public.syllabus_milestones 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_learning_objectives_updated_at
BEFORE UPDATE ON public.learning_objectives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resource_attachments_updated_at
BEFORE UPDATE ON public.resource_attachments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_syllabus_milestones_updated_at
BEFORE UPDATE ON public.syllabus_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_learning_objectives_topic_id ON public.learning_objectives(topic_id);
CREATE INDEX idx_learning_objectives_subtopic_id ON public.learning_objectives(subtopic_id);
CREATE INDEX idx_learning_objectives_user_id ON public.learning_objectives(user_id);

CREATE INDEX idx_resource_attachments_topic_id ON public.resource_attachments(topic_id);
CREATE INDEX idx_resource_attachments_subtopic_id ON public.resource_attachments(subtopic_id);
CREATE INDEX idx_resource_attachments_user_id ON public.resource_attachments(user_id);

CREATE INDEX idx_syllabus_milestones_subject_id ON public.syllabus_milestones(subject_id);
CREATE INDEX idx_syllabus_milestones_user_id ON public.syllabus_milestones(user_id);
CREATE INDEX idx_syllabus_milestones_target_date ON public.syllabus_milestones(target_date);