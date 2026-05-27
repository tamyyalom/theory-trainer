import { useCallback, useEffect, useState } from 'react'
import type { Progress } from '../types'
import { loadProgress, saveProgress } from '../lib/storage'

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const update = useCallback((updater: (prev: Progress) => Progress) => {
    setProgress((prev) => updater(prev))
  }, [])

  const reset = useCallback(() => {
    const empty = loadProgress()
    localStorage.removeItem('theory-trainer-progress-v1')
    setProgress({ ...empty, wrongCounts: {}, correctStreak: {}, lastAnsweredAt: {}, seenCount: {}, examHistory: [], customNotes: {} })
  }, [])

  return { progress, update, reset, setProgress }
}
