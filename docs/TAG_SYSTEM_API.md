# 标签系统 API 文档

## 📋 概述

本文档介绍角色标签系统的数据库视图和 RPC 函数，用于前端查询和筛选角色。

### 核心概念

1. **容器（Container）**：指主分类（category_main）或维度分类（category_dimension）的记录
2. **标签路径（Tag Path）**：层级标签的完整路径，如 `["文化艺术", "文学与戏剧", "作家"]`
3. **标签名称（Tag Name）**：标签路径中的每一个具体标签

### 数据格式

角色的 `tags` 字段存储格式（jsonb）：

```json
{
  "a70bb7e3-f823-4f17-8ff4-71f951c11055": ["文化艺术", "文学与戏剧", "作家"],
  "8410aab5-5a20-4012-8be4-be269698b7d6": ["中国", "华夏文化圈"],
  "805b0b21-e1e2-4ef1-91cc-0ba43d146079": ["当代", "21世纪"]
}
```

- **键**：容器 UUID（category_main 或 category_dimension 的 id）
- **值**：标签路径数组（从父到子的完整层级）

---

## 📊 数据库视图

### 1. `tag_character_mapping` - 标签到角色的映射

**用途**：展开标签路径，建立每个具体标签与角色的关联关系。

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `character_id` | uuid | 角色 ID |
| `character_name` | text | 角色名称 |
| `avatar_id` | varchar | 头像 ID |
| `creator_id` | uuid | 创建者 ID |
| `creator_name` | text | 创建者用户名 |
| `created_at` | timestamptz | 创建时间 |
| `container_id` | uuid | 容器 ID |
| `container_name` | text | 容器名称（英文） |
| `container_display_name` | text | 容器显示名称（中文） |
| `container_type` | text | 容器类型（'main' 或 'dimension'） |
| `tag_path` | jsonb | 完整标签路径 |
| `tag_name` | text | 具体的标签名称 |
| `mode_id` | uuid | 模式 ID |

**示例数据**：

假设角色A的 tags 为：
```json
{
  "container1": ["文化艺术", "文学与戏剧", "作家"],
  "container2": ["中国"]
}
```

视图中会产生 4 条记录：
```
| character_id | container_id | tag_name | tag_path |
|--------------|--------------|----------|----------|
| 角色A-UUID   | container1   | 文化艺术  | ["文化艺术", "文学与戏剧", "作家"] |
| 角色A-UUID   | container1   | 文学与戏剧 | ["文化艺术", "文学与戏剧", "作家"] |
| 角色A-UUID   | container1   | 作家      | ["文化艺术", "文学与戏剧", "作家"] |
| 角色A-UUID   | container2   | 中国      | ["中国"] |
```

**前端查询示例**：

```typescript
// 直接查询视图（适合自定义复杂筛选）
const { data, error } = await supabase
  .from('tag_character_mapping')
  .select('*')
  .eq('container_id', 'a70bb7e3-f823-4f17-8ff4-71f951c11055')
  .eq('tag_name', '作家')
```

---

### 2. `tag_usage_by_container` - 标签使用统计

**用途**：统计每个容器下每个标签被多少个角色使用。

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `container_id` | uuid | 容器 ID |
| `container_name` | text | 容器名称 |
| `container_display_name` | text | 容器显示名称 |
| `container_type` | text | 容器类型 |
| `tag_name` | text | 标签名称 |
| `mode_id` | uuid | 模式 ID |
| `character_count` | bigint | 使用该标签的角色数量 |
| `characters` | jsonb | 使用该标签的所有角色信息（数组） |

**前端查询示例**：

```typescript
// 查看"文化艺术"容器下所有标签的使用情况
const { data, error } = await supabase
  .from('tag_usage_by_container')
  .select('tag_name, character_count')
  .eq('container_id', 'a70bb7e3-f823-4f17-8ff4-71f951c11055')
  .order('character_count', { ascending: false })

// 返回示例：
// [
//   { tag_name: "作家", character_count: 25 },
//   { tag_name: "文学与戏剧", character_count: 30 },
//   { tag_name: "文化艺术", character_count: 50 }
// ]
```

---

## 🔧 RPC 函数

### 1. `get_characters_by_tag` - 根据容器和标签查询角色

**用途**：查询包含指定标签的所有角色（支持分页）。

**参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `p_container_id` | uuid | ✅ | - | 容器 UUID |
| `p_tag_name` | text | ✅ | - | 标签名称 |
| `p_limit` | integer | ❌ | 20 | 返回数量 |
| `p_offset` | integer | ❌ | 0 | 分页偏移 |

**返回字段**：

```typescript
{
  character_id: string,
  character_name: string,
  avatar_id: string,
  creator_id: string,
  creator_name: string,
  tag_path: object,      // 完整标签路径
  created_at: string
}
```

**使用示例**：

```typescript
// 查询"文化艺术"容器下，标签为"作家"的所有角色
const { data, error } = await supabase.rpc('get_characters_by_tag', {
  p_container_id: 'a70bb7e3-f823-4f17-8ff4-71f951c11055',
  p_tag_name: '作家',
  p_limit: 20,
  p_offset: 0
})

// 分页查询第二页
const { data: page2 } = await supabase.rpc('get_characters_by_tag', {
  p_container_id: 'a70bb7e3-f823-4f17-8ff4-71f951c11055',
  p_tag_name: '作家',
  p_limit: 20,
  p_offset: 20
})
```

---

### 2. `get_tags_by_container` - 获取容器下所有标签统计

**用途**：获取某个容器下所有标签及其角色数量。

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `p_container_id` | uuid | ✅ | 容器 UUID |

**返回字段**：

```typescript
{
  tag_name: string,
  character_count: number
}
```

**使用示例**：

```typescript
// 查询"文化艺术"容器下所有标签的统计
const { data, error } = await supabase.rpc('get_tags_by_container', {
  p_container_id: 'a70bb7e3-f823-4f17-8ff4-71f951c11055'
})

// 返回示例：
// [
//   { tag_name: "文化艺术", character_count: 50 },
//   { tag_name: "文学与戏剧", character_count: 30 },
//   { tag_name: "作家", character_count: 25 },
//   { tag_name: "诗人", character_count: 15 },
//   ...
// ]
```

**适用场景**：
- 显示标签导航菜单
- 显示每个标签的热度（角色数量）
- 生成标签云

---

### 3. `count_characters_by_container` - 统计容器下的角色数量

**用途**：统计某个容器下有多少个角色。

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `p_container_id` | uuid | ✅ | 容器 UUID |

**返回**：`bigint` - 角色数量

**使用示例**：

```typescript
// 统计"文化艺术"容器下的角色数量
const { data: count, error } = await supabase.rpc('count_characters_by_container', {
  p_container_id: 'a70bb7e3-f823-4f17-8ff4-71f951c11055'
})

console.log(`该分类下有 ${count} 个角色`)
```

---

### 4. `get_characters_by_multiple_tags` - 多标签筛选（交集）

**用途**：查询同时包含多个指定标签的角色。

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `p_tags` | jsonb | ✅ | 标签筛选条件（对象格式） |

**参数格式**：

```typescript
{
  "container_uuid_1": "tag_name_1",
  "container_uuid_2": "tag_name_2",
  ...
}
```

**返回字段**：

```typescript
{
  character_id: string,
  character_name: string,
  avatar_id: string,
  creator_id: string,
  creator_name: string,
  created_at: string
}
```

**使用示例**：

```typescript
// 查询同时包含"作家"和"中国"标签的角色
const { data, error } = await supabase.rpc('get_characters_by_multiple_tags', {
  p_tags: {
    'a70bb7e3-f823-4f17-8ff4-71f951c11055': '作家',      // 文化艺术容器
    '8410aab5-5a20-4012-8be4-be269698b7d6': '中国'       // 文化圈容器
  }
})

// 查询同时包含3个标签的角色
const { data: filtered } = await supabase.rpc('get_characters_by_multiple_tags', {
  p_tags: {
    'container_id_1': '作家',
    'container_id_2': '中国',
    'container_id_3': '当代'
  }
})
```

**适用场景**：
- 高级筛选功能
- 多条件组合查询
- 精准搜索

---

## 🎯 常见使用场景

### 场景1：显示某个分类的角色列表

```typescript
// 例如：显示"文化艺术 > 作家"分类下的所有角色
const { data: characters } = await supabase.rpc('get_characters_by_tag', {
  p_container_id: 'a70bb7e3-f823-4f17-8ff4-71f951c11055',
  p_tag_name: '作家',
  p_limit: 20,
  p_offset: 0
})
```

---

### 场景2：显示分类导航菜单（含角色数量）

```typescript
// 获取"文化艺术"容器下所有标签及数量
const { data: tags } = await supabase.rpc('get_tags_by_container', {
  p_container_id: 'a70bb7e3-f823-4f17-8ff4-71f951c11055'
})

// 渲染导航菜单
tags.forEach(tag => {
  console.log(`${tag.tag_name} (${tag.character_count})`)
})
// 输出：
// 文化艺术 (50)
// 文学与戏剧 (30)
// 作家 (25)
// 诗人 (15)
```

---

### 场景3：多标签筛选

```typescript
// 用户选择了多个筛选条件：
// - 主分类：作家
// - 国籍：中国
// - 时代：当代

const { data: filtered } = await supabase.rpc('get_characters_by_multiple_tags', {
  p_tags: {
    'a70bb7e3-f823-4f17-8ff4-71f951c11055': '作家',
    '8410aab5-5a20-4012-8be4-be269698b7d6': '中国',
    '805b0b21-e1e2-4ef1-91cc-0ba43d146079': '当代'
  }
})

// 返回同时满足这3个条件的角色
```

---

### 场景4：标签热度排行

```typescript
// 查看某个容器下最热门的标签
const { data: tags } = await supabase.rpc('get_tags_by_container', {
  p_container_id: 'a70bb7e3-f823-4f17-8ff4-71f951c11055'
})

// tags 已按 character_count 降序排列
const topTags = tags.slice(0, 10) // 取前10个最热门标签
```

---

### 场景5：统计某个分类的总角色数

```typescript
// 统计"文化艺术"分类下有多少个角色
const { data: count } = await supabase.rpc('count_characters_by_container', {
  p_container_id: 'a70bb7e3-f823-4f17-8ff4-71f951c11055'
})

console.log(`该分类共有 ${count} 个角色`)
```

---

## 📝 注意事项

1. **容器 ID 来源**：容器 UUID 需要从 `category_main` 或 `category_dimension` 表获取
2. **标签名称匹配**：标签名称必须完全匹配（区分大小写）
3. **分页查询**：建议使用 `p_limit` 和 `p_offset` 进行分页，避免一次加载过多数据
4. **性能优化**：视图已建立 GIN 索引，查询性能良好
5. **只返回已完成的角色**：所有查询都自动过滤 `processing_status = 'completed'` 的角色

---

## 🔗 相关表结构

### category_mode（分类模式）
- `29da7da1-4824-40bc-ab3e-43d329d61e6b` - 模式一：领域与职业
- `e391abc6-86d7-4047-b1c9-60bd876daf1e` - 模式二：世界观/题材
- `0fadc768-9802-4bc8-b79d-542128363453` - 模式三：作品归属

### category_main（主分类）
存储主分类容器，如"文化艺术"、"学术思想"等

### category_dimension（维度分类）
存储维度分类容器，如"文化圈/国籍"、"时代"、"命理核心"等

---

## ❓ 常见问题

### Q1: 如何获取容器 UUID？
**A:** 从 `category_main` 或 `category_dimension` 表查询：
```typescript
const { data: containers } = await supabase
  .from('category_main')
  .select('id, name, display_name')
  .eq('mode_id', '29da7da1-4824-40bc-ab3e-43d329d61e6b')
```

### Q2: 标签路径和标签名称有什么区别？
**A:** 
- 标签路径：完整层级数组，如 `["文化艺术", "文学与戏剧", "作家"]`
- 标签名称：路径中的单个标签，如 `"作家"`、`"文学与戏剧"`

### Q3: 为什么查询不到结果？
**A:** 检查以下几点：
1. 容器 UUID 是否正确
2. 标签名称是否完全匹配（包括大小写）
3. 角色的 `processing_status` 是否为 `completed`
4. 角色的 `tags` 字段是否包含该标签

---

**文档更新日期**：2024-12-10
