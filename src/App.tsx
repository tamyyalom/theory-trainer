import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import './App.css'
import type { AppMode, QuestionBank, TheoryGuide } from './types'
import { HomeScreen } from './components/HomeScreen'
import { useProgress } from './hooks/useProgress'
import { ToastProvider, useToast } from './hooks/useToast'
import { exportProgress, importProgressFile } from './lib/storage'
import { loadSession, saveSession, type AppSession } from './lib/session'
import { validateQuestionBank } from './lib/validateBank'
import { validateTheoryGuide } from './lib/validateTheory'
import { clearTheoryProgress } from './lib/theoryProgress'

const TheoryMode = lazy(() =>
  import('./modes/TheoryMode').then((m) => ({ default: m.TheoryMode })),
)
const LearnMode = lazy(() =>
  import('./modes/LearnMode').then((m) => ({ default: m.LearnMode })),
)
const DrillMode = lazy(() =>
  import('./modes/DrillMode').then((m) => ({ default: m.DrillMode })),
)
const ExamMode = lazy(() =>
  import('./modes/ExamMode').then((m) => ({ default: m.ExamMode })),
)

function ModeFallback() {
  return <main className="app-shell">טוען מסך...</main>
}

function AppContent() {
  const [mode, setMode] = useState<AppMode>('home')
  const [bank, setBank] = useState<QuestionBank | null>(null)
  const [theoryGuide, setTheoryGuide] = useState<TheoryGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savedSession, setSavedSession] = useState<AppSession | null>(() => loadSession())
  const [resumePayload, setResumePayload] = useState<AppSession | null>(null)
  const { progress, setProgress, reset } = useProgress()
  const { showToast } = useToast()

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        setLoading(true)
        const [questionsRes, theoryRes] = await Promise.all([
          fetch('/data/questions.json'),
          fetch('/data/theory.json'),
        ])

        if (!questionsRes.ok) {
          throw new Error('לא נמצא מאגר שאלות. הרץ npm run import ואז רענן.')
        }

        const json = validateQuestionBank(await questionsRes.json())
        if (!mounted) return
        setBank(json)

        if (theoryRes.ok) {
          try {
            const guide = validateTheoryGuide(await theoryRes.json())
            if (mounted) setTheoryGuide(guide)
          } catch {
            /* מדריך תיאוריה אופציונלי — האפליקציה ממשיכה בלי */
          }
        }

        setError(null)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'טעינת המאגר נכשלה')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      mounted = false
    }
  }, [])

  const questions = bank?.questions ?? []

  const goHome = useCallback(() => {
    setMode('home')
  }, [])

  const goMode = useCallback((next: AppMode) => {
    setMode(next)
    setResumePayload(null)
    if (next === 'home') {
      saveSession(null)
      setSavedSession(null)
    }
  }, [])

  const persistTheorySession = useCallback(
    (payload: { chapterId: string; sectionIndex: number }) => {
      const session: AppSession = { mode: 'theory', theory: payload }
      saveSession(session)
      setSavedSession(session)
    },
    [],
  )

  const persistLearnSession = useCallback((payload: { category: string; index: number }) => {
    const session: AppSession = { mode: 'learn', learn: payload }
    saveSession(session)
    setSavedSession(session)
  }, [])

  const persistDrillSession = useCallback(
    (payload: { focusCategory: string | null; index: number }) => {
      const session: AppSession = { mode: 'drill', drill: payload }
      saveSession(session)
      setSavedSession(session)
    },
    [],
  )

  const resumeSession = useCallback(() => {
    const session = loadSession()
    if (!session) return
    setResumePayload(session)
    setMode(session.mode)
    setSavedSession(session)
    showToast('ממשיכים מאיפה שהפסקת')
  }, [showToast])

  const practiceFromTheory = useCallback(
    (category: string) => {
      setResumePayload({ mode: 'learn', learn: { category, index: 0 } })
      setMode('learn')
      showToast(`מתחילים תרגול שאלות: ${category}`)
    },
    [showToast],
  )

  const onImportProgress = useCallback(
    async (file: File) => {
      try {
        const parsed = await importProgressFile(file)
        setProgress(parsed)
        showToast('התקדמות יובאה בהצלחה')
      } catch {
        showToast('קובץ התקדמות לא תקין', 'error')
      }
    },
    [setProgress, showToast],
  )

  const onExport = useCallback(() => {
    exportProgress(progress)
    showToast('קובץ התקדמות הורד')
  }, [progress, showToast])

  const onResetQuestions = useCallback(() => {
    reset()
    saveSession(null)
    setSavedSession(null)
    showToast('התקדמות שאלות ומבחנים אופסה')
  }, [reset, showToast])

  const onResetTheory = useCallback(() => {
    clearTheoryProgress()
    if (savedSession?.mode === 'theory') {
      saveSession(null)
      setSavedSession(null)
    }
    showToast('התקדמות לימוד תיאוריה אופסה')
  }, [savedSession?.mode, showToast])

  if (loading) {
    return <main className="app-shell">טוען מאגר שאלות...</main>
  }

  if (error || !bank) {
    return (
      <main className="app-shell">
        <section className="panel">
          <h1>Theory Trainer</h1>
          <p className="result-text">{error ?? 'שגיאה לא ידועה'}</p>
          <p className="muted">
            הרץ טרמינל: <code>npm run import</code> ואז <code>npm run dev</code>.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <Suspense fallback={<ModeFallback />}>
        {mode === 'home' && (
          <HomeScreen
            questions={questions}
            progress={progress}
            theoryGuide={theoryGuide}
            onMode={goMode}
            onResetQuestions={onResetQuestions}
            onResetTheory={onResetTheory}
            onExport={onExport}
            onImport={onImportProgress}
            savedSession={savedSession}
            onResume={resumeSession}
          />
        )}

        {mode === 'theory' && theoryGuide && (
          <TheoryMode
            guide={theoryGuide}
            onBack={goHome}
            onPracticeCategory={practiceFromTheory}
            initialChapterId={
              resumePayload?.mode === 'theory' ? resumePayload.theory?.chapterId : undefined
            }
            initialSectionIndex={
              resumePayload?.mode === 'theory' ? resumePayload.theory?.sectionIndex : undefined
            }
            onSessionChange={persistTheorySession}
          />
        )}

        {mode === 'theory' && !theoryGuide && (
          <section className="panel">
            <p>מדריך התיאוריה לא זמין.</p>
            <button type="button" className="btn ghost" onClick={goHome}>
              חזרה
            </button>
          </section>
        )}

        {mode === 'learn' && (
          <LearnMode
            questions={questions}
            progress={progress}
            onProgress={setProgress}
            onBack={goHome}
            initialCategory={
              resumePayload?.mode === 'learn' ? resumePayload.learn?.category : undefined
            }
            initialIndex={resumePayload?.mode === 'learn' ? resumePayload.learn?.index : undefined}
            onSessionChange={persistLearnSession}
          />
        )}

        {mode === 'drill' && (
          <DrillMode
            questions={questions}
            progress={progress}
            onProgress={setProgress}
            onBack={goHome}
            initialFocusCategory={
              resumePayload?.mode === 'drill' ? resumePayload.drill?.focusCategory : undefined
            }
            initialIndex={resumePayload?.mode === 'drill' ? resumePayload.drill?.index : undefined}
            onSessionChange={persistDrillSession}
          />
        )}

        {mode === 'exam' && (
          <ExamMode
            questions={questions}
            progress={progress}
            onProgress={setProgress}
            onBack={goHome}
          />
        )}
      </Suspense>
    </main>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App
