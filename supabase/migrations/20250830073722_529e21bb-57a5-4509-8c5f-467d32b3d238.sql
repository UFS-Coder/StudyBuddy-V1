-- Create tables for admin console features

-- Syllabus topics table
CREATE TABLE public.syllabus_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;

-- Create policies for syllabus_topics
CREATE POLICY "Users can view their own syllabus topics" 
ON public.syllabus_topics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own syllabus topics" 
ON public.syllabus_topics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own syllabus topics" 
ON public.syllabus_topics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabus topics" 
ON public.syllabus_topics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Subtopics table
CREATE TABLE public.subtopics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;

-- Create policies for subtopics
CREATE POLICY "Users can view their own subtopics" 
ON public.subtopics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subtopics" 
ON public.subtopics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subtopics" 
ON public.subtopics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subtopics" 
ON public.subtopics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID,
  topic_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  time_period TEXT DEFAULT 'week' CHECK (time_period IN ('day', 'week', 'month', 'quarter', 'half_year')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Homework table
CREATE TABLE public.homework (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_period TEXT DEFAULT 'week' CHECK (time_period IN ('day', 'week', 'month', 'quarter', 'half_year')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

-- Create policies for homework
CREATE POLICY "Users can view their own homework" 
ON public.homework 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own homework" 
ON public.homework 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own homework" 
ON public.homework 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own homework" 
ON public.homework 
FOR DELETE 
USING (auth.uid() = user_id);

-- Notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID,
  topic_id UUID,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  time_period TEXT DEFAULT 'week' CHECK (time_period IN ('day', 'week', 'month', 'quarter', 'half_year')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies for notes
CREATE POLICY "Users can view their own notes" 
ON public.notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_syllabus_topics_updated_at
BEFORE UPDATE ON public.syllabus_topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subtopics_updated_at
BEFORE UPDATE ON public.subtopics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_homework_updated_at
BEFORE UPDATE ON public.homework
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();