import type { AppMode } from '../types'
import { isValidExamSessionState, type ExamSessionState } from './examSession'

export type { ExamSessionState } from './examSession'

export interface AppSession {
  mode: Exclude<AppMode, 'home'>
  theory?: { chapterId: string; sectionIndex: number }
  learn?: { category: string; index: number }
  drill?: { focusCategory: string | null; index: number }
  exam?: ExamSessionState
}

const SESSION_KEY = 'theory-trainer-session-v2'

export function loadSession(): AppSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) {
      return migrateLegacySession()
    }
    const parsed = JSON.parse(raw) as AppSession
    if (
      parsed.mode !== 'theory' &&
      parsed.mode !== 'learn' &&
      parsed.mode !== 'drill' &&
      parsed.mode !== 'exam'
    ) {
      return null
    }
    if (parsed.mode === 'exam') {
      if (!parsed.exam || !isValidExamSessionState(parsed.exam)) {
        localStorage.removeItem(SESSION_KEY)
        return null
      }
    }
    return parsed
  } catch {
    return null
  }
}

/** קריאת מפתח ישן v1 (בלי מבחן שמור) */
function migrateLegacySession(): AppSession | null {
  try {
    const raw = localStorage.getItem('theory-trainer-session-v1')
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
    if (parsed.mode === 'exam') return null
    localStorage.removeItem('theory-trainer-session-v1')
    saveSession(parsed)
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
