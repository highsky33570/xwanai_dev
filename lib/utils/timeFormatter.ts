/**
 * 解析 UTC 时间字符串，确保正确转换为本地时间
 * 后端返回的时间格式可能缺少 'Z' 后缀，需要手动添加
 */
const parseUTCDate = (dateString: string | Date): Date => {
  if (typeof dateString !== 'string') {
    return dateString;
  }

  // 如果字符串包含 'T' 但没有时区标识符（Z 或 +/-），则添加 'Z' 表示 UTC
  if (dateString.includes('T') && !dateString.match(/[Z+-]\d{2}:\d{2}$/)) {
    // 移除可能存在的微秒部分后的多余字符，只保留到微秒
    const cleanedString = dateString.replace(/(\.\d{3})\d+/, '$1');
    return new Date(cleanedString + 'Z');
  }

  return new Date(dateString);
};

/**
 * 将语言代码转换为完整的 locale
 */
const getFullLocale = (language: string): string => {
  if (language === 'zh' || language === 'zh-CN') {
    return 'zh-CN';
  }
  if (language === 'en' || language === 'en-US') {
    return 'en-US';
  }
  return language;
};

/**
 * 格式化时间为友好的本地时间显示
 * 例如: "刚刚", "5分钟前", "今天 14:30", "昨天 09:15", "2025/09/28 10:30"
 * 
 * 注意：后端返回的是 UTC 时间（ISO 8601 格式），会自动转换为本地时区
 */
export const formatRelativeTime = (dateString: string | Date, language: string = 'zh-CN'): string => {
  // 转换为完整 locale
  const locale = getFullLocale(language);

  // 正确解析 UTC 时间
  const date = parseUTCDate(dateString);
  const now = new Date();

  // 确保日期有效
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateString);
    return '无效时间';
  }

  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // 小于1分钟: "刚刚"
  if (diffSeconds < 60) {
    return locale === 'zh-CN' ? '刚刚' : 'Just now';
  }

  // 小于1小时: "N分钟前"
  if (diffMinutes < 60) {
    return locale === 'zh-CN'
      ? `${diffMinutes}分钟前`
      : `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
  }

  // 获取今天、昨天的日期（只比较年月日）
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 今天: "今天 HH:MM" / "Today HH:MM"
  if (dateOnly.getTime() === today.getTime()) {
    const todayText = locale === 'zh-CN' ? '今天' : 'Today';
    return locale === 'zh-CN' ? `${todayText} ${timeStr}` : `${todayText} ${timeStr}`;
  }

  // 昨天: "昨天 HH:MM" / "Yesterday HH:MM"
  if (dateOnly.getTime() === yesterday.getTime()) {
    const yesterdayText = locale === 'zh-CN' ? '昨天' : 'Yesterday';
    return locale === 'zh-CN' ? `${yesterdayText} ${timeStr}` : `${yesterdayText} ${timeStr}`;
  }

  // 本周内（7天内）: "周一 HH:MM" / "Mon HH:MM"
  if (diffDays < 7) {
    const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
    return locale === 'zh-CN' ? `${weekday} ${timeStr}` : `${weekday} ${timeStr}`;
  }

  // 本年内: "MM/DD HH:MM"
  if (date.getFullYear() === now.getFullYear()) {
    const dateStr = date.toLocaleDateString(locale, {
      month: '2-digit',
      day: '2-digit',
    });
    return locale === 'zh-CN' ? `${dateStr} ${timeStr}` : `${dateStr} ${timeStr}`;
  }

  // 更早: "YYYY/MM/DD HH:MM"
  const fullDateStr = date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return locale === 'zh-CN' ? `${fullDateStr} ${timeStr}` : `${fullDateStr} ${timeStr}`;
};

/**
 * 格式化为简短的日期显示（不含时间）
 * 例如: "今天", "昨天", "09/28", "2024/09/28"
 */
export const formatShortDate = (dateString: string | Date, language: string = 'zh-CN'): string => {
  // 转换为完整 locale
  const locale = getFullLocale(language);

  const date = parseUTCDate(dateString);
  const now = new Date();

  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateString);
    return '无效日期';
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // 今天
  if (dateOnly.getTime() === today.getTime()) {
    return locale === 'zh-CN' ? '今天' : 'Today';
  }

  // 昨天
  if (dateOnly.getTime() === yesterday.getTime()) {
    return locale === 'zh-CN' ? '昨天' : 'Yesterday';
  }

  const diffDays = Math.floor((today.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));

  // 本周内（7天内）：显示星期几
  if (diffDays < 7) {
    return date.toLocaleDateString(locale, { weekday: 'short' });
  }

  // 本年内：显示月/日
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(locale, {
      month: '2-digit',
      day: '2-digit',
    });
  }

  // 更早：显示完整日期
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * 格式化为时间戳显示
 * 例如: "14:30"
 */
export const formatTimeOnly = (dateString: string | Date, language: string = 'zh-CN'): string => {
  // 转换为完整 locale
  const locale = getFullLocale(language);

  const date = parseUTCDate(dateString);

  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateString);
    return '--:--';
  }

  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};
