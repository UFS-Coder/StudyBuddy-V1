-- Add account_type to profiles table
ALTER TABLE profiles ADD COLUMN account_type VARCHAR(20) DEFAULT 'student' CHECK (account_type IN ('student', 'parent'));

-- Create parent_child_relationships table
CREATE TABLE parent_child_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(parent_id, child_id)
);

-- Create indexes for better performance
CREATE INDEX idx_parent_child_relationships_parent_id ON parent_child_relationships(parent_id);
CREATE INDEX idx_parent_child_relationships_child_id ON parent_child_relationships(child_id);

-- Enable RLS on parent_child_relationships
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;

-- RLS policies for parent_child_relationships
-- Parents can view their own relationships
CREATE POLICY "Parents can view their own child relationships" ON parent_child_relationships
    FOR SELECT USING (auth.uid() = parent_id);

-- Parents can insert new child relationships
CREATE POLICY "Parents can add child relationships" ON parent_child_relationships
    FOR INSERT WITH CHECK (auth.uid() = parent_id);

-- Parents can delete their own child relationships
CREATE POLICY "Parents can remove child relationships" ON parent_child_relationships
    FOR DELETE USING (auth.uid() = parent_id);

-- Children can view relationships where they are the child
CREATE POLICY "Children can view their parent relationships" ON parent_child_relationships
    FOR SELECT USING (auth.uid() = child_id);

-- Update the updated_at column trigger
CREATE TRIGGER update_parent_child_relationships_updated_at
    BEFORE UPDATE ON parent_child_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get children for a parent
CREATE OR REPLACE FUNCTION get_parent_children(parent_user_id UUID)
RETURNS TABLE (
    child_id UUID,
    child_email TEXT,
    child_display_name TEXT,
    child_grade_level TEXT,
    child_school TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pcr.child_id,
        au.email::TEXT as child_email,
        p.display_name::TEXT as child_display_name,
        p.grade_level::TEXT as child_grade_level,
        p.school::TEXT as child_school
    FROM parent_child_relationships pcr
    JOIN auth.users au ON pcr.child_id = au.id
    JOIN profiles p ON pcr.child_id = p.user_id
    WHERE pcr.parent_id = parent_user_id
    ORDER BY p.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link a child to a parent by email
CREATE OR REPLACE FUNCTION link_child_to_parent(parent_user_id UUID, child_email TEXT)
RETURNS JSON AS $$
DECLARE
    child_user_id UUID;
    child_account_type TEXT;
    result JSON;
BEGIN
    -- Find the child user by email
    SELECT au.id INTO child_user_id
    FROM auth.users au
    WHERE au.email = child_email;
    
    -- Check if user exists
    IF child_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Email not found in system');
    END IF;
    
    -- Check if the user is a student account
    SELECT p.account_type INTO child_account_type
    FROM profiles p
    WHERE p.user_id = child_user_id;
    
    IF child_account_type != 'student' THEN
        RETURN json_build_object('success', false, 'error', 'Email does not belong to a student account');
    END IF;
    
    -- Check if relationship already exists
    IF EXISTS (SELECT 1 FROM parent_child_relationships WHERE parent_id = parent_user_id AND child_id = child_user_id) THEN
        RETURN json_build_object('success', false, 'error', 'Child is already linked to this parent account');
    END IF;
    
    -- Create the relationship
    INSERT INTO parent_child_relationships (parent_id, child_id)
    VALUES (parent_user_id, child_user_id);
    
    RETURN json_build_object('success', true, 'message', 'Child successfully linked to parent account');
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'An error occurred while linking the child');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_parent_children(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION link_child_to_parent(UUID, TEXT) TO authenticated;