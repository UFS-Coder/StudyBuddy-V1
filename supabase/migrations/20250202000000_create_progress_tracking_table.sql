-- Create progress_tracking table to store historical progress data
CREATE TABLE IF NOT EXISTS progress_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    progress_percentage DECIMAL(5,2) NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    total_topics INTEGER NOT NULL DEFAULT 0,
    completed_topics INTEGER NOT NULL DEFAULT 0,
    total_subtopics INTEGER NOT NULL DEFAULT 0,
    completed_subtopics INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user_id ON progress_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_subject_id ON progress_tracking(subject_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_recorded_at ON progress_tracking(recorded_at);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user_subject ON progress_tracking(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user_recorded_at ON progress_tracking(user_id, recorded_at);

-- Enable RLS (Row Level Security)
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own progress tracking" ON progress_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress tracking" ON progress_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress tracking" ON progress_tracking
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress tracking" ON progress_tracking
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_progress_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_progress_tracking_updated_at
    BEFORE UPDATE ON progress_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_progress_tracking_updated_at();

-- Create function to get progress change for a specific time period
CREATE OR REPLACE FUNCTION get_progress_change(
    p_user_id UUID,
    p_subject_id UUID DEFAULT NULL,
    p_period_type TEXT DEFAULT 'week' -- 'day', 'week', 'month'
)
RETURNS TABLE (
    current_progress DECIMAL(5,2),
    previous_progress DECIMAL(5,2),
    change_percentage DECIMAL(5,2),
    change_type TEXT
) AS $$
DECLARE
    v_period_start TIMESTAMP WITH TIME ZONE;
    v_current_progress DECIMAL(5,2);
    v_previous_progress DECIMAL(5,2);
    v_change DECIMAL(5,2);
BEGIN
    -- Calculate period start based on type
    CASE p_period_type
        WHEN 'day' THEN
            v_period_start := DATE_TRUNC('day', NOW()) - INTERVAL '1 day';
        WHEN 'week' THEN
            v_period_start := DATE_TRUNC('week', NOW()) - INTERVAL '1 week';
        WHEN 'month' THEN
            v_period_start := DATE_TRUNC('month', NOW()) - INTERVAL '1 month';
        ELSE
            v_period_start := DATE_TRUNC('week', NOW()) - INTERVAL '1 week';
    END CASE;

    -- Get current progress (latest record)
    IF p_subject_id IS NULL THEN
        -- Overall progress across all subjects
        SELECT AVG(pt.progress_percentage) INTO v_current_progress
        FROM (
            SELECT DISTINCT ON (subject_id) progress_percentage
            FROM progress_tracking
            WHERE user_id = p_user_id
            ORDER BY subject_id, recorded_at DESC
        ) pt;
    ELSE
        -- Progress for specific subject
        SELECT pt.progress_percentage INTO v_current_progress
        FROM progress_tracking pt
        WHERE pt.user_id = p_user_id
        AND pt.subject_id = p_subject_id
        ORDER BY pt.recorded_at DESC
        LIMIT 1;
    END IF;

    -- Get previous progress (from the specified period ago)
    IF p_subject_id IS NULL THEN
        -- Overall progress across all subjects
        SELECT AVG(pt.progress_percentage) INTO v_previous_progress
        FROM (
            SELECT DISTINCT ON (subject_id) progress_percentage
            FROM progress_tracking
            WHERE user_id = p_user_id
            AND recorded_at <= v_period_start
            ORDER BY subject_id, recorded_at DESC
        ) pt;
    ELSE
        -- Progress for specific subject
        SELECT pt.progress_percentage INTO v_previous_progress
        FROM progress_tracking pt
        WHERE pt.user_id = p_user_id
        AND pt.subject_id = p_subject_id
        AND pt.recorded_at <= v_period_start
        ORDER BY pt.recorded_at DESC
        LIMIT 1;
    END IF;

    -- Calculate change
    IF v_current_progress IS NULL THEN
        v_current_progress := 0;
    END IF;
    
    IF v_previous_progress IS NULL THEN
        v_previous_progress := 0;
    END IF;

    v_change := v_current_progress - v_previous_progress;

    -- Return results
    RETURN QUERY SELECT 
        v_current_progress,
        v_previous_progress,
        v_change,
        CASE 
            WHEN v_change > 0 THEN 'positive'
            WHEN v_change < 0 THEN 'negative'
            ELSE 'neutral'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON progress_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION get_progress_change(UUID, UUID, TEXT) TO authenticated;