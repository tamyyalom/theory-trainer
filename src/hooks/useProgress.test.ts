import { act, renderHook, waitFor } from '@testing-library/react'
import { STORAGE_KEY } from '../lib/storage'
import { useProgress } from './useProgress'

describe('useProgress', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reset clears persisted progress', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        wrongCounts: { q1: 5 },
        correctStreak: {},
        lastAnsweredAt: {},
        seenCount: { q1: 10 },
        examHistory: [{ id: '1', finishedAt: 1, score: 20, total: 30, passed: false }],
        customNotes: {},
      }),
    )

    const { result } = renderHook(() => useProgress())
    expect(result.current.progress.wrongCounts.q1).toBe(5)

    act(() => {
      result.current.reset()
    })

    await waitFor(() => {
      expect(result.current.progress.wrongCounts).toEqual({})
      expect(result.current.progress.examHistory).toEqual([])
    })

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.wrongCounts).toEqual({})
    expect(stored.examHistory).toEqual([])
  })
})
