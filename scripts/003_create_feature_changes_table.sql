-- Create feature changes table to store detected changes
CREATE TABLE IF NOT EXISTS public.feature_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.monitoring_sources(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('feature_added', 'feature_removed', 'feature_updated', 'pricing_change', 'ui_change', 'content_change')),
  title TEXT NOT NULL,
  description TEXT,
  old_content TEXT,
  new_content TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  is_reviewed BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feature_changes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "feature_changes_select_own" ON public.feature_changes 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "feature_changes_insert_own" ON public.feature_changes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feature_changes_update_own" ON public.feature_changes 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "feature_changes_delete_own" ON public.feature_changes 
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_changes_competitor_id ON public.feature_changes(competitor_id);
CREATE INDEX IF NOT EXISTS idx_feature_changes_user_id ON public.feature_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_changes_detected_at ON public.feature_changes(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_changes_is_important ON public.feature_changes(is_important);
