"use client"

import { Card, CardBody } from "@heroui/react"
import type { ReactNode } from "react"

interface CharacterTypeCardProps {
  type: string
  description: string
  icon: ReactNode
  onClick: () => void
}

export default function CharacterTypeCard({ type, description, icon, onClick }: CharacterTypeCardProps) {
  return (
    <Card
      isPressable
      onPress={onClick}
      className="bg-content1 hover:bg-content2 transition-all duration-200 hover:scale-105 hover:shadow-lg border border-white/5 w-80 h-[28rem]"
    >
      <CardBody className="flex flex-col items-center text-center p-8 space-y-6 h-full">
        <div className="flex-shrink-0 flex-grow flex items-center justify-center">
          <div className="scale-[3]">{icon}</div>
        </div>

        <div className="space-y-3 flex-shrink-0 pb-6">
          <h3 className="text-xl font-bold text-primary">{type}</h3>
          <p className="text-foreground-600 text-sm leading-relaxed">{description}</p>
        </div>
      </CardBody>
    </Card>
  )
}
