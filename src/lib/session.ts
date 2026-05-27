import type { AppMode } from '../types'

export interface AppSession {
  mode: Exclude<AppMode, 'home'>
  theory?: { chapterId: string; sectionIndex: number }
  learn?: { category: string; index: number }
  drill?: { focusCategory: string | null; index: number }
}

const SESSION_KEY = 'theory-trainer-session-v1'

export function loadSession(): AppSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppSession
    if (
      parsed.mode !== 'theory' &&
      parsed.mode !== 'learn' &&
      parsed.mode !== 'drill' &&
      parsed.mode !== 'exam'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveSession(session: AppSession | null): void {
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}
