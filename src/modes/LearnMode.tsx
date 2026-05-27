import { useMemo, useState } from 'react'
import type { Progress, Question } from '../types'
import { recordAnswer } from '../lib/progress'
import { QuestionCard } from '../components/QuestionCard'

interface Props {
  questions: Question[]
  progress: Progress
  onProgress: (p: Progress) => void
  onBack: () => void
}

export function LearnMode({ questions, progress, onProgress, onBack }: Props) {
  const categories = useMemo(
    () => [...new Set(questions.map((q) => q.category))].sort(),
    [questions],
  )
  const [category, setCategory] = useState(categories[0] ?? '')
  const filtered = useMemo(
    () => questions.filter((q) => q.category === category),
    [questions, category],
  )
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

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
    <div className="panel">
      <header className="panel-header">
        <button type="button" className="btn ghost" onClick={onBack}>
          ← חזרה
        </button>
        <h1>לימוד לפי נושא</h1>
      </header>

      <label className="field">
        <span>נושא</span>
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

      <p className="counter">
        שאלה {index + 1} מתוך {filtered.length}
      </p>

      <QuestionCard
        question={question}
        selectedIndex={selected}
        revealed={revealed}
        onSelect={onSelect}
      />

      <div className="row">
        <button type="button" className="btn secondary" onClick={prev}>
          הקודם
        </button>
        <button type="button" className="btn primary" onClick={next}>
          הבא
        </button>
      </div>
    </div>
  )
}
