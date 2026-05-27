import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { AppMode, QuestionBank } from './types'
import { LearnMode } from './modes/LearnMode'
import { DrillMode } from './modes/DrillMode'
import { ExamMode } from './modes/ExamMode'
import { HomeScreen } from './components/HomeScreen'
import { useProgress } from './hooks/useProgress'
import { exportProgress, importProgressFile } from './lib/storage'

function App() {
  const [mode, setMode] = useState<AppMode>('home')
  const [bank, setBank] = useState<QuestionBank | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { progress, setProgress, reset } = useProgress()

  useEffect(() => {
    let mounted = true
    async function loadBank() {
      try {
        setLoading(true)
        const res = await fetch('/data/questions.json')
        if (!res.ok) {
          throw new Error('לא נמצא מאגר שאלות. הרץ npm run import ואז רענן.')
        }
        const json = (await res.json()) as QuestionBank
        if (!mounted) return
        setBank(json)
        setError(null)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'טעינת המאגר נכשלה')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadBank()
    return () => {
      mounted = false
    }
  }, [])

  const questions = useMemo(() => bank?.questions ?? [], [bank])

  const onImportProgress = async (file: File) => {
    try {
      const parsed = await importProgressFile(file)
      setProgress(parsed)
    } catch {
      alert('קובץ התקדמות לא תקין')
    }
  }

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
      {mode === 'home' && (
        <HomeScreen
          questions={questions}
          progress={progress}
          onMode={setMode}
          onReset={reset}
          onExport={() => exportProgress(progress)}
          onImport={onImportProgress}
        />
      )}

      {mode === 'learn' && (
        <LearnMode
          questions={questions}
          progress={progress}
          onProgress={setProgress}
          onBack={() => setMode('home')}
        />
      )}

      {mode === 'drill' && (
        <DrillMode
          questions={questions}
          progress={progress}
          onProgress={setProgress}
          onBack={() => setMode('home')}
        />
      )}

      {mode === 'exam' && (
        <ExamMode
          questions={questions}
          progress={progress}
          onProgress={setProgress}
          onBack={() => setMode('home')}
        />
      )}
    </main>
  )
}

export default App
