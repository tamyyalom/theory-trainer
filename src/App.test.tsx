import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows home screen actions after loading question bank', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input)
      if (url.includes('theory.json')) {
        return Promise.resolve({ ok: false } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          meta: {
            license: 'B',
            language: 'he',
            importedAt: new Date().toISOString(),
            source: 'test',
            total: 1,
          },
          questions: [
            {
              id: '1',
              text: 'שאלה לבדיקה',
              answers: ['תשובה א', 'תשובה ב'],
              correctIndex: 0,
              category: 'כללי',
              imageUrl: null,
              licenses: ['B'],
            },
          ],
        }),
      } as Response)
    })

    render(<App />)
    expect(await screen.findByText('תרגול לפי נושא')).toBeInTheDocument()
    expect(screen.getByText('תרגול חכם')).toBeInTheDocument()

    fetchMock.mockRestore()
  })

  it('navigates from home to learn mode', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input)
      if (url.includes('theory.json')) {
        return Promise.resolve({ ok: false } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          meta: {
            license: 'B',
            language: 'he',
            importedAt: new Date().toISOString(),
            source: 'test',
            total: 1,
          },
          questions: [
            {
              id: '1',
              text: 'שאלה לבדיקה',
              answers: ['תשובה א', 'תשובה ב'],
              correctIndex: 0,
              category: 'כללי',
              imageUrl: null,
              licenses: ['B'],
            },
          ],
        }),
      } as Response)
    })

    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByText('תרגול לפי נושא'))
    expect(await screen.findByText('שאלה לבדיקה')).toBeInTheDocument()

    fetchMock.mockRestore()
  })
})
