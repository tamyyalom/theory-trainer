import type { Question, QuestionBank } from '../types'

function isQuestion(value: unknown): value is Question {
  if (!value || typeof value !== 'object') return false
  const q = value as Question
  return (
    typeof q.id === 'string' &&
    typeof q.text === 'string' &&
    Array.isArray(q.answers) &&
    q.answers.length >= 2 &&
    q.answers.every((a) => typeof a === 'string') &&
    typeof q.correctIndex === 'number' &&
    q.correctIndex >= 0 &&
    q.correctIndex < q.answers.length &&
    typeof q.category === 'string' &&
    (q.imageUrl === null || typeof q.imageUrl === 'string') &&
    Array.isArray(q.licenses)
  )
}

export function validateQuestionBank(data: unknown): QuestionBank {
  if (!data || typeof data !== 'object') {
    throw new Error('מאגר השאלות אינו בפורמט תקין')
  }

  const bank = data as QuestionBank
  if (!bank.meta || typeof bank.meta !== 'object') {
    throw new Error('חסרים מטא-דאטה במאגר השאלות')
  }
  if (!Array.isArray(bank.questions)) {
    throw new Error('רשימת השאלות חסרה או לא תקינה')
  }

  const invalid = bank.questions.find((q) => !isQuestion(q))
  if (invalid !== undefined) {
    throw new Error('נמצאו שאלות לא תקינות במאגר')
  }

  return bank
}
