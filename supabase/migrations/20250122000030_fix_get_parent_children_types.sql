-- Fix type casting in get_parent_children function
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