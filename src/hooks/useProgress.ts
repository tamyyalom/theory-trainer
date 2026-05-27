import { useCallback, useEffect, useState } from 'react'
import type { Progress } from '../types'
import { emptyProgress, loadProgress, saveProgress } from '../lib/storage'

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const update = useCallback((updater: (prev: Progress) => Progress) => {
    setProgress((prev) => updater(prev))
  }, [])

  const reset = useCallback(() => {
    setProgress(emptyProgress())
  }, [])

  return { progress, update, reset, setProgress }
}
