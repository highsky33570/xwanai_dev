import { createClient } from "./client"
import { apiClient } from "@/lib/api/client"

export interface UploadedAvatarInfo {
  file_id: string
  public_url: string
}

const AVATAR_BUCKET = "avatars"
const supabase = createClient();

export async function uploadAvatarToStorage(file: File): Promise<UploadedAvatarInfo> {
  // Use API endpoint to avoid RLS policy issues
  // The backend handles the upload with proper permissions
  const { file_id } = await apiClient.uploadAvatar(file)

  // Get public URL for the uploaded file
  // The file_id format from backend is typically: user_id/uuid.ext
  const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(file_id)
  const publicUrl = publicUrlData.publicUrl

  return { file_id, public_url: publicUrl }
}

export function getAvatarPublicUrl(
  fileId: string | null | undefined,
  ownerUserId?: string | null
): string | undefined {

  if (!fileId) return undefined
  if (fileId.includes("http") || fileId.includes("https")) {
    return fileId
  }
  let normalizedId = fileId

  // If legacy file IDs are stored without an extension, default to .png
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(normalizedId)
  if (!hasExtension) {
    normalizedId = `${normalizedId}.png`
  }

  // If id was stored as bare UUID and we know the owner, attempt `${ownerUserId}_${uuid}.ext`
  const looksBareUuid = !normalizedId.includes("/") && !normalizedId.includes("_") && /^[0-9a-fA-F-]{36}(\.[a-zA-Z0-9]+)?$/.test(normalizedId)
  if (looksBareUuid && ownerUserId) {
    normalizedId = `${ownerUserId}_${normalizedId}`
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(normalizedId)
  return data.publicUrl
}

