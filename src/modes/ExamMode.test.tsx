import { render, screen, act, within } from '@testing-library/react'
import type { ComponentProps } from 'react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider } from '../components/ConfirmProvider'
import { ExamMode } from './ExamMode'
import type { Progress, Question } from '../types'
import { emptyProgress } from '../lib/storage'

function renderExam(overrides: Partial<ComponentProps<typeof ExamMode>> & Pick<
  ComponentProps<typeof ExamMode>,
  'questions' | 'progress' | 'onProgress' | 'onBack'
>) {
  return render(
    <ConfirmProvider>
      <ExamMode
        onExamPersist={vi.fn()}
        savedExamSnapshot={undefined}
        {...overrides}
      />
    </ConfirmProvider>,
  )
}

vi.mock('../lib/shuffle', () => ({
  pickRandom: (items: Question[]) => items.slice(0, 2),
}))

const questions: Question[] = [
  {
    id: '1',
    text: 'שאלה ראשונה',
    answers: ['א', 'ב'],
    correctIndex: 0,
    category: 'כללי',
    imageUrl: null,
    licenses: ['B'],
  },
  {
    id: '2',
    text: 'שאלה שנייה',
    answers: ['ג', 'ד'],
    correctIndex: 1,
    category: 'כללי',
    imageUrl: null,
    licenses: ['B'],
  },
]

const baseProgress: Progress = emptyProgress()

describe('ExamMode', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('submits exam and shows score', async () => {
    const onProgress = vi.fn()
    const onExamPersist = vi.fn()
    const user = userEvent.setup()

    renderExam({
      questions,
      progress: baseProgress,
      onProgress,
      onBack: () => {},
      onExamPersist,
    })

    await user.click(screen.getByText('התחל מבחן'))
    expect(screen.getByText('שאלה ראשונה')).toBeInTheDocument()

    const answerButtons = screen.getAllByRole('button').filter((b) => b.classList.contains('answer'))
    await user.click(answerButtons[0])
    expect(screen.getByText('שאלה שנייה')).toBeInTheDocument()
    const secondAnswers = screen.getAllByRole('button').filter((b) => b.classList.contains('answer'))
    await user.click(secondAnswers[1])
    await user.click(screen.getByText('סיים'))

    expect(await screen.findByText('2/2')).toBeInTheDocument()
    expect(onProgress).toHaveBeenCalled()
    const last = onProgress.mock.calls.at(-1)?.[0] as Progress
    expect(last.examHistory).toHaveLength(1)
    expect(last.examHistory[0]?.score).toBe(2)
    expect(onExamPersist).toHaveBeenCalledWith(null)
  })

  it('auto-submits when timer expires', async () => {
    const onProgress = vi.fn()
    const user = userEvent.setup()

    renderExam({
      questions,
      progress: baseProgress,
      onProgress,
      onBack: () => {},
    })

    await user.click(screen.getByText('התחל מבחן'))

    await act(async () => {
      vi.advanceTimersByTime(40 * 60 * 1000 + 2000)
    })

    expect(await screen.findByText(/\/2/)).toBeInTheDocument()
    expect(onProgress).toHaveBeenCalled()
  })

  it('exits active exam after confirmation', async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()

    renderExam({
      questions,
      progress: baseProgress,
      onProgress: () => {},
      onBack,
    })

    await user.click(screen.getByText('התחל מבחן'))
    await user.click(screen.getByRole('button', { name: /יציאה מהמבחן/ }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'יציאה מהמבחן' }))

    expect(onBack).toHaveBeenCalled()
  })

  it('stays in exam when exit is cancelled', async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()

    renderExam({
      questions,
      progress: baseProgress,
      onProgress: () => {},
      onBack,
    })

    await user.click(screen.getByText('התחל מבחן'))
    await user.click(screen.getByRole('button', { name: /יציאה מהמבחן/ }))
    await user.click(screen.getByRole('button', { name: 'ביטול' }))

    expect(onBack).not.toHaveBeenCalled()
    expect(screen.getByText('שאלה ראשונה')).toBeInTheDocument()
  })

  it('auto-advances after answer but allows manual navigation', async () => {
    const user = userEvent.setup()

    renderExam({
      questions,
      progress: baseProgress,
      onProgress: () => {},
      onBack: () => {},
    })

    await user.click(screen.getByText('התחל מבחן'))
    const answerButtons = screen.getAllByRole('button').filter((b) => b.classList.contains('answer'))
    await user.click(answerButtons[0])

    expect(screen.getByText('שאלה שנייה')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /שאלה 1/ }))
    expect(screen.getByText('שאלה ראשונה')).toBeInTheDocument()
  })
})
