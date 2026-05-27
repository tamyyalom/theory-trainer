import type { Question } from '../types'

interface Props {
  question: Question
  selectedIndex: number | null
  revealed: boolean
  onSelect: (index: number) => void
  showHint?: boolean
}

export function QuestionCard({
  question,
  selectedIndex,
  revealed,
  onSelect,
  showHint = true,
}: Props) {
  return (
    <article className="question-card">
      <p className="question-meta">
        <span className="badge">{question.category}</span>
        <span className="qid">#{question.id}</span>
      </p>

      <h2 className="question-text">{question.text}</h2>

      {question.imageUrl && (
        <img
          className="question-image"
          src={question.imageUrl}
          alt=""
          loading="lazy"
        />
      )}

      <ul className="answers" role="listbox" aria-label="תשובות">
        {question.answers.map((answer, index) => {
          const selected = selectedIndex === index
          const correct = index === question.correctIndex
          let className = 'answer'
          if (selected) className += ' selected'
          if (revealed && correct) className += ' correct'
          if (revealed && selected && !correct) className += ' wrong'

          return (
            <li key={`${question.id}-${index}`}>
              <button
                type="button"
                className={className}
                onClick={() => !revealed && onSelect(index)}
                disabled={revealed}
              >
                <span className="answer-letter">{String.fromCharCode(1488 + index)}</span>
                <span>{answer}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {revealed && showHint && (
        <p className="feedback">
          {selectedIndex === question.correctIndex ? (
            <span className="ok">נכון</span>
          ) : (
            <span className="fail">
              התשובה הנכונה:{' '}
              <strong>{question.answers[question.correctIndex]}</strong>
            </span>
          )}
        </p>
      )}
    </article>
  )
}
