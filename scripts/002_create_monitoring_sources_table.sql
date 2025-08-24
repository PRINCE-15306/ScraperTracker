-- Create monitoring sources table to track different sources for each competitor
CREATE TABLE IF NOT EXISTS public.monitoring_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('website', 'changelog', 'blog', 'social', 'app_store', 'pricing_page')),
  source_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.monitoring_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "monitoring_sources_select_own" ON public.monitoring_sources 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "monitoring_sources_insert_own" ON public.monitoring_sources 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "monitoring_sources_update_own" ON public.monitoring_sources 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "monitoring_sources_delete_own" ON public.monitoring_sources 
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_monitoring_sources_competitor_id ON public.monitoring_sources(competitor_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_sources_user_id ON public.monitoring_sources(user_id);
