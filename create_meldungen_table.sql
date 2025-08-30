-- Create meldungen table for tracking daily subject participation
CREATE TABLE IF NOT EXISTS public.meldungen (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite uniqueness constraint
    UNIQUE(user_id, subject_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meldungen_user_date ON public.meldungen(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meldungen_user_subject ON public.meldungen(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_meldungen_date ON public.meldungen(date);

-- Enable RLS
ALTER TABLE public.meldungen ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own meldungen
CREATE POLICY "Users can view own meldungen" ON public.meldungen
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meldungen" ON public.meldungen
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meldungen" ON public.meldungen
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meldungen" ON public.meldungen
    FOR DELETE USING (auth.uid() = user_id);

-- Parent access policies (using parent_child_relationships table)
CREATE POLICY "Parents can view children meldungen" ON public.meldungen
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_child_relationships pcr
            WHERE pcr.parent_id = auth.uid()
            AND pcr.child_id = user_id
        )
    );

CREATE POLICY "Parents can insert children meldungen" ON public.meldungen
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM parent_child_relationships pcr
            WHERE pcr.parent_id = auth.uid()
            AND pcr.child_id = user_id
        )
    );

CREATE POLICY "Parents can update children meldungen" ON public.meldungen
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM parent_child_relationships pcr
            WHERE pcr.parent_id = auth.uid()
            AND pcr.child_id = user_id
        )
    );

CREATE POLICY "Parents can delete children meldungen" ON public.meldungen
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM parent_child_relationships pcr
            WHERE pcr.parent_id = auth.uid()
            AND pcr.child_id = user_id
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_meldungen_updated_at
    BEFORE UPDATE ON public.meldungen
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();