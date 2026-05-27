export interface Question {
  id: string
  text: string
  answers: string[]
  correctIndex: number
  category: string
  imageUrl: string | null
  licenses: string[]
}

export interface QuestionBank {
  meta: {
    license: string
    language: string
    importedAt: string
    source: string
    total: number
  }
  questions: Question[]
}

export interface ExamResult {
  id: string
  finishedAt: number
  score: number
  total: number
  passed: boolean
}

export interface Progress {
  version: 1
  wrongCounts: Record<string, number>
  correctStreak: Record<string, number>
  lastAnsweredAt: Record<string, number>
  seenCount: Record<string, number>
  examHistory: ExamResult[]
  customNotes: Record<string, string>
}

export type AppMode = 'home' | 'learn' | 'drill' | 'exam'

export const EXAM_SIZE = 30
export const EXAM_MINUTES = 40
export const PASS_SCORE = 26
export const PASS_STREAK = 3
