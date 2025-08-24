-- Create integration settings table to store Slack/Notion configuration
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_type TEXT NOT NULL CHECK (integration_type IN ('slack', 'notion')),
  is_enabled BOOLEAN DEFAULT false,
  webhook_url TEXT,
  channel_id TEXT,
  access_token TEXT,
  settings JSONB DEFAULT '{}',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "integration_settings_select_own" ON public.integration_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "integration_settings_insert_own" ON public.integration_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_settings_update_own" ON public.integration_settings 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "integration_settings_delete_own" ON public.integration_settings 
  FOR DELETE USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate integration types per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_settings_user_type 
  ON public.integration_settings(user_id, integration_type);
