-- Create analysis_patterns table for storing learned patterns
CREATE TABLE IF NOT EXISTS analysis_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_name VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    success_rate DECIMAL(3,2) DEFAULT 0.5,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analysis_history table for storing analysis results
CREATE TABLE IF NOT EXISTS analysis_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    competitor_url VARCHAR(500) NOT NULL,
    analysis_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    feedback_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning_feedback table for storing user feedback
CREATE TABLE IF NOT EXISTS learning_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES analysis_history(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'neutral')),
    accuracy_score DECIMAL(3,2),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create web_verification_cache table for caching verification results
CREATE TABLE IF NOT EXISTS web_verification_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    verification_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE analysis_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_verification_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analysis_patterns
CREATE POLICY "Users can view their own analysis patterns" ON analysis_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis patterns" ON analysis_patterns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis patterns" ON analysis_patterns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis patterns" ON analysis_patterns
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for analysis_history
CREATE POLICY "Users can view their own analysis history" ON analysis_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis history" ON analysis_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis history" ON analysis_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis history" ON analysis_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for learning_feedback
CREATE POLICY "Users can view their own learning feedback" ON learning_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning feedback" ON learning_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning feedback" ON learning_feedback
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning feedback" ON learning_feedback
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for web_verification_cache
CREATE POLICY "Users can view their own verification cache" ON web_verification_cache
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification cache" ON web_verification_cache
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification cache" ON web_verification_cache
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own verification cache" ON web_verification_cache
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_analysis_patterns_user_id ON analysis_patterns(user_id);
CREATE INDEX idx_analysis_patterns_type ON analysis_patterns(pattern_type);
CREATE INDEX idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX idx_analysis_history_url ON analysis_history(competitor_url);
CREATE INDEX idx_learning_feedback_analysis_id ON learning_feedback(analysis_id);
CREATE INDEX idx_web_verification_cache_url ON web_verification_cache(url);
CREATE INDEX idx_web_verification_cache_expires ON web_verification_cache(expires_at);
