-- Create competitors table to store competitor information
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  logo_url TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "competitors_select_own" ON public.competitors 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "competitors_insert_own" ON public.competitors 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "competitors_update_own" ON public.competitors 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "competitors_delete_own" ON public.competitors 
  FOR DELETE USING (auth.uid() = user_id);
