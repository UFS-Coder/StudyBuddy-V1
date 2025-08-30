-- Add themes support to the curriculum structure

-- Create themes table
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6', -- Default blue color
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for themes
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- Create policies for themes
CREATE POLICY "Users can view their own themes" 
ON public.themes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own themes" 
ON public.themes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own themes" 
ON public.themes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own themes" 
ON public.themes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add theme_id column to syllabus_topics table (optional)
ALTER TABLE public.syllabus_topics 
ADD COLUMN theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_themes_subject_id ON public.themes(subject_id);
CREATE INDEX idx_themes_user_id ON public.themes(user_id);
CREATE INDEX idx_syllabus_topics_theme_id ON public.syllabus_topics(theme_id);

-- Create trigger for updated_at on themes
CREATE TRIGGER update_themes_updated_at
BEFORE UPDATE ON public.themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();