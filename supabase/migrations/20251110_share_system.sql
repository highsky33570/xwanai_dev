-- =============================================================================
-- Migration: Share System
-- Description: Create tables for character/chat sharing with reward system
-- Date: 2025-11-10
-- =============================================================================

-- 1. Drop old share table if exists
DROP TABLE IF EXISTS public.basic_bazi_session_shares CASCADE;

-- 2. Add unique constraint to sessions.id if not exists
-- (sessions 表使用复合主键，但 id 字段本身是全局唯一的 UUID)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sessions_id_unique'
  ) THEN
    ALTER TABLE public.sessions ADD CONSTRAINT sessions_id_unique UNIQUE (id);
  END IF;
END $$;

-- =============================================================================
-- SHARES TABLE
-- 统一的分享记录表（如果表不存在则创建，如果存在则添加新列）
-- =============================================================================
DO $$ 
BEGIN
  -- 检查表是否存在
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shares') THEN
    -- 表不存在，创建表
    CREATE TABLE public.shares (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      share_token varchar(32) NOT NULL UNIQUE,
      share_type varchar(20) NOT NULL CHECK (share_type IN ('character', 'chat', 'hepan')),
      
      -- 分享内容引用
      character_id uuid NULL REFERENCES public.characters(id) ON DELETE CASCADE,
      session_id varchar NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
      
      -- 角色分享的报告选择（JSON数组，如 ["basic", "personal", "career"]）
      selected_reports jsonb NULL DEFAULT '[]'::jsonb,
      
      -- 角色灵魂档案的子模块选择（JSON数组，如 ["ai_summary", "keywords", "key_events"]）
      selected_soul_sections jsonb NULL DEFAULT '[]'::jsonb,
      
      -- 聊天记录分享的消息ID列表（JSON数组）
      selected_message_ids jsonb NULL DEFAULT '[]'::jsonb,
      
      -- 是否包含用户消息
      include_user_messages boolean DEFAULT true,
      
      -- 统计数据
      view_count int DEFAULT 0,
      
      -- 时间字段
      expires_at timestamptz NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL,
      
      CONSTRAINT shares_character_or_session CHECK (
        (share_type = 'character' AND character_id IS NOT NULL) OR
        (share_type IN ('chat', 'hepan') AND session_id IS NOT NULL)
      )
    );
  ELSE
    -- 表已存在，添加新列（如果不存在）
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'shares' 
      AND column_name = 'selected_soul_sections'
    ) THEN
      ALTER TABLE public.shares 
      ADD COLUMN selected_soul_sections jsonb NULL DEFAULT '[]'::jsonb;
    END IF;
  END IF;
END $$;

-- Indexes for shares (如果不存在则创建)
CREATE INDEX IF NOT EXISTS idx_shares_token ON public.shares(share_token);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON public.shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_character_id ON public.shares(character_id);
CREATE INDEX IF NOT EXISTS idx_shares_session_id ON public.shares(session_id);
CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON public.shares(expires_at);

-- Enable RLS
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shares (如果不存在则创建)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'shares' 
    AND policyname = 'Users can create their own shares'
  ) THEN
    CREATE POLICY "Users can create their own shares"
      ON public.shares FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'shares' 
    AND policyname = 'Users can view their own shares'
  ) THEN
    CREATE POLICY "Users can view their own shares"
      ON public.shares FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'shares' 
    AND policyname = 'Users can update their own shares'
  ) THEN
    CREATE POLICY "Users can update their own shares"
      ON public.shares FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'shares' 
    AND policyname = 'Users can delete their own shares'
  ) THEN
    CREATE POLICY "Users can delete their own shares"
      ON public.shares FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================================================
-- SHARE_VIEWS TABLE
-- 分享访问记录，用于防刷和统计
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.share_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id uuid NOT NULL REFERENCES public.shares(id) ON DELETE CASCADE,
  
  -- 访客标识（优先级：user_id > session_id > ip_address）
  viewer_user_id uuid NULL REFERENCES auth.users(id),
  viewer_session_id varchar NULL,  -- 浏览器指纹
  viewer_ip varchar NULL,
  
  -- 访问信息
  user_agent text NULL,
  referer text NULL,
  
  -- 是否触发奖励
  reward_granted boolean DEFAULT false,
  
  viewed_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for share_views
CREATE INDEX IF NOT EXISTS idx_share_views_share_id ON public.share_views(share_id);
CREATE INDEX IF NOT EXISTS idx_share_views_viewer_user ON public.share_views(viewer_user_id);
CREATE INDEX IF NOT EXISTS idx_share_views_viewer_session ON public.share_views(viewer_session_id);
CREATE INDEX IF NOT EXISTS idx_share_views_viewed_at ON public.share_views(viewed_at);

-- Unique constraint: 同一访客只能访问同一分享一次
CREATE UNIQUE INDEX IF NOT EXISTS idx_share_views_unique_viewer ON public.share_views(
  share_id, 
  COALESCE(viewer_user_id::text, ''), 
  COALESCE(viewer_session_id, ''), 
  COALESCE(viewer_ip, '')
);

-- Enable RLS
ALTER TABLE public.share_views ENABLE ROW LEVEL SECURITY;

-- RLS Policy: 任何人都可以创建访问记录（包括匿名用户）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'share_views' 
    AND policyname = 'Anyone can record share views'
  ) THEN
    CREATE POLICY "Anyone can record share views"
      ON public.share_views FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'share_views' 
    AND policyname = 'Users can view their share views'
  ) THEN
    CREATE POLICY "Users can view their share views"
      ON public.share_views FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.shares 
          WHERE shares.id = share_views.share_id 
          AND shares.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =============================================================================
-- SHARE_REWARDS TABLE
-- 分享奖励记录
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.share_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_id uuid NOT NULL REFERENCES public.shares(id) ON DELETE CASCADE,
  
  -- 奖励内容（基于用户类型）
  chat_bonus int DEFAULT 0,          -- 每日聊天次数增加
  hepan_bonus int DEFAULT 0,         -- 每周合盘次数增加
  character_bonus int DEFAULT 0,     -- 角色数量增加
  agent_bonus int DEFAULT 0,         -- 可激活Agent增加
  
  -- 奖励状态
  is_active boolean DEFAULT true,
  reward_count int DEFAULT 1,        -- 第几次分享奖励（1, 2, 3）
  
  -- 有效期
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT share_rewards_user_share_unique UNIQUE (user_id, share_id)
);

-- Indexes for share_rewards
CREATE INDEX IF NOT EXISTS idx_share_rewards_user_id ON public.share_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_share_rewards_expires_at ON public.share_rewards(expires_at);
CREATE INDEX IF NOT EXISTS idx_share_rewards_active ON public.share_rewards(user_id, is_active, expires_at);

-- Enable RLS
ALTER TABLE public.share_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policy: 用户只能查看自己的奖励
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'share_rewards' 
    AND policyname = 'Users can view their own rewards'
  ) THEN
    CREATE POLICY "Users can view their own rewards"
      ON public.share_rewards FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================================================
-- RPC FUNCTION: record_share_view
-- 记录分享访问并触发奖励
-- =============================================================================
CREATE OR REPLACE FUNCTION public.record_share_view(
  p_share_token varchar,
  p_viewer_user_id uuid DEFAULT NULL,
  p_viewer_session_id varchar DEFAULT NULL,
  p_viewer_ip varchar DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_referer text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_share_id uuid;
  v_share_owner_id uuid;
  v_share_type varchar;
  v_view_exists boolean;
  v_reward_granted boolean := false;
  v_reward_count int := 0;
  v_is_premium boolean := false;
  v_chat_bonus int := 0;
  v_hepan_bonus int := 0;
  v_character_bonus int := 0;
  v_agent_bonus int := 0;
BEGIN
  -- 1. 获取分享信息
  SELECT id, user_id, share_type
  INTO v_share_id, v_share_owner_id, v_share_type
  FROM public.shares
  WHERE share_token = p_share_token
  AND expires_at > now();
  
  IF v_share_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Share not found or expired'
    );
  END IF;
  
  -- 2. 检查是否自己访问自己的分享
  IF p_viewer_user_id = v_share_owner_id THEN
    RETURN jsonb_build_object(
      'success', true,
      'reward_granted', false,
      'message', 'Owner viewing own share'
    );
  END IF;
  
  -- 3. 检查是否已访问过
  SELECT EXISTS (
    SELECT 1 FROM public.share_views
    WHERE share_id = v_share_id
    AND (
      (p_viewer_user_id IS NOT NULL AND viewer_user_id = p_viewer_user_id) OR
      (p_viewer_session_id IS NOT NULL AND viewer_session_id = p_viewer_session_id) OR
      (p_viewer_ip IS NOT NULL AND viewer_ip = p_viewer_ip)
    )
  ) INTO v_view_exists;
  
  IF v_view_exists THEN
    RETURN jsonb_build_object(
      'success', true,
      'reward_granted', false,
      'message', 'Already viewed'
    );
  END IF;
  
  -- 4. 记录访问
  INSERT INTO public.share_views (
    share_id,
    viewer_user_id,
    viewer_session_id,
    viewer_ip,
    user_agent,
    referer
  ) VALUES (
    v_share_id,
    p_viewer_user_id,
    p_viewer_session_id,
    p_viewer_ip,
    p_user_agent,
    p_referer
  );
  
  -- 5. 更新分享的访问计数
  UPDATE public.shares
  SET view_count = view_count + 1
  WHERE id = v_share_id;
  
  -- 6. 检查是否应该触发奖励
  -- 统计本周内已获得的分享奖励次数（7天内）
  SELECT COUNT(*)
  INTO v_reward_count
  FROM public.share_rewards
  WHERE user_id = v_share_owner_id
  AND created_at > now() - interval '7 days';
  
  -- 如果已经获得3次奖励，不再发放
  IF v_reward_count >= 3 THEN
    RETURN jsonb_build_object(
      'success', true,
      'reward_granted', false,
      'message', 'Weekly reward limit reached'
    );
  END IF;
  
  -- 7. 获取用户会员状态
  SELECT 
    CASE 
      WHEN subscription_status = 'active' THEN true
      ELSE false
    END
  INTO v_is_premium
  FROM public.profiles
  WHERE id = v_share_owner_id;
  
  -- 8. 计算奖励（基于用户类型）
  IF v_is_premium THEN
    -- 付费用户奖励
    v_agent_bonus := 2;
    v_character_bonus := 2;
  ELSE
    -- 免费用户奖励
    v_chat_bonus := 10;
    v_hepan_bonus := 1;
    v_character_bonus := 1;
    v_agent_bonus := 1;
  END IF;
  
  -- 9. 创建奖励记录
  INSERT INTO public.share_rewards (
    user_id,
    share_id,
    chat_bonus,
    hepan_bonus,
    character_bonus,
    agent_bonus,
    reward_count,
    expires_at
  ) VALUES (
    v_share_owner_id,
    v_share_id,
    v_chat_bonus,
    v_hepan_bonus,
    v_character_bonus,
    v_agent_bonus,
    v_reward_count + 1,
    now() + interval '7 days'
  );
  
  v_reward_granted := true;
  
  -- 10. 标记此次访问已触发奖励
  UPDATE public.share_views
  SET reward_granted = true
  WHERE share_id = v_share_id
  AND viewer_user_id = p_viewer_user_id
  AND viewer_session_id = p_viewer_session_id
  AND viewer_ip = p_viewer_ip;
  
  -- 11. 返回结果
  RETURN jsonb_build_object(
    'success', true,
    'reward_granted', v_reward_granted,
    'reward', jsonb_build_object(
      'chat_bonus', v_chat_bonus,
      'hepan_bonus', v_hepan_bonus,
      'character_bonus', v_character_bonus,
      'agent_bonus', v_agent_bonus,
      'expires_at', now() + interval '7 days',
      'count', v_reward_count + 1
    )
  );
  
EXCEPTION
  WHEN unique_violation THEN
    -- 并发情况下可能重复插入，返回已访问
    RETURN jsonb_build_object(
      'success', true,
      'reward_granted', false,
      'message', 'Already viewed (concurrent)'
    );
  WHEN OTHERS THEN
    RAISE WARNING 'Error in record_share_view: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- =============================================================================
-- RPC FUNCTION: get_active_share_rewards
-- 获取用户当前有效的分享奖励总和
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_active_share_rewards(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_chat_bonus int := 0;
  v_total_hepan_bonus int := 0;
  v_total_character_bonus int := 0;
  v_total_agent_bonus int := 0;
  v_reward_count int := 0;
BEGIN
  -- 统计所有有效的奖励
  SELECT
    COALESCE(SUM(chat_bonus), 0),
    COALESCE(SUM(hepan_bonus), 0),
    COALESCE(SUM(character_bonus), 0),
    COALESCE(SUM(agent_bonus), 0),
    COUNT(*)
  INTO
    v_total_chat_bonus,
    v_total_hepan_bonus,
    v_total_character_bonus,
    v_total_agent_bonus,
    v_reward_count
  FROM public.share_rewards
  WHERE user_id = p_user_id
  AND is_active = true
  AND expires_at > now();
  
  RETURN jsonb_build_object(
    'chat_bonus', v_total_chat_bonus,
    'hepan_bonus', v_total_hepan_bonus,
    'character_bonus', v_total_character_bonus,
    'agent_bonus', v_total_agent_bonus,
    'active_count', v_reward_count
  );
END;
$$;

-- =============================================================================
-- New function: get_user_limits
-- 获取用户完整配额信息（包含分享奖励、邀请奖励）
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_user_limits(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_status text;
    v_subscription_tier text;
    v_subscription_start_date timestamptz;
    v_subscription_end_date timestamptz;
    v_is_premium boolean;
    v_invitation_reward RECORD;
    v_share_reward RECORD;
    v_has_active_invitation_reward boolean := false;
    v_has_active_share_reward boolean := false;
    v_base_character_limit int;
    v_base_session_limit int;
    v_base_chat_limit int;
    v_base_hepan_limit int;
    v_base_agent_limit int;
    v_final_character_limit int;
    v_final_session_limit int;
    v_final_chat_limit int;
    v_final_hepan_limit int;
    v_final_agent_limit int;
BEGIN
    -- Get subscription info
    SELECT 
        subscription_status,
        subscription_tier,
        subscription_start_date,
        subscription_end_date
    INTO 
        v_subscription_status,
        v_subscription_tier,
        v_subscription_start_date,
        v_subscription_end_date
    FROM public.profiles
    WHERE id = target_user_id;

    v_is_premium := (v_subscription_status = 'active');

    -- Check for active invitation reward
    SELECT ir.* INTO v_invitation_reward
    FROM invitation_rewards ir
    WHERE ir.user_id = target_user_id
      AND ir.expires_at > now();
    
    v_has_active_invitation_reward := v_invitation_reward IS NOT NULL;
    
    -- Check for active share rewards (汇总所有有效奖励)
    SELECT 
      COALESCE(SUM(chat_bonus), 0) as total_chat_bonus,
      COALESCE(SUM(hepan_bonus), 0) as total_hepan_bonus,
      COALESCE(SUM(character_bonus), 0) as total_character_bonus,
      COALESCE(SUM(agent_bonus), 0) as total_agent_bonus
    INTO v_share_reward
    FROM share_rewards sr
    WHERE sr.user_id = target_user_id
      AND sr.is_active = true
      AND sr.expires_at > now();
    
    v_has_active_share_reward := (v_share_reward.total_chat_bonus > 0 OR 
                                   v_share_reward.total_character_bonus > 0 OR
                                   v_share_reward.total_agent_bonus > 0);

    -- Base limits
    IF v_is_premium THEN
        v_base_character_limit := 15;
        v_base_session_limit := 10;
        v_base_chat_limit := 999999;
        v_base_hepan_limit := 999999;
        v_base_agent_limit := 999999;
    ELSE
        v_base_character_limit := 5;
        v_base_session_limit := 3;
        v_base_chat_limit := 5;
        v_base_hepan_limit := 3;
        v_base_agent_limit := 1;
    END IF;

    -- Apply invitation rewards
    IF v_has_active_invitation_reward THEN
        v_final_character_limit := v_base_character_limit + COALESCE(v_invitation_reward.character_count_bonus, 0);
        v_final_session_limit := v_base_session_limit + COALESCE(v_invitation_reward.session_count_bonus, 0);
    ELSE
        v_final_character_limit := v_base_character_limit;
        v_final_session_limit := v_base_session_limit;
    END IF;
    
    -- Apply share rewards
    IF v_has_active_share_reward THEN
        v_final_character_limit := v_final_character_limit + COALESCE(v_share_reward.total_character_bonus, 0);
        v_final_chat_limit := v_base_chat_limit + COALESCE(v_share_reward.total_chat_bonus, 0);
        v_final_hepan_limit := v_base_hepan_limit + COALESCE(v_share_reward.total_hepan_bonus, 0);
        v_final_agent_limit := v_base_agent_limit + COALESCE(v_share_reward.total_agent_bonus, 0);
    ELSE
        v_final_chat_limit := v_base_chat_limit;
        v_final_hepan_limit := v_base_hepan_limit;
        v_final_agent_limit := v_base_agent_limit;
    END IF;

    RETURN jsonb_build_object(
        'is_premium', v_is_premium,
        'subscription_status', v_subscription_status,
        'subscription_tier', v_subscription_tier,
        'subscription_start_date', v_subscription_start_date,
        'subscription_end_date', v_subscription_end_date,
        'has_active_invitation_reward', v_has_active_invitation_reward,
        'has_active_share_reward', v_has_active_share_reward,
        'limits', jsonb_build_object(
            'character_max', v_final_character_limit,
            'character_session_weekly_max', v_final_session_limit,
            'chat_daily_max', v_final_chat_limit,
            'hepan_weekly_max', v_final_hepan_limit,
            'agent_max', v_final_agent_limit
        ),
        'bonuses', jsonb_build_object(
            'invitation', CASE 
                WHEN v_has_active_invitation_reward THEN
                    jsonb_build_object(
                        'character_bonus', COALESCE(v_invitation_reward.character_count_bonus, 0),
                        'session_bonus', COALESCE(v_invitation_reward.session_count_bonus, 0),
                        'expires_at', v_invitation_reward.expires_at
                    )
                ELSE NULL
            END,
            'share', CASE 
                WHEN v_has_active_share_reward THEN
                    jsonb_build_object(
                        'character_bonus', COALESCE(v_share_reward.total_character_bonus, 0),
                        'chat_bonus', COALESCE(v_share_reward.total_chat_bonus, 0),
                        'hepan_bonus', COALESCE(v_share_reward.total_hepan_bonus, 0),
                        'agent_bonus', COALESCE(v_share_reward.total_agent_bonus, 0)
                    )
                ELSE NULL
            END
        )
    );
END;
$$;

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE public.shares IS '统一的分享记录表，支持角色、聊天、合盘分享';
COMMENT ON TABLE public.share_views IS '分享访问记录，用于防刷和奖励触发';
COMMENT ON TABLE public.share_rewards IS '分享奖励记录，支持叠加和过期管理';
COMMENT ON FUNCTION public.record_share_view IS '记录分享访问并自动触发奖励（防刷机制）';
COMMENT ON FUNCTION public.get_active_share_rewards IS '获取用户当前有效的分享奖励总和';
COMMENT ON FUNCTION public.get_user_limits IS '获取用户完整配额信息（包含付费会员、邀请奖励、分享奖励）';

