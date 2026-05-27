interface Props {
  secondsLeft: number
}

export function ExamTimer({ secondsLeft }: Props) {
  const m = Math.floor(secondsLeft / 60)
  const s = secondsLeft % 60
  const urgent = secondsLeft <= 5 * 60

  return (
    <div className={`exam-timer ${urgent ? 'urgent' : ''}`} aria-live="polite">
      <span className="label">זמן נותר</span>
      <span className="time">
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    </div>
  )
}
