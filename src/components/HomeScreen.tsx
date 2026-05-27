import { useRef } from 'react'
import type { AppMode, Progress, Question } from '../types'
import { PASS_SCORE, PASS_STREAK } from '../types'
import { masteryPercent, readiness, readinessLabel, weakCategories } from '../lib/progress'

interface Props {
  questions: Question[]
  progress: Progress
  onMode: (mode: AppMode) => void
  onReset: () => void
  onExport: () => void
  onImport: (file: File) => Promise<void>
}

export function HomeScreen({
  questions,
  progress,
  onMode,
  onReset,
  onExport,
  onImport,
}: Props) {
  const readinessLevel = readiness(progress)
  const mastery = masteryPercent(questions, progress)
  const weak = weakCategories(questions, progress).slice(0, 3)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <section className="panel">
      <header className="panel-header">
        <h1>Theory Trainer</h1>
      </header>

      <div className={`status status-${readinessLevel}`}>
        <p className="status-title">{readinessLabel(readinessLevel)}</p>
        <p className="status-sub">
          {PASS_STREAK} מבחנים אחרונים · ציון עובר {PASS_SCORE}
        </p>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <p className="stat-value">{questions.length}</p>
          <p className="stat-label">שאלות במאגר</p>
        </article>
        <article className="stat-card">
          <p className="stat-value">{mastery}%</p>
          <p className="stat-label">שליטה מוערכת</p>
        </article>
        <article className="stat-card">
          <p className="stat-value">{progress.examHistory.length}</p>
          <p className="stat-label">מבחנים שבוצעו</p>
        </article>
      </div>

      {weak.length > 0 && (
        <div className="weak-box">
          <p className="weak-title">נושאים לחיזוק</p>
          <div className="chips">
            {weak.map((entry) => (
              <span key={entry.category} className="chip active">
                {entry.category} ({entry.wrong})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="stack">
        <button type="button" className="btn primary full" onClick={() => onMode('learn')}>
          לימוד לפי נושא
        </button>
        <button type="button" className="btn secondary full" onClick={() => onMode('drill')}>
          תרגול חכם
        </button>
        <button type="button" className="btn secondary full" onClick={() => onMode('exam')}>
          מבחן מלא
        </button>
      </div>

      <div className="row">
        <button type="button" className="btn ghost" onClick={onExport}>
          יצוא התקדמות
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            inputRef.current?.click()
          }}
        >
          יבוא התקדמות
        </button>
        <button type="button" className="btn ghost danger" onClick={onReset}>
          איפוס
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            await onImport(file)
            e.currentTarget.value = ''
          }}
        />
      </div>
    </section>
  )
}
