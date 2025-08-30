-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  grade_level TEXT DEFAULT '12',
  school TEXT DEFAULT 'UFS',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  color TEXT DEFAULT '#3B82F6',
  current_grade DECIMAL(3,1),
  target_grade DECIMAL(3,1),
  credits INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Create policies for subjects
CREATE POLICY "Users can view their own subjects" 
ON public.subjects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subjects" 
ON public.subjects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects" 
ON public.subjects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects" 
ON public.subjects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create grades table
CREATE TABLE public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  grade DECIMAL(3,1) NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0,
  date_received DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT DEFAULT 'assignment',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for grades
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Create policies for grades
CREATE POLICY "Users can view their own grades" 
ON public.grades 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own grades" 
ON public.grades 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grades" 
ON public.grades 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grades" 
ON public.grades 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'display_name', new.email)
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();