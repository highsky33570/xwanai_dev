-- =============================================================================
-- 修复 is_premium_user 函数：检查订阅过期时间
-- 
-- 问题：原函数只检查 subscription_tier，不检查 subscription_end_date
-- 导致已过期的试用会员仍然被判定为 premium 用户
-- 
-- 修复：增加对 subscription_end_date 的检查
-- =============================================================================

CREATE OR REPLACE FUNCTION is_premium_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_tier TEXT;
    v_subscription_end_date TIMESTAMPTZ;
    v_has_active_reward BOOLEAN;
BEGIN
    -- 1. 检查付费订阅
    SELECT p.subscription_tier, p.subscription_end_date 
    INTO v_subscription_tier, v_subscription_end_date
    FROM profiles p
    WHERE p.id = target_user_id;
    
    -- 🎯 修复：检查订阅类型 AND 检查是否未过期
    IF v_subscription_tier IN ('monthly', 'yearly', 'premium') THEN
        -- 如果有结束日期，检查是否过期
        IF v_subscription_end_date IS NOT NULL THEN
            -- 只有未过期才返回 TRUE
            IF v_subscription_end_date > NOW() THEN
                RETURN TRUE;
            END IF;
        ELSE
            -- 如果没有结束日期（不应该发生，但兼容处理）
            RETURN TRUE;
        END IF;
    END IF;
    
    -- 2. 检查邀请奖励（试用会员）
    SELECT EXISTS(
        SELECT 1 FROM invitation_rewards ir
        WHERE ir.user_id = target_user_id
          AND ir.expires_at > NOW()
    ) INTO v_has_active_reward;
    
    RETURN v_has_active_reward;
END;
$$;

-- =============================================================================
-- 更新已过期订阅的状态
-- 将所有过期的订阅状态从 'active' 改为 'expired'
-- =============================================================================
UPDATE profiles
SET 
    subscription_status = 'expired',
    updated_at = NOW()
WHERE 
    subscription_status = 'active'
    AND subscription_end_date IS NOT NULL
    AND subscription_end_date <= NOW();

-- =============================================================================
-- 说明和提醒
-- =============================================================================
-- 
-- ✅ 修复后的行为：
-- 1. 检查 subscription_tier 是否为 'monthly', 'yearly', 'premium'
-- 2. 如果是，进一步检查 subscription_end_date 是否已过期
-- 3. 只有未过期的订阅才返回 TRUE
-- 4. 邀请奖励仍然按原逻辑检查 expires_at
-- 
-- 📋 后续建议：
-- 考虑创建一个定时任务（pg_cron）或触发器，自动更新过期订阅的状态
-- 
-- =============================================================================

