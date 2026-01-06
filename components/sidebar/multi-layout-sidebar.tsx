"use client"

import { useState } from "react"
import { Card, CardBody, Button, Avatar, Input, Chip } from "@heroui/react"
import { Search, MessageCircle, Users, Settings, Plus, Star } from "lucide-react"

interface SidebarProps {
  defaultLayout?: "chats" | "characters" | "settings"
}

interface ChatItem {
  id: string
  characterName: string
  lastMessage: string
  timestamp: string
  avatar: string
  isOnline: boolean
  unreadCount?: number
}

interface CharacterItem {
  id: string
  name: string
  type: string
  avatar: string
  rating: number
  isOnline: boolean
  description: string
}

export default function MultiLayoutSidebar({ defaultLayout = "chats" }: SidebarProps) {
  const [activeLayout, setActiveLayout] = useState(defaultLayout)
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data
  const chatHistory: ChatItem[] = [
    {
      id: "1",
      characterName: "Luna Starweaver",
      lastMessage: "The stars whisper of new opportunities...",
      timestamp: "2m ago",
      avatar: "/placeholder-user.jpg",
      isOnline: true,
      unreadCount: 2,
    },
    {
      id: "2",
      characterName: "Marcus Chen",
      lastMessage: "Based on the data patterns I see...",
      timestamp: "1h ago",
      avatar: "/placeholder-user.jpg",
      isOnline: false,
    },
    {
      id: "3",
      characterName: "Aria Moonlight",
      lastMessage: "Your energy feels different today...",
      timestamp: "3h ago",
      avatar: "/placeholder-user.jpg",
      isOnline: true,
    },
  ]

  const characters: CharacterItem[] = [
    {
      id: "1",
      name: "Luna Starweaver",
      type: "Astrologer",
      avatar: "/placeholder-user.jpg",
      rating: 4.9,
      isOnline: true,
      description: "Mystical guide through cosmic energies",
    },
    {
      id: "2",
      name: "Marcus Chen",
      type: "Data Analyst",
      avatar: "/placeholder-user.jpg",
      rating: 4.7,
      isOnline: false,
      description: "Decodes personality patterns",
    },
    {
      id: "3",
      name: "Aria Moonlight",
      type: "Healer",
      avatar: "/placeholder-user.jpg",
      rating: 4.8,
      isOnline: true,
      description: "Emotional guidance specialist",
    },
    {
      id: "4",
      name: "Dr. Orion Vale",
      type: "Philosopher",
      avatar: "/placeholder-user.jpg",
      rating: 4.6,
      isOnline: false,
      description: "Cosmic theorist and sage",
    },
  ]

  const renderChatLayout = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-foreground/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Chats</h2>
          <Button isIconOnly size="sm" variant="ghost" className="text-foreground hover:bg-content2 rounded-lg">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="w-4 h-4 text-foreground-400" />}
          className="w-full"
          classNames={{
            input: "bg-content2 border-foreground/10 text-foreground placeholder:text-foreground-400",
            inputWrapper: "bg-content2 border-foreground/10 hover:border-foreground/20 focus-within:border-primary/50",
          }}
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-2 space-y-1">
          {chatHistory
            .filter(
              (chat) =>
                chat.characterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((chat) => (
              <Card
                key={chat.id}
                className="bg-content2/80 border border-foreground/10 hover:bg-content2 hover:border-foreground/20 transition-all duration-200 cursor-pointer rounded-xl backdrop-blur-sm"
                isPressable
              >
                <CardBody className="p-3">
                  <div className="flex items-start gap-3 w-full">
                    <div className="relative flex-shrink-0">
                      <Avatar 
                        src={chat.avatar} 
                        name={chat.characterName} 
                        size="sm"
                        fallback={
                          <div className="w-full h-full bg-content2 flex items-center justify-center">
                            <img 
                              src="/placeholder.svg" 
                              alt="Character Avatar" 
                              className="w-4 h-4 opacity-80"
                            />
                          </div>
                        }
                      />
                      {chat.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-content1" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-foreground text-sm truncate">{chat.characterName}</h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs text-foreground-400">{chat.timestamp}</span>
                          {chat.unreadCount && (
                            <Chip size="sm" className="bg-primary text-primary-foreground min-w-5 h-5 text-xs">
                              {chat.unreadCount}
                            </Chip>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-foreground-600 truncate">{chat.lastMessage}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )

  const renderCharactersLayout = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-foreground/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Characters</h2>
          <Button isIconOnly size="sm" variant="ghost" className="text-foreground hover:bg-content2 rounded-lg">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <Input
          placeholder="Search characters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="w-4 h-4 text-foreground-400" />}
          className="w-full"
          classNames={{
            input: "bg-content2 border-foreground/10 text-foreground placeholder:text-foreground-400",
            inputWrapper: "bg-content2 border-foreground/10 hover:border-foreground/20 focus-within:border-primary/50",
          }}
        />
      </div>

      {/* Character List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-2 space-y-2">
          {characters
            .filter(
              (character) =>
                character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                character.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                character.description.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((character) => (
              <Card
                key={character.id}
                className="bg-content2/80 border border-foreground/10 hover:bg-content2 hover:border-foreground/20 transition-all duration-200 cursor-pointer rounded-xl backdrop-blur-sm w-full"
                isPressable
              >
                <CardBody className="p-4 w-full">
                  <div className="flex items-start gap-3 w-full">
                    <div className="relative flex-shrink-0">
                      <Avatar 
                        src={character.avatar} 
                        name={character.name} 
                        size="md"
                        fallback={
                          <div className="w-full h-full bg-content2 flex items-center justify-center">
                            <img 
                              src="/placeholder.svg" 
                              alt="Character Avatar" 
                              className="w-6 h-6 opacity-80"
                            />
                          </div>
                        }
                      />
                      {character.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-content1 animate-pulse" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground text-sm leading-tight">{character.name}</h4>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <Star className="w-3 h-3 text-warning fill-current" />
                          <span className="text-xs text-foreground-500 font-medium">{character.rating}</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <Chip 
                          size="sm" 
                          variant="flat"
                          className="bg-primary/10 text-primary text-xs h-5"
                        >
                          {character.type}
                        </Chip>
                      </div>
                      <p className="text-xs text-foreground-600 leading-relaxed line-clamp-2">{character.description}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )

  const renderSettingsLayout = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-foreground/10 flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-2 space-y-2">
          <Card className="bg-content2/80 border border-foreground/10 hover:bg-content2 hover:border-foreground/20 transition-all duration-200 rounded-xl backdrop-blur-sm" isPressable>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm">General Settings</h4>
                  <p className="text-xs text-foreground-600">App preferences and defaults</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-content2/80 border border-foreground/10 hover:bg-content2 hover:border-foreground/20 transition-all duration-200 rounded-xl backdrop-blur-sm" isPressable>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm">Chat Settings</h4>
                  <p className="text-xs text-foreground-600">Message preferences</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-content2/80 border border-foreground/10 hover:bg-content2 hover:border-foreground/20 transition-all duration-200 rounded-xl backdrop-blur-sm" isPressable>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm">Account</h4>
                  <p className="text-xs text-foreground-600">Profile and privacy</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-80 bg-content1 border-r border-foreground/10 h-full flex flex-col">
      {/* Navigation Tabs */}
      <div className="p-4 border-b border-foreground/10 flex-shrink-0">
        <div className="flex gap-1 bg-content2 p-1 rounded-xl">
          <Button
            size="sm"
            variant={activeLayout === "chats" ? "solid" : "light"}
            color={activeLayout === "chats" ? "primary" : "default"}
            className="flex-1 rounded-lg text-xs"
            onPress={() => setActiveLayout("chats")}
          >
            <MessageCircle className="w-3 h-3" />
            Chats
          </Button>
          <Button
            size="sm"
            variant={activeLayout === "characters" ? "solid" : "light"}
            color={activeLayout === "characters" ? "primary" : "default"}
            className="flex-1 rounded-lg text-xs"
            onPress={() => setActiveLayout("characters")}
          >
            <Users className="w-3 h-3" />
            Characters
          </Button>
          <Button
            size="sm"
            variant={activeLayout === "settings" ? "solid" : "light"}
            color={activeLayout === "settings" ? "primary" : "default"}
            className="flex-1 rounded-lg text-xs"
            onPress={() => setActiveLayout("settings")}
          >
            <Settings className="w-3 h-3" />
            Settings
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {activeLayout === "chats" && renderChatLayout()}
        {activeLayout === "characters" && renderCharactersLayout()}
        {activeLayout === "settings" && renderSettingsLayout()}
      </div>
    </div>
  )
}
