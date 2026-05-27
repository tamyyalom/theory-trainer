import { useEffect, useMemo, useState } from 'react'
import type { Progress, Question } from '../types'
import { recordAnswer } from '../lib/progress'
import { QuestionCard } from '../components/QuestionCard'
import { labelBack } from '../lib/rtl'

interface Props {
  questions: Question[]
  progress: Progress
  onProgress: (p: Progress) => void
  onBack: () => void
  initialCategory?: string
  initialIndex?: number
  onSessionChange?: (payload: { category: string; index: number }) => void
}

export function LearnMode({
  questions,
  progress,
  onProgress,
  onBack,
  initialCategory,
  initialIndex = 0,
  onSessionChange,
}: Props) {
  const categories = useMemo(
    () => [...new Set(questions.map((q) => q.category))].sort(),
    [questions],
  )
  const [category, setCategory] = useState(
    () => initialCategory && categories.includes(initialCategory) ? initialCategory : (categories[0] ?? ''),
  )
  const filtered = useMemo(
    () => questions.filter((q) => q.category === category),
    [questions, category],
  )
  const [index, setIndex] = useState(() =>
    Math.min(initialIndex, Math.max(filtered.length - 1, 0)),
  )
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    onSessionChange?.({ category, index })
  }, [category, index, onSessionChange])

  const question = filtered[index]

  if (!question) {
    return (
      <div className="panel">
        <button type="button" className="btn ghost" onClick={onBack}>
          חזרה
        </button>
        <p>אין שאלות בקטגוריה.</p>
      </div>
    )
  }

  const next = () => {
    setSelected(null)
    setRevealed(false)
    setIndex((i) => (i + 1) % filtered.length)
  }

  const prev = () => {
    setSelected(null)
    setRevealed(false)
    setIndex((i) => (i - 1 + filtered.length) % filtered.length)
  }

  const onSelect = (answerIndex: number) => {
    setSelected(answerIndex)
    setRevealed(true)
    const correct = answerIndex === question.correctIndex
    onProgress(recordAnswer(progress, question.id, correct))
  }

  return (
    <div className="panel mode-panel">
      <header className="mode-header">
        <button type="button" className="btn ghost" onClick={onBack}>
          {labelBack('חזרה')}
        </button>
        <div className="mode-header-copy">
          <p className="mode-kicker">מצב לימוד</p>
          <h1>לימוד לפי נושא</h1>
          <p className="mode-subtitle">מתרגלים שאלה-שאלה עם פתרון מיידי להבנה וזיכרון טובים יותר.</p>
        </div>
      </header>

      <label className="field mode-filter">
        <span className="mode-label">נושא</span>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setIndex(0)
            setSelected(null)
            setRevealed(false)
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <p className="counter mode-counter">
        שאלה {index + 1} מתוך {filtered.length}
      </p>

      <QuestionCard
        question={question}
        selectedIndex={selected}
        revealed={revealed}
        onSelect={onSelect}
      />

      <div className="row mode-actions-row">
        <button type="button" className="btn secondary mode-action-btn" onClick={prev}>
          הקודם
        </button>
        <button type="button" className="btn primary mode-action-btn" onClick={next}>
          הבא
        </button>
      </div>
    </div>
  )
}
