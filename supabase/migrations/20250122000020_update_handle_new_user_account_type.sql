-- Update handle_new_user function to support account type from registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, account_type)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'display_name', new.email),
    COALESCE(new.raw_user_meta_data ->> 'account_type', 'student')
  );
  RETURN new;
END;
$$;