import { Fragment } from 'react'
import { GLOSSARY } from '@/data/glossary'
import { Term } from './Term'

interface RichTextProps {
  text: string
  className?: string
}

const MARKER_REGEX = /\{\{([^}]+)\}\}/g

export function RichText({ text, className }: RichTextProps) {
  const parts: Array<string | { termId: string; display?: string }> = []
  let lastIndex = 0

  let match: RegExpExecArray | null
  const regex = new RegExp(MARKER_REGEX.source, 'g')

  while ((match = regex.exec(text)) !== null) {
    // Push text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const inner = match[1]
    const pipeIndex = inner.indexOf('|')
    if (pipeIndex > -1) {
      parts.push({
        termId: inner.slice(0, pipeIndex),
        display: inner.slice(pipeIndex + 1),
      })
    } else {
      parts.push({ termId: inner })
    }

    lastIndex = regex.lastIndex
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  // If no markers found, return plain text
  if (parts.length === 1 && typeof parts[0] === 'string') {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (typeof part === 'string') {
          return <Fragment key={i}>{part}</Fragment>
        }
        const entry = GLOSSARY[part.termId]
        if (!entry) {
          return <Fragment key={i}>{part.display ?? part.termId}</Fragment>
        }
        return (
          <Term key={i} id={part.termId}>
            {part.display ?? entry.term}
          </Term>
        )
      })}
    </span>
  )
}
