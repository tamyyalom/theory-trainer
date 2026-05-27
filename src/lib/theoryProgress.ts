const THEORY_PROGRESS_KEY = 'theory-trainer-theory-progress-v1'

export interface TheoryProgress {
  version: 1
  readSectionIds: string[]
  lastChapterId?: string
  lastSectionIndex?: number
}

export function emptyTheoryProgress(): TheoryProgress {
  return { version: 1, readSectionIds: [] }
}

export function loadTheoryProgress(): TheoryProgress {
  try {
    const raw = localStorage.getItem(THEORY_PROGRESS_KEY)
    if (!raw) return emptyTheoryProgress()
    const parsed = JSON.parse(raw) as TheoryProgress
    if (parsed.version !== 1) return emptyTheoryProgress()
    return { ...emptyTheoryProgress(), ...parsed }
  } catch {
    return emptyTheoryProgress()
  }
}

export function saveTheoryProgress(progress: TheoryProgress): void {
  localStorage.setItem(THEORY_PROGRESS_KEY, JSON.stringify(progress))
}

export function clearTheoryProgress(): void {
  localStorage.removeItem(THEORY_PROGRESS_KEY)
}

export function markSectionRead(progress: TheoryProgress, sectionId: string): TheoryProgress {
  if (progress.readSectionIds.includes(sectionId)) return progress
  return {
    ...progress,
    readSectionIds: [...progress.readSectionIds, sectionId],
  }
}

export function chapterProgress(
  progress: TheoryProgress,
  chapter: { sections: { id: string }[] },
): { read: number; total: number } {
  const total = chapter.sections.length
  const read = chapter.sections.filter((s) => progress.readSectionIds.includes(s.id)).length
  return { read, total }
}
