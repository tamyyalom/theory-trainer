import type { ExamResult, Progress, Question } from '../types'
import { PASS_SCORE, PASS_STREAK } from '../types'

export function recordAnswer(
  progress: Progress,
  questionId: string,
  correct: boolean,
): Progress {
  const next = { ...progress, wrongCounts: { ...progress.wrongCounts } }
  const streak = { ...progress.correctStreak }
  const seen = { ...progress.seenCount }
  const last = { ...progress.lastAnsweredAt }

  seen[questionId] = (seen[questionId] ?? 0) + 1
  last[questionId] = Date.now()

  if (correct) {
    streak[questionId] = (streak[questionId] ?? 0) + 1
    if ((next.wrongCounts[questionId] ?? 0) > 0 && streak[questionId] >= 2) {
      next.wrongCounts[questionId] = Math.max(0, next.wrongCounts[questionId] - 1)
    }
  } else {
    streak[questionId] = 0
    next.wrongCounts[questionId] = (next.wrongCounts[questionId] ?? 0) + 1
  }

  return {
    ...next,
    correctStreak: streak,
    seenCount: seen,
    lastAnsweredAt: last,
  }
}

export function recordExam(progress: Progress, score: number, total: number): Progress {
  const result: ExamResult = {
    id: crypto.randomUUID(),
    finishedAt: Date.now(),
    score,
    total,
    passed: score >= PASS_SCORE,
  }
  return {
    ...progress,
    examHistory: [result, ...progress.examHistory].slice(0, 50),
  }
}

export function readiness(progress: Progress): 'green' | 'yellow' | 'red' {
  const recent = progress.examHistory.slice(0, PASS_STREAK)
  if (recent.length < PASS_STREAK) return 'red'
  const passes = recent.filter((e) => e.passed).length
  if (passes === PASS_STREAK) return 'green'
  if (passes >= PASS_STREAK - 1) return 'yellow'
  return 'red'
}

export function readinessLabel(level: ReturnType<typeof readiness>): string {
  switch (level) {
    case 'green':
      return 'מוכן למבחן'
    case 'yellow':
      return 'קרוב — עוד מבחן אחד טוב'
    case 'red':
      return 'צריך עוד תרגול'
  }
}

export function weakCategories(
  questions: Question[],
  progress: Progress,
): { category: string; wrong: number; total: number }[] {
  const totals = new Map<string, number>()
  const wrongs = new Map<string, number>()

  for (const q of questions) {
    totals.set(q.category, (totals.get(q.category) ?? 0) + 1)
    const w = progress.wrongCounts[q.id] ?? 0
    if (w > 0) wrongs.set(q.category, (wrongs.get(q.category) ?? 0) + w)
  }

  return [...totals.keys()]
    .map((category) => ({
      category,
      wrong: wrongs.get(category) ?? 0,
      total: totals.get(category) ?? 0,
    }))
    .filter((x) => x.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
}

export function drillQuestions(questions: Question[], progress: Progress, limit = 20): Question[] {
  const scored = questions.map((q) => {
    const wrong = progress.wrongCounts[q.id] ?? 0
    const seen = progress.seenCount[q.id] ?? 0
    const last = progress.lastAnsweredAt[q.id] ?? 0
    const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24)
    const priority = wrong * 10 + (seen === 0 ? 5 : 0) + (daysSince > 2 ? 2 : 0)
    return { q, priority }
  })

  scored.sort((a, b) => b.priority - a.priority || Math.random() - 0.5)
  return scored.slice(0, limit).map((s) => s.q)
}

export function masteryPercent(questions: Question[], progress: Progress): number {
  if (!questions.length) return 0
  const mastered = questions.filter((q) => {
    const wrong = progress.wrongCounts[q.id] ?? 0
    const streak = progress.correctStreak[q.id] ?? 0
    return wrong === 0 && streak >= 1
  }).length
  return Math.round((mastered / questions.length) * 100)
}
