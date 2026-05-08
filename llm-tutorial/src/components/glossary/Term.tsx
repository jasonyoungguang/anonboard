import type { ReactNode } from 'react'
import { useGlossary } from './GlossaryProvider'

interface TermProps {
  id: string
  children?: ReactNode
}

export function Term({ id, children }: TermProps) {
  const { glossary, openTerm } = useGlossary()
  const entry = glossary[id]
  const displayText = children ?? entry?.term ?? id

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        openTerm(id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          openTerm(id)
        }
      }}
      className="term-link"
    >
      {displayText}
    </span>
  )
}
