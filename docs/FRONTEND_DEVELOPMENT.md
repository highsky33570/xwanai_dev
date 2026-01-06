# XWANAI 前端开发文档

> **AI驱动的中国八字命理分析平台 - 前端完整开发指南**

**最后更新**: 2025-11-16  
**版本**: 2.0.0  
**文档作者**: XWANAI Team

---

## 📑 目录

- [项目概览](#项目概览)
- [技术栈详解](#技术栈详解)
- [项目结构](#项目结构)
- [核心概念](#核心概念)
- [页面详解](#页面详解)
- [组件系统](#组件系统)
- [状态管理](#状态管理)
- [API 集成](#api-集成)
- [样式系统](#样式系统)
- [国际化系统](#国际化系统)
- [性能优化](#性能优化)
- [开发规范](#开发规范)

---

## 📌 项目概览

### 应用简介

XWANAI 是一个基于 AI 的中国八字命理分析平台，允许用户创建角色、生成命理报告、进行 AI 对话、查看命运时间线等功能。

### 核心功能

1. **角色管理** - 创建、编辑、删除、收藏角色
2. **命理分析** - 八字排盘、报告生成、命运时间线
3. **AI 对话** - 与角色对话、合盘分析、个人命理咨询
4. **社区互动** - 公开角色库、分享功能
5. **会员系统** - 订阅管理、配额限制、邀请奖励
6. **任务系统** - 新手引导任务、奖励机制

### 技术特点

- **全栈 TypeScript** - 类型安全的开发体验
- **SSR/SSG** - Next.js 15 App Router 架构
- **响应式设计** - 移动端优先的 UI/UX
- **实时通信** - SSE 流式 AI 对话
- **直接数据库访问** - Supabase Client SDK
- **现代化 UI** - NextUI + TailwindCSS

---

## 🛠️ 技术栈详解

### 核心框架

#### Next.js 15 (App Router)
```
框架版本: Next.js 15.x
路由系统: App Router (非 Pages Router)
渲染策略: SSR (Server Side Rendering) + CSR (Client Side Rendering)
```

**关键特性**:
- 文件系统路由
- 路由组 (Route Groups)
- 服务端组件 (RSC)
- 流式渲染
- 增量静态再生 (ISR)

#### TypeScript
```
版本: TypeScript 5.x
配置: 严格模式
```

**类型系统**:
- Supabase 数据库类型自动生成
- API 请求/响应类型定义
- 组件 Props 类型检查
- 全局状态类型安全

### UI 框架

#### NextUI v2
```
组件库: NextUI v2
主题系统: 自定义暗色主题
设计风格: 现代简约
```

**核心组件**:
- `Button`, `Card`, `Modal` - 基础组件
- `Dropdown`, `Select` - 交互组件
- `Avatar`, `Chip` - 展示组件
- `Skeleton` - 加载状态

#### TailwindCSS
```
版本: TailwindCSS 3.x
配置: 自定义配置 + NextUI 集成
```

**自定义主题**:
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // 高度基础的颜色系统
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        content1: "hsl(var(--content1))",
        content2: "hsl(var(--content2))",
        content3: "hsl(var(--content3))",
        content4: "hsl(var(--content4))",
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
      },
    },
  },
  plugins: [nextui({
    themes: {
      dark: {
        colors: {
          primary: "#EFB778",
          secondary: "#B8A57B",
        }
      }
    }
  })]
}
```

### 状态管理

#### MobX
```
版本: MobX 6.x
用途: 全局应用状态
```

**Store 结构**:
```typescript
// store/index.ts
export const Store = {
  user: new UserStore(),      // 用户状态
  session: new SessionStore(), // 会话状态
  global: new GlobalStore()    // 全局状态
}
```

#### React Query (TanStack Query)
```
版本: @tanstack/react-query v5
用途: 服务器状态管理
```

**查询策略**:
- 自动缓存和更新
- 后台数据重新验证
- 乐观更新
- 无限滚动支持

### 数据层

#### Supabase Client SDK
```
客户端: @supabase/supabase-js
认证: Supabase Auth (JWT)
数据库: PostgreSQL (通过 Supabase)
存储: Supabase Storage
```

**连接配置**:
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)
```

### 国际化

#### 自定义 i18n 系统
```
文件: lib/utils/translations.ts
语言: English (en) + 简体中文 (zh)
持久化: localStorage
```

**Hook 用法**:
```typescript
import { useTranslation } from "@/lib/utils/translations"

function MyComponent() {
  const { t, language, setLanguage } = useTranslation()
  return <h1>{t("nav.home")}</h1>
}
```

---

## 📁 项目结构

### 根目录结构

```
XWANAI_frontend/
├── app/                      # Next.js App Router 页面
│   ├── (base)/              # 主应用路由组
│   ├── (chat)/              # 聊天路由组
│   ├── (login)/             # 认证路由组
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 首页
│   └── globals.css          # 全局样式
│
├── components/              # React 组件
│   ├── auth/               # 认证组件
│   ├── character/          # 角色组件
│   ├── chat/               # 聊天组件
│   ├── database/           # 数据库组件
│   ├── modals/             # 模态框组件
│   ├── navigation/         # 导航组件
│   ├── sidebar/            # 侧边栏组件
│   ├── subscription/       # 订阅组件
│   ├── theme/              # 主题组件
│   ├── usage/              # 使用统计组件
│   ├── user/               # 用户组件
│   └── ui/                 # NextUI 基础组件
│
├── lib/                    # 工具库
│   ├── api/                # API 客户端
│   ├── supabase/           # Supabase 客户端
│   └── utils/              # 工具函数
│
├── hooks/                  # React Hooks
│   ├── use-chat-sse.ts     # SSE 聊天 Hook
│   ├── use-data-queries.ts # React Query 钩子
│   └── use-subscription.ts # 订阅管理 Hook
│
├── store/                  # MobX 状态管理
│   ├── global.ts           # 全局状态
│   ├── session.ts          # 会话状态
│   └── user.ts             # 用户状态
│
├── shared/                 # 前后端共享资源
│   ├── .definitionrc       # 数据库定义
│   ├── openapi.json        # API 规范
│   └── chat-flow.md        # 聊天协议
│
├── public/                 # 静态资源
├── styles/                 # 样式文件
└── supabase/              # Supabase 配置
    └── migrations/         # 数据库迁移
```

### App Router 路由结构

```
app/
├── layout.tsx                    # 根布局 (全局 Provider)
├── page.tsx                      # 首页 (/)
│
├── (base)/                       # 主应用路由组
│   ├── layout.tsx               # 主应用布局
│   ├── database/
│   │   └── page.tsx             # 角色数据库页 (/database)
│   ├── character/
│   │   ├── create/
│   │   │   └── page.tsx         # 角色类型选择 (/character/create)
│   │   ├── designer/
│   │   │   └── page.tsx         # 角色编辑器 (/character/designer)
│   │   └── info/
│   │       └── page.tsx         # 角色详情 (/character/info?id=xxx)
│   ├── user/
│   │   ├── my-info/
│   │   │   └── page.tsx         # 我的资料 (/user/my-info)
│   │   └── other/
│   │       └── page.tsx         # 其他用户资料 (/user/other?id=xxx)
│   ├── settings/
│   │   └── page.tsx             # 设置页面 (/settings)
│   └── tasks/
│       └── page.tsx             # 任务页面 (/tasks)
│
├── (chat)/                       # 聊天路由组
│   ├── layout.tsx               # 聊天布局 (无导航栏)
│   └── chat/
│       ├── page.tsx             # 会话列表 (/chat)
│       └── [id]/
│           └── page.tsx         # 聊天页面 (/chat/:id)
│
├── (login)/                      # 认证路由组
│   ├── layout.tsx               # 认证布局
│   ├── login/
│   │   └── page.tsx             # 登录页 (/login)
│   ├── register/
│   │   └── page.tsx             # 注册页 (/register)
│   └── restore-password/
│       └── page.tsx             # 重置密码 (/restore-password)
│
├── subscription/                 # 订阅路由
│   ├── success/
│   │   └── page.tsx             # 支付成功 (/subscription/success)
│   └── cancel/
│       └── page.tsx             # 支付取消 (/subscription/cancel)
│
└── share/                        # 分享路由
    └── [token]/
        └── page.tsx              # 分享页面 (/share/:token)
```

---

## 🎯 核心概念

### 路由组 (Route Groups)

Next.js App Router 使用文件夹名称加括号来创建路由组，路由组不影响 URL 结构，仅用于组织代码。

#### (base) 路由组
**用途**: 主应用功能  
**布局**: 包含导航栏 + 主内容区  
**页面**: 角色管理、数据库、用户资料、设置等

```typescript
// app/(base)/layout.tsx
export default function BaseLayout({ children }: { children: React.Node }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
```

#### (chat) 路由组
**用途**: 聊天对话功能  
**布局**: 全屏布局，无导航栏  
**页面**: 会话列表、聊天页面

```typescript
// app/(chat)/layout.tsx
export default function ChatLayout({ children }: { children: React.Node }) {
  return (
    <div className="h-screen flex">
      <EnhancedChatSidebar />
      {children}
    </div>
  )
}
```

#### (login) 路由组
**用途**: 用户认证  
**布局**: 居中布局  
**页面**: 登录、注册、密码重置

### 数据获取策略

#### 策略 1: Supabase 直接查询 (推荐用于简单 GET)

**适用场景**:
- 简单的数据库查询
- 需要 RLS (Row Level Security) 保护的数据
- 实时订阅功能

**示例**:
```typescript
// ✅ 获取用户角色列表
const { data: characters, error } = await supabase
  .from('characters')
  .select('*')
  .eq('auth_id', userId)
  .order('created_at', { ascending: false })

// ✅ 调用 RPC 函数
const { data: isPremium } = await supabase.rpc('is_premium_user', {
  target_user_id: userId
})

// ✅ 实时订阅
const subscription = supabase
  .channel('characters_changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'characters',
    filter: `auth_id=eq.${userId}`
  }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

#### 策略 2: 后端 API 调用 (用于复杂业务逻辑)

**适用场景**:
- 需要多步骤处理的操作 (创建角色 + 生成报告)
- 需要 AI 服务集成 (聊天、报告生成)
- 需要支付处理 (Stripe)
- 需要配额检查和限制

**示例**:
```typescript
// ✅ 创建角色 (包含配额检查 + AI 处理)
const response = await fetch(`${API_BASE_URL}/api/character/v1`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(characterData)
})

// ✅ AI 聊天 (SSE 流式响应)
const response = await fetch(`${API_BASE_URL}/api/chat/v1`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept': 'text/event-stream'
  },
  body: JSON.stringify({
    message: userInput,
    session_id: sessionId,
    mode: 'character_ready_chat',
    stream: true
  })
})
```

### 认证流程

#### 登录流程
1. 用户输入邮箱和密码
2. 调用 `authOperations.signIn(email, password)`
3. Supabase Auth 返回 JWT Token
4. Token 自动存储在 localStorage
5. 应用自动跳转到首页

#### 认证守卫
```typescript
// ✅ 页面级别守卫
useEffect(() => {
  const checkAuth = async () => {
    const user = await authOperations.getCurrentUser()
    if (!user) {
      router.push('/login')
    }
  }
  checkAuth()
}, [])

// ✅ API 调用守卫
const token = await authOperations.getAccessToken()
if (!token) {
  logger.warn("User not authenticated")
  return
}
```

#### Token 刷新
Supabase 自动处理 Token 刷新，无需手动干预。

---

## 📄 页面详解

### 1. 首页 (`app/page.tsx`)

**功能**: 展示公开角色库，用户可以浏览、搜索、收藏角色

**核心组件**:
- `CharacterCard` - 角色卡片
- `SearchBar` - 搜索栏
- `FilterDropdown` - 筛选器

**数据流**:
```typescript
// 1. 获取公开角色列表
const { data: characters } = await supabase
  .from('characters')
  .select('*')
  .eq('access_level', 'public')
  .eq('processing_status', 'completed')
  .order('created_at', { ascending: false })
  .range(0, 19)  // 分页: 每页20个

// 2. 搜索功能
const filteredCharacters = characters.filter(char =>
  char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  char.description?.toLowerCase().includes(searchQuery.toLowerCase())
)

// 3. 收藏角色
const { data } = await supabase.rpc('favorite_character', {
  p_character_id: characterId,
  p_auth_id: userId
})
```

**关键实现**:
```typescript
export default function HomePage() {
  const [characters, setCharacters] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCharacters()
  }, [])

  const loadCharacters = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('access_level', 'public')
      .eq('processing_status', 'completed')
    
    if (data) setCharacters(data)
    setLoading(false)
  }

  const handleFavorite = async (characterId: string) => {
    const user = await authOperations.getCurrentUser()
    if (!user) {
      toast.error("请先登录")
      return
    }

    try {
      const { data, error } = await supabase.rpc('favorite_character', {
        p_character_id: characterId,
        p_auth_id: user.id
      })

      if (error) throw error
      toast.success("收藏成功！")
      
      // 刷新数据
      await loadCharacters()
    } catch (error) {
      logger.error("收藏失败", { error })
      toast.error("收藏失败，请重试")
    }
  }

  return (
    <div className="container mx-auto p-6">
      <SearchBar 
        value={searchQuery}
        onChange={setSearchQuery}
      />
      
      {loading ? (
        <div className="grid grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {characters.map(character => (
            <CharacterCard
              key={character.id}
              character={character}
              onFavorite={() => handleFavorite(character.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

### 2. 角色数据库页 (`app/(base)/database/page.tsx`)

**功能**: 管理用户的私有角色库

**核心功能**:
- 查看角色列表
- 创建新角色
- 编辑/删除角色
- 创建合盘分析

**页面状态**:
```typescript
const [characters, setCharacters] = useState<DisplayCharacterData[]>([])
const [searchQuery, setSearchQuery] = useState("")
const [sortBy, setSortBy] = useState("recent")
const [filters, setFilters] = useState<string[]>([])
const [isSelectionMode, setIsSelectionMode] = useState(false)  // 合盘选择模式
const [selectedCharacters, setSelectedCharacters] = useState<string[]>([])
const [isDeletionMode, setIsDeletionMode] = useState(false)  // 删除模式
const [charactersToDelete, setCharactersToDelete] = useState<string[]>([])
```

**数据加载**:
```typescript
const loadUserAndCharacters = async () => {
  const currentUser = await authOperations.getCurrentUser()
  if (!currentUser) {
    router.push("/login")
    return
  }

  const { data: userCharacters, error } = await databaseOperations.getUserCharacters(currentUser.id)
  
  if (error) {
    logger.error("Failed to load user characters", { error })
    setError(error.message)
    return
  }

  // 转换为展示格式
  const transformedCharacters = userCharacters.map(char => ({
    id: char.id,
    characterName: char.name,
    description: char.description || "无描述",
    characterImage: getAvatarPublicUrl(char.avatar_id, char.auth_id),
    tags: char.tags || [],
    visibility: char.access_level,
    isFromFavorite: !!char.character_metadata?.original_character_id,
    processingStatus: char.is_report_ready
  }))

  setCharacters(transformedCharacters)
}
```

**关键操作**:
```typescript
// 1. 创建合盘分析
const handleSynastryReading = async () => {
  if (selectedCharacters.length !== 2) {
    toast.error("请选择两个角色进行合盘")
    return
  }

  const { data, error } = await apiClient.createHepanSession({
    character_ids: selectedCharacters
  })

  if (data) {
    router.push(`/chat/${data.session_id}`)
  }
}

// 2. 删除角色
const handleDeleteCharacters = async () => {
  for (const characterId of charactersToDelete) {
    // 删除关联的 sessions
    await databaseOperations.deleteSessionsByCharacterId(characterId)
    
    // 删除角色
    await databaseOperations.deleteCharacter(characterId)
  }

  toast.success(`成功删除 ${charactersToDelete.length} 个角色`)
  await loadUserAndCharacters()
}
```

**UI 布局**:
```
┌────────────────────────────────────────────────┐
│ 左侧: Character Database Logo + 标题          │
│                                                │
│ 右侧: 搜索栏 + 筛选器 + 排序 + 操作按钮      │
│       ┌──────────────────────────────────┐   │
│       │ [搜索框]                          │   │
│       ├──────────────────────────────────┤   │
│       │ 筛选: [公开] [私有] [真实] [虚拟] │   │
│       ├──────────────────────────────────┤   │
│       │ 排序: [最近] [名称] [最早]         │   │
│       ├──────────────────────────────────┤   │
│       │ [创建角色] [创建合盘] [删除]       │   │
│       └──────────────────────────────────┘   │
│                                                │
│ 角色列表 (Grid 布局):                          │
│ ┌────────┐ ┌────────┐ ┌────────┐           │
│ │ 角色1   │ │ 角色2   │ │ 角色3   │           │
│ │ 头像    │ │ 头像    │ │ 头像    │           │
│ │ 名称    │ │ 名称    │ │ 名称    │           │
│ │ [编辑]  │ │ [编辑]  │ │ [编辑]  │           │
│ └────────┘ └────────┘ └────────┘           │
└────────────────────────────────────────────────┘
```

### 3. 聊天页面 (`app/(chat)/chat/[id]/page.tsx`)

**功能**: AI 聊天对话界面

**核心特性**:
- SSE 流式消息接收
- Markdown 渲染 (支持代码高亮、图片)
- Thinking 过程可折叠显示
- 命盘附件支持 (`vis-paipan`)
- 消息分享功能
- 回合数限制提示

**页面布局**:
```
┌─────────────────────────────────────────────────────────────┐
│ Header: [Avatar] 角色名称  [历史对话▼] [分享] [菜单]       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  消息区域 (可滚动):                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ [AI头像] AI: 你好！我是...                          │  │
│  │           (Thinking) [折叠/展开]                     │  │
│  │           这是我的回复内容...                        │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                              用户: 你好！ [用户头像]  │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ [AI头像] AI: 正在输入... [光标闪烁]                 │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ Input: [附件📎] [输入框...] [发送🚀]                       │
└─────────────────────────────────────────────────────────────┘
```

**核心实现**:
```typescript
export default function ChatPage() {
  const params = useParams()
  const chatId = params.id as string
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")

  // 使用 SSE Hook
  const {
    sendMessage,
    isLoading,
    currentAssistantMessage,
    currentThinkingMessage,
    sessionId
  } = useChatSSE({
    initialSessionId: chatId !== "new" ? chatId : null,
    onMessage: (message) => {
      setMessages(prev => [...prev, message])
    },
    onError: (error) => {
      toast.error(error.error)
    }
  })

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    // 立即显示用户消息
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
      isComplete: true
    }
    setMessages(prev => [...prev, userMessage])

    // 清空输入框
    setInputMessage("")

    // 发送到后端
    await sendMessage(inputMessage, Store.session.currentMode)
  }

  return (
    <div className="flex h-full">
      {/* 左侧边栏 */}
      <EnhancedChatSidebar />

      {/* 主聊天区 */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2>{sessionInfo?.title || "Chat"}</h2>
        </div>

        {/* 消息区域 */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6">
          {messages.map(message => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* 流式输出中的消息 */}
          {(currentThinkingMessage || currentAssistantMessage) && (
            <div className="flex items-start gap-3">
              <Avatar src={characterAvatar} />
              <div className="max-w-[60%] p-4 bg-content2 rounded-2xl">
                {/* Thinking 部分 */}
                {currentThinkingMessage && (
                  <details>
                    <summary>思考过程...</summary>
                    <Markdown>{currentThinkingMessage}</Markdown>
                  </details>
                )}

                {/* 回复内容 */}
                {currentAssistantMessage && (
                  <Markdown>{currentAssistantMessage}</Markdown>
                )}

                {/* 输入指示器 */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs text-primary">正在输入...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 输入区 */}
        <div className="p-4 border-t">
          <div className="flex items-end gap-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="输入消息..."
              className="flex-1 resize-none rounded-2xl"
              rows={1}
            />
            <Button
              color="primary"
              onPress={handleSendMessage}
              isLoading={isLoading}
              isDisabled={!inputMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 右侧面板 (可选) */}
      <div className="w-80 border-l p-4">
        {/* 角色信息、命盘数据等 */}
      </div>
    </div>
  )
}
```

**SSE 数据流处理**:
```typescript
// hooks/use-chat-sse.ts
export function useChatSSE(options: UseChatSSEOptions) {
  const sendMessage = async (message: string, mode: string) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        mode,
        stream: true
      })
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.startsWith("event: thinking")) {
          // 处理 thinking 事件
          const data = JSON.parse(line.slice(6))
          setCurrentThinkingMessage(data.content.thinking)
        } else if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6))
          
          if (data.partial) {
            // 流式输出中
            setCurrentAssistantMessage(data.content.text)
          } else {
            // 消息完成
            const finalMessage: ChatMessage = {
              id: data.id,
              content: data.content.text,
              sender: "assistant",
              timestamp: new Date(),
              isComplete: true,
              thinking: currentThinkingMessage
            }
            options.onMessage?.(finalMessage)
            setCurrentAssistantMessage("")
            setCurrentThinkingMessage("")
          }
        }
      }
    }
  }

  return {
    sendMessage,
    isLoading,
    currentAssistantMessage,
    currentThinkingMessage,
    sessionId
  }
}
```

---

## 🧩 组件系统

### 核心组件架构

```
components/
├── auth/              # 认证组件
│   └── login-modal.tsx
│
├── character/         # 角色相关组件
│   ├── character-card.tsx           # 角色卡片
│   ├── character-card-database.tsx  # 数据库角色卡片
│   ├── character-creation-modal.tsx # 创建角色模态框
│   ├── character-edit-modal.tsx     # 编辑角色模态框
│   ├── character-preview.tsx        # 角色预览
│   └── character-actions.tsx        # 角色操作按钮
│
├── chat/              # 聊天组件
│   ├── ai-card.tsx                  # AI 功能卡片
│   ├── character-detail-card.tsx    # 角色详情卡
│   ├── message-skeleton.tsx         # 消息骨架屏
│   ├── error-message.tsx            # 错误消息
│   └── markdown-with-sources.tsx    # Markdown 渲染
│
├── sidebar/           # 侧边栏组件
│   ├── enhanced-chat-sidebar.tsx    # 增强聊天侧边栏
│   ├── character-selection-view.tsx # 角色选择视图
│   ├── character-readings-view.tsx  # 角色解读视图
│   └── sessions-view.tsx            # 会话视图
│
└── modals/            # 模态框组件
    ├── mode-selection-modal.tsx     # 模式选择
    ├── upgrade-prompt-modal.tsx     # 升级提示
    └── share-modal.tsx              # 分享模态框
```

### 组件详解

#### 1. CharacterCard (角色卡片)

**功能**: 展示角色基本信息，支持点击查看详情、收藏等操作

**Props**:
```typescript
interface CharacterCardProps {
  character: {
    id: string
    name: string
    avatar_url?: string
    description?: string
    tags?: string[]
    is_report_ready?: boolean
  }
  onFavorite?: () => void
  onClick?: () => void
  showActions?: boolean
}
```

**实现**:
```typescript
export function CharacterCard({ 
  character, 
  onFavorite, 
  onClick,
  showActions = true 
}: CharacterCardProps) {
  const { t } = useTranslation()

  return (
    <Card 
      isPressable
      onPress={onClick}
      className="group hover:scale-105 transition-transform"
    >
      <CardHeader className="absolute z-10 top-1 flex-col items-start">
        {/* 状态标签 */}
        {character.is_report_ready && (
          <Chip size="sm" color="success">
            {t("character.ready")}
          </Chip>
        )}
      </CardHeader>

      {/* 头像 */}
      <Image
        src={character.avatar_url || "/placeholder.jpg"}
        alt={character.name}
        className="z-0 w-full h-48 object-cover"
      />

      <CardBody>
        {/* 名称 */}
        <h4 className="font-bold text-large">{character.name}</h4>

        {/* 描述 */}
        <p className="text-small text-default-500 line-clamp-2">
          {character.description || t("character.noDescription")}
        </p>

        {/* 标签 */}
        {character.tags && character.tags.length > 0 && (
          <div className="flex gap-2 mt-2">
            {character.tags.slice(0, 3).map(tag => (
              <Chip key={tag} size="sm" variant="flat">
                {tag}
              </Chip>
            ))}
          </div>
        )}
      </CardBody>

      {showActions && (
        <CardFooter className="gap-2">
          <Button 
            size="sm" 
            color="primary"
            onPress={onClick}
          >
            {t("character.viewDetails")}
          </Button>
          
          {onFavorite && (
            <Button
              size="sm"
              variant="flat"
              onPress={(e) => {
                e.stopPropagation()
                onFavorite()
              }}
            >
              <Star className="w-4 h-4" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
```

#### 2. EnhancedChatSidebar (增强聊天侧边栏)

**功能**: 多状态侧边栏，支持会话列表、角色选择、角色解读等视图

**状态类型**:
```typescript
type SidebarState = 
  | "sessions"              // 会话列表
  | "character-selection"   // 角色选择
  | "character-readings"    // 角色解读
```

**实现**:
```typescript
export const EnhancedChatSidebar = observer(({ 
  defaultState = "sessions"
}: EnhancedChatSidebarProps) => {
  const [sidebarState, setSidebarState] = useState<SidebarState>(defaultState)
  const { user, characters, sessions } = useUserData()

  return (
    <div className="w-80 bg-content1 border-r h-full flex flex-col">
      {/* 状态切换按钮 */}
      <div className="sticky top-0 z-10 p-3 border-b bg-content1/95 backdrop-blur-sm">
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant={sidebarState === "sessions" ? "solid" : "flat"}
            onPress={() => setSidebarState("sessions")}
          >
            Sessions
          </Button>
          <Button
            size="sm"
            variant={sidebarState === "character-selection" ? "solid" : "flat"}
            onPress={() => setSidebarState("character-selection")}
          >
            Characters
          </Button>
          <Button
            size="sm"
            variant={sidebarState === "character-readings" ? "solid" : "flat"}
            onPress={() => setSidebarState("character-readings")}
          >
            Readings
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {sidebarState === "sessions" && (
          <SessionsView sessions={sessions} />
        )}
        {sidebarState === "character-selection" && (
          <CharacterSelectionView characters={characters} />
        )}
        {sidebarState === "character-readings" && (
          <CharacterReadingsView />
        )}
      </div>
    </div>
  )
})
```

**SessionsView** (会话列表视图):
```typescript
function SessionsView({ sessions }: { sessions: Session[] }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* 搜索栏 */}
      <div className="p-3 border-b">
        <Input
          placeholder={t("sidebar.searchConversations")}
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<Search className="w-4 h-4" />}
        />
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="text-center p-6 text-foreground-400">
            {t("sidebar.noSessions")}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredSessions.map(session => (
              <Card
                key={session.id}
                isPressable
                onPress={() => router.push(`/chat/${session.id}`)}
                className="hover:bg-content2"
              >
                <CardBody className="p-3">
                  <div className="flex items-start gap-3">
                    {/* 模式图标 */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* 标题 */}
                      <h4 className="font-medium truncate">
                        {session.title}
                      </h4>

                      {/* 时间 */}
                      <p className="text-xs text-foreground-400">
                        {formatRelativeTime(session.update_time)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 新建对话按钮 */}
      <div className="p-3 border-t">
        <Button
          fullWidth
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => router.push("/chat/new")}
        >
          {t("sidebar.newChat")}
        </Button>
      </div>
    </div>
  )
}
```

#### 3. MarkdownWithSources (Markdown 渲染组件)

**功能**: 支持 Markdown 渲染、代码高亮、命盘可视化

**特性**:
- 支持标准 Markdown 语法
- 支持 `vis-paipan` 代码块 (渲染命盘)
- 支持代码高亮
- 支持实时流式渲染

**实现**:
```typescript
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

export function MarkdownWithSources({
  content,
  isStreaming = false,
  className
}: {
  content: string
  isStreaming?: boolean
  className?: string
}) {
  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      components={{
        // 代码块渲染
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : ''

          // 🎯 特殊处理: vis-paipan 代码块
          if (language === 'vis-paipan') {
            try {
              const paipanData = JSON.parse(String(children))
              return <PaipanCard paipan={paipanData} />
            } catch (e) {
              return <code>{children}</code>
            }
          }

          // 常规代码块
          return !inline && match ? (
            <SyntaxHighlighter
              language={language}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          )
        },

        // 链接渲染
        a({ href, children }) {
          return (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          )
        },

        // 图片渲染
        img({ src, alt }) {
          return (
            <img
              src={src}
              alt={alt}
              className="max-w-full rounded-lg"
              loading="lazy"
            />
          )
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
```

---

## 📡 API 集成

### API 配置

```typescript
// lib/api/config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export const apiEndpoints = {
  // 用户模块
  users: {
    avatar: '/api/users/v1/avatar',
    me: '/api/users/v1/me'
  },
  
  // 角色模块
  character: {
    create: '/api/character/v1',
    list: '/api/character/v1/list',
    detail: (id: string) => `/api/character/v1/${id}`,
    reports: (id: string) => `/api/character/v1/${id}/reports`
  },
  
  // 聊天模块
  chat: {
    base: '/api/chat/v1',
    session: '/api/chat/v1/session'
  },
  
  // 支付模块
  stripe: {
    checkout: '/api/stripe/v1/checkout',
    portal: '/api/stripe/v1/portal'
  }
}
```

### API 客户端

```typescript
// lib/api/client.ts
import { API_BASE_URL, apiEndpoints } from './config'
import { getAuthHeaders } from '@/lib/utils/authHelpers'

export const apiClient = {
  // 创建角色
  async createCharacter(data: CharacterCreateData) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}${apiEndpoints.character.create}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create character')
    }

    return response.json()
  },

  // 生成报告
  async generateReports(characterId: string, reportTypes: string[]) {
    const headers = await getAuthHeaders()
    const response = await fetch(
      `${API_BASE_URL}${apiEndpoints.character.reports(characterId)}`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ report_types: reportTypes })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to generate reports')
    }

    return response.json()
  },

  // 创建会话
  async createSession(data: { mode: string; title: string; greeting?: string }) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}${apiEndpoints.chat.session}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('Failed to create session')
    }

    return response.json()
  },

  // 创建 Stripe Checkout Session
  async createCheckoutSession(tier: 'monthly' | 'yearly') {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}${apiEndpoints.stripe.checkout}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tier,
        success_url: `${window.location.origin}/subscription/success`,
        cancel_url: `${window.location.origin}/subscription/cancel`
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create checkout session')
    }

    const data = await response.json()
    return data.checkout_url
  }
}
```

### React Query Hooks

```typescript
// hooks/use-data-queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'

// Query Keys
export const queryKeys = {
  userCharacters: (userId: string) => ['characters', 'user', userId],
  userSessions: (userId: string) => ['sessions', 'user', userId],
  characterById: (characterId: string) => ['character', characterId],
  sessionById: (sessionId: string) => ['session', sessionId],
  usageStats: (userId: string) => ['usage-stats', userId]
}

// 获取用户角色列表
export function useUserCharacters(userId?: string) {
  return useQuery({
    queryKey: queryKeys.userCharacters(userId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('auth_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!userId
  })
}

// 获取角色详情
export function useCharacterById(characterId?: string) {
  return useQuery({
    queryKey: queryKeys.characterById(characterId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!characterId
  })
}

// 生成报告 Mutation
export function useGenerateReports() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      characterId, 
      reportTypes 
    }: { 
      characterId: string
      reportTypes: string[] 
    }) => {
      return await apiClient.generateReports(characterId, reportTypes)
    },
    onSuccess: (data, variables) => {
      // 刷新角色数据
      queryClient.invalidateQueries({
        queryKey: queryKeys.characterById(variables.characterId)
      })
    }
  })
}

// 获取使用统计
export function useUsageStats(userId?: string) {
  return useQuery({
    queryKey: queryKeys.usageStats(userId!),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_usage_stats', {
        user_id_param: userId
      })

      if (error) throw error
      return data[0]  // RPC 返回的是数组
    },
    enabled: !!userId,
    refetchInterval: 30000  // 每30秒刷新一次
  })
}
```

---

## 🎨 样式系统

### TailwindCSS 配置

```javascript
// tailwind.config.js
import { nextui } from "@heroui/react"

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        title: ["Merriweather", "serif"]
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        }
      }
    }
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        dark: {
          colors: {
            background: "#0A0A0A",
            foreground: "#ECEDEE",
            content1: "#18181B",
            content2: "#27272A",
            content3: "#3F3F46",
            content4: "#52525B",
            primary: {
              DEFAULT: "#EFB778",
              foreground: "#000000"
            },
            secondary: {
              DEFAULT: "#B8A57B",
              foreground: "#000000"
            }
          }
        }
      }
    })
  ]
}
```

### 全局样式

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 240 5% 93%;
    --content1: 240 6% 10%;
    --content2: 240 5% 15%;
    --content3: 240 5% 25%;
    --content4: 240 4% 32%;
    --primary: 38 83% 70%;
    --secondary: 48 28% 59%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* 滚动条样式 */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }

  ::-webkit-scrollbar-track {
    @apply bg-content1;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-content3 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-content4;
  }
}

@layer components {
  /* 卡片悬停效果 */
  .card-hover {
    @apply transition-all duration-300 hover:scale-105 hover:shadow-xl;
  }

  /* Markdown 样式 */
  .prose {
    @apply text-foreground;
  }

  .prose h1,
  .prose h2,
  .prose h3 {
    @apply text-primary;
  }

  .prose a {
    @apply text-primary hover:underline;
  }

  .prose code {
    @apply bg-content2 px-1 py-0.5 rounded text-sm;
  }

  .prose pre {
    @apply bg-content2 p-4 rounded-lg overflow-x-auto;
  }

  /* 打字机光标 */
  .cursor-blink {
    @apply inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5;
  }
}
```

### 响应式设计

```typescript
// 响应式断点
const breakpoints = {
  sm: '640px',   // 移动设备
  md: '768px',   // 平板
  lg: '1024px',  // 笔记本
  xl: '1280px',  // 桌面
  '2xl': '1536px' // 大屏
}

// 组件示例
function ResponsiveLayout() {
  return (
    <div className="
      px-4 sm:px-6 md:px-8
      py-6 sm:py-8 md:py-12
      grid 
      grid-cols-1 
      sm:grid-cols-2 
      lg:grid-cols-3 
      xl:grid-cols-4
      gap-4 md:gap-6
    ">
      {/* 内容 */}
    </div>
  )
}
```

---

## 🌍 国际化系统

### 翻译文件结构

```typescript
// lib/utils/translations.ts
export type Language = "en" | "zh"

export const translations = {
  en: {
    nav: {
      home: "Home",
      database: "Database",
      chat: "Chat",
      settings: "Settings"
    },
    sidebar: {
      newChat: "New Chat",
      sessions: "Sessions",
      characters: "Characters"
    },
    database: {
      title: "Character Database",
      noCharacters: "No characters found",
      createFirst: "Create your first character"
    }
  },
  zh: {
    nav: {
      home: "首页",
      database: "数据库",
      chat: "对话",
      settings: "设置"
    },
    sidebar: {
      newChat: "新建对话",
      sessions: "会话列表",
      characters: "角色列表"
    },
    database: {
      title: "角色数据库",
      noCharacters: "未找到角色",
      createFirst: "创建第一个角色"
    }
  }
}
```

### Hook 实现

```typescript
// lib/utils/translations.ts (续)
export function useTranslation() {
  const [language, setLanguageState] = useState<Language>(() => {
    // 从 localStorage 读取语言设置
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language')
      return (saved as Language) || 'zh'
    }
    return 'zh'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }

    return value || key
  }

  return {
    t,
    language,
    setLanguage,
    getLanguage: () => language
  }
}
```

### 使用示例

```typescript
// 组件中使用
function MyComponent() {
  const { t, language, setLanguage } = useTranslation()

  return (
    <div>
      <h1>{t("database.title")}</h1>
      <p>{t("database.noCharacters")}</p>
      
      {/* 语言切换器 */}
      <Button onPress={() => setLanguage(language === 'zh' ? 'en' : 'zh')}>
        {language === 'zh' ? 'EN' : '中文'}
      </Button>
    </div>
  )
}

// 动态文本替换
function TasksPage() {
  const { t } = useTranslation()
  const completedCount = 3

  return (
    <p>
      {t("tasks.progress").replace("{count}", String(completedCount))}
      {/* 输出: "已完成 3 个任务" (中文) 或 "Completed 3 tasks" (英文) */}
    </p>
  )
}
```

---

## ⚡ 性能优化

### 1. 代码分割

```typescript
// 动态导入组件
import dynamic from 'next/dynamic'

const PaipanCard = dynamic(() => import('@/components/chat/paipan-card'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-64" />
})

const AICard = dynamic(() => import('@/components/chat/ai-card'), {
  ssr: false
})
```

### 2. 图片优化

```typescript
import Image from 'next/image'

function CharacterAvatar({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={200}
      height={200}
      placeholder="blur"
      blurDataURL="/placeholder.jpg"
      loading="lazy"
      className="rounded-full"
    />
  )
}
```

### 3. React Query 缓存配置

```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 数据1分钟内视为新鲜
      cacheTime: 5 * 60 * 1000,  // 缓存5分钟
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### 4. 虚拟滚动

```typescript
// 使用 react-window 实现大列表虚拟滚动
import { FixedSizeList as List } from 'react-window'

function VirtualCharacterList({ characters }: { characters: Character[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <CharacterCard character={characters[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={characters.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

---

## 📐 开发规范

### 1. 文件命名规范

```
页面: page.tsx, layout.tsx, loading.tsx, error.tsx
组件: kebab-case.tsx (例: character-card.tsx)
工具函数: camelCase.ts (例: dateFormatter.ts)
类型定义: PascalCase.ts (例: Character.ts)
```

### 2. 组件编写规范

```typescript
// ✅ 好的组件示例
import { useTranslation } from "@/lib/utils/translations"

interface CharacterCardProps {
  character: Character
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
}

export function CharacterCard({
  character,
  onEdit,
  onDelete,
  showActions = true
}: CharacterCardProps) {
  const { t } = useTranslation()

  // 事件处理函数
  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3>{character.name}</h3>
      </CardHeader>
      
      <CardBody>
        <p>{character.description || t("character.noDescription")}</p>
      </CardBody>

      {showActions && (
        <CardFooter className="gap-2">
          <Button size="sm" onPress={handleEdit}>
            {t("common.edit")}
          </Button>
          <Button size="sm" color="danger" onPress={onDelete}>
            {t("common.delete")}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
```

### 3. 状态管理规范

```typescript
// ❌ 错误: 状态过多，难以维护
const [name, setName] = useState("")
const [gender, setGender] = useState("")
const [birthday, setBirthday] = useState("")
const [description, setDescription] = useState("")

// ✅ 正确: 使用对象管理相关状态
const [formData, setFormData] = useState({
  name: "",
  gender: "",
  birthday: "",
  description: ""
})

const updateFormData = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }))
}
```

### 4. 错误处理规范

```typescript
// ✅ 统一的错误处理
try {
  const { data, error } = await supabase
    .from('characters')
    .select('*')

  if (error) throw error

  setCharacters(data)
} catch (error) {
  logger.error("Failed to load characters", { error })
  toast.error(t("errors.loadCharactersFailed"))
}
```

### 5. TypeScript 规范

```typescript
// ✅ 明确的类型定义
interface Character {
  id: string
  name: string
  gender: "male" | "female" | "unknown"
  birth_time?: string
  description?: string
  tags?: string[]
  is_report_ready: boolean
}

// ✅ 使用 Supabase 生成的类型
import { Tables } from "@/lib/supabase/types"

type Character = Tables<"characters">

// ✅ 类型守卫
function isCharacter(obj: any): obj is Character {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string'
  )
}
```

---

## 🔚 总结

本文档涵盖了 XWANAI 前端的完整开发指南，包括：

- ✅ 项目架构和技术栈
- ✅ 页面结构和路由设计
- ✅ 组件系统和设计模式
- ✅ 状态管理和数据流
- ✅ API 集成和认证
- ✅ 样式系统和响应式设计
- ✅ 国际化和性能优化

如需了解后端开发细节，请参考《后端开发文档》  
如需了解前后端协作细节，请参考《前后端联合文档》

---

**文档维护**: 请在代码变更时同步更新本文档  
**反馈渠道**: GitHub Issues 或开发团队内部通道

