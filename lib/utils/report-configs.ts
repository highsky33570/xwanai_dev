/**
 * 报告配置 - 定义每个模式的报告类型和显示名称
 * 需要与后端 REPORT_CONFIGS 保持同步
 */

import { FileText, Brain, Sparkles, Gem, Heart, Briefcase, Wallet, Home, Star } from "lucide-react";

export interface ReportSection {
  key: string;
  name: string;
  order: number;
  icon?: any;
}

export interface ReportConfig {
  sections: ReportSection[];
}

/**
 * 报告配置映射表
 * key: 角色的 category 字段值（如 "create_character_real_custom", "personal" 等）
 */
export const REPORT_CONFIGS: Record<string, ReportConfig> = {
  // create_character_real_custom 模式：真实人物精确分析
  "create_character_real_custom": {
    sections: [
      { key: "basic", name: "核心要素档案", order: 1, icon: FileText },
      { key: "personal", name: "性格深度剖析", order: 2, icon: Brain },
      { key: "luck", name: "多元个性棱镜", order: 3, icon: Sparkles },
      { key: "achievement", name: "人生成就考据", order: 4, icon: Gem }
    ]
  },

  // personal 模式：个人算命
  "personal": {
    sections: [
      { key: "basic", name: "基本信息", order: 0, icon: FileText },
      { key: "personality", name: "个性报告", order: 1, icon: Brain },
      { key: "fortune", name: "命运报告", order: 2, icon: Sparkles },
      { key: "career", name: "职业报告", order: 3, icon: Briefcase },
      { key: "wealth", name: "财富报告", order: 4, icon: Wallet },
      { key: "relationship", name: "亲密关系", order: 5, icon: Heart },
      { key: "fengshui", name: "风水报告", order: 6, icon: Home },
      { key: "mbti_zodiac", name: "星座生肖MBTI", order: 7, icon: Star }
    ]
  },

  // 🔄 其他模式待添加...
  // "create_character_real_guess": { ... },
  // "create_character_virtual_custom": { ... },
};

/**
 * 根据角色的 category 获取报告配置
 */
export function getReportConfig(category: string | undefined | null): ReportConfig {
  if (!category) {
    // 默认配置（兼容旧数据）
    return REPORT_CONFIGS["create_character_real_custom"];
  }

  return REPORT_CONFIGS[category] || REPORT_CONFIGS["create_character_real_custom"];
}

/**
 * 获取报告的显示名称（支持国际化）
 */
export function getReportDisplayName(
  reportKey: string,
  category: string | undefined | null,
  t?: (key: string) => string
): string {
  const config = getReportConfig(category);
  const section = config.sections.find(s => s.key === reportKey);

  if (!section) {
    return reportKey;
  }

  // 如果提供了翻译函数，尝试使用翻译
  if (t) {
    const translationKey = `sidebar.${reportKey}`;
    const translated = t(translationKey);
    // 如果翻译存在且不是 key 本身，返回翻译
    if (translated && translated !== translationKey) {
      return translated;
    }
  }

  // 否则返回配置中的名称
  return section.name;
}

/**
 * 获取报告的图标
 */
export function getReportIcon(reportKey: string, category: string | undefined | null) {
  const config = getReportConfig(category);
  const section = config.sections.find(s => s.key === reportKey);
  return section?.icon || FileText;
}

