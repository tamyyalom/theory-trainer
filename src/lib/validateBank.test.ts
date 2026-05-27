import { validateQuestionBank } from './validateBank'

const validQuestion = {
  id: '1',
  text: 'שאלה',
  answers: ['א', 'ב'],
  correctIndex: 0,
  category: 'כללי',
  imageUrl: null,
  licenses: ['B'],
}

describe('validateQuestionBank', () => {
  it('accepts a valid bank', () => {
    const bank = validateQuestionBank({
      meta: { license: 'B', language: 'he', importedAt: '', source: '', total: 1 },
      questions: [validQuestion],
    })
    expect(bank.questions).toHaveLength(1)
  })

  it('rejects bank with too few answers', () => {
    expect(() =>
      validateQuestionBank({
        meta: {},
        questions: [{ ...validQuestion, answers: ['א'] }],
      }),
    ).toThrow('לא תקינות')
  })

  it('rejects non-object payload', () => {
    expect(() => validateQuestionBank(null)).toThrow('פורמט תקין')
  })
})
