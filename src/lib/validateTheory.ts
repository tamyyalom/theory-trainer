import type { TheoryChapter, TheoryGuide } from '../types'

function isSection(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const s = value as {
    id?: unknown
    title?: unknown
    body?: unknown
    imageUrl?: unknown
    imageCaption?: unknown
  }
  return (
    typeof s.id === 'string' &&
    typeof s.title === 'string' &&
    typeof s.body === 'string' &&
    (s.imageUrl === undefined || typeof s.imageUrl === 'string') &&
    (s.imageCaption === undefined || typeof s.imageCaption === 'string')
  )
}

function isChapter(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const c = value as TheoryChapter
  return (
    typeof c.id === 'string' &&
    typeof c.title === 'string' &&
    typeof c.description === 'string' &&
    typeof c.questionCategory === 'string' &&
    typeof c.order === 'number' &&
    Array.isArray(c.sections) &&
    c.sections.length > 0 &&
    c.sections.every(isSection)
  )
}

export function validateTheoryGuide(data: unknown): TheoryGuide {
  if (!data || typeof data !== 'object') {
    throw new Error('מדריך התיאוריה אינו בפורמט תקין')
  }
  const guide = data as TheoryGuide
  if (!Array.isArray(guide.chapters) || !guide.chapters.every(isChapter)) {
    throw new Error('פרקי התיאוריה חסרים או לא תקינים')
  }
  return guide
}
