import { useEffect, useMemo, useState } from 'react'
import type { TheoryGuide } from '../types'
import {
  chapterProgress,
  loadTheoryProgress,
  markSectionRead,
  saveTheoryProgress,
  type TheoryProgress,
} from '../lib/theoryProgress'
import { ARROW_FORWARD, labelBack } from '../lib/rtl'

interface Props {
  guide: TheoryGuide
  onBack: () => void
  onPracticeCategory: (category: string) => void
  initialChapterId?: string
  initialSectionIndex?: number
  onSessionChange?: (payload: {
    chapterId: string
    sectionIndex: number
  }) => void
}

type View = 'chapters' | 'sections' | 'read'

export function TheoryMode({
  guide,
  onBack,
  onPracticeCategory,
  initialChapterId,
  initialSectionIndex = 0,
  onSessionChange,
}: Props) {
  const chapters = useMemo(
    () => [...guide.chapters].sort((a, b) => a.order - b.order),
    [guide.chapters],
  )

  const [theoryProgress, setTheoryProgress] = useState<TheoryProgress>(() => loadTheoryProgress())
  const [view, setView] = useState<View>(() => (initialChapterId ? 'read' : 'chapters'))
  const [chapterId, setChapterId] = useState(
    () => initialChapterId ?? chapters[0]?.id ?? '',
  )
  const [sectionIndex, setSectionIndex] = useState(initialSectionIndex)

  const chapter = chapters.find((c) => c.id === chapterId)
  const section = chapter?.sections[sectionIndex]

  useEffect(() => {
    if (view === 'read' && chapter) {
      onSessionChange?.({ chapterId: chapter.id, sectionIndex })
    }
  }, [view, chapter, sectionIndex, onSessionChange])

  const markCurrentRead = () => {
    if (!section) return
    const next = markSectionRead(theoryProgress, section.id)
    setTheoryProgress(next)
    saveTheoryProgress({
      ...next,
      lastChapterId: chapterId,
      lastSectionIndex: sectionIndex,
    })
  }

  const openChapter = (id: string) => {
    setChapterId(id)
    setSectionIndex(0)
    setView('sections')
  }

  const openSection = (index: number) => {
    setSectionIndex(index)
    setView('read')
    const sec = chapter?.sections[index]
    if (sec) {
      const next = markSectionRead(theoryProgress, sec.id)
      setTheoryProgress(next)
      saveTheoryProgress({ ...next, lastChapterId: chapterId, lastSectionIndex: index })
    }
  }

  const goNext = () => {
    if (!chapter) return
    markCurrentRead()
    if (sectionIndex < chapter.sections.length - 1) {
      openSection(sectionIndex + 1)
    } else {
      setView('sections')
    }
  }

  const goPrev = () => {
    if (sectionIndex > 0) {
      openSection(sectionIndex - 1)
    } else {
      setView('sections')
    }
  }

  const totalSections = chapters.reduce((n, c) => n + c.sections.length, 0)
  const readCount = theoryProgress.readSectionIds.length

  if (view === 'chapters') {
    return (
      <div className="panel mode-panel theory-panel">
        <header className="mode-header">
          <button type="button" className="btn ghost" onClick={onBack}>
            {labelBack('חזרה')}
          </button>
          <div className="mode-header-copy">
            <p className="mode-kicker">מצב תיאוריה</p>
            <h1>תיאוריה מקוצרת</h1>
            <p className="mode-subtitle">לומדים את העיקרון, את ההיגיון, ואז עוברים לשאלות בצורה חכמה.</p>
          </div>
        </header>

        <p className="counter mode-counter">
          התקדמות: {readCount}/{totalSections} נושאים נקראו
        </p>

        <ul className="theory-chapter-list">
          {chapters.map((ch) => {
            const prog = chapterProgress(theoryProgress, ch)
            const pct = prog.total ? Math.round((prog.read / prog.total) * 100) : 0
            const thumb = ch.sections.find((s) => s.imageUrl)?.imageUrl
            return (
              <li key={ch.id}>
                <button type="button" className="theory-chapter-btn" onClick={() => openChapter(ch.id)}>
                  {thumb && (
                    <img
                      className="theory-chapter-thumb"
                      src={thumb}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <span className="theory-chapter-body">
                    <span className="theory-chapter-title">
                      {ch.order}. {ch.title}
                    </span>
                    <span className="theory-chapter-desc">{ch.description}</span>
                    <span className="theory-chapter-progress" aria-hidden>
                      <span className="theory-chapter-progress-fill" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="theory-chapter-meta">
                      {prog.read}/{prog.total} נושאים · {ch.questionCategory}
                    </span>
                  </span>
                  <span className="theory-chapter-arrow" aria-hidden>
                    {ARROW_FORWARD}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  if (view === 'sections' && chapter) {
    const prog = chapterProgress(theoryProgress, chapter)
    return (
      <div className="panel mode-panel theory-panel">
        <header className="mode-header">
          <button type="button" className="btn ghost" onClick={() => setView('chapters')}>
            {labelBack('פרקים')}
          </button>
          <div className="mode-header-copy">
            <p className="mode-kicker">פרק תיאוריה</p>
            <h1>{chapter.title}</h1>
          </div>
        </header>

        <p className="counter">
          {prog.read}/{prog.total} נושאים בפרק
        </p>

        <div className="theory-practice-banner">
          <p>
            <strong>קטגוריית שאלות במבחן:</strong> {chapter.questionCategory}
          </p>
          <p className="theory-practice-banner-hint">
            אחרי הקריאה, עבור לתרגול שאלות מאותה קטגוריה במאגר הרשמי.
          </p>
        </div>

        <ul className="theory-section-list">
          {chapter.sections.map((sec, i) => {
            const read = theoryProgress.readSectionIds.includes(sec.id)
            return (
              <li key={sec.id}>
                <button
                  type="button"
                  className={`theory-section-btn ${read ? 'read' : ''}`}
                  onClick={() => openSection(i)}
                >
                  {sec.imageUrl && (
                    <img className="theory-section-thumb" src={sec.imageUrl} alt="" loading="lazy" />
                  )}
                  <span className="theory-section-body">
                    <span>{i + 1}. {sec.title}</span>
                    {read && <span className="theory-read-badge">נקרא</span>}
                  </span>
                  <span className="theory-chapter-arrow" aria-hidden>
                    {ARROW_FORWARD}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          className="btn primary full"
          onClick={() => onPracticeCategory(chapter.questionCategory)}
        >
          תרגל שאלות — {chapter.questionCategory}
        </button>
      </div>
    )
  }

  if (view === 'read' && chapter && section) {
    const paragraphs = section.body.split('\n\n').filter(Boolean)
    return (
      <div className="panel mode-panel theory-panel">
        <header className="mode-header">
          <button type="button" className="btn ghost" onClick={() => setView('sections')}>
            {labelBack(chapter.title)}
          </button>
          <div className="mode-header-copy">
            <p className="mode-kicker">נושא ללמידה</p>
            <h1>{section.title}</h1>
          </div>
        </header>

        <p className="counter">
          {sectionIndex + 1}/{chapter.sections.length} · {chapter.questionCategory}
        </p>

        <article className="theory-article">
          {section.imageUrl && (
            <figure className="theory-figure">
              <img src={section.imageUrl} alt={section.imageCaption ?? section.title} loading="lazy" />
              {section.imageCaption && <figcaption>{section.imageCaption}</figcaption>}
            </figure>
          )}
          {paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}

          {section.why && (
            <aside className="theory-why">
              <strong>למה זה כך?</strong>
              <p>{section.why}</p>
            </aside>
          )}

          {section.remember && (
            <aside className="theory-remember">
              <strong>לזכור</strong>
              <p>{section.remember}</p>
            </aside>
          )}
        </article>

        <div className="row">
          <button type="button" className="btn secondary" onClick={goPrev}>
            הקודם
          </button>
          <button type="button" className="btn primary" onClick={goNext}>
            {sectionIndex < chapter.sections.length - 1 ? 'הבא' : 'סיום פרק'}
          </button>
        </div>

        <button
          type="button"
          className="btn secondary full"
          onClick={() => onPracticeCategory(chapter.questionCategory)}
        >
          עבור לתרגול שאלות בנושא
        </button>
      </div>
    )
  }

  return null
}
