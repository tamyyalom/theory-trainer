import { useCallback, useEffect, useRef, useState } from 'react'
import type { Progress, Question } from '../types'
import { EXAM_MINUTES, EXAM_SIZE, PASS_SCORE } from '../types'
import { pickRandom } from '../lib/shuffle'
import { recordAnswer, recordExam } from '../lib/progress'
import { buildExamSnapshot, questionsFromExamSnapshot, type ExamSessionState } from '../lib/examSession'
import { QuestionCard } from '../components/QuestionCard'
import { ExamTimer } from '../components/ExamTimer'
import { useConfirm } from '../hooks/useConfirm'
import { ARROW_BACK, ARROW_FORWARD, labelBack } from '../lib/rtl'

interface Props {
  questions: Question[]
  progress: Progress
  onProgress: (p: Progress) => void
  onBack: () => void
  /** מצב מבחן שמור מהסשן (לפני mount) */
  savedExamSnapshot?: ExamSessionState | null
  onExamPersist: (snapshot: ExamSessionState | null) => void
}

type Phase = 'intro' | 'active' | 'review' | 'done'

export function ExamMode({
  questions,
  progress,
  onProgress,
  onBack,
  savedExamSnapshot,
  onExamPersist,
}: Props) {
  const { confirm } = useConfirm()
  const [phase, setPhase] = useState<Phase>('intro')
  const [examQuestions, setExamQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [secondsLeft, setSecondsLeft] = useState(EXAM_MINUTES * 60)
  const [finalScore, setFinalScore] = useState<{ correct: number; total: number } | null>(null)

  const liveRef = useRef({
    phase: 'intro' as Phase,
    examQuestions: [] as Question[],
    answers: [] as (number | null)[],
    current: 0,
    secondsLeft: EXAM_MINUTES * 60,
  })
  const persistDisabledRef = useRef(false)

  useEffect(() => {
    liveRef.current = { phase, examQuestions, answers, current, secondsLeft }
  }, [phase, examQuestions, answers, current, secondsLeft])

  const flushPersist = useCallback(() => {
    if (persistDisabledRef.current) return
    const { phase: ph, examQuestions: qs, answers: ans, current: cur, secondsLeft: sec } =
      liveRef.current
    if (ph !== 'active' || qs.length !== EXAM_SIZE) return
    onExamPersist(buildExamSnapshot(qs, ans, cur, sec))
  }, [onExamPersist])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushPersist()
    }
    window.addEventListener('pagehide', flushPersist)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flushPersist)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [flushPersist])

  useEffect(() => {
    if (phase !== 'active' || examQuestions.length !== EXAM_SIZE) return
    const t = window.setTimeout(flushPersist, 450)
    return () => window.clearTimeout(t)
  }, [phase, examQuestions, answers, current, secondsLeft, flushPersist])

  const canResume =
    Boolean(savedExamSnapshot) &&
    questionsFromExamSnapshot(questions, savedExamSnapshot!) !== null

  useEffect(() => {
    if (!savedExamSnapshot) return
    if (!questionsFromExamSnapshot(questions, savedExamSnapshot)) {
      onExamPersist(null)
    }
  }, [savedExamSnapshot, questions, onExamPersist])

  const startNewExam = useCallback(async () => {
    if (canResume) {
      const ok = await confirm({
        title: 'מבחן חדש',
        message: 'מבחן שמור יימחק וייבחרו 30 שאלות חדשות. להמשיך?',
        confirmLabel: 'התחל מחדש',
        danger: true,
      })
      if (!ok) return
    }
    persistDisabledRef.current = false
    onExamPersist(null)
    const picked = pickRandom(questions, EXAM_SIZE)
    setExamQuestions(picked)
    setAnswers(new Array(picked.length).fill(null))
    setCurrent(0)
    setReviewIndex(0)
    setSecondsLeft(EXAM_MINUTES * 60)
    setFinalScore(null)
    setPhase('active')
  }, [canResume, confirm, onExamPersist, questions])

  const resumeExam = useCallback(() => {
    if (!savedExamSnapshot) return
    const list = questionsFromExamSnapshot(questions, savedExamSnapshot)
    if (!list) {
      onExamPersist(null)
      return
    }
    persistDisabledRef.current = false
    setExamQuestions(list)
    setAnswers([...savedExamSnapshot.answers])
    setCurrent(Math.min(savedExamSnapshot.current, EXAM_SIZE - 1))
    setSecondsLeft(savedExamSnapshot.secondsLeft)
    setReviewIndex(0)
    setFinalScore(null)
    setPhase('active')
  }, [onExamPersist, questions, savedExamSnapshot])

  const submit = useCallback(() => {
    persistDisabledRef.current = true
    onExamPersist(null)
    setAnswers((currentAnswers) => {
      setExamQuestions((currentQuestions) => {
        let score = 0
        currentQuestions.forEach((q, i) => {
          if (currentAnswers[i] === q.correctIndex) score++
        })
        let next = progress
        currentQuestions.forEach((q, i) => {
          const pickedAns = currentAnswers[i]
          if (pickedAns === null) return
          next = recordAnswer(next, q.id, pickedAns === q.correctIndex)
        })
        next = recordExam(next, score, currentQuestions.length)
        onProgress(next)
        setFinalScore({ correct: score, total: currentQuestions.length })
        setPhase('done')
        return currentQuestions
      })
      return currentAnswers
    })
  }, [onExamPersist, onProgress, progress])

  useEffect(() => {
    if (phase !== 'active') return
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t)
          submit()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [phase, submit])

  const q = examQuestions[current]
  const answeredCount = answers.filter((a) => a !== null).length

  if (phase === 'intro') {
    return (
      <div className="panel mode-panel">
        <header className="mode-header">
          <button type="button" className="btn ghost" onClick={onBack}>
            {labelBack('חזרה')}
          </button>
          <div className="mode-header-copy">
            <p className="mode-kicker">מצב מבחן</p>
            <h1>מבחן מלא</h1>
            <p className="mode-subtitle">סימולציה בתנאי אמת: 30 שאלות, טיימר, וללא רמזים במהלך הבחינה.</p>
          </div>
        </header>
        {canResume && savedExamSnapshot && (
          <div className="exam-resume-banner" role="status">
            <p>
              <strong>יש מבחן שמור</strong> — נענו {savedExamSnapshot.answers.filter((a) => a !== null).length}/
              {EXAM_SIZE}, זמן נותר כ־{Math.ceil(savedExamSnapshot.secondsLeft / 60)} דקות.
            </p>
            <p className="exam-resume-hint">אפשר להמשיך מאותו מבחן או להתחיל מבחן חדש.</p>
          </div>
        )}
        <ul className="exam-rules">
          <li>{EXAM_SIZE} שאלות</li>
          <li>{EXAM_MINUTES} דקות</li>
          <li>ציון עובר: {PASS_SCORE} ומעלה</li>
          <li>בלי הצגת תשובות במהלך המבחן</li>
          <li>המבחן נשמר אוטומטית — אפשר לחזור מהבית</li>
        </ul>
        {canResume ? (
          <div className="exam-intro-actions">
            <button type="button" className="btn primary full" onClick={resumeExam}>
              המשך מבחן שמור
            </button>
            <button type="button" className="btn secondary full" onClick={startNewExam}>
              התחל מבחן חדש
            </button>
          </div>
        ) : (
          <button type="button" className="btn primary full" onClick={startNewExam}>
            התחל מבחן
          </button>
        )}
      </div>
    )
  }

  if (phase === 'done' && finalScore) {
    const passed = finalScore.correct >= PASS_SCORE
    return (
      <div className="panel mode-panel">
        <h1 className={`result ${passed ? 'pass' : 'fail'}`}>
          {finalScore.correct}/{finalScore.total}
        </h1>
        <p className="result-text">
          {passed ? 'עברת את המבחן המדומה' : `צריך לפחות ${PASS_SCORE} — נסה שוב`}
        </p>
        <button type="button" className="btn secondary full" onClick={() => setPhase('review')}>
          סקירת תשובות
        </button>
        <button type="button" className="btn primary full" onClick={startNewExam}>
          מבחן נוסף
        </button>
        <button type="button" className="btn ghost full" onClick={onBack}>
          חזרה לדף הבית
        </button>
      </div>
    )
  }

  if (phase === 'review') {
    const rq = examQuestions[reviewIndex]
    return (
      <div className="panel mode-panel">
        <header className="mode-header">
          <button type="button" className="btn ghost" onClick={() => setPhase('done')}>
            {labelBack('תוצאה')}
          </button>
          <div className="mode-header-copy">
            <p className="mode-kicker">סקירה</p>
            <h1>סקירת תשובות</h1>
          </div>
        </header>
        <p className="counter">
          {reviewIndex + 1}/{examQuestions.length}
        </p>
        {rq && (
          <QuestionCard
            question={rq}
            selectedIndex={answers[reviewIndex]}
            revealed
            onSelect={() => {}}
            showHint
          />
        )}
        <div className="row">
          <button
            type="button"
            className="btn secondary"
            disabled={reviewIndex === 0}
            onClick={() => setReviewIndex((i) => i - 1)}
          >
            הקודם
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={reviewIndex >= examQuestions.length - 1}
            onClick={() => setReviewIndex((i) => i + 1)}
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
    if (current < examQuestions.length - 1) {
      setCurrent((c) => c + 1)
    }
  }

  const exitExam = async () => {
    const ok = await confirm({
      title: 'יציאה מהמבחן',
      message: 'התקדמות במבחן הנוכחי לא תישמר. לצאת בכל זאת?',
      confirmLabel: 'יציאה מהמבחן',
      danger: true,
    })
    if (ok) {
      persistDisabledRef.current = true
      onExamPersist(null)
      onBack()
    }
  }

  return (
    <div className="panel mode-panel exam-active">
      <div className="exam-active-header">
        <button type="button" className="btn ghost" onClick={exitExam}>
          {labelBack('יציאה מהמבחן')}
        </button>
      </div>

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
        fixedImageArea
      />

      <div className="exam-nav">
        <button
          type="button"
          className="btn secondary"
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
          aria-label="שאלה קודמת"
        >
          {ARROW_BACK}
        </button>

        <div
          className="dots"
          role="radiogroup"
          aria-label="מעבר מהיר בין שאלות במבחן"
        >
          {examQuestions.map((_, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={i === current}
              tabIndex={i === current ? 0 : -1}
              className={`dot ${i === current ? 'current' : ''} ${answers[i] !== null ? 'answered' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`שאלה ${i + 1}${answers[i] !== null ? ', נענתה' : ', לא נענתה'}`}
            />
          ))}
        </div>

        {current < examQuestions.length - 1 ? (
          <button
            type="button"
            className="btn secondary"
            onClick={() => setCurrent((c) => c + 1)}
            aria-label="שאלה הבאה"
          >
            {ARROW_FORWARD}
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={submit}>
            סיים
          </button>
        )}
      </div>

      <button type="button" className="btn ghost full exam-submit" onClick={submit}>
        הגש מבחן עכשיו
      </button>
    </div>
  )
}
