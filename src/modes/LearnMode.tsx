import { useEffect, useMemo, useState } from 'react'
import type { Progress, Question } from '../types'
import { recordAnswer, isBookmarked, toggleBookmark } from '../lib/progress'
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

type LearnFilter = 'all' | 'bookmarked'

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
  const [learnFilter, setLearnFilter] = useState<LearnFilter>('all')
  const [category, setCategory] = useState(
    () => initialCategory && categories.includes(initialCategory) ? initialCategory : (categories[0] ?? ''),
  )
  const filtered = useMemo(() => {
    const base = questions.filter((q) => q.category === category)
    if (learnFilter !== 'bookmarked') return base
    const marked = new Set(progress.bookmarkedQuestionIds ?? [])
    return base.filter((q) => marked.has(q.id))
  }, [questions, category, learnFilter, progress.bookmarkedQuestionIds])
  const [index, setIndex] = useState(() =>
    Math.min(initialIndex, Math.max(filtered.length - 1, 0)),
  )
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const safeIndex = useMemo(
    () => (filtered.length === 0 ? 0 : Math.min(index, filtered.length - 1)),
    [index, filtered.length],
  )

  useEffect(() => {
    onSessionChange?.({ category, index: safeIndex })
  }, [category, safeIndex, onSessionChange])

  const question = filtered[safeIndex]

  if (filtered.length === 0) {
    return (
      <div className="panel mode-panel">
        <header className="mode-header">
          <button type="button" className="btn ghost" onClick={onBack}>
            {labelBack('חזרה')}
          </button>
          <div className="mode-header-copy">
            <p className="mode-kicker">מצב לימוד</p>
            <h1>לימוד לפי נושא</h1>
          </div>
        </header>
        <label className="field mode-filter">
          <span className="mode-label">נושא</span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setIndex(0)
              setLearnFilter('all')
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
        <div className="learn-filter-row">
          <span className="mode-label">תצוגה</span>
          <div className="chips" role="group" aria-label="סינון שאלות">
            <button
              type="button"
              className={`chip ${learnFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                setLearnFilter('all')
                setIndex(0)
                setSelected(null)
                setRevealed(false)
              }}
            >
              כל השאלות
            </button>
            <button
              type="button"
              className={`chip ${learnFilter === 'bookmarked' ? 'active' : ''}`}
              onClick={() => {
                setLearnFilter('bookmarked')
                setIndex(0)
                setSelected(null)
                setRevealed(false)
              }}
            >
              מסומנות לחזרה
            </button>
          </div>
        </div>
        <p className="counter mode-counter">
          {learnFilter === 'bookmarked'
            ? 'אין שאלות מסומנות בנושא הזה — לחץ על הכוכב ליד מזהה השאלה כדי לסמן.'
            : 'אין שאלות בקטגוריה.'}
        </p>
        {learnFilter === 'bookmarked' && (
          <button type="button" className="btn secondary" onClick={() => setLearnFilter('all')}>
            הצג את כל השאלות בנושא
          </button>
        )}
      </div>
    )
  }

  const next = () => {
    setSelected(null)
    setRevealed(false)
    setIndex((i) => {
      const cur = Math.min(i, filtered.length - 1)
      return (cur + 1) % filtered.length
    })
  }

  const prev = () => {
    setSelected(null)
    setRevealed(false)
    setIndex((i) => {
      const cur = Math.min(i, filtered.length - 1)
      return (cur - 1 + filtered.length) % filtered.length
    })
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
            setLearnFilter('all')
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

      <div className="learn-filter-row">
        <span className="mode-label">תצוגה</span>
        <div className="chips" role="group" aria-label="סינון שאלות">
          <button
            type="button"
            className={`chip ${learnFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setLearnFilter('all')
              setIndex(0)
              setSelected(null)
              setRevealed(false)
            }}
          >
            כל השאלות
          </button>
          <button
            type="button"
            className={`chip ${learnFilter === 'bookmarked' ? 'active' : ''}`}
            onClick={() => {
              setLearnFilter('bookmarked')
              setIndex(0)
              setSelected(null)
              setRevealed(false)
            }}
          >
            מסומנות לחזרה
          </button>
        </div>
      </div>

      <p className="counter mode-counter">
        שאלה {safeIndex + 1} מתוך {filtered.length}
      </p>

      <QuestionCard
        question={question}
        selectedIndex={selected}
        revealed={revealed}
        onSelect={onSelect}
        bookmark={{
          active: isBookmarked(progress, question.id),
          onToggle: () => onProgress(toggleBookmark(progress, question.id)),
        }}
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
