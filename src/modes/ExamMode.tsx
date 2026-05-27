import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Progress, Question } from '../types'
import { EXAM_MINUTES, EXAM_SIZE, PASS_SCORE } from '../types'
import { pickRandom } from '../lib/shuffle'
import { recordAnswer, recordExam } from '../lib/progress'
import { QuestionCard } from '../components/QuestionCard'
import { ExamTimer } from '../components/ExamTimer'

interface Props {
  questions: Question[]
  progress: Progress
  onProgress: (p: Progress) => void
  onBack: () => void
}

type Phase = 'intro' | 'active' | 'review' | 'done'

export function ExamMode({ questions, progress, onProgress, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [examQuestions, setExamQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [secondsLeft, setSecondsLeft] = useState(EXAM_MINUTES * 60)

  const start = () => {
    const picked = pickRandom(questions, EXAM_SIZE)
    setExamQuestions(picked)
    setAnswers(new Array(picked.length).fill(null))
    setCurrent(0)
    setSecondsLeft(EXAM_MINUTES * 60)
    setPhase('active')
  }

  const submit = useCallback(() => {
    let score = 0
    examQuestions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score++
    })
    let next = progress
    examQuestions.forEach((q, i) => {
      const picked = answers[i]
      if (picked === null) return
      next = recordAnswer(next, q.id, picked === q.correctIndex)
    })
    next = recordExam(next, score, examQuestions.length)
    onProgress(next)
    setPhase('done')
    setScore(score)
  }, [answers, examQuestions, onProgress, progress])

  const [score, setScore] = useState(0)

  useEffect(() => {
    if (phase !== 'active') return
    if (secondsLeft <= 0) {
      submit()
      return
    }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase, secondsLeft, submit])

  const q = examQuestions[current]
  const answeredCount = answers.filter((a) => a !== null).length

  const reviewStats = useMemo(() => {
    if (phase !== 'review' && phase !== 'done') return null
    let correct = 0
    examQuestions.forEach((question, i) => {
      if (answers[i] === question.correctIndex) correct++
    })
    return { correct, total: examQuestions.length }
  }, [phase, examQuestions, answers])

  if (phase === 'intro') {
    return (
      <div className="panel">
        <header className="panel-header">
          <button type="button" className="btn ghost" onClick={onBack}>
            ← חזרה
          </button>
          <h1>מבחן מלא</h1>
        </header>
        <ul className="exam-rules">
          <li>{EXAM_SIZE} שאלות</li>
          <li>{EXAM_MINUTES} דקות</li>
          <li>ציון עובר: {PASS_SCORE} ומעלה</li>
          <li>בלי הצגת תשובות במהלך המבחן</li>
        </ul>
        <button type="button" className="btn primary full" onClick={start}>
          התחל מבחן
        </button>
      </div>
    )
  }

  if (phase === 'done' && reviewStats) {
    const passed = reviewStats.correct >= PASS_SCORE
    return (
      <div className="panel">
        <h1 className={`result ${passed ? 'pass' : 'fail'}`}>
          {reviewStats.correct}/{reviewStats.total}
        </h1>
        <p className="result-text">
          {passed ? 'עברת את המבחן המדומה' : `צריך לפחות ${PASS_SCORE} — נסה שוב`}
        </p>
        <button type="button" className="btn secondary full" onClick={() => setPhase('review')}>
          סקירת תשובות
        </button>
        <button type="button" className="btn primary full" onClick={start}>
          מבחן נוסף
        </button>
        <button type="button" className="btn ghost full" onClick={onBack}>
          חזרה לדף הבית
        </button>
      </div>
    )
  }

  if (phase === 'review') {
    const [ri, setRi] = useState(0)
    const rq = examQuestions[ri]
    return (
      <div className="panel">
        <header className="panel-header">
          <button type="button" className="btn ghost" onClick={() => setPhase('done')}>
            ← תוצאה
          </button>
          <h1>סקירה</h1>
        </header>
        <p className="counter">
          {ri + 1}/{examQuestions.length}
        </p>
        {rq && (
          <QuestionCard
            question={rq}
            selectedIndex={answers[ri]}
            revealed
            onSelect={() => {}}
            showHint
          />
        )}
        <div className="row">
          <button
            type="button"
            className="btn secondary"
            disabled={ri === 0}
            onClick={() => setRi((i) => i - 1)}
          >
            הקודם
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={ri >= examQuestions.length - 1}
            onClick={() => setRi((i) => i + 1)}
          >
            הבא
          </button>
        </div>
      </div>
    )
  }

  if (!q) return null

  const selectAnswer = (index: number) => {
    const next = [...answers]
    next[current] = index
    setAnswers(next)
  }

  return (
    <div className="panel exam-active">
      <div className="exam-top">
        <ExamTimer secondsLeft={secondsLeft} />
        <span className="exam-progress">
          שאלה {current + 1}/{examQuestions.length} · נענו {answeredCount}
        </span>
      </div>

      <QuestionCard
        question={q}
        selectedIndex={answers[current]}
        revealed={false}
        onSelect={selectAnswer}
        showHint={false}
      />

      <div className="exam-nav">
        <button
          type="button"
          className="btn secondary"
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
        >
          ←
        </button>

        <div className="dots">
          {examQuestions.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`dot ${i === current ? 'current' : ''} ${answers[i] !== null ? 'answered' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`שאלה ${i + 1}`}
            />
          ))}
        </div>

        {current < examQuestions.length - 1 ? (
          <button type="button" className="btn secondary" onClick={() => setCurrent((c) => c + 1)}>
            →
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={submit}>
            סיים
          </button>
        )}
      </div>

      <button type="button" className="btn ghost full small" onClick={submit}>
        הגש מבחן עכשיו
      </button>
    </div>
  )
}
