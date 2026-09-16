import { X } from '@phosphor-icons/react'
import { useEffect, useRef, type ReactNode } from 'react'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      aria-labelledby="modal-title"
      className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 backdrop:bg-ink/40 open:animate-none"
    >
      <div className="flex items-center justify-between">
        <h2 id="modal-title" className="font-display text-lg font-semibold text-ink">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="touch-manipulation rounded-full p-1.5 text-muted hover:bg-paper-dim hover:text-ink"
        >
          <X className="h-[18px] w-[18px]" weight="bold" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </dialog>
  )
}
