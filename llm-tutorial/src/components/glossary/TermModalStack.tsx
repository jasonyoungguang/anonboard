import { createPortal } from 'react-dom'
import { useGlossary } from './GlossaryProvider'
import { TermModal } from './TermModal'

export function TermModalStack() {
  const { glossary, modalStack, closeTerm } = useGlossary()

  if (modalStack.length === 0) return null

  return createPortal(
    <>
      {/* Single shared backdrop */}
      <div
        className="modal-backdrop fixed inset-0 animate-fade-in"
        style={{ zIndex: 100 }}
        onClick={closeTerm}
      />
      {/* Modal stack */}
      {modalStack.map((termId, index) => {
        const entry = glossary[termId]
        if (!entry) return null
        return (
          <TermModal
            key={`${termId}-${index}`}
            entry={entry}
            stackIndex={index}
            stackSize={modalStack.length}
            onClose={closeTerm}
          />
        )
      })}
    </>,
    document.body
  )
}
