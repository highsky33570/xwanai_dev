/**
 * 个人算命问卷 - 开场白生成器
 * 
 * 根据用户基础信息生成固定模板的开场白
 */

export interface UserBasicInfo {
  name: string;
  gender: 'male' | 'female';
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:MM (可选)
}

/**
 * 生成个人算命的开场白
 */
export function generatePersonalGreeting(userInfo: UserBasicInfo): string {
  const { name, gender, birthDate, birthTime } = userInfo;

  const genderDisplay = gender === 'male' ? '男' : '女';
  const hasTime = birthTime && birthTime.trim() !== '';
  const timeDisplay = hasTime ? `已提供 ${birthTime}` : '未提供';

  // 根据是否提供时分，生成不同的开场白
  if (hasTime) {
    // 有时分：给用户选择权
    return `✨ 首席档案官已就位！

我已收到您的基础信息：
- 姓名/昵称：${name}
- 性别：${genderDisplay}
- 公历生日：${birthDate}
- 出生时间：${timeDisplay}

根据您提供的出生时间，我可以为您生成精确的八字命盘。

---

🎯 **请选择：**

▶️ 回复「生成」→ 直接生成命盘（快速，约30s）

▶️ 回复「开始」→ 先填写问卷再生成（推荐，约3-5分钟）

💡 **问卷的作用**：
通过一些性格和经历问题，验证命盘的准确性，让分析更贴合您的真实情况。

问卷信息仅用于命理分析，不会对外展示。`;

  } else {
    // 无时分：必须问卷
    return `✨ 首席档案官已就位！

我已收到您的基础信息：
- 姓名/昵称：${name}
- 性别：${genderDisplay}
- 公历生日：${birthDate}
- 出生时间：${timeDisplay}

⚠️ **由于您未提供出生时间，我需要通过问卷推断您的出生时辰。**

整个过程大约需要 5-8 分钟，共分为4个部分：

📋 【必答】第一部分：基础性格（5题，约1分钟）
🧠 【选答】第二部分：思维模式（8题，约2分钟）  
⚖️【选答】第三部分：行为风格（6题，约1分钟）
🌟 【强烈推荐】第四部分：人生经历（8题，约2分钟）

💡 **小提示**：
- 问卷信息仅用于命理分析，不会对外展示
- 至少需要完成第一部分（5题）才能生成命盘
- 完成的题目越多，时辰推断越准确

---

准备好了吗？回复「开始」即可进入问卷！`;
  }
}

/**
 * 生成恢复进度的问候语
 */
export function generateResumeGreeting(userName: string, currentPart: number): string {
  return `✨ 欢迎回来，${userName}！

我们之前的问卷进行到了第${currentPart}部分，现在继续吗？

💡 **小提示**：
- 回复「继续」→ 从上次进度继续
- 回复「重新开始」→ 重新开始问卷
- 回复「生成」→ 基于当前信息直接生成命盘`;
}

