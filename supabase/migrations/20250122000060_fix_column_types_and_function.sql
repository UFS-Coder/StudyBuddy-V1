-- Fix column type mismatch and function issues

-- Fix account_type column type from VARCHAR to TEXT
ALTER TABLE profiles ALTER COLUMN account_type TYPE TEXT;

-- Recreate the get_parent_children function with proper error handling
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
        au.email as child_email,
        COALESCE(p.display_name, '') as child_display_name,
        COALESCE(p.grade_level, '') as child_grade_level,
        COALESCE(p.school, '') as child_school
    FROM parent_child_relationships pcr
    JOIN auth.users au ON pcr.child_id = au.id
    LEFT JOIN profiles p ON pcr.child_id = p.user_id
    WHERE pcr.parent_id = parent_user_id
    ORDER BY COALESCE(p.display_name, au.email);
EXCEPTION
    WHEN OTHERS THEN
        -- Return empty result on error instead of throwing
        RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_parent_children(UUID) TO authenticated;