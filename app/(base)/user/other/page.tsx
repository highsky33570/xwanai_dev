"use client"

import { Button } from "@heroui/react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import UserProfileHeader from "@/components/user/user-profile-header"
import UserCharacterGrid from "@/components/user/user-character-grid"

export default function UserOtherPage() {
  // Mock other user data (profile-like object used by UserProfileHeader)
  const otherUserProfile = {
    email: "bob@example.com",
    user_metadata: {
      username: "Bob",
      avatar_url: "/placeholder.svg?height=96&width=96",
    },
    created_at: new Date("2023-03-01").toISOString(),
  } as any

  // Mock other user's characters
  const userCharacters = [
    {
      id: "5",
      username: "Bob",
      updatedTime: "1 day ago",
      characterName: "Cyber Detective Nova",
      description:
        "A augmented detective in Neo-Tokyo 2087, investigating crimes that blur the line between human and machine.",
      characterImage: "/placeholder.svg?height=300&width=300",
      userAvatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "6",
      username: "Bob",
      updatedTime: "3 days ago",
      characterName: "Admiral Zara",
      description: "Commander of the last human fleet, leading the exodus to find a new home among the stars.",
      characterImage: "/placeholder.svg?height=300&width=300",
      userAvatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const handleCharacterClick = (character: any) => {
    // Handle character click - navigate to character details
  }

  return (
    <div className="w-full px-4 py-6">
      {/* Return Button */}
      <div className="mb-6">
        <Button
          as={Link}
          href="/"
          variant="ghost"
          startContent={<ArrowLeft className="w-4 h-4" />}
          className="text-foreground-600 hover:text-foreground"
        >
          Back to Home
        </Button>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* User Profile Header */}
        <UserProfileHeader
          profile={otherUserProfile}
          stats={{
            totalCharacters: userCharacters.length,
            publicCharacters: userCharacters.length,
            privateCharacters: 0,
            totalLikes: 0,
          }}
        />

        {/* User's Characters */}
        <UserCharacterGrid
          characters={userCharacters}
          username={otherUserProfile.user_metadata.username}
          onCharacterClick={handleCharacterClick}
          showTitle={true}
        />
      </div>
    </div>
  )
}
