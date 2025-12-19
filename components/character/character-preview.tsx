"use client"

import { Card, CardBody, Avatar } from "@heroui/react"
import { Heart, MessageCircle, Share2 } from "lucide-react"

interface CharacterData {
  id: string
  name: string
  description: string
  image?: string
  avatar?: string
  author?: {
    username: string
    avatar?: string
  }
  creator?: string
  stats?: {
    likes: number
    comments: number
    shares: number
  }
  rating?: number
  totalChats?: number
}

interface CharacterPreviewProps {
  character: CharacterData
}

export default function CharacterPreview({ character }: CharacterPreviewProps) {
  // Safely extract character data with fallbacks
  const characterImage = character.image || character.avatar || "/placeholder.svg?height=400&width=400"
  const authorName = character.author?.username || character.creator || "Unknown"
  const authorAvatar = character.author?.avatar || "/placeholder.svg?height=40&width=40"
  const likes = character.stats?.likes || 0
  const comments = character.stats?.comments || 0
  const shares = character.stats?.shares || 0

  return (
    <Card className="bg-content1 border border-white/5 rounded-xl">
      <CardBody className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Character Image */}
          <div className="flex-shrink-0">
            <div className="w-64 h-64 mx-auto md:mx-0 rounded-lg overflow-hidden bg-content2">
              <img
                src={characterImage || "/placeholder.svg"}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Character Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-primary font-title mb-2">{character.name}</h1>

              {/* Author Info */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar size="sm" src={authorAvatar} name={authorName} />
                <div>
                  <p className="text-sm text-white/60">Created by</p>
                  <p className="text-primary font-medium">{authorName}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-white/60">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{comments}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Share2 className="w-4 h-4" />
                  <span>{shares}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-white/80 leading-relaxed">{character.description}</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
