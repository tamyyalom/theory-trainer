import type { Question } from '../types'

interface Props {
  question: Question
  selectedIndex: number | null
  revealed: boolean
  onSelect: (index: number) => void
  showHint?: boolean
  /** Reserve fixed image area (exam mode) so card height stays stable */
  fixedImageArea?: boolean
  /** סימון לחזרה (לימוד / תרגול) */
  bookmark?: { active: boolean; onToggle: () => void }
}

export function QuestionCard({
  question,
  selectedIndex,
  revealed,
  onSelect,
  showHint = true,
  fixedImageArea = false,
  bookmark,
}: Props) {
  const image = question.imageUrl ? (
    <img className="question-image" src={question.imageUrl} alt="" loading="lazy" />
  ) : null

  return (
    <article className={`question-card ${fixedImageArea ? 'question-card-fixed' : ''}`}>
      <p className="question-meta">
        <span className="badge">{question.category}</span>
        <span className="question-meta-end">
          <span className="qid">#{question.id}</span>
          {bookmark && (
            <button
              type="button"
              className={`bookmark-btn ${bookmark.active ? 'on' : ''}`}
              onClick={bookmark.onToggle}
              aria-pressed={bookmark.active}
              aria-label={bookmark.active ? 'הסר מסימון לחזרה' : 'סמן לחזרה על השאלה'}
            >
              {bookmark.active ? '★' : '☆'}
            </button>
          )}
        </span>
      </p>

      <h2 className="question-text">{question.text}</h2>

      {fixedImageArea ? (
        <div className="question-image-slot" aria-hidden={!question.imageUrl}>
          {image}
        </div>
      ) : (
        image
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
