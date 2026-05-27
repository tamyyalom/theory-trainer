import { useContext } from 'react'
import { ConfirmContext } from '../contexts/confirmContext'

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}

export type { ConfirmOptions } from '../contexts/confirmContext'
