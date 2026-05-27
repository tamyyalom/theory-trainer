import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ConfirmContext,
  type ConfirmContextValue,
  type ConfirmOptions,
} from '../contexts/confirmContext'

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  const confirm = useCallback<ConfirmContextValue['confirm']>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve })
    })
  }, [])

  const close = useCallback((result: boolean) => {
    setPending((current) => {
      current?.resolve(result)
      return null
    })
  }, [])

  useEffect(() => {
    if (!pending) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending, close])

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && (
        <div className="confirm-backdrop" role="presentation" onClick={() => close(false)}>
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="confirm-title">
              {pending.title}
            </h2>
            <p id="confirm-message" className="confirm-message">
              {pending.message}
            </p>
            <div className="confirm-actions">
              <button
                ref={cancelRef}
                type="button"
                className="btn secondary"
                onClick={() => close(false)}
              >
                {pending.cancelLabel ?? 'ביטול'}
              </button>
              <button
                type="button"
                className={`btn ${pending.danger ? 'danger' : 'primary'}`}
                onClick={() => close(true)}
              >
                {pending.confirmLabel ?? 'אישור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
