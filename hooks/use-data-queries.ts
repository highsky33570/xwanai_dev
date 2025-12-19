import { useQuery } from "@tanstack/react-query";
import { authOperations } from "@/lib/supabase/auth";
import { databaseOperations } from "@/lib/supabase/database";
import { usageLimitsAPI } from "@/lib/api/usage-limits";
import type { User } from "@supabase/supabase-js";

// 查询键常量
export const queryKeys = {
  currentUser: ['currentUser'],
  userCharacters: (userId: string) => ['userCharacters', userId],
  userSessions: (userId: string) => ['userSessions', userId],
  characterSessions: (characterId: string, userId: string) => ['characterSessions', characterId, userId],
  sessionById: (sessionId: string) => ['session', sessionId],
  eventsBySession: (sessionId: string) => ['events', sessionId],
  characterBySession: (sessionId: string) => ['characterBySession', sessionId],
  usageStats: (userId: string) => ['usageStats', userId],  // 🎯 添加使用统计
  characterCategories: ['characterCategories'],
  mainCategories: ['mainCategories'],
  dimensionCategories: ['dimensionCategories'],
  getCharactersByTag:  (p_container_id: string, p_tag_name: string, p_limit: number = 20, p_offset: number = 0) => ['get_characters_by_tag', p_container_id, p_tag_name, p_limit, p_offset],
  getCharactersByMultipleTags:  (p_tags: {}, p_limit: number = 20, p_offset: number = 0) => ['get_characters_by_multiple_tags', p_tags, p_limit, p_offset],
} as const;

export function useMainCategories() {
  return useQuery({
    queryKey: queryKeys.mainCategories,
    queryFn: () => databaseOperations.getMainCategories(),
    staleTime: 2 * 60 * 1000, // 2分钟内认为数据新鲜
    gcTime: 5 * 60 * 1000, // 5分钟后清理缓存
    select: (data) => data.data || [],
  })
}

export function useDimensionCategories() {
  return useQuery({
    queryKey: queryKeys.dimensionCategories,
    queryFn: () => databaseOperations.getDimensionCategories(),
    staleTime: 2 * 60 * 1000, // 2分钟内认为数据新鲜
    gcTime: 5 * 60 * 1000, // 5分钟后清理缓存
    select: (data) => data.data || [],
  })
}

export function useGetCharactersByTag(container_id:string, tagName: string, p_limit: number = 20, p_offset: number = 0) {
  return useQuery({
    queryKey: queryKeys.getCharactersByTag(container_id, tagName, p_limit, p_offset),
    queryFn: () => databaseOperations.getCharactersByTag(container_id, tagName, p_limit, p_offset),
    staleTime: 2 * 60 * 1000, // 2分钟内认为数据新鲜
    gcTime: 5 * 60 * 1000, // 5分钟后清理缓存
    select: (data) => data.data || [],
  })
}

export function useGetCharactersByMultipleTag(pTags: {}) {
  return useQuery({
    queryKey: queryKeys.getCharactersByMultipleTags(pTags),
    queryFn: () => databaseOperations.getCharactersByMultipleTag(pTags),
    staleTime: 2 * 60 * 1000, // 2分钟内认为数据新鲜
    gcTime: 5 * 60 * 1000, // 5分钟后清理缓存
    select: (data) => data.data || [],
  })
}

// 获取角色分类的hook
export function useCharacterCategories() {
  return useQuery({
    queryKey: queryKeys.characterCategories,
    queryFn: () => databaseOperations.getCharacterCategories(),
    staleTime: 60 * 60 * 1000, // 1小时内认为数据新鲜 (分类数据不常变)
    gcTime: 24 * 60 * 60 * 1000, // 24小时后清理缓存
    select: (data) => data.data || [],
  });
}

// 获取当前用户的hook
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => authOperations.getCurrentUser(),
    staleTime: 2 * 60 * 1000, // 2分钟内认为数据新鲜
    gcTime: 5 * 60 * 1000, // 5分钟后清理缓存
    retry: 1, // 认证失败只重试1次
  });
}

// 获取用户角色的hook
export function useUserCharacters(userId?: string) {
  return useQuery({
    queryKey: queryKeys.userCharacters(userId || ''),
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return databaseOperations.getUserCharacters(userId);
    },
    enabled: !!userId, // 只有当userId存在时才执行查询
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据新鲜
    gcTime: 10 * 60 * 1000, // 10分钟后清理缓存
    select: (data) => data.data || [], // 只返回data部分
  });
}

// 获取用户会话的hook
export function useUserSessions(userId?: string) {
  return useQuery({
    queryKey: queryKeys.userSessions(userId || ''),
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return databaseOperations.getUserSessions(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 会话数据2分钟内新鲜
    gcTime: 5 * 60 * 1000, // 5分钟后清理缓存
    select: (data) => data.data || [],
  });
}

// 🎯 获取角色关联的所有sessions
export function useCharacterSessions(characterId?: string, userId?: string) {
  return useQuery({
    queryKey: queryKeys.characterSessions(characterId || '', userId || ''),
    queryFn: () => {
      if (!characterId) throw new Error('Character ID is required');
      if (!userId) throw new Error('User ID is required');
      return databaseOperations.getSessionsByCharacterId(characterId, userId);
    },
    enabled: !!characterId && !!userId,
    staleTime: 1 * 60 * 1000, // 角色sessions 1分钟内新鲜
    gcTime: 5 * 60 * 1000, // 5分钟后清理缓存
    select: (data) => data.data || [],
  });
}

// 获取特定会话详情的hook
export function useSessionById(sessionId?: string) {
  return useQuery({
    queryKey: queryKeys.sessionById(sessionId || ''),
    queryFn: () => {
      if (!sessionId) throw new Error('Session ID is required');
      return databaseOperations.getSessionById(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 10 * 60 * 1000, // 会话详情10分钟内新鲜
    gcTime: 30 * 60 * 1000, // 30分钟后清理缓存
    select: (data) => data.data,
  });
}

// 获取会话事件的hook
export function useEventsBySessionId(sessionId?: string) {
  return useQuery({
    queryKey: queryKeys.eventsBySession(sessionId || ''),
    queryFn: () => {
      if (!sessionId) throw new Error('Session ID is required');
      return databaseOperations.getEventsBySessionId(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 1 * 60 * 1000, // 事件数据1分钟内新鲜
    gcTime: 5 * 60 * 1000, // 5分钟后清理缓存
    select: (data) => data.data || [],
  });
}

// 🎯 获取 session 关联的 character
export function useCharacterBySession(sessionId?: string) {
  return useQuery({
    queryKey: queryKeys.characterBySession(sessionId || ''),
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');

      // 1. 获取 session 数据
      const { data: session, error: sessionError } = await databaseOperations.getSessionById(sessionId);
      if (sessionError || !session) {
        console.warn('⚠️ [Character] Session not found:', sessionId);
        return null;
      }

      // 2. 从 session.character_ids 中获取 character_id
      const characterIds = (session as any).character_ids || [];
      if (!characterIds || characterIds.length === 0) {
        return null;
      }

      // 🎯 使用第一个角色ID
      const characterId = characterIds[0];

      // 3. 获取 character 数据
      const { data: character, error: characterError } = await databaseOperations.getCharacterById(characterId);
      if (characterError) {
        console.error('❌ [Character] Failed to fetch character:', characterError);
        return null;
      }

      return character;
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // character 数据 5 分钟内新鲜
    gcTime: 10 * 60 * 1000, // 10 分钟后清理缓存
  });
}

// 组合hook：获取用户基本信息（用户+角色+会话）
export function useUserData() {
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const {
    data: characters = [],
    isLoading: charactersLoading,
    error: charactersError
  } = useUserCharacters(user?.id);
  const {
    data: sessions = [],
    isLoading: sessionsLoading,
    error: sessionsError
  } = useUserSessions(user?.id);

  return {
    user,
    characters,
    sessions,
    isLoading: userLoading || charactersLoading || sessionsLoading,
    error: userError || charactersError || sessionsError,
  };
}

// 🎯 获取用户使用统计的hook（基于 React Query）
export function useUsageStatsQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.usageStats(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return await usageLimitsAPI.getUsageStats();
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30秒内认为数据新鲜
    gcTime: 2 * 60 * 1000, // 2分钟后清理缓存
    refetchOnMount: true, // 每次挂载时都重新获取
    select: (data) => {
      // 🎯 双重保险：如果数据还有包装，这里再提取一次
      if (data && (data as any).code !== undefined && (data as any).data) {
        return (data as any).data;
      }
      return data;
    },
  });
}
