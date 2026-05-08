import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { GLOSSARY, type GlossaryEntry } from '@/data/glossary'

interface GlossaryContextValue {
  glossary: Record<string, GlossaryEntry>
  modalStack: string[]
  openTerm: (id: string) => void
  closeTerm: () => void
  closeAll: () => void
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null)

const MAX_STACK_DEPTH = 8

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [modalStack, setModalStack] = useState<string[]>([])

  const openTerm = useCallback((id: string) => {
    if (!GLOSSARY[id]) return
    setModalStack(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === id) return prev
      if (prev.includes(id)) return prev
      if (prev.length >= MAX_STACK_DEPTH) return prev
      return [...prev, id]
    })
  }, [])

  const closeTerm = useCallback(() => {
    setModalStack(prev => prev.slice(0, -1))
  }, [])

  const closeAll = useCallback(() => {
    setModalStack([])
  }, [])

  // Lock body scroll when modals are open
  useEffect(() => {
    if (modalStack.length > 0) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [modalStack.length])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalStack.length > 0) {
        closeTerm()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalStack.length, closeTerm])

  return (
    <GlossaryContext.Provider value={{ glossary: GLOSSARY, modalStack, openTerm, closeTerm, closeAll }}>
      {children}
    </GlossaryContext.Provider>
  )
}

export function useGlossary() {
  const ctx = useContext(GlossaryContext)
  if (!ctx) throw new Error('useGlossary must be used within GlossaryProvider')
  return ctx
}
