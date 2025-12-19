import { createClient } from "./client"

import { v4 as  uuidv4 } from "uuid"

export interface UploadedAvatarInfo {
  file_id: string
  public_url: string
}

const AVATAR_BUCKET = "avatars"
const supabase = createClient();
export async function uploadAvatarToStorage(file: File): Promise<UploadedAvatarInfo> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Not authenticated")
  }

  const fileExtension = file.name.split(".").pop() || "bin"
  const uniqueId = uuidv4();
  
  // typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
  //   ? crypto.randomUUID()
  //   : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const objectPath = `${user.id}/${uniqueId}.${fileExtension.toLowerCase()}`

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || undefined,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath)
  const publicUrl = publicUrlData.publicUrl

  return { file_id: objectPath, public_url: publicUrl }
}

export function getAvatarPublicUrl(
  fileId: string | null | undefined,
  ownerUserId?: string | null
): string | undefined {
  if (!fileId) return undefined
  let normalizedId = fileId

  // If legacy file IDs are stored without an extension, default to .jpg
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(normalizedId)
  if (!hasExtension) {
    normalizedId = `${normalizedId}.jpg`
  }

  // If id was stored as bare UUID and we know the owner, attempt `${ownerUserId}_${uuid}.ext`
  const looksBareUuid = !normalizedId.includes("/") && !normalizedId.includes("_") && /^[0-9a-fA-F-]{36}(\.[a-zA-Z0-9]+)?$/.test(normalizedId)
  if (looksBareUuid && ownerUserId) {
    normalizedId = `${ownerUserId}_${normalizedId}`
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(normalizedId)
  return data.publicUrl
}

