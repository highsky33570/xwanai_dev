"use client"

import { useState } from "react"
import { Button, Textarea, Avatar } from "@heroui/react"
import { Send } from "lucide-react"

interface Comment {
  id: string
  author: string
  content: string
  timestamp: string
  avatar?: string
}

interface CommentSectionProps {
  characterId: string
}

export default function CommentSection({ characterId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)

    // TODO: Implement actual comment submission to Supabase
    const comment: Comment = {
      id: Date.now().toString(),
      author: "Current User", // TODO: Get from auth context
      content: newComment.trim(),
      timestamp: new Date().toISOString(),
    }

    setComments((prev) => [comment, ...prev])
    setNewComment("")
    setIsSubmitting(false)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Comment Form */}
      <div className="mb-6 flex-shrink-0">
        <Textarea
          placeholder="Share your thoughts about this character..."
          value={newComment}
          onValueChange={setNewComment}
          minRows={3}
          className="mb-3"
          classNames={{
            input: "text-foreground placeholder:text-foreground-400",
            inputWrapper: "bg-content1/50 border-white/10 hover:border-white/20 focus-within:border-primary/50",
          }}
        />
        <div className="flex justify-end">
          <Button
            color="primary"
            startContent={<Send className="w-4 h-4" />}
            onPress={handleSubmitComment}
            isLoading={isSubmitting}
            isDisabled={!newComment.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            Post Comment
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-0" style={{ scrollbarGutter: "stable" }}>
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="group">
              <div className="flex gap-3 p-4 bg-content1/30 hover:bg-content1/50 rounded-lg border border-white/5 hover:border-white/10 transition-all duration-200">
                <Avatar 
                  src={comment.avatar} 
                  name={comment.author} 
                  size="sm" 
                  className="flex-shrink-0"
                  classNames={{
                    base: "bg-gradient-to-br from-primary/20 to-secondary/20"
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-foreground">{comment.author}</span>
                    <span className="text-xs text-foreground-400">•</span>
                    <span className="text-xs text-foreground-400">{formatTimestamp(comment.timestamp)}</span>
                  </div>
                  <p className="text-foreground-600 text-sm leading-relaxed break-words">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
              <Send className="w-6 h-6 text-foreground-400" />
            </div>
            <div className="text-foreground-400 text-lg mb-2">No comments yet</div>
            <div className="text-foreground-300 text-sm max-w-sm">
              Start the conversation! Share your thoughts about this character.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
