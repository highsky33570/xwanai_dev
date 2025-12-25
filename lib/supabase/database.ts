// import { supabase } from "./client"

import { createClient } from '@/lib/supabase/client'

import { logger, withTiming } from "@/lib/utils/logger"
import type { Tables, TablesInsert, TablesUpdate } from "./types"

type Character = Tables<"characters">
type CharacterInsert = TablesInsert<"characters">
type CharacterUpdate = TablesUpdate<"characters">
type Profile = Tables<"profiles">
type ProfileInsert = TablesInsert<"profiles">
type ProfileUpdate = TablesUpdate<"profiles">
type Session = Tables<"sessions">
type SessionInsert = TablesInsert<"sessions">
type SessionUpdate = TablesUpdate<"sessions">
type Event = Tables<"events">
type EventInsert = TablesInsert<"events">
type EventUpdate = TablesUpdate<"events">

export type TagFilters = {
  mainC: {
    containerId: string
    tags: string[]
  }
  pTags?: Record<string, any>
  orderBy?: {
    column?: string
    ascending?: boolean
  }
  nameSearch?: string // Optional name search filter
}


export interface CreateCharacterData {
  name: string
  description?: string
  avatar_id?: string
  access_level?: "public" | "private"
  data_type?: "virtual" | "real"
  tags?: string[]
  gender?: string
  mbti?: string
  longitude?: number
  birthday_utc8?: string
  birthplace?: string
  paipan?: any
}

export interface UpdateCharacterData {
  name?: string
  description?: string
  avatar_id?: string
  access_level?: "public" | "private"
  data_type?: "virtual" | "real"
  tags?: string[]
  gender?: string
  mbti?: string
  longitude?: number
  birthday_utc8?: string
  birthplace?: string
  paipan?: any
}

export interface ChatMessageData {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  isComplete: boolean
  isFailed?: boolean
}
const supabase = createClient();
class DatabaseOperations {

  async getMainCategories(): Promise<{ data: any[]; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .from("category_mode")
          .select("*, children:category_main(*)")
          .is("children.parent_id", null)
          .order("sort", { ascending: true })
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getMainCategories",
            error: result.error,
            duration,
          },
          "Failed to fetch character categories",
        )
        return { data: [], error: result.error }
      }
      console.log('getMainCategories: ', result.data);

      return { data: result.data || [], error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getCharacterCategories",
          error,
        },
        "Unexpected error fetching character categories",
      )
      return { data: [], error }
    }
  }

  async getDimensionCategories(): Promise<{ data: any[]; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .from("category_mode")
          .select("*, children:category_dimension(*, children:category_dimension(*))")
          .is("children.parent_id", null)
          .order("sort", { ascending: true })
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getMainCategories",
            error: result.error,
            duration,
          },
          "Failed to fetch character categories",
        )
        return { data: [], error: result.error }
      }

      console.log('getDimensionCategories: ', result.data);

      return { data: result.data || [], error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getCharacterCategories",
          error,
        },
        "Unexpected error fetching character categories",
      )
      return { data: [], error }
    }
  }

  async getCharactersByTag(p_container_id: string, p_tag_name: string, p_limit: number = 20, p_offset: number = 0): Promise<{ data: any[]; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .rpc('get_characters_by_tag', {
            p_container_id,
            p_limit,
            p_offset,
            p_tag_name
          })
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getMainCategories",
            error: result.error,
            duration,
          },
          "Failed to fetch character categories",
        )
        return { data: [], error: result.error }
      }

      console.log('getCharactersByTag: ', result.data);

      return { data: result.data || [], error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getCharacterCategories",
          error,
        },
        "Unexpected error fetching character categories",
      )
      return { data: [], error }
    }
  }
  async getCharactersByMultipleTag(pTags: {}): Promise<{ data: any[]; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .rpc("get_characters_by_multiple_tags", {
            p_tags: pTags
          })
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getMainCategories",
            error: result.error,
            duration,
          },
          "Failed to fetch character categories",
        )
        return { data: [], error: result.error }
      }

      console.log('getDimensionCategories: ', result.data);

      return { data: result.data || [], error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getCharacterCategories",
          error,
        },
        "Unexpected error fetching character categories",
      )
      return { data: [], error }
    }
  }

  buildTagCharacterQuery(
    filters: TagFilters,
    limit: number,
    offset: number
  ) {
    let query = supabase
      .from('tag_character_mapping')
      .select('*')
      .eq('container_id', filters.mainC.containerId)

    // tags filter
    if (filters.mainC.tags?.length) {
      const orConditions = filters.mainC.tags
        .map(tag => `tag_name.eq.${tag}`)
        .join(',');

      query = query.or(orConditions);
    }

    // pTags filter
    if (filters.pTags) {
      Object.entries(filters.pTags).forEach(([key, value]) => {
        query = query.eq('tag_name', value).eq('container_id', key);
      });
    }

    // name search filter
    if (filters.nameSearch && filters.nameSearch.trim()) {
      query = query.ilike('character_name', `%${filters.nameSearch.trim()}%`);
    }

    // order by
    if (filters.orderBy?.column) {
      query = query.order(
        filters.orderBy.column,
        { ascending: filters.orderBy.ascending ?? true }
      )
    }

    // pagination
    query = query.range(offset, offset + limit - 1)

    return query
  }


  async getTagCharacterMapping(
    filters: TagFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: any[]; error: any, count: number }> {
    function isValidUuid(uuid: string): boolean {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    }
    if (!isValidUuid(filters.mainC.containerId)) {
      return {
        data: [],
        error: 'not-a-valid-uuid',
        count: 0,
      }
    }
    const query = this.buildTagCharacterQuery(filters, limit, offset)

    const { data, error, count } = await query
    let { data: data1, error: error1 } = await supabase
      .rpc('build_tag_character_query', {filter_args: filters})
    if (error) console.error(error1, 'error1')
    else console.log(data1, 'data1')

    return {
      data: data ?? [],
      error,
      count: count ?? 0,
    }
  }

  async getCharacterCategories(): Promise<{ data: any[]; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .from("character_category")
          .select("*")
          .order("id", { ascending: true })
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getCharacterCategories",
            error: result.error,
            duration,
          },
          "Failed to fetch character categories",
        )
        return { data: [], error: result.error }
      }

      return { data: result.data || [], error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getCharacterCategories",
          error,
        },
        "Unexpected error fetching character categories",
      )
      return { data: [], error }
    }
  }

  // Character operations
  async createCharacter(userId: string, data: CreateCharacterData): Promise<{ data: Character | null; error: any }> {
    try {
      const characterData: CharacterInsert = {
        auth_id: userId,
        name: data.name,
        description: data.description || null,
        avatar_id: data.avatar_id || null,
        access_level: data.access_level || "private",
        data_type: data.data_type || "virtual",
        tags: data.tags || null,
        gender: data.gender || "male",
        mbti: data.mbti || null,
        longitude: data.longitude || null,
        birthday_utc8: data.birthday_utc8 || null,
        birthplace: data.birthplace || null,
        paipan: data.paipan || null,
      }

      const { result, duration } = await withTiming(async () => {
        return await supabase.from("characters").insert(characterData).select().single()
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "createCharacter",
            error: result.error,
            data: { userId, characterData },
            duration,
          },
          "Failed to create character",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "createCharacter",
          error,
          data: { userId, characterData: data },
        },
        "Unexpected error creating character",
      )
      return { data: null, error }
    }
  }

  async getUserCharacters(userId: string): Promise<{ data: Character[]; error: any }> {
    try {
      const { data: isPremium, error: premiumError } = await supabase
        .rpc('is_premium_user', { target_user_id: userId })

      if (premiumError) {
        logger.error(
          {
            module: "database",
            operation: "getUserCharacters",
            error: premiumError,
            data: { userId },
          },
          "Failed to check premium status",
        )
      }

      const characterLimit = isPremium ? 15 : 5

      const { result, duration } = await withTiming(async () => {
        return await supabase
          .from("characters")
          .select("*")
          .eq("auth_id", userId)
          .eq("access_level", "private")
          .neq("category", "personal")
          .order("created_at", { ascending: true })
          .limit(characterLimit)
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getUserCharacters",
            error: result.error,
            data: { userId },
            duration,
          },
          "Failed to fetch user characters",
        )
        return { data: [], error: result.error }
      }

      const sortedCharacters = (result.data as Character[]).sort((a, b) => {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })

      return { data: sortedCharacters, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getUserCharacters",
          error,
          data: { userId },
        },
        "Unexpected error fetching user characters",
      )
      return { data: [], error }
    }
  }

  async getPublicCharacters(): Promise<{ data: Character[]; error: any }> {
    try {
      const { result: charactersResult, duration: charactersDuration } = await withTiming(async () => {
        return await supabase
          .from("characters")
          .select("*")
          .eq("access_level", "public")
          .order("updated_at", { ascending: false })
          .limit(50)
      })

      if (charactersResult.error) {
        logger.error(
          {
            module: "database",
            operation: "getPublicCharacters",
            error: charactersResult.error,
            duration: charactersDuration,
          },
          "Failed to fetch public characters",
        )
        return { data: [], error: charactersResult.error }
      }

      return this._enrichCharactersWithProfiles(charactersResult.data || [])
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getPublicCharacters",
          error,
        },
        "Unexpected error fetching public characters",
      )
      return { data: [], error }
    }
  }

  async getPublicCharactersByCategory(categoryId: number): Promise<{ data: Character[]; error: any }> {
    try {
      const { result: charactersResult, duration: charactersDuration } = await withTiming(async () => {
        return await supabase
          .from("characters")
          .select("*")
          .eq("access_level", "public")
          .eq("category_id", categoryId)
          .order("updated_at", { ascending: false })
          .limit(50)
      })

      if (charactersResult.error) {
        logger.error(
          {
            module: "database",
            operation: "getPublicCharactersByCategory",
            error: charactersResult.error,
            data: { categoryId },
            duration: charactersDuration,
          },
          "Failed to fetch public characters by category",
        )
        return { data: [], error: charactersResult.error }
      }

      return this._enrichCharactersWithProfiles(charactersResult.data || [])
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getPublicCharactersByCategory",
          error,
          data: { categoryId },
        },
        "Unexpected error fetching public characters by category",
      )
      return { data: [], error }
    }
  }

  async getPublicCharactersPaginated(options: {
    categoryId?: number
    dataType?: "virtual" | "real"
    orderBy?: "updated_at" | "name"
    order?: "asc" | "desc"
    limit?: number
    page?: number
    search?: string
  }): Promise<{ data: Character[]; count: number | null; error: any }> {
    const {
      categoryId,
      dataType,
      orderBy = "updated_at",
      order = "desc",
      limit = 24,
      page = 1,
      search,
    } = options || {}

    const from = (page - 1) * limit
    const to = from + limit - 1

    try {
      const { result, duration } = await withTiming(async () => {
        let q = supabase
          .from("characters")
          .select("*", { count: "exact" })
          .eq("access_level", "public")

        if (typeof categoryId === "number") {
          q = q.eq("category_id", categoryId)
        }
        if (dataType) {
          q = q.eq("data_type", dataType)
        }
        if (search && search.trim().length > 0) {
          q = q.ilike("name", `% ${search.trim()
            }% `)
        }

        q = q.order(orderBy, { ascending: order === "asc" })
        q = q.range(from, to)

        return await q
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getPublicCharactersPaginated",
            error: result.error,
            data: { options },
            duration,
          },
          "Failed to fetch public characters (paginated)",
        )
        return { data: [], count: null, error: result.error }
      }

      const enriched = await this._enrichCharactersWithProfiles(result.data || [])
      return { data: enriched.data, count: result.count ?? null, error: enriched.error }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getPublicCharactersPaginated",
          error,
          data: { options },
        },
        "Unexpected error fetching public characters (paginated)",
      )
      return { data: [], count: null, error }
    }
  }

  async getPublicCharacterMetaDatas(): Promise<{ data: Tables<"public_characters">[]; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .from("public_characters")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50)
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getPublicCharacterMetaDatas",
            error: result.error,
            duration,
          },
          "Failed to fetch public character metadatas",
        )
        return { data: [], error: result.error }
      }

      return { data: result.data || [], error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getPublicCharacterMetaDatas",
          error,
        },
        "Unexpected error fetching public character metadatas",
      )
      return { data: [], error }
    }
  }

  async getFeaturedCharacters(): Promise<{ data: Character[]; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase.from("public_characters").select("*")
        .order("last_chat_at", { ascending: true }).limit(50)
      })
      return { data: result.data || [], error: null }
    }
    catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getFeaturedCharacters",
          error,
        },
        "Unexpected error fetching featured characters",
      )
      return { data: [], error }
    }
  }

  private async _enrichCharactersWithProfiles(characters: Character[]): Promise<{ data: Character[]; error: any }> {
    if (characters.length === 0) {
      return { data: [], error: null }
    }

    const authIds = [...new Set(characters.map(char => char.auth_id).filter(Boolean))] as string[]
    const userProfiles = new Map()

    if (authIds.length > 0) {
      try {
        const { result: profilesResult } = await withTiming(async () => {
          return await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", authIds)
        })

        if (profilesResult.data && !profilesResult.error) {
          profilesResult.data.forEach((profile: any) => {
            userProfiles.set(profile.id, {
              username: profile.username || "Anonymous",
              avatar_url: profile.avatar_url
            })
          })
        }
      } catch (error) {
        logger.error({ module: "database", operation: "_enrichCharactersWithProfiles", error }, "Failed to fetch user profiles")
      }
    }

    // Fill missing profiles with Anonymous
    authIds.forEach(authId => {
      if (!userProfiles.has(authId)) {
        userProfiles.set(authId, { username: "Anonymous", avatar_url: null })
      }
    })

    const mergedData = characters.map(character => ({
      ...character,
      profiles: character.auth_id ? userProfiles.get(character.auth_id) || null : null
    }))

    return { data: mergedData, error: null }
  }


  async searchCharacters(query: string): Promise<{ data: Character[]; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .from("characters")
          .select("*")
          .eq("access_level", "public")
          .ilike("name", `% ${query}% `)
          .order("updated_at", { ascending: false })
          .limit(20)
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "searchCharacters",
            error: result.error,
            data: { query },
            duration,
          },
          "Failed to search characters",
        )
        return { data: [], error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "searchCharacters",
          error,
          data: { query },
        },
        "Unexpected error searching characters",
      )
      return { data: [], error }
    }
  }

  async getCharacterById(id: string): Promise<{ data: Character | null; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase.from("characters").select("*").eq("id", id).single()
      })

      if (result.error) {
        if (result.error.code === "PGRST116") {
          return { data: null, error: { message: "Character not found", code: "NOT_FOUND" } }
        }

        logger.error(
          {
            module: "database",
            operation: "getCharacterById",
            error: result.error,
            data: { characterId: id },
            duration,
          },
          "Failed to fetch character by ID",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getCharacterById",
          error,
          data: { characterId: id },
        },
        "Unexpected error fetching character by ID",
      )
      return { data: null, error }
    }
  }

  async updateCharacter(id: string, data: UpdateCharacterData): Promise<{ data: Character | null; error: any }> {
    try {
      const updateData: CharacterUpdate = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      const { result, duration } = await withTiming(async () => {
        return await supabase.from("characters").update(updateData).eq("id", id).select().single()
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "updateCharacter",
            error: result.error,
            data: { characterId: id, updateData },
            duration,
          },
          "Failed to update character",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "updateCharacter",
          error,
          data: { characterId: id, updateData: data },
        },
        "Unexpected error updating character",
      )
      return { data: null, error }
    }
  }

  async toggleCharacterAccessLevel(id: string): Promise<{ data: Character | null; error: any }> {
    try {
      const { data: currentChar, error: fetchError } = await this.getCharacterById(id)

      if (fetchError || !currentChar) {
        return { data: null, error: fetchError || new Error("Character not found") }
      }

      const newAccessLevel = currentChar.access_level === "public" ? "private" : "public"

      return await this.updateCharacter(id, { access_level: newAccessLevel })
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "toggleCharacterAccessLevel",
          error,
          data: { characterId: id },
        },
        "Unexpected error toggling access level",
      )
      return { data: null, error }
    }
  }

  async favoriteCharacter(characterId: string, userId: string): Promise<{ data: any; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await (supabase as any).rpc("favorite_character", {
          p_character_id: characterId,
          p_auth_id: userId,
        })
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "favoriteCharacter",
            error: result.error,
            data: { characterId, userId },
            duration,
          },
          "Failed to favorite character",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "favoriteCharacter",
          error,
          data: { characterId, userId },
        },
        "Unexpected error favoriting character",
      )
      return { data: null, error }
    }
  }

  async deleteCharacter(id: string): Promise<{ error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase.from("characters").delete().eq("id", id)
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "deleteCharacter",
            error: result.error,
            data: { characterId: id },
            duration,
          },
          "Failed to delete character",
        )
        return { error: result.error }
      }

      return { error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "deleteCharacter",
          error,
          data: { characterId: id },
        },
        "Unexpected error deleting character",
      )
      return { error }
    }
  }

  // Profile operations
  async getUserProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase.from("profiles").select("*").eq("id", userId).single()
      })

      if (result.error) {
        if (result.error.code === "PGRST116") {
          return { data: null, error: null }
        }

        logger.error(
          {
            module: "database",
            operation: "getUserProfile",
            error: result.error,
            data: { userId },
            duration,
          },
          "Failed to fetch user profile",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getUserProfile",
          error,
          data: { userId },
        },
        "Unexpected error fetching user profile",
      )
      return { data: null, error }
    }
  }

  async createUserProfile(userId: string, data: Partial<ProfileInsert>): Promise<{ data: Profile | null; error: any }> {
    try {
      const profileData: ProfileInsert = {
        id: userId,
        username: data.username || null,
        full_name: data.full_name || null,
        bio: data.bio || null,
        location: data.location || null,
        birth_date: data.birth_date || null,
        theme: data.theme || null,
        public_profile: data.public_profile ?? true,
        show_email: data.show_email ?? false,
        email_notifications: data.email_notifications ?? true,
        avatar_url: data.avatar_url || null,
      }

      const { result, duration } = await withTiming(async () => {
        return await supabase.from("profiles").insert(profileData).select().single()
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "createUserProfile",
            error: result.error,
            data: { userId, profileData },
            duration,
          },
          "Failed to create user profile",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "createUserProfile",
          error,
          data: { userId, profileData: data },
        },
        "Unexpected error creating user profile",
      )
      return { data: null, error }
    }
  }

  async updateUserProfile(userId: string, data: ProfileUpdate): Promise<{ data: Profile | null; error: any }> {
    try {
      const updateData: ProfileUpdate = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      const { result, duration } = await withTiming(async () => {
        return await supabase.from("profiles").update(updateData).eq("id", userId).select().single()
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "updateUserProfile",
            error: result.error,
            data: { userId, updateData },
            duration,
          },
          "Failed to update user profile",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "updateUserProfile",
          error,
          data: { userId, updateData: data },
        },
        "Unexpected error updating user profile",
      )
      return { data: null, error }
    }
  }

  async getUsersByIds(userIds: string[]): Promise<{ data: Profile[] | null; error: any }> {
    try {
      if (userIds.length === 0) {
        return { data: [], error: null }
      }

      const { result, duration } = await withTiming(async () => {
        return await supabase.from("profiles").select("*").in("id", userIds)
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getUsersByIds",
            error: result.error,
            data: { userIds },
            duration,
          },
          "Failed to fetch user profiles by IDs",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getUsersByIds",
          error,
          data: { userIds },
        },
        "Unexpected error fetching user profiles by IDs",
      )
      return { data: null, error }
    }
  }

  // Session operations
  async getSessionById(sessionId: string): Promise<{ data: Session | null; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .eq("app_name", "xwan_ai")
          .maybeSingle()
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getSessionById",
            error: result.error,
            data: { sessionId },
            duration,
          },
          "Error fetching session",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getSessionById",
          error,
          data: { sessionId },
        },
        "Unexpected error fetching session",
      )
      return { data: null, error }
    }
  }

  async getEventsBySessionId(sessionId: string): Promise<{ data: Event[] | null; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .from("events")
          .select("*")
          .eq("session_id", sessionId)
          .order("timestamp", { ascending: true })
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getEventsBySessionId",
            error: result.error,
            data: { sessionId },
            duration,
          },
          "Error fetching events",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getEventsBySessionId",
          error,
          data: { sessionId },
        },
        "Unexpected error fetching events",
      )
      return { data: null, error }
    }
  }

  async getSessionsByCharacterId(characterId: string, userId: string, appName: string = "xwan_ai"): Promise<{ data: Session[] | null; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .from("sessions")
          .select("*")
          .eq("user_id", userId)
          .eq("app_name", appName)
          .contains("character_ids", [characterId])
          .order("update_time", { ascending: false })
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getSessionsByCharacterId",
            error: result.error,
            data: { characterId, userId, appName },
            duration,
          },
          "Error fetching character sessions",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getSessionsByCharacterId",
          error,
          data: { characterId, userId, appName },
        },
        "Unexpected error fetching character sessions",
      )
      return { data: null, error }
    }
  }

  async deleteSessionsByCharacterId(characterId: string): Promise<{ error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .from("sessions")
          .delete()
          .contains("character_ids", [characterId])
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "deleteSessionsByCharacterId",
            error: result.error,
            data: { characterId },
            duration,
          },
          "Failed to delete character sessions",
        )
        return { error: result.error }
      }

      return { error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "deleteSessionsByCharacterId",
          error,
          data: { characterId },
        },
        "Unexpected error deleting character sessions",
      )
      return { error }
    }
  }

  async deleteSessions(sessionIds: string[]): Promise<{ error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .from("sessions")
          .delete()
          .in("id", sessionIds)
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "deleteSessions",
            error: result.error,
            data: { sessionIds, count: sessionIds.length },
            duration,
          },
          "Failed to delete sessions",
        )
        return { error: result.error }
      }

      return { error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "deleteSessions",
          error,
          data: { sessionIds, count: sessionIds.length },
        },
        "Unexpected error deleting sessions",
      )
      return { error }
    }
  }

  async getUserSessions(userId: string, appName: string = "xwan_ai"): Promise<{ data: Session[] | null; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await supabase
          .from("sessions")
          .select("*")
          .eq("user_id", userId)
          .eq("app_name", appName)
          .order("update_time", { ascending: false })
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getUserSessions",
            error: result.error,
            data: { userId, appName },
            duration,
          },
          "Error fetching user sessions",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getUserSessions",
          error,
          data: { userId, appName },
        },
        "Unexpected error fetching user sessions",
      )
      return { data: null, error }
    }
  }

  // Convert events to chat messages format
  convertEventsToMessages(events: Event[]): ChatMessageData[] {
    return events.map(event => {
      const content = (event.content as any) || {}
      let text: string = ""
      let sender: "user" | "assistant" = "user"
      let isFailed: boolean = false

      if (content.text) {
        text = content.text
        sender = event.author === "assistant" ? "assistant" : "user"
        isFailed = content.is_failed === true
      }
      else if (content?.parts?.[0]?.text) {
        const firstPart = content.parts[0]
        text = firstPart.text
        sender = content?.role === "model" ? "assistant" : "user"
      }
      else if (content?.parts?.[0]?.function_response) {
        const firstPart = content.parts[0]
        try {
          const funcName = firstPart.function_response.name
          const funcResp = firstPart.function_response.response
          const rawResult = (funcResp && (funcResp.result ?? funcResp)) as any
          const parsed = typeof rawResult === "string" ? JSON.parse(rawResult) : rawResult
          if (parsed && (parsed.card_id === "get_paipan_by_bazi" || funcName === "get_paipan_by_bazi")) {
            const paipan = parsed.data?.paipan ?? parsed.paipan ?? null
            const mbti = parsed.data?.mbti ?? parsed.mbti ?? null
            text = `User's Bazi Infos: ${JSON.stringify({ paipan, mbti })}`
          } else {
            text = JSON.stringify(parsed)
          }
          sender = "assistant"
        } catch (e) {
          text = ""
          sender = "assistant"
        }
      }
      else {
        if (typeof content === 'string') {
          text = content
        } else if (content.text) {
          text = content.text
        } else {
          text = JSON.stringify(content)
        }
        sender = event.author === "assistant" ? "assistant" : "user"
      }

      return {
        id: event.id,
        content: text,
        sender,
        timestamp: new Date(event.timestamp),
        isComplete: true,
        isFailed,
        thinking: content.thinking || undefined
      }
    })
  }

  // BaZi / RPC operations
  async getBasicBaziByCharacterId(characterId: string): Promise<{ data: any; error: any }> {
    try {
      const { result, duration } = await withTiming(async () => {
        return await (supabase as any).rpc("get_basic_bazi_by_character_id", { p_character_id: characterId })
      })

      if (result.error) {
        logger.error(
          {
            module: "database",
            operation: "getBasicBaziByCharacterId",
            error: result.error,
            data: { characterId },
            duration,
          },
          "RPC get_basic_bazi_by_character_id failed",
        )
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "getBasicBaziByCharacterId",
          error,
          data: { characterId },
        },
        "Unexpected error calling RPC get_basic_bazi_by_character_id",
      )
      return { data: null, error }
    }
  }
}

export const databaseOperations = new DatabaseOperations()

