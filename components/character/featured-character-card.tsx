"use client"

import { Card, CardBody } from "@heroui/react"
import { MessageCircle } from "lucide-react"
import { getAvatarPublicUrl } from "@/lib/supabase/storage"
import { Check } from "lucide-react"
import { useTranslation } from "@/lib/utils/translations"

interface FeaturedCharacterCardProps {
  data: any
  onClick?: (character: any) => void
  isCheckable?: boolean
  isClickAble?: boolean
  isSelected?: boolean
  onToggleSelected?: (next: boolean) => void
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

export default function FeaturedCharacterCard({ data, onClick, isCheckable = false, isClickAble = true, isSelected: selectedProp, onToggleSelected }: FeaturedCharacterCardProps) {
  const { t } = useTranslation()
  const imageSrc = data?.avatar_id ? getAvatarPublicUrl(data.avatar_id, data.auth_id || null) : data?.characterImage
  const displayName = data?.profiles?.username || data?.username || "Unknown"
  const description = data?.description || ""
  const stat = data?.stats?.messages ?? data?.interaction_count ?? data?.favorites_count ?? 0
  const isSelected = Boolean(selectedProp ?? data?.isSelected ?? data?.selected ?? data?.checked)
  const title = data?.name ?? data?.characterName ?? ""

  return (
    <Card
      isPressable={isClickAble}
      shadow="sm"
      className="rounded-2xl bg-gray-100 w-full"
      onPress={isClickAble ? () => onClick?.(data) : undefined}
    >
      <CardBody className="p-3 relative">
        {isCheckable && isSelected && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[50%] h-full rounded-tr-2xl bg-[radial-gradient(ellipse_at_top_right,rgba(235,112,32,0.95)_0%,rgba(235,112,32,0.7)_35%,rgba(235,112,32,0.0)_60%)]" />
          </div>
        )}
        {isCheckable && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleSelected?.(!isSelected) }}
              onMouseDown={(e) => { e.stopPropagation() }}
              onPointerDown={(e) => { e.stopPropagation() }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggleSelected?.(!isSelected);
                }
              }}
              className={`absolute top-2 right-2 w-7 h-7 rounded-md border flex items-center justify-center ${isSelected ? "bg-[#EB7020] border-[#EB7020] text-white" : "bg-white/80 border-black/20 text-black/60"}`}
            >
              <Check className={`w-4 h-4 ${isSelected ? "opacity-100" : "opacity-40"}`} />
            </button>
          </>
        )}
        <div className="flex items-stretch gap-3">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 overflow-hidden flex-shrink-0">
            
            {imageSrc ? (
              <img
              src={imageSrc || "/placeholder.svg"}
              alt={data?.name || "character"}
              className="w-2/3 h-full object-cover rounded-xl"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg" }}
            />
            ) : (
              <div className="w-2/3 h-full rounded-xl flex items-center justify-center text-foreground-400 bg-gradient-to-br from-primary/20 to-primary/40">
                <span className="text-4xl">🎭</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 flex flex-col">
            <div className="text-sm sm:text-base font-semibold text-black truncate">{title}</div>
            <div className="mt-0.5 text-xs text-gray-500 truncate">By @{displayName}</div>
            {description ? (
              <div className="mt-1.5 text-xs sm:text-sm text-black/70 line-clamp-2">{description}</div>
            ) : null}
            <div className="mt-auto pt-2 flex items-center gap-2 text-gray-500">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{formatCount(stat)}</span>
            </div>
          </div>
        </div>
        {isCheckable && isSelected && (
          <div className="absolute bottom-2 right-3 text-xs text-[#EB7020]">{t("database.cardSelected")}</div>
        )}
      </CardBody>
    </Card>
  )
}
