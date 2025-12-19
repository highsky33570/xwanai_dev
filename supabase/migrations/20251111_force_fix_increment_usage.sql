-- =============================================================================
-- 强制修复 increment_usage 函数中的 user_id 歧义性问题
-- 先删除旧函数，再创建新函数
-- =============================================================================

-- 删除旧函数（如果存在）
DROP FUNCTION IF EXISTS public.increment_usage(uuid, text);

-- 重新创建函数，明确指定所有参数引用
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_usage_type text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_count INTEGER;
    v_now TIMESTAMPTZ := NOW();
    v_shanghai_tz TIMESTAMPTZ := v_now AT TIME ZONE 'Asia/Shanghai';
BEGIN
    -- 确保用户有记录
    INSERT INTO usage_stats (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 根据类型更新计数
    CASE p_usage_type
        WHEN 'xwan_ai_daily' THEN
            UPDATE usage_stats
            SET 
                xwan_ai_daily = CASE 
                    WHEN xwan_ai_daily_reset_at <= v_now THEN 1
                    ELSE xwan_ai_daily + 1
                END,
                xwan_ai_daily_reset_at = CASE
                    WHEN xwan_ai_daily_reset_at <= v_now THEN 
                        (DATE_TRUNC('day', v_shanghai_tz) + INTERVAL '1 day') AT TIME ZONE 'Asia/Shanghai'
                    ELSE xwan_ai_daily_reset_at
                END,
                updated_at = v_now
            WHERE usage_stats.user_id = p_user_id
            RETURNING xwan_ai_daily INTO v_new_count;
            
        WHEN 'hepan_weekly' THEN
            UPDATE usage_stats
            SET 
                hepan_weekly = CASE 
                    WHEN hepan_weekly_reset_at <= v_now THEN 1
                    ELSE hepan_weekly + 1
                END,
                hepan_weekly_reset_at = CASE
                    WHEN hepan_weekly_reset_at <= v_now THEN 
                        (DATE_TRUNC('week', v_shanghai_tz) + INTERVAL '1 week') AT TIME ZONE 'Asia/Shanghai'
                    ELSE hepan_weekly_reset_at
                END,
                updated_at = v_now
            WHERE usage_stats.user_id = p_user_id
            RETURNING hepan_weekly INTO v_new_count;
            
        WHEN 'character_session_weekly' THEN
            UPDATE usage_stats
            SET 
                character_session_weekly = CASE 
                    WHEN character_session_weekly_reset_at <= v_now THEN 1
                    ELSE character_session_weekly + 1
                END,
                character_session_weekly_reset_at = CASE
                    WHEN character_session_weekly_reset_at <= v_now THEN 
                        (DATE_TRUNC('week', v_shanghai_tz) + INTERVAL '1 week') AT TIME ZONE 'Asia/Shanghai'
                    ELSE character_session_weekly_reset_at
                END,
                updated_at = v_now
            WHERE usage_stats.user_id = p_user_id
            RETURNING character_session_weekly INTO v_new_count;
            
        ELSE
            RAISE EXCEPTION 'Invalid usage_type: %', p_usage_type;
    END CASE;
    
    RETURN COALESCE(v_new_count, 0);
END;
$$;

