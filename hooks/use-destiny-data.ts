/**
 * 命运时间线数据 Hooks
 * 使用 React Query 管理分层级的大运、流年、流月、流日数据
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';

// ============ 类型定义 ============

export interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  gender?: 'male' | 'female';
}

export interface Shishen {
  天干: string;
  地支: string[];
}

export interface Wuxing {
  天干: string;
  地支: string;
}

export interface DayunSummary {
  id: string;
  index: number;
  start_year: number;
  end_year: number;
  age_start: number;
  age_end: number;
  ganzhi: [string, string];
  shishen: Shishen;
  五行: Wuxing;
  纳音: string;
  is_current: boolean;
}

export interface FortuneSignals {
  五行能量变化: Record<string, { 能量: number }>;
  喜用神事件: Array<{ 事件: string; 描述: string }>;
  运势计分: {
    综合评分: number;
    评语: string;
    标签: string;
    详细评分?: Record<string, number>;
  };
}

export interface DayunDetail extends DayunSummary {
  运势信号: FortuneSignals;
}

export interface LiunianSummary {
  year: number;
  age: number;
  ganzhi: [string, string];
  shishen: Shishen;
  五行: Wuxing;
  is_current: boolean;
}

export interface LiunianDetail extends LiunianSummary {
  纳音: string;
  运势信号: FortuneSignals;
}

export interface LiuyueSummary {
  month: number;
  ganzhi: [string, string];
  shishen: Shishen;
  五行: Wuxing;
  is_current: boolean;
}

export interface LiuyueDetail extends LiuyueSummary {
  year: number;
  运势信号?: FortuneSignals;
}

export interface LiuriSummary {
  day: number;
  ganzhi: [string, string];
  shishen: Shishen;
  is_current: boolean;
}

export interface LiuriDetail extends LiuriSummary {
  year: number;
  month: number;
  五行: Wuxing;
  运势信号?: FortuneSignals;
}

export interface LiushiSummary {
  shichen: string;
  time_range: string;
  ganzhi: [string, string];
  shishen: Shishen;
  五行: Wuxing;
  is_current: boolean;
}

// ============ API 响应类型 ============

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface DayunListResponse {
  birth_info: {
    year: number;
    month: number;
    day: number;
    hour: number;
    bazi: string;
    dayun_start_age: number;
    gender: string;
  };
  dayun_list: DayunSummary[];
}

interface DayunDetailResponse {
  dayun_detail: DayunDetail;
  liunian_list: LiunianSummary[];
}

interface LiunianDetailResponse {
  liunian_detail: LiunianDetail;
  liuyue_list: LiuyueSummary[];
}

interface LiuyueDetailResponse {
  liuyue_detail: LiuyueDetail;
  liuri_list: LiuriSummary[];
}

interface LiuriDetailResponse {
  liuri_detail: LiuriDetail;
  liushi_list: LiushiSummary[];
}

// ============ API 调用函数 ============

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function fetchDayunList(birthInfo: BirthInfo): Promise<DayunListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/bazi/v1/destiny/dayun`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: birthInfo.year,
      month: birthInfo.month,
      day: birthInfo.day,
      hour: birthInfo.hour || 0,
      minute: birthInfo.minute || 0,
      gender: birthInfo.gender || 'male',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dayun list');
  }

  const result: ApiResponse<any> = await response.json();
  if (result.code !== 1 && result.code !== 200) {
    throw new Error(result.message || 'API error');
  }

  // 处理嵌套的 data 结构
  const innerData = result.data;
  if (innerData && innerData.data) {
    return innerData.data;
  }

  return result.data;
}

async function fetchDayunDetail(
  birthInfo: BirthInfo,
  dayunIndex: number
): Promise<DayunDetailResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/bazi/v1/destiny/dayun/${dayunIndex}/liunian`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: birthInfo.year,
        month: birthInfo.month,
        day: birthInfo.day,
        hour: birthInfo.hour || 0,
        minute: birthInfo.minute || 0,
        gender: birthInfo.gender || 'male',
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch dayun detail');
  }

  const result: ApiResponse<any> = await response.json();
  if (result.code !== 1 && result.code !== 200) {
    throw new Error(result.message || 'API error');
  }

  // 处理嵌套的 data 结构
  const innerData = result.data;
  if (innerData && innerData.data) {
    return innerData.data;
  }

  return result.data;
}

async function fetchLiunianDetail(
  birthInfo: BirthInfo,
  targetYear: number
): Promise<LiunianDetailResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/bazi/v1/destiny/liunian/${targetYear}/liuyue`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: birthInfo.year,
        month: birthInfo.month,
        day: birthInfo.day,
        hour: birthInfo.hour || 0,
        minute: birthInfo.minute || 0,
        gender: birthInfo.gender || 'male',
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch liunian detail');
  }

  const result: ApiResponse<any> = await response.json();
  if (result.code !== 1 && result.code !== 200) {
    throw new Error(result.message || 'API error');
  }

  // 处理嵌套的 data 结构
  const innerData = result.data;
  if (innerData && innerData.data) {
    return innerData.data;
  }

  return result.data;
}

async function fetchLiuyueDetail(
  birthInfo: BirthInfo,
  targetYear: number,
  targetMonth: number
): Promise<LiuyueDetailResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/bazi/v1/destiny/liuyue/${targetYear}/${targetMonth}/liuri`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: birthInfo.year,
        month: birthInfo.month,
        day: birthInfo.day,
        hour: birthInfo.hour || 0,
        minute: birthInfo.minute || 0,
        gender: birthInfo.gender || 'male',
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch liuyue detail');
  }

  const result: ApiResponse<any> = await response.json();
  if (result.code !== 1 && result.code !== 200) {
    throw new Error(result.message || 'API error');
  }

  // 处理嵌套的 data 结构
  const innerData = result.data;
  if (innerData && innerData.data) {
    return innerData.data;
  }

  return result.data;
}

async function fetchLiuriDetail(
  birthInfo: BirthInfo,
  targetYear: number,
  targetMonth: number,
  targetDay: number
): Promise<LiuriDetailResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/bazi/v1/destiny/liuri/${targetYear}/${targetMonth}/${targetDay}/liushi`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: birthInfo.year,
        month: birthInfo.month,
        day: birthInfo.day,
        hour: birthInfo.hour || 0,
        minute: birthInfo.minute || 0,
        gender: birthInfo.gender || 'male',
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch liuri detail');
  }

  const result: ApiResponse<any> = await response.json();
  if (result.code !== 1 && result.code !== 200) {
    throw new Error(result.message || 'API error');
  }

  // 处理嵌套的 data 结构
  const innerData = result.data;
  if (innerData && innerData.data) {
    return innerData.data;
  }

  return result.data;
}

// ============ React Query Hooks ============

/**
 * Layer 1: 获取大运列表
 */
export function useDayunList(
  birthInfo: BirthInfo | null
): UseQueryResult<DayunListResponse, Error> {
  return useQuery({
    queryKey: ['dayun-list', birthInfo],
    queryFn: () => fetchDayunList(birthInfo!),
    enabled: !!birthInfo,
    staleTime: Infinity, // 大运数据不会变，永久缓存
    gcTime: Infinity, // 永不过期
  });
}

/**
 * Layer 2: 获取大运详情 + 流年列表
 */
export function useDayunDetail(
  birthInfo: BirthInfo | null,
  dayunIndex: number | null
): UseQueryResult<DayunDetailResponse, Error> {
  return useQuery({
    queryKey: ['dayun-detail', birthInfo, dayunIndex],
    queryFn: () => fetchDayunDetail(birthInfo!, dayunIndex!),
    enabled: !!birthInfo && dayunIndex !== null,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Layer 3: 获取流年详情 + 流月列表
 */
export function useLiunianDetail(
  birthInfo: BirthInfo | null,
  targetYear: number | null
): UseQueryResult<LiunianDetailResponse, Error> {
  return useQuery({
    queryKey: ['liunian-detail', birthInfo, targetYear],
    queryFn: () => fetchLiunianDetail(birthInfo!, targetYear!),
    enabled: !!birthInfo && targetYear !== null,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Layer 4: 获取流月详情 + 流日列表
 */
export function useLiuyueDetail(
  birthInfo: BirthInfo | null,
  targetYear: number | null,
  targetMonth: number | null
): UseQueryResult<LiuyueDetailResponse, Error> {
  return useQuery({
    queryKey: ['liuyue-detail', birthInfo, targetYear, targetMonth],
    queryFn: () => fetchLiuyueDetail(birthInfo!, targetYear!, targetMonth!),
    enabled: !!birthInfo && targetYear !== null && targetMonth !== null,
    staleTime: 5 * 60 * 1000, // 流日数据5分钟过期
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Layer 5: 获取流日详情 + 流时列表
 */
export function useLiuriDetail(
  birthInfo: BirthInfo | null,
  targetYear: number | null,
  targetMonth: number | null,
  targetDay: number | null
): UseQueryResult<LiuriDetailResponse, Error> {
  return useQuery({
    queryKey: ['liuri-detail', birthInfo, targetYear, targetMonth, targetDay],
    queryFn: () => fetchLiuriDetail(birthInfo!, targetYear!, targetMonth!, targetDay!),
    enabled: !!birthInfo && targetYear !== null && targetMonth !== null && targetDay !== null,
    staleTime: 1 * 60 * 1000, // 流时数据1分钟过期
    gcTime: 5 * 60 * 1000,
  });
}
