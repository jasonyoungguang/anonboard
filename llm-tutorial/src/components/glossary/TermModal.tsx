import { X, BookOpen } from 'lucide-react'
import { type GlossaryEntry } from '@/data/glossary'
import { RichText } from './RichText'
import { Term } from './Term'
import { cn } from '@/lib/utils'

interface TermModalProps {
  entry: GlossaryEntry
  stackIndex: number
  stackSize: number
  onClose: () => void
}

const categoryConfig: Record<GlossaryEntry['category'], { label: string; colorClass: string }> = {
  llm: { label: 'LLM 基础', colorClass: 'bg-primary/10 text-primary' },
  'vector-db': { label: '向量数据库', colorClass: 'bg-glow-cyan/10 text-glow-cyan' },
  rag: { label: 'RAG', colorClass: 'bg-accent/10 text-accent' },
  general: { label: '通用概念', colorClass: 'bg-muted text-muted-foreground' },
}

export function TermModal({ entry, stackIndex, stackSize, onClose }: TermModalProps) {
  const cat = categoryConfig[entry.category]
  const isTop = stackIndex === stackSize - 1

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{
        zIndex: 110 + stackIndex * 10,
        pointerEvents: isTop ? 'auto' : 'none',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`term-title-${entry.id}`}
        className={cn(
          'modal-panel relative w-[90vw] max-w-xl max-h-[80vh] flex flex-col rounded-xl border border-border bg-card shadow-card-hover overflow-hidden',
          isTop ? 'animate-modal-enter' : 'opacity-60 scale-[0.97]'
        )}
        style={{
          transform: isTop
            ? undefined
            : `translateY(${(stackIndex - stackSize + 1) * 8}px) scale(${1 - (stackSize - 1 - stackIndex) * 0.03})`,
          pointerEvents: isTop ? 'auto' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-3 border-b border-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', cat.colorClass)}>
                {cat.label}
              </span>
              {stackSize > 1 && (
                <span className="text-[10px] text-muted-foreground">
                  深度 {stackIndex + 1}/{stackSize}
                </span>
              )}
            </div>
            <h3 id={`term-title-${entry.id}`} className="text-lg font-bold text-foreground">
              {entry.term}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{entry.shortDef}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Explanation */}
          <p className="text-sm text-foreground leading-relaxed">
            <RichText text={entry.explanation} />
          </p>

          {/* Sections / bullet points */}
          {entry.sections && entry.sections.length > 0 && (
            <ul className="space-y-2.5">
              {entry.sections.map((section, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="leading-relaxed">
                    <RichText text={section} />
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Formula */}
          {entry.formula && (
            <div className="code-block p-3">
              <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">公式</p>
              <p className="text-sm font-mono text-primary">{entry.formula}</p>
            </div>
          )}

          {/* Example */}
          {entry.example && (
            <div className="code-block p-3 space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">示例</p>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">输入</p>
                <p className="text-xs font-mono text-primary">{entry.example.input}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">输出</p>
                <p className="text-xs font-mono text-accent">{entry.example.output}</p>
              </div>
            </div>
          )}

          {/* Related terms */}
          {entry.relatedTerms && entry.relatedTerms.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">相关概念</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.relatedTerms.map(termId => (
                  <Term key={termId} id={termId}>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs border border-border bg-secondary/50 text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                      {entry.id === termId ? termId : undefined}
                    </span>
                  </Term>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
