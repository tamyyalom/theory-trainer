import { useEffect, useMemo, useState } from 'react'
import type { Progress, Question } from '../types'
import { drillQuestions, recordAnswer, weakCategories } from '../lib/progress'
import { QuestionCard } from '../components/QuestionCard'
import { labelBack } from '../lib/rtl'

interface Props {
  questions: Question[]
  progress: Progress
  onProgress: (p: Progress) => void
  onBack: () => void
  initialFocusCategory?: string | null
  initialIndex?: number
  onSessionChange?: (payload: { focusCategory: string | null; index: number }) => void
}

type CategoryStats = Record<string, { correct: number; total: number }>

export function DrillMode({
  questions,
  progress,
  onProgress,
  onBack,
  initialFocusCategory = null,
  initialIndex = 0,
  onSessionChange,
}: Props) {
  const weak = useMemo(() => weakCategories(questions, progress), [questions, progress])

  const [focusCategory, setFocusCategory] = useState<string | null>(initialFocusCategory)
  const [pool, setPool] = useState<Question[]>(() => {
    const source = initialFocusCategory
      ? questions.filter((q) => q.category === initialFocusCategory)
      : questions
    return drillQuestions(source, progress, 30)
  })

  const [index, setIndex] = useState(() => Math.min(initialIndex, Math.max(pool.length - 1, 0)))
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({})
  const [showRoundSummary, setShowRoundSummary] = useState(false)

  useEffect(() => {
    onSessionChange?.({ focusCategory, index })
  }, [focusCategory, index, onSessionChange])

  const changeCategory = (category: string | null) => {
    setFocusCategory(category)
    const source = category ? questions.filter((q) => q.category === category) : questions
    setPool(drillQuestions(source, progress, 30))
    setIndex(0)
    setSelected(null)
    setRevealed(false)
    setDone(0)
    setCorrect(0)
    setCategoryStats({})
    setShowRoundSummary(false)
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
    const atEnd = index + 1 >= pool.length
    if (atEnd) {
      setShowRoundSummary(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
    setRevealed(false)
  }

  const startNewRound = () => {
    const source = focusCategory ? questions.filter((q) => q.category === focusCategory) : questions
    setPool(drillQuestions(source, progress, 30))
    setIndex(0)
    setSelected(null)
    setRevealed(false)
    setDone(0)
    setCorrect(0)
    setCategoryStats({})
    setShowRoundSummary(false)
  }

  const onSelect = (answerIndex: number) => {
    if (!question) return
    setSelected(answerIndex)
    setRevealed(true)
    const isCorrect = answerIndex === question.correctIndex
    setDone((d) => d + 1)
    if (isCorrect) setCorrect((c) => c + 1)
    setCategoryStats((prev) => {
      const cat = question.category
      const entry = prev[cat] ?? { correct: 0, total: 0 }
      return {
        ...prev,
        [cat]: {
          correct: entry.correct + (isCorrect ? 1 : 0),
          total: entry.total + 1,
        },
      }
    })
    onProgress(recordAnswer(progress, question.id, isCorrect))
  }

  if (showRoundSummary) {
    const entries = Object.entries(categoryStats).sort((a, b) => b[1].total - a[1].total)
    return (
      <div className="panel mode-panel">
        <header className="mode-header">
          <div className="mode-header-copy">
            <p className="mode-kicker">סיכום</p>
            <h1>סיכום סבב</h1>
          </div>
        </header>
        <p className="summary">
          {correct}/{done} נכונות בסבב
        </p>
        {entries.length > 0 ? (
          <ul className="round-summary">
            {entries.map(([cat, stats]) => (
              <li key={cat}>
                <span>{cat}</span>
                <span>
                  {stats.correct}/{stats.total}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">אין נתונים לפי קטגוריה בסבב זה.</p>
        )}
        <div className="stack">
          <button type="button" className="btn primary full" onClick={startNewRound}>
            סבב חדש
          </button>
          <button type="button" className="btn ghost full" onClick={onBack}>
            חזרה לדף הבית
          </button>
        </div>
      </div>
    )
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
    <div className="panel mode-panel">
      <header className="mode-header">
        <button type="button" className="btn ghost" onClick={onBack}>
          {labelBack('חזרה')}
        </button>
        <div className="mode-header-copy">
          <p className="mode-kicker">מצב תרגול</p>
          <h1>תרגול חכם</h1>
          <p className="mode-subtitle">שאלות מותאמות חולשות כדי לחזק בדיוק את מה שצריך.</p>
        </div>
      </header>

      {weak.length > 0 && (
        <div className="weak-box mode-weak-box">
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

      <p className="counter mode-counter">
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
