import type { Progress } from '../types'

export const STORAGE_KEY = 'theory-trainer-progress-v1'

export function emptyProgress(): Progress {
  return {
    version: 1,
    wrongCounts: {},
    correctStreak: {},
    lastAnsweredAt: {},
    seenCount: {},
    examHistory: [],
    customNotes: {},
    bookmarkedQuestionIds: [],
  }
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Progress
    if (parsed.version !== 1) return emptyProgress()
    return { ...emptyProgress(), ...parsed }
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(progress: Progress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function exportProgress(progress: Progress): void {
  const blob = new Blob([JSON.stringify(progress, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `theory-trainer-progress-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importProgressFile(file: File): Promise<Progress> {
  return file.text().then((raw) => {
    const parsed = JSON.parse(raw) as Progress
    if (parsed.version !== 1) throw new Error('קובץ לא תואם')
    return { ...emptyProgress(), ...parsed }
  })
}
