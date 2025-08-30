-- Force update get_parent_children function by dropping and recreating
DROP FUNCTION IF EXISTS get_parent_children(UUID);

CREATE FUNCTION get_parent_children(parent_user_id UUID)
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
        COALESCE(p.display_name, '')::TEXT as child_display_name,
        COALESCE(p.grade_level, '')::TEXT as child_grade_level,
        COALESCE(p.school, '')::TEXT as child_school
    FROM parent_child_relationships pcr
    JOIN auth.users au ON pcr.child_id = au.id
    LEFT JOIN profiles p ON pcr.child_id = p.user_id
    WHERE pcr.parent_id = parent_user_id
    ORDER BY COALESCE(p.display_name, au.email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;