import { useState, useRef, useEffect } from 'react'
import './App.css'

const MOODS = [
  { value: 'great',   label: 'Great',   emoji: '😄' },
  { value: 'good',    label: 'Good',    emoji: '🙂' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'low',     label: 'Low',     emoji: '😔' },
  { value: 'rough',   label: 'Rough',   emoji: '😣' },
]

const MAX_CHARS = 500

const formatDate = (date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))

function App() {
  const [note, setNote]             = useState('')
  const [title, setTitle]           = useState('')
  const [mood, setMood]             = useState(null)
  const [isEditing, setIsEditing]   = useState(false)
  const [showToast, setShowToast]   = useState(false)
  const [savedNotes, setSavedNotes] = useState([])
  const [noteToDelete, setNoteToDelete] = useState(null)
  const [viewingNote, setViewingNote]   = useState(null)
  const [viewEditTitle, setViewEditTitle]     = useState('')
  const [viewEditContent, setViewEditContent] = useState('')
  const [viewEditMood, setViewEditMood]       = useState(null)
  const [now, setNow]               = useState(new Date())

  const titleRef       = useRef(null)
  const textareaRef    = useRef(null)
  const editorRef      = useRef(null)
  const viewContentRef = useRef(null)

  // Tick the clock while editing so the timestamp stays live
  useEffect(() => {
    if (!isEditing) return
    setNow(new Date()) // Sync immediately when opened
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [isEditing])

  // Auto-focus title when editor opens
  useEffect(() => {
    if (isEditing) setTimeout(() => titleRef.current?.focus(), 50)
  }, [isEditing])

  // Click outside → auto-save or discard
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editorRef.current && !editorRef.current.contains(e.target)) {
        if (note.trim()) handleDone()
        else closeEditor()
      }
    }
    if (isEditing) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing, note, mood, title])

  const closeEditor = () => {
    setIsEditing(false)
    setNote('')
    setTitle('')
    setMood(null)
  }

  const handleDone = async () => {
    if (!note.trim()) { closeEditor(); return }
    const ts = new Date()
    try {
      const res = await fetch('http://127.0.0.1:8000/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: note, title: title.trim() || null, mood }),
      })
      const data = await res.json()
      const backendId = data.id ?? Date.now()
      setSavedNotes(prev => [{ id: backendId, title: title.trim() || null, content: note, mood, created_at: ts }, ...prev])
    } catch (err) {
      console.error('Error saving note:', err)
      setSavedNotes(prev => [{ id: Date.now(), title: title.trim() || null, content: note, mood, created_at: ts }, ...prev])
    }

    closeEditor()
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2200)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleDone()
    if (e.key === 'Escape') closeEditor()
  }

  const deleteNote = (n, e) => {
    e.stopPropagation()
    setNoteToDelete(n)
  }

  const openNote = (n) => {
    setViewingNote(n)
    setViewEditTitle(n.title || '')
    setViewEditContent(n.content)
    setViewEditMood(n.mood)
  }

  const saveNoteEdit = async () => {
    if (!viewEditContent.trim()) return
    const updated = {
      ...viewingNote,
      title:   viewEditTitle.trim() || null,
      content: viewEditContent,
      mood:    viewEditMood,
    }
    try {
      await fetch(`http://127.0.0.1:8000/note/${viewingNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: updated.title, content: updated.content, mood: updated.mood }),
      })
    } catch (err) {
      console.error('Error updating note:', err)
    }
    setSavedNotes(prev => prev.map(n => n.id === viewingNote.id ? updated : n))
    setViewingNote(null)
  }

  const confirmDelete = async () => {
    if (!noteToDelete) return
    try {
      await fetch(`http://127.0.0.1:8000/note/${noteToDelete.id}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Error deleting note:', err)
    }
    setSavedNotes(prev => prev.filter(n => n.id !== noteToDelete.id))
    setNoteToDelete(null)
  }

  return (
    <div className="app-layout">

      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Antar</h1>
        </div>
        <nav className="header-nav">
          <a href="#" className="nav-link active">Home</a>
          <a href="#" className="nav-link">Journal</a>
          <a href="#" className="nav-link">Analytics</a>
          <a href="#" className="nav-link">Settings</a>
          <a href="#" className="nav-link">Profile</a>
        </nav>
      </header>

      {/* ── Note input area ── */}
      <main className={`app-main${savedNotes.length > 0 ? ' has-notes' : ''}`}>
        <div className="input-area input-area--hero">

          {/* Hero heading — always visible */}
          <div className={`hero-prompt${isEditing ? ' hero-prompt--editing' : ''}`}>
            <p className="hero-title">What's on your mind?</p>
            <p className="hero-subtitle">Capture a thought, log your mood, reflect later.</p>
          </div>

          {!isEditing ? (
            /* Collapsed bar */
            <div
              className="note-collapsed-bar note-collapsed-bar--hero"
              onClick={() => setIsEditing(true)}
              id="note-collapsed-bar"
            >
              <div className="collapsed-bar-inner">
                <span className="collapsed-edit-icon">✏</span>
                <span className="collapsed-placeholder">Drop an idea, capture a moment…</span>
                <span className="collapsed-icon">✦</span>
              </div>
            </div>
          ) : (
            /* Expanded editor */
            <div className="editor-expand-wrapper">
              <div
                className={`note-card${mood ? ` mood-${mood}` : ''}`}
                ref={editorRef}
              >
                {/* Editor header: title + timestamp */}
                <div className="editor-header">
                  <input
                    ref={titleRef}
                    className="note-title-input"
                    placeholder="Title"
                    autoComplete="off"
                    spellCheck="false"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') { e.preventDefault(); textareaRef.current?.focus() }
                      if (e.key === 'Escape') closeEditor()
                    }}
                    maxLength={80}
                    id="note-title-input"
                  />
                  <span className="editor-timestamp">{formatDate(now)}</span>
                </div>

                <textarea
                  ref={textareaRef}
                  className="note-textarea"
                  placeholder="Write your note here…"
                  value={note}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS) setNote(e.target.value)
                  }}
                  onKeyDown={handleKeyDown}
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
                  <span className="char-count">{note.length} / {MAX_CHARS}</span>
                  <div className="footer-actions">
                    <button className="close-btn" onClick={closeEditor} type="button">
                      Discard
                    </button>
                    <button
                      className="done-btn"
                      onClick={handleDone}
                      disabled={!note.trim()}
                      id="done-button"
                    >
                      <span className="btn-icon">✦</span>
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Saved notes grid ── */}
        {savedNotes.length > 0 && (
          <section className="notes-grid-section">
            <p className="notes-grid-label">Notes</p>
            <div className="notes-grid">
              {savedNotes.map((n) => {
                const moodMeta = MOODS.find(m => m.value === n.mood)
                return (
                  <div
                    key={n.id}
                    className={`saved-note-card${n.mood ? ` mood-${n.mood}` : ''}`}
                    id={`saved-note-${n.id}`}
                    onClick={() => openNote(n)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Card header: title + timestamp */}
                    <div className="card-header">
                      <span className="card-title">{n.title || '\u00A0'}</span>
                      <span className="card-timestamp">{formatDate(n.created_at)}</span>
                    </div>

                    {/* Content preview — always same height */}
                    <p className="saved-note-content">{n.content}</p>

                    {/* Footer: mood badge + delete */}
                    <div className="saved-note-footer">
                      {moodMeta ? (
                        <span className="saved-note-mood-badge" title={moodMeta.label}>
                          {moodMeta.emoji}
                        </span>
                      ) : <span />}
                      <button
                        className="delete-note-btn"
                        onClick={(e) => deleteNote(n, e)}
                        title="Delete note"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* ── Note viewer / editor ── */}
      {viewingNote && (
        <div className="modal-overlay" onClick={() => setViewingNote(null)}>
          <div
            className={`note-view-card${viewEditMood ? ` mood-${viewEditMood}` : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: editable title + timestamp + close */}
            <div className="note-view-header">
              <div className="note-view-meta" style={{ flex: 1 }}>
                <input
                  className="note-view-title-input"
                  placeholder="Title (optional)"
                  autoComplete="off"
                  spellCheck="false"
                  value={viewEditTitle}
                  onChange={(e) => setViewEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); viewContentRef.current?.focus() }
                  }}
                  maxLength={80}
                />
                <span className="note-view-time">{formatDate(viewingNote.created_at)}</span>
              </div>
              <button className="note-view-close" onClick={() => setViewingNote(null)}>✕</button>
            </div>

            {/* Editable content */}
            <textarea
              ref={viewContentRef}
              className="note-view-textarea"
              value={viewEditContent}
              onChange={(e) => setViewEditContent(e.target.value)}
              placeholder="Write your note here…"
            />

            {/* Mood selector */}
            <div className="note-view-mood-section">
              <div className="mood-options">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    className={`mood-chip ${viewEditMood === m.value ? 'mood-chip--active' : ''}`}
                    onClick={() => setViewEditMood(prev => prev === m.value ? null : m.value)}
                    type="button"
                  >
                    <span className="mood-emoji">{m.emoji}</span>
                    <span className="mood-text">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer: Save + Close */}
            <div className="note-view-actions">
              <button className="close-btn" onClick={() => setViewingNote(null)}>Close</button>
              <button
                className="done-btn"
                onClick={saveNoteEdit}
                disabled={
                  !viewEditContent.trim() || 
                  (viewEditTitle.trim() === (viewingNote.title || '') && 
                   viewEditContent === viewingNote.content && 
                   viewEditMood === viewingNote.mood)
                }
              >
                <span className="btn-icon">✦</span> Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation modal ── */}
      {noteToDelete && (
        <div className="modal-overlay" onClick={() => setNoteToDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Delete this note?</p>
            {noteToDelete.title && (
              <p className="modal-note-title">"{noteToDelete.title}"</p>
            )}
            <p className="modal-preview">
              {noteToDelete.content.slice(0, 100)}{noteToDelete.content.length > 100 ? '…' : ''}
            </p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setNoteToDelete(null)}>
                Cancel
              </button>
              <button className="modal-confirm" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      <div className={`toast ${showToast ? 'visible' : ''}`}>
        ✓&nbsp;Note saved
      </div>
    </div>
  )
}

export default App
