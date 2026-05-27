import { emptyProgress, importProgressFile, loadProgress } from './storage'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty progress when storage is missing', () => {
    expect(loadProgress()).toEqual(emptyProgress())
  })

  it('merges imported progress with defaults', async () => {
    const file = new File(
      [
        JSON.stringify({
          version: 1,
          wrongCounts: { q1: 2 },
        }),
      ],
      'progress.json',
      { type: 'application/json' },
    )

    const parsed = await importProgressFile(file)
    expect(parsed.version).toBe(1)
    expect(parsed.wrongCounts.q1).toBe(2)
    expect(parsed.examHistory).toEqual([])
    expect(parsed.correctStreak).toEqual({})
  })
})
