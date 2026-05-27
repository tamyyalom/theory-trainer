import type { Progress, Question } from '../types'
import { drillQuestions, recordAnswer, toggleBookmark, isBookmarked } from './progress'

const baseProgress: Progress = {
  version: 1,
  wrongCounts: {},
  correctStreak: {},
  lastAnsweredAt: {},
  seenCount: {},
  examHistory: [],
  customNotes: {},
  bookmarkedQuestionIds: [],
}

describe('progress', () => {
  it('increments wrong count on incorrect answer', () => {
    const next = recordAnswer(baseProgress, 'q1', false)
    expect(next.wrongCounts.q1).toBe(1)
    expect(next.correctStreak.q1).toBe(0)
    expect(next.seenCount.q1).toBe(1)
  })

  it('reduces wrong count after two correct answers', () => {
    const withWrong = {
      ...baseProgress,
      wrongCounts: { q1: 1 },
      correctStreak: { q1: 1 },
      seenCount: { q1: 2 },
      lastAnsweredAt: { q1: Date.now() },
    }

    const next = recordAnswer(withWrong, 'q1', true)
    expect(next.correctStreak.q1).toBe(2)
    expect(next.wrongCounts.q1).toBe(0)
  })

  it('toggles bookmark list', () => {
    const next = toggleBookmark(baseProgress, 'q9')
    expect(isBookmarked(next, 'q9')).toBe(true)
    const back = toggleBookmark(next, 'q9')
    expect(isBookmarked(back, 'q9')).toBe(false)
  })

  it('prioritizes weaker questions in drill mode', () => {
    const questions: Question[] = [
      {
        id: 'hard',
        text: 'Hard',
        answers: ['a', 'b'],
        correctIndex: 0,
        category: 'x',
        imageUrl: null,
        licenses: ['B'],
      },
      {
        id: 'easy',
        text: 'Easy',
        answers: ['a', 'b'],
        correctIndex: 0,
        category: 'x',
        imageUrl: null,
        licenses: ['B'],
      },
    ]

    const progress: Progress = {
      ...baseProgress,
      wrongCounts: { hard: 3, easy: 0 },
      seenCount: { hard: 1, easy: 1 },
      lastAnsweredAt: { hard: Date.now(), easy: Date.now() },
    }

    const picked = drillQuestions(questions, progress, 2)
    expect(picked[0]?.id).toBe('hard')
  })
})
