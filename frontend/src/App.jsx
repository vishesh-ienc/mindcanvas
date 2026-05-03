import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [note, setNote] = useState('')
  const [mood, setMood] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [allNotes, setAllNotes] = useState([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const textareaRef = useRef(null)

  const MOODS = [
    { value: 'great',   label: 'Great',   emoji: '😄' },
    { value: 'good',    label: 'Good',    emoji: '🙂' },
    { value: 'neutral', label: 'Neutral', emoji: '😐' },
    { value: 'low',     label: 'Low',     emoji: '😔' },
    { value: 'rough',   label: 'Rough',   emoji: '😣' },
  ]

  const MAX_CHARS = 500

  const handleDone = async () => {
    if (!note.trim()) return

    // 🔥 SEND TO BACKEND FIRST
    try {
      const response = await fetch("http://127.0.0.1:8000/note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: note,
          mood: mood
        })
      })


    } catch (error) {
      console.error("Error sending note:", error)
    }




    setIsDone(true)

    // Show toast
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2200)

    // Reset after brief feedback
    setTimeout(() => {
      setNote('')
      setMood(null)
      setIsDone(false)
      textareaRef.current?.focus()
    }, 1200)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleDone()
    }
  }

  const handleSummarise = async () => {
    setShowPanel(true)
    setLoadingNotes(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/notes')
      const data = await res.json()
      setAllNotes(data)
    } catch (err) {
      console.error('Failed to fetch notes:', err)
      setAllNotes([])
    } finally {
      setLoadingNotes(false)
    }
  }

  return (
    <div className="note-container">

      {/* Fixed top-right summarise button + dropdown */}
      <div className="summarise-wrapper">
        <button
          className="summarise-btn"
          onClick={() => setShowPanel(prev => !prev)}
          id="summarise-button"
        >
          ✦ Summarise
        </button>
        {showPanel && (
          <div className="summarise-dropdown">
            <p className="dropdown-label">Summary</p>
            <textarea
              className="summary-textarea"
              placeholder="Your summary will appear here..."
              readOnly
              value=""
            />
          </div>
        )}
      </div>

      <header className="note-header">
        <h1>MindCanvas</h1>
        <p>Capture a quick thought</p>
      </header>

      <div className={`note-card${mood ? ` mood-${mood}` : ''}`}>
        <textarea
          ref={textareaRef}
          className="note-textarea"
          placeholder="Write your note here..."
          value={note}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              setNote(e.target.value)
            }
          }}
          onKeyDown={handleKeyDown}
          autoFocus
          id="note-input"
        />

        {/* Mood selector */}
        <div className="mood-section">
          <p className="mood-label">How are you feeling right now?</p>
          <div className="mood-options">
            {MOODS.map((m) => (
              <button
                key={m.value}
                className={`mood-chip ${mood === m.value ? 'mood-chip--active' : ''}`}
                onClick={() => setMood(prev => prev === m.value ? null : m.value)}
                type="button"
                id={`mood-${m.value}`}
              >
                <span className="mood-emoji">{m.emoji}</span>
                <span className="mood-text">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="note-footer">
          <span className="char-count">
            {note.length} / {MAX_CHARS}
          </span>

          <button
            className={`done-btn ${isDone ? 'success' : ''}`}
            onClick={handleDone}
            disabled={!note.trim() || isDone}
            id="done-button"
          >
            <span className="btn-icon">{isDone ? '✓' : '✦'}</span>
            {isDone ? 'Saved' : 'Done'}
          </button>
        </div>
      </div>

      <div className={`toast ${showToast ? 'visible' : ''}`}>
        ✓ &nbsp;Note saved successfully
      </div>
    </div>
  )
}

export default App
