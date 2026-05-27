import type { Question } from '../types'
import { EXAM_MINUTES, EXAM_SIZE } from '../types'

export interface ExamSessionState {
  questionIds: string[]
  answers: (number | null)[]
  current: number
  secondsLeft: number
}

export function isValidExamSessionState(value: unknown): value is ExamSessionState {
  if (!value || typeof value !== 'object') return false
  const e = value as ExamSessionState
  if (!Array.isArray(e.questionIds) || e.questionIds.length !== EXAM_SIZE) return false
  if (!e.questionIds.every((id) => typeof id === 'string' && id.length > 0)) return false
  if (!Array.isArray(e.answers) || e.answers.length !== EXAM_SIZE) return false
  if (!e.answers.every((a) => a === null || (typeof a === 'number' && a >= 0 && a < 10)))
    return false
  if (typeof e.current !== 'number' || e.current < 0 || e.current >= EXAM_SIZE) return false
  const maxSec = EXAM_MINUTES * 60 + 120
  if (typeof e.secondsLeft !== 'number' || e.secondsLeft < 0 || e.secondsLeft > maxSec) return false
  return true
}

/** מחזיר את רשימת השאלות לפי הסדר השמור, או null אם חסרות מהמאגר */
export function questionsFromExamSnapshot(
  allQuestions: Question[],
  snap: ExamSessionState,
): Question[] | null {
  const map = new Map(allQuestions.map((q) => [q.id, q]))
  const list: Question[] = []
  for (const id of snap.questionIds) {
    const q = map.get(id)
    if (!q) return null
    list.push(q)
  }
  return list
}

export function buildExamSnapshot(
  examQuestions: Question[],
  answers: (number | null)[],
  current: number,
  secondsLeft: number,
): ExamSessionState {
  return {
    questionIds: examQuestions.map((q) => q.id),
    answers: [...answers],
    current,
    secondsLeft,
  }
}
