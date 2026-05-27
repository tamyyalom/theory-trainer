import { chapterProgress, emptyTheoryProgress, markSectionRead } from './theoryProgress'

describe('theoryProgress', () => {
  it('marks section as read once', () => {
    const base = emptyTheoryProgress()
    const once = markSectionRead(base, 's1')
    const twice = markSectionRead(once, 's1')
    expect(once.readSectionIds).toEqual(['s1'])
    expect(twice.readSectionIds).toEqual(['s1'])
  })

  it('counts chapter progress', () => {
    const progress = markSectionRead(emptyTheoryProgress(), 'a')
    const chapter = {
      sections: [{ id: 'a' }, { id: 'b' }],
    }
    expect(chapterProgress(progress, chapter)).toEqual({ read: 1, total: 2 })
  })
})
