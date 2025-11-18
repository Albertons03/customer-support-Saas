-- AI Usage Tracking Table
-- Purpose: Track OpenAI API usage, costs, and enforce rate limits
-- Features: Token counting, cost estimation, workspace quotas, user rate limiting

-- Create ai_usage table
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    
    -- Token usage
    token_count INTEGER NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    
    -- Cost tracking
    cost_estimate DECIMAL(10, 6) NOT NULL,
    model TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT ai_usage_token_count_positive CHECK (token_count > 0),
    CONSTRAINT ai_usage_cost_positive CHECK (cost_estimate >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_workspace ON ai_usage(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_conversation ON ai_usage(conversation_id);

-- Composite index for rate limiting queries (user + recent time)
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_time ON ai_usage(user_id, created_at DESC);

-- Composite index for monthly quota queries (workspace + month)
CREATE INDEX IF NOT EXISTS idx_ai_usage_workspace_time ON ai_usage(workspace_id, created_at DESC);

-- RLS Policies
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own usage
CREATE POLICY "ai_usage_user_read" ON ai_usage
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT id FROM profiles WHERE email = (auth.jwt() ->> 'email')::text LIMIT 1));

-- Policy: Users can view their workspace usage (for admins)
CREATE POLICY "ai_usage_workspace_read" ON ai_usage
    FOR SELECT
    TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM profiles 
            WHERE email = (auth.jwt() ->> 'email')::text
            AND role IN ('admin', 'agent')
            LIMIT 1
        )
    );

-- Policy: Service role can insert (Edge Function uses service role key)
-- Note: This policy is handled by service role key in Edge Function

-- Function: Get user's hourly rate limit status
CREATE OR REPLACE FUNCTION get_user_rate_limit(p_user_id UUID)
RETURNS TABLE (
    request_count BIGINT,
    requests_allowed INTEGER,
    requests_remaining INTEGER,
    reset_at TIMESTAMPTZ
) AS $$
DECLARE
    v_one_hour_ago TIMESTAMPTZ := NOW() - INTERVAL '1 hour';
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM ai_usage
    WHERE user_id = p_user_id
    AND created_at >= v_one_hour_ago;
    
    RETURN QUERY
    SELECT 
        v_count,
        20::INTEGER AS requests_allowed,
        GREATEST(0, 20 - v_count::INTEGER) AS requests_remaining,
        (NOW() + INTERVAL '1 hour')::TIMESTAMPTZ AS reset_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get workspace monthly quota status
CREATE OR REPLACE FUNCTION get_workspace_monthly_quota(p_workspace_id UUID)
RETURNS TABLE (
    tokens_used BIGINT,
    tokens_limit INTEGER,
    tokens_remaining INTEGER,
    cost_used DECIMAL,
    cost_limit DECIMAL,
    reset_at TIMESTAMPTZ
) AS $$
DECLARE
    v_start_of_month TIMESTAMPTZ := DATE_TRUNC('month', NOW());
    v_next_month TIMESTAMPTZ := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    v_tokens BIGINT;
    v_cost DECIMAL;
BEGIN
    SELECT 
        COALESCE(SUM(token_count), 0),
        COALESCE(SUM(cost_estimate), 0)
    INTO v_tokens, v_cost
    FROM ai_usage
    WHERE workspace_id = p_workspace_id
    AND created_at >= v_start_of_month;
    
    RETURN QUERY
    SELECT 
        v_tokens,
        1000000::INTEGER AS tokens_limit,
        GREATEST(0, 1000000 - v_tokens::INTEGER) AS tokens_remaining,
        v_cost,
        2.00::DECIMAL AS cost_limit,
        v_next_month AS reset_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get usage statistics for dashboard
CREATE OR REPLACE FUNCTION get_usage_stats(
    p_workspace_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    request_count BIGINT,
    total_tokens BIGINT,
    total_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as date,
        COUNT(*)::BIGINT as request_count,
        SUM(token_count)::BIGINT as total_tokens,
        SUM(cost_estimate)::DECIMAL as total_cost
    FROM ai_usage
    WHERE workspace_id = p_workspace_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(created_at)
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_rate_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_workspace_monthly_quota(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_stats(UUID, INTEGER) TO authenticated;

-- Insert sample usage data (optional, for testing)
-- Commented out by default
/*
INSERT INTO ai_usage (workspace_id, user_id, token_count, cost_estimate, model)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    id,
    (RANDOM() * 1000 + 100)::INTEGER,
    ((RANDOM() * 1000 + 100) / 1000 * 0.002)::DECIMAL,
    'gpt-3.5-turbo'
FROM profiles
LIMIT 5;
*/

COMMENT ON TABLE ai_usage IS 'Tracks OpenAI API usage for rate limiting and cost control';
COMMENT ON COLUMN ai_usage.token_count IS 'Total tokens used (prompt + completion)';
COMMENT ON COLUMN ai_usage.cost_estimate IS 'Estimated cost in USD based on model pricing';
COMMENT ON COLUMN ai_usage.model IS 'OpenAI model used (e.g., gpt-3.5-turbo, gpt-4)';
