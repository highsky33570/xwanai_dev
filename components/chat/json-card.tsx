"use client"

import { useState } from "react"
import { Card, CardBody, Button } from "@heroui/react"
import { Copy, ChevronDown, ChevronRight, Check } from "lucide-react"

interface JsonCardProps {
  content: any
  title?: string
  originalContent?: string
}

export default function JsonCard({ content, title = "JSON Data", originalContent }: JsonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      // If we have original content (which includes the markdown code block), use that
      // Otherwise, format the parsed content nicely
      const textToCopy = originalContent || 
        (typeof content === 'string' ? content : JSON.stringify(content, null, 2))
      await navigator.clipboard.writeText(textToCopy)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy JSON:', error)
    }
  }

  const renderJsonValue = (value: any, depth: number = 0): React.ReactNode => {
    if (value === null) return <span className="text-foreground-500">null</span>
    if (value === undefined) return <span className="text-foreground-500">undefined</span>
    if (typeof value === 'boolean') return <span className="text-success">{value.toString()}</span>
    if (typeof value === 'number') return <span className="text-warning">{value}</span>
    if (typeof value === 'string') return <span className="text-primary">"{value}"</span>
    
    if (Array.isArray(value)) {
      return (
        <div className="ml-4">
          <span className="text-foreground-600">[</span>
          {value.map((item, index) => (
            <div key={index} className="ml-4">
              <span className="text-foreground-600">{index}: </span>
              {renderJsonValue(item, depth + 1)}
              {index < value.length - 1 && <span className="text-foreground-600">,</span>}
            </div>
          ))}
          <span className="text-foreground-600">]</span>
        </div>
      )
    }
    
    if (typeof value === 'object') {
      const entries = Object.entries(value)
      return (
        <div className="ml-4">
          <span className="text-foreground-600">{'{'}</span>
          {entries.map(([key, val], index) => (
            <div key={key} className="ml-4 break-words">
              <span className="text-secondary-600 font-medium">"{key}"</span>
              <span className="text-foreground-600">: </span>
              {renderJsonValue(val, depth + 1)}
              {index < entries.length - 1 && <span className="text-foreground-600">,</span>}
            </div>
          ))}
          <span className="text-foreground-600">{'}'}</span>
        </div>
      )
    }
    
    return <span className="text-foreground">{String(value)}</span>
  }

  const jsonString = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  const isLarge = jsonString.length > 500
  const previewContent = isLarge && !isExpanded 
    ? jsonString.substring(0, 300) + '...' 
    : jsonString

  return (
    <Card className="bg-content1/50 border border-foreground/20">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          </div>
          <div className="flex items-center gap-2">
            {isLarge && (
              <Button
                size="sm"
                variant="light"
                onPress={() => setIsExpanded(!isExpanded)}
                startContent={isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                className="h-7 text-xs text-foreground-600"
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            )}
            <Button
              size="sm"
              variant="light"
              onPress={handleCopy}
              startContent={isCopied ? <Check size={14} /> : <Copy size={14} />}
              className="h-7 text-xs text-foreground-600"
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <pre className="text-xs text-foreground font-mono bg-content2/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
            {previewContent}
          </pre>
        </div>
      </CardBody>
    </Card>
  )
}
