import { useMemo, useRef } from 'react'
import type { AppMode, Progress, Question, TheoryGuide } from '../types'
import { loadTheoryProgress } from '../lib/theoryProgress'
import { PASS_SCORE, PASS_STREAK } from '../types'
import { masteryPercent, readiness, readinessLabel, weakCategories } from '../lib/progress'
import type { AppSession } from '../lib/session'
import { ARROW_FORWARD } from '../lib/rtl'

interface Props {
  questions: Question[]
  progress: Progress
  onMode: (mode: AppMode) => void
  onResetQuestions: () => void
  onResetTheory: () => void
  onExport: () => void
  onImport: (file: File) => Promise<void>
  savedSession: AppSession | null
  onResume: () => void
  theoryGuide: TheoryGuide | null
}

const modeLabels: Record<Exclude<AppMode, 'home'>, string> = {
  theory: 'תיאוריה',
  learn: 'שאלות',
  drill: 'תרגול',
  exam: 'מבחן',
}

export function HomeScreen({
  questions,
  progress,
  onMode,
  onResetQuestions,
  onResetTheory,
  onExport,
  onImport,
  savedSession,
  onResume,
  theoryGuide,
}: Props) {
  const readinessLevel = useMemo(() => readiness(progress), [progress])
  const mastery = useMemo(() => masteryPercent(questions, progress), [questions, progress])
  const weak = useMemo(() => weakCategories(questions, progress).slice(0, 3), [questions, progress])
  const theoryTotal = useMemo(
    () => theoryGuide?.chapters.reduce((n, ch) => n + ch.sections.length, 0) ?? 0,
    [theoryGuide],
  )
  const theoryRead = (() => {
    if (!theoryGuide) return 0
    const readIds = new Set(loadTheoryProgress().readSectionIds)
    return theoryGuide.chapters.reduce(
      (n, ch) => n + ch.sections.filter((s) => readIds.has(s.id)).length,
      0,
    )
  })()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <section className="panel home-panel">
      <header className="home-hero">
        <div>
          <p className="home-kicker">Theory Trainer</p>
          <h1>מוכנים לתיאוריה, בצורה חכמה</h1>
          <p className="home-subtitle">
            לומדים את ההיגיון, מתרגלים שאלות, וניגשים למבחן רק כשבאמת מוכנים.
          </p>
        </div>
        <div className="home-glow" aria-hidden="true" />
      </header>

      <div className={`status status-${readinessLevel}`}>
        <p className="status-title">{readinessLabel(readinessLevel)}</p>
        <p className="status-sub">
          {PASS_STREAK} מבחנים אחרונים · ציון עובר {PASS_SCORE}
        </p>
      </div>

      {savedSession && (
        <button type="button" className="btn secondary full resume-btn" onClick={onResume}>
          המשך {modeLabels[savedSession.mode]} מאיפה שהפסקת
        </button>
      )}

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

      <div className="home-actions-grid">
        {theoryGuide && (
          <button type="button" className="action-card action-card-primary" onClick={() => onMode('theory')}>
            <span className="action-card-title">תיאוריה מקוצרת</span>
            <span className="action-card-subtitle">להבין את ההיגיון לפני תרגול</span>
            <span className="action-card-arrow">{ARROW_FORWARD}</span>
          </button>
        )}
        <button
          type="button"
          className={theoryGuide ? 'action-card' : 'action-card action-card-primary'}
          onClick={() => onMode('learn')}
        >
          <span className="action-card-title">תרגול לפי נושא</span>
          <span className="action-card-subtitle">שאלות ממוקדות לפי קטגוריה</span>
          <span className="action-card-arrow">{ARROW_FORWARD}</span>
        </button>
        <button type="button" className="action-card" onClick={() => onMode('drill')}>
          <span className="action-card-title">תרגול חכם</span>
          <span className="action-card-subtitle">חיזוק חולשות אוטומטי</span>
          <span className="action-card-arrow">{ARROW_FORWARD}</span>
        </button>
        <button type="button" className="action-card" onClick={() => onMode('exam')}>
          <span className="action-card-title">מבחן מלא</span>
          <span className="action-card-subtitle">סימולציה מלאה עם טיימר</span>
          <span className="action-card-arrow">{ARROW_FORWARD}</span>
        </button>
      </div>

      {theoryGuide && theoryTotal > 0 && (
        <p className="muted theory-home-hint">
          מומלץ: קודם תיאוריה ({theoryRead}/{theoryTotal} נושאים), אחר כך שאלות.
        </p>
      )}

      <div className="row home-tools">
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
        <button type="button" className="btn ghost danger" onClick={onResetQuestions}>
          איפוס שאלות
        </button>
        {theoryGuide && (
          <button type="button" className="btn ghost danger" onClick={onResetTheory}>
            איפוס לימוד תיאוריה
          </button>
        )}
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
