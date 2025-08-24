-- Create weekly summaries table to store generated reports
CREATE TABLE IF NOT EXISTS public.weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  summary_content JSONB NOT NULL,
  total_changes INTEGER DEFAULT 0,
  important_changes INTEGER DEFAULT 0,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "weekly_summaries_select_own" ON public.weekly_summaries 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "weekly_summaries_insert_own" ON public.weekly_summaries 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "weekly_summaries_update_own" ON public.weekly_summaries 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "weekly_summaries_delete_own" ON public.weekly_summaries 
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_id ON public.weekly_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week_start ON public.weekly_summaries(week_start_date DESC);

-- Create unique constraint to prevent duplicate summaries for the same week
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_summaries_user_week 
  ON public.weekly_summaries(user_id, week_start_date);
