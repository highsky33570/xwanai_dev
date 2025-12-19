export interface Character {
  id: string;
  name: string;
  birthday_utc8?: string | null;  // 旧字段，保留兼容性
  birth_time?: string | null;      // 新字段
  paipan?: any;
  avatar_id?: string | null;
  auth_id?: string | null;
  description?: string | null;
  created_at: string;
  basic_bazi_id?: string | null;
  processing_status?: 'pending' | 'processing' | 'pending_reports' | 'completed' | 'failed'; // 🚫 已废弃，保留兼容性
  is_report_ready?: boolean | null; // 🎯 新字段：报告是否生成完毕（true=完成，false=待生成）
  category?: string;
  reports?: {
    // create_character_real_custom 模式的报告
    basic?: string;
    personal?: string;
    luck?: string;
    achievement?: string;
    // personal 模式的报告
    personality?: string;
    fortune?: string;
    career?: string;
    wealth?: string;
    relationship?: string;
    fengshui?: string;
    mbti_zodiac?: string;
    // 其他模式的报告可以继续添加...
    [key: string]: string | undefined;  // 支持动态扩展
  } | null;
}

export interface CharacterSelectionViewProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  characters: Character[];
  isLoading: boolean;
  onSynastrySwitchMode: () => void;
  t: (key: string) => string;
  userId?: string;  // 用于刷新查询
}

export interface Session {
  app_name: string;
  user_id: string;
  id: string;
  state: any;
  create_time: string;
  update_time: string;
  title?: string | null;
  mode?: string | null;
}

export interface ActionGroupItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  category: string;
  isSelected?: boolean;
}

export interface EnhancedChatSidebarProps {
  defaultState?: "character-selection" | "character-readings" | "sessions";
  onModeChange?: (mode: string) => void;
  onCharacterSelect?: (character: Character) => void;
  currentCharacter?: Character | null; // 保留用于 new-chat 页面
}

export type SidebarState = "character-selection" | "character-readings" | "sessions";
