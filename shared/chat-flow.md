# Chat System Flow Definition
# 聊天系统流程定义

**Last Updated**: 2025-11-10
**Version**: 2.0

---

## 📋 Overview

This document defines the frontend-backend interaction protocol for the chat system, including:
- Chat session creation and management
- SSE (Server-Sent Events) streaming response format
- Character chat modes
- Hepan (synastry) analysis

---

## 🎯 Chat Modes

### 1. Regular Chat Modes (create_character_*)
- `create_character_real_custom` - 创建真实人物（自定义八字）
- `create_character_real_guess` - 创建真实人物（推测八字）
- `create_character_virtual_custom` - 创建虚拟人物（自定义设定）
- `create_character_virtual_search_or_guess` - 创建虚拟人物（搜索或推测）

### 2. Character Chat Modes
- `character_ready_chat` - 与完整角色对话（requires is_report_ready=true）
- `hepan` - 双人合盘分析

---

## 🔄 API Endpoints

### Chat API
**Base URL**: `/api/chat/v1`

#### POST /api/chat/v1
- **Purpose**: Send chat message and get streaming response
- **Method**: POST
- **Content-Type**: application/json
- **Response**: SSE (Server-Sent Events) stream

### Character Chat API
**Base URL**: `/api/character-chat`

#### POST /api/character-chat/create-chat-session
- **Purpose**: Create character chat session
- **Quota**: Free: 3/week | Premium: 10/week

#### POST /api/character-chat/create-hepan-session
- **Purpose**: Create hepan (synastry) session
- **Quota**: Free: 3/week | Premium: unlimited

---

## 💬 Chat Request Format

### Standard Chat Request

```json
{
  "message": "Your message here",
  "session_id": "uuid-string or null",
  "mode": "create_character_real_custom",
  "stream": true
}
```

### Character Chat Request

```json
{
  "character_id": "uuid-string",
  "from_task": false
}
```

**Response**:
```json
{
  "session_id": "uuid-string",
  "mode": "character_ready_chat",
  "character_ids": ["uuid-string"]
}
```

### Hepan Request

```json
{
  "character_ids": ["uuid-1", "uuid-2"],
  "from_task": false
}
```

**Response**:
```json
{
  "session_id": "uuid-string",
  "mode": "hepan",
  "character_ids": ["uuid-1", "uuid-2"]
}
```

---

## 📡 SSE Response Format

### Event Stream Structure

Each SSE event is a JSON object with the following structure:

```json
{
  "session_id": "947382d4-5957-4351-a0df-9f2d2bf879a1",
  "content": {
    "parts": [
      {
        "text": "Response text content",
        "function_call": null,
        "function_response": null,
        "inline_data": null,
        "file_data": null,
        "video_metadata": null,
        "thought": null,
        "thought_signature": null,
        "code_execution_result": null,
        "executable_code": null
      }
    ],
    "role": "model"
  },
  "partial": true,
  "id": "05a50038-9d04-4b17-93d2-f93a36fe4425",
  "timestamp": 1752868753.336045
}
```

### Field Descriptions

- **session_id**: Session UUID (validate before rendering)
- **content.parts[].text**: Main text content to display
- **content.role**: Always "model" for AI responses
- **partial**: 
  - `true` - Message is still streaming
  - `false` - Message complete
- **id**: Unique ID for this message chunk
- **timestamp**: Unix timestamp

### Special Content Types

#### Function Call (Tool Usage)
```json
{
  "parts": [{
    "function_call": {
      "name": "get_character_info",
      "args": {
        "character_id": "uuid"
      }
    }
  }]
}
```

#### Paipan Attachment
```json
{
  "parts": [{
    "text": "Here's the analysis",
    "inline_data": {
      "mime_type": "application/json",
      "data": {
        "paipan": { /* paipan data */ }
      }
    }
  }]
}
```

---

## 🔁 Frontend Integration

### 1. Initialize Chat

```typescript
// Create new session
const response = await fetch(`${API_BASE_URL}/api/chat/v1`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'Start',
    session_id: null,
    mode: 'create_character_real_custom',
    stream: true
  })
})

// Setup SSE listener
const reader = response.body?.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const chunk = decoder.decode(value)
  const events = chunk.split('\n\n')
  
  for (const event of events) {
    if (event.startsWith('data: ')) {
      const data = JSON.parse(event.slice(6))
      
      // Store session_id on first message
      if (data.session_id && !currentSessionId) {
        currentSessionId = data.session_id
      }
      
      // Render message
      if (data.content?.parts?.[0]?.text) {
        appendToMessage(data.content.parts[0].text)
      }
      
      // Message complete
      if (!data.partial) {
        finalizeMessage()
      }
    }
  }
}
```

### 2. Send User Message

```typescript
const response = await fetch(`${API_BASE_URL}/api/chat/v1`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: userInput,
    session_id: currentSessionId,
    mode: currentMode,
    stream: true
  })
})

// Process SSE response (same as above)
```

### 3. Create Character Chat

```typescript
// Create session
const sessionResponse = await fetch(
  `${API_BASE_URL}/api/character-chat/create-chat-session`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      character_id: characterId,
      from_task: false
    })
  }
)

const { session_id, mode } = await sessionResponse.json()

// Then use this session_id for chat
```

---

## 🎨 UI Components

### Left Sidebar States

#### State 1: Character Selection
- Search bar for public character database
- Scrollable list of user's characters
- Character cards with: name, birthday, star sign
- Actions: "Create Hepan" | "Upgrade Account"

#### State 2: Character Readings
- Selected character info card
- Action buttons for pre-set questions
- "Agent" mode (premium feature)
- Actions: "Share" | "Create Hepan" | "Upgrade"

### Character Card Layout
```
┌─────────────────────────────────┐
│ Avatar   Name (text-xl primary) │
│          Birthday (text-sm)     │
│          ──────────────────     │
│          Star Sign (text-sm)    │
└─────────────────────────────────┘
```

### Center Chat Area
- **User messages**: `bg-primary` with `text-background`
- **AI messages**: `bg-content2` with `text-foreground`
- **Avatars**: Character avatar for AI, user avatar for user

### Right Sidebar
- Character details
- Paipan visualization
- Related information

---

## ⚠️ Important Notes

### Quota Limits
- **Character Sessions**: Free (3/week) | Premium (10/week)
- **Hepan Sessions**: Free (3/week) | Premium (unlimited)
- **Chat Messages**: Free (5/day) | Premium (unlimited)

### Session Management
- Session IDs are returned in first SSE response
- Store session_id to continue conversation
- Validate session_id before rendering messages

### Error Handling
- Check HTTP status codes before processing SSE
- Handle network errors gracefully
- Show user-friendly error messages

### Task Mode
- `from_task: true` - Does not consume quota (for onboarding tasks)
- `from_task: false` - Normal usage, consumes quota

---

## 📝 Session Storage Schema

Sessions are stored in `public.sessions` table:

```sql
{
  app_name: 'xwan_ai',
  user_id: 'uuid',
  id: 'session_uuid',
  mode: 'character_ready_chat' | 'hepan' | 'create_character_*',
  character_ids: ['uuid1', 'uuid2'],  -- Array of character IDs
  hepan_data: {...},  -- For hepan mode
  state: {...},  -- Conversation state
  title: 'Session title',
  create_time: timestamp,
  update_time: timestamp
}
```

---

**End of Document**
