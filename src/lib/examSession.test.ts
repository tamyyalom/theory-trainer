import { describe, expect, it } from 'vitest'
import { EXAM_SIZE } from '../types'
import {
  buildExamSnapshot,
  isValidExamSessionState,
  questionsFromExamSnapshot,
} from './examSession'
import type { Question } from '../types'

const q = (id: string): Question => ({
  id,
  text: 't',
  answers: ['a', 'b', 'c', 'd'],
  correctIndex: 0,
  category: 'c',
  imageUrl: null,
  licenses: ['B'],
})

describe('examSession', () => {
  it('validates snapshot shape', () => {
    const ids = Array.from({ length: EXAM_SIZE }, (_, i) => String(i + 1))
    const snap = {
      questionIds: ids,
      answers: new Array(EXAM_SIZE).fill(null),
      current: 0,
      secondsLeft: 100,
    }
    expect(isValidExamSessionState(snap)).toBe(true)
    expect(isValidExamSessionState({ ...snap, questionIds: ids.slice(0, 5) })).toBe(false)
  })

  it('restores questions by id order', () => {
    const all = [q('a'), q('b'), q('c')]
    const snap = buildExamSnapshot([q('c'), q('a')], [null, 1], 1, 200)
    expect(questionsFromExamSnapshot(all, snap)?.map((x) => x.id)).toEqual(['c', 'a'])
    expect(questionsFromExamSnapshot([q('a')], snap)).toBeNull()
  })
})
