import { useMemo, useState } from 'react'
import type { Progress, Question } from '../types'
import { drillQuestions, recordAnswer, weakCategories } from '../lib/progress'
import { QuestionCard } from '../components/QuestionCard'

interface Props {
  questions: Question[]
  progress: Progress
  onProgress: (p: Progress) => void
  onBack: () => void
}

export function DrillMode({ questions, progress, onProgress, onBack }: Props) {
  const weak = useMemo(() => weakCategories(questions, progress), [questions, progress])
  const [focusCategory, setFocusCategory] = useState<string | null>(null)

  // Pool is frozen at mount / when category changes — does not react to progress updates
  const [pool, setPool] = useState<Question[]>(() => drillQuestions(questions, progress, 30))

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)
  const [correct, setCorrect] = useState(0)

  const changeCategory = (category: string | null) => {
    setFocusCategory(category)
    const source = category ? questions.filter((q) => q.category === category) : questions
    setPool(drillQuestions(source, progress, 30))
    setIndex(0)
    setSelected(null)
    setRevealed(false)
  }

  const question = pool[index]

  if (!pool.length) {
    return (
      <div className="panel">
        <button type="button" className="btn ghost" onClick={onBack}>
          חזרה
        </button>
        <p>אין עדיין מספיק נתונים — עשה כמה שאלות בלימוד או מבחן.</p>
      </div>
    )
  }

  const finishSet = () => {
    setIndex((i) => {
      const next = i + 1
      if (next >= pool.length) return 0
      return next
    })
    setSelected(null)
    setRevealed(false)
  }

  const onSelect = (answerIndex: number) => {
    if (!question) return
    setSelected(answerIndex)
    setRevealed(true)
    const isCorrect = answerIndex === question.correctIndex
    setDone((d) => d + 1)
    if (isCorrect) setCorrect((c) => c + 1)
    onProgress(recordAnswer(progress, question.id, isCorrect))
  }

  if (!question) {
    return (
      <div className="panel">
        <p className="summary">
          סיימת סבב: {correct}/{done} נכונות
        </p>
        <button type="button" className="btn primary" onClick={onBack}>
          חזרה לדף הבית
        </button>
      </div>
    )
  }

  return (
    <div className="panel">
      <header className="panel-header">
        <button type="button" className="btn ghost" onClick={onBack}>
          ← חזרה
        </button>
        <h1>תרגול חכם</h1>
      </header>

      {weak.length > 0 && (
        <div className="weak-box">
          <p className="weak-title">נושאים חלשים</p>
          <div className="chips">
            <button
              type="button"
              className={`chip ${focusCategory === null ? 'active' : ''}`}
              onClick={() => changeCategory(null)}
            >
              הכל
            </button>
            {weak.slice(0, 5).map((w) => (
              <button
                key={w.category}
                type="button"
                className={`chip ${focusCategory === w.category ? 'active' : ''}`}
                onClick={() => changeCategory(w.category)}
              >
                {w.category} ({w.wrong})
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="counter">
        {index + 1}/{pool.length} · בסבב: {correct}/{done || 0}
      </p>

      <QuestionCard
        question={question}
        selectedIndex={selected}
        revealed={revealed}
        onSelect={onSelect}
      />

      {revealed && (
        <button type="button" className="btn primary full" onClick={finishSet}>
          {index + 1 >= pool.length ? 'סיים סבב' : 'המשך'}
        </button>
      )}
    </div>
  )
}
