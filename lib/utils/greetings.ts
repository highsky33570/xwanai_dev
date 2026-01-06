/**
 * 前端greeting映射工具函数
 * 统一管理各模式的打招呼语（支持多语言）
 */

export const getGreetingByMode = (mode: string, characterName?: string, language?: string): string => {
  // 从 localStorage 获取语言设置
  const currentLanguage = language || (typeof window !== 'undefined' ? localStorage.getItem("language") : null) || "zh";
  const isEnglish = currentLanguage === "en";

  if (isEnglish) {
    // 英文打招呼语
    const greetings: Record<string, string> = {
      create_character_real_custom:
        "Chief Archivist is ready. To ensure accuracy, please provide key information about this person. I will build the BaZi chart based on this information, or infer from life events if exact details are unavailable.\n\nPlease provide in the following format:\nName: [Person's name]\nGregorian birthday: [YYYY-MM-DD]\nBirth time: [HH hour] (optional)",
      create_character_real_guess:
        "Destiny Navigator mode activated. Like stellar positioning, we will find the perfect 'destiny anchor' for your character through step-by-step selections. Ready? Let's start with the core 'soul imprint' - the Day Stem.",
      create_character_virtual_custom:
        "Character Architect is ready. In this mode, we will completely deconstruct the BaZi system, treating it as the ultimate 'personality and ability setting toolkit', fully serving your creativity.\n\nLet your imagination flow. Use a few words, a sentence, or a series of #hashtags to sketch the outline of that character in your mind.",
      create_character_virtual_search_or_guess:
        "Chief Deducer is ready. Please tell me which existing virtual character's destiny foundation you'd like me to deduce? (For example: Furina from Genshin Impact, Trailblazer or Firefly from Honkai: Star Rail)\n\nBased on my knowledge base, I will deduce the BaZi chart that best fits their destiny trajectory, no detailed description needed.",
      personal:
        "Hello, I am your Personal Fortune Analyst. I specialize in providing personal destiny analysis and fortune guidance. Please provide your birth information.",
      character_agent: characterName
        ? `(Internalizing ${characterName}'s soul information...)\n\n(Taking a deep breath, adjusting state...)\n\nHello. I am ${characterName}.`
        : "(Internalizing character information...)\n\n(Taking a deep breath, adjusting state...)\n\nHello.",
    };
    return greetings[mode] || `Hello, I am the ${mode} mode AI assistant, happy to serve you!`;
  } else {
    // 中文打招呼语
    const greetings: Record<string, string> = {
      create_character_real_custom:
        "首席档案官已就位。为确保档案的准确，请输入这位人物的关键信息。我将基于此构建命盘，如果没有确切的信息，我将会根据人物的生平事迹进行推断。\n\n请严格按照以下格式提供：\n姓名：[人物姓名]\n公历生日：[YYYY年MM月DD日]\n出生时间：[HH时]（可以没有）",
      create_character_real_guess:
        "命运导航员模式启动。我们将像星辰定位一样，通过一步步选择，为你的角色在真实的时间坐标中找到一个完美的'命运锚点'。准备好了吗？我们从核心的'灵魂印记'——日干开始。",
      create_character_virtual_custom:
        "性格架构师已就位。在这个模式下，我们将彻底解构八字系统，把它当作一套终极的'性格与能力设定集'，完全为你的创意服务。\n\n请尽情挥洒你的想象力。用几个词、一句话，或者一系列 #标签，勾勒出你心中那个TA的轮廓吧。",
      create_character_virtual_search_or_guess:
        "首席推演师已就位。请告诉我你希望推演哪位已存在的虚拟人物的命运基盘？（例如：原神中的芙宁娜，崩坏星穹铁道中的开拓者或流萤等）\n\n我将根据我已有的知识库，直接为你推演出最契合其命运轨迹的八字命盘，无需你再详细描述。",
      personal:
        "你好，我是个人运势师。我专门为你提供个人命理分析和运势指导。请提供你的出生信息。",
      character_agent: characterName
        ? `（内化${characterName}的灵魂信息中...）\n\n（深吸一口气，调整状态...）\n\n你好。我是${characterName}。`
        : "（内化角色信息中...）\n\n（深吸一口气，调整状态...）\n\n你好。",
    };
    return greetings[mode] || `你好，我是${mode}模式的AI助手，很高兴为你服务！`;
  }
};
