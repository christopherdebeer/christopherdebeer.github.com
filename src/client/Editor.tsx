import { useState, useEffect, useRef, useCallback } from 'react'
import { EditorView, basicSetup, ViewUpdate } from 'codemirror'
import { keymap } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { EditorState, Compartment } from '@codemirror/state'
import { autocompletion, CompletionContext, CompletionResult, acceptCompletion } from '@codemirror/autocomplete'
import {
  listFiles,
  getFile,
  getFileRaw,
  saveFile,
  createFile,
  getStoredToken,
  storeToken,
  type GitHubFile,
} from './github'

// Compartment for dynamically updating completions when file list changes
const completionCompartment = new Compartment()

// Create wikilink autocomplete source
function createWikilinkCompletions(files: GitHubFile[]) {
  // Extract slugs from file paths (docs/slug.md -> slug)
  const slugs = files
    .map(f => f.path.replace(/^docs\//, '').replace(/\.md$/, ''))
    .sort()

  return (context: CompletionContext): CompletionResult | null => {
    // Find if we're inside a wikilink: [[...
    const line = context.state.doc.lineAt(context.pos)
    const lineText = line.text
    const cursorInLine = context.pos - line.from

    // Look backwards for [[ that isn't closed
    let start = -1
    for (let i = cursorInLine - 1; i >= 1; i--) {
      if (lineText[i] === '[' && lineText[i - 1] === '[') {
        // Check if there's a ]] before cursor
        const afterOpen = lineText.slice(i + 1, cursorInLine)
        if (!afterOpen.includes(']]')) {
          start = i + 1
          break
        }
      }
      // Stop if we hit ]]
      if (lineText[i] === ']' && lineText[i - 1] === ']') break
    }

    if (start === -1) return null

    // Get the text typed so far
    const typed = lineText.slice(start, cursorInLine).toLowerCase()

    // Filter and sort slugs by match quality
    const matches = slugs
      .filter(slug => slug.toLowerCase().includes(typed))
      .sort((a, b) => {
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()
        // Prioritize prefix matches
        const aPrefix = aLower.startsWith(typed)
        const bPrefix = bLower.startsWith(typed)
        if (aPrefix && !bPrefix) return -1
        if (!aPrefix && bPrefix) return 1
        return a.localeCompare(b)
      })
      .slice(0, 20)

    if (matches.length === 0) return null

    return {
      from: line.from + start,
      options: matches.map(slug => ({
        label: slug,
        type: 'text',
        apply: slug,
      })),
    }
  }
}

const BACKUP_KEY = 'editor-backup'

interface EditorBackup {
  path: string | null
  content: string
  timestamp: number
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// Get the log file path for today
function getTodayLogPath(): string {
  return `docs/log/${getTodayDate()}.md`
}

// Get week number for a date
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Generate log template for a new day
function generateLogTemplate(date: string): string {
  const d = new Date(date + 'T00:00:00Z')
  const year = d.getUTCFullYear()
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0')
  const week = getWeekNumber(d).toString().padStart(2, '0')

  return `---
title: ${date}
created: ${date}
---

[[log/${year}|${year}]] / [[log/${year}-${month}|${month}]] / [[log/${year}-w${week}|W${week}]]

`
}

function saveBackup(path: string | null, content: string): void {
  const backup: EditorBackup = { path, content, timestamp: Date.now() }
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
}

function loadBackup(): EditorBackup | null {
  const data = localStorage.getItem(BACKUP_KEY)
  if (!data) return null
  try {
    return JSON.parse(data) as EditorBackup
  } catch {
    return null
  }
}

function clearBackup(): void {
  localStorage.removeItem(BACKUP_KEY)
}

// Extract filename from path
function getFileName(path: string | null): string {
  if (!path) return 'Untitled'
  const name = path.split('/').pop() || path
  return name.replace(/\.md$/, '')
}

export function Editor() {
  const [token, setToken] = useState(getStoredToken)
  const [connected, setConnected] = useState(false)
  const [files, setFiles] = useState<GitHubFile[]>([])
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [currentSha, setCurrentSha] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [captureMode, setCaptureMode] = useState(false)
  const [captureContent, setCaptureContent] = useState<string | null>(null)

  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const savedContentRef = useRef<string>('')
  const currentFileRef = useRef<string | null>(null)

  const params = new URLSearchParams(window.location.search)
  const fileParam = params.get('file')
  const captureParam = params.get('capture')

  // Keep currentFileRef in sync
  useEffect(() => {
    currentFileRef.current = currentFile
  }, [currentFile])

  // Initialize CodeMirror immediately
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return

    const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        const content = update.state.doc.toString()
        const isDirty = content !== savedContentRef.current
        setDirty(isDirty)
        if (isDirty) {
          saveBackup(currentFileRef.current, content)
        }
      }
    })

    // Wikilink autocomplete with Tab to accept
    const wikilinkAutocomplete = autocompletion({
      override: [createWikilinkCompletions([])],
      activateOnTyping: true,
    })

    const state = EditorState.create({
      doc: '',
      extensions: [
        basicSetup,
        markdown(),
        EditorView.lineWrapping,
        updateListener,
        completionCompartment.of(wikilinkAutocomplete),
        // Tab accepts completion when menu is open
        keymap.of([{ key: 'Tab', run: acceptCompletion }]),
      ],
    })

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    })

    // Check for backup to restore
    const backup = loadBackup()
    if (backup && backup.content) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: backup.content },
      })
      setDirty(true)
      if (backup.path) {
        setCurrentFile(backup.path)
        setStatus('Restored from backup')
      }
    }

    return () => {
      viewRef.current?.destroy()
      viewRef.current = null
    }
  }, [])

  // Update autocomplete when files list changes
  useEffect(() => {
    if (!viewRef.current || files.length === 0) return

    const wikilinkAutocomplete = autocompletion({
      override: [createWikilinkCompletions(files)],
      activateOnTyping: true,
    })

    viewRef.current.dispatch({
      effects: completionCompartment.reconfigure(wikilinkAutocomplete),
    })
  }, [files])

  // Load file from raw endpoint (no auth required)
  const loadFileRaw = useCallback(async (path: string) => {
    if (!path) return

    setStatus('Loading...')
    setReadOnly(true)
    try {
      const content = await getFileRaw(path)
      savedContentRef.current = content
      viewRef.current?.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
      })
      setCurrentFile(path)
      setCurrentSha(null)
      setDirty(false)
      clearBackup()
      setStatus(content ? 'Read-only' : 'New')
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }, [])

  // Load file with API (gets SHA for editing)
  const loadFileWithApi = useCallback(
    async (path: string) => {
      if (!path || !token) {
        savedContentRef.current = ''
        viewRef.current?.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: '' },
        })
        setCurrentFile(null)
        setCurrentSha(null)
        setDirty(false)
        setReadOnly(false)
        return
      }

      setStatus('Loading...')
      try {
        const { content, sha } = await getFile(token, path)
        savedContentRef.current = content
        viewRef.current?.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
        })
        setCurrentFile(path)
        setCurrentSha(sha)
        setDirty(false)
        clearBackup()
        setReadOnly(false)
        setStatus('')
        setPanelOpen(false)
      } catch (e) {
        // If API fails, fall back to raw
        if ((e as Error).message.includes('404')) {
          savedContentRef.current = ''
          setCurrentFile(path)
          setCurrentSha(null)
          setDirty(false)
          setReadOnly(false)
          setStatus('New')
        } else {
          setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
        }
      }
    },
    [token]
  )

  // Handle capture mode - load today's log and prepare to append
  // NOTE: Must be defined before connect() which depends on it
  const initCaptureMode = useCallback(async () => {
    if (!token) {
      setPanelOpen(true)
      setStatus('Connect to capture')
      return
    }

    const logPath = getTodayLogPath()
    const today = getTodayDate()
    setCaptureMode(true)
    setStatus('Loading log...')

    try {
      // Try to load existing log file
      const { content, sha } = await getFile(token, logPath)
      savedContentRef.current = content

      // Append capture content
      const capturedText = captureContent || ''
      const newContent = content.trimEnd() + '\n\n' + capturedText

      viewRef.current?.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: newContent },
      })
      setCurrentFile(logPath)
      setCurrentSha(sha)
      setDirty(true)
      setReadOnly(false)
      setStatus('Append to log')
    } catch (e) {
      // File doesn't exist - create new log
      const template = generateLogTemplate(today)
      const capturedText = captureContent || ''
      const newContent = template + capturedText

      savedContentRef.current = ''
      viewRef.current?.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: newContent },
      })
      setCurrentFile(logPath)
      setCurrentSha(null)
      setDirty(true)
      setReadOnly(false)
      setStatus('New log')
    }

    // Clear URL params after processing
    window.history.replaceState(null, '', '/edit.html')
  }, [token, captureContent])

  const connect = useCallback(async () => {
    if (!token) return

    setStatus('Connecting...')
    try {
      const fileList = await listFiles(token)
      setFiles(fileList)
      setConnected(true)
      storeToken(token)

      // Handle capture mode after connecting
      if (captureMode) {
        await initCaptureMode()
        return
      }

      const targetFile = currentFile || fileParam
      if (targetFile && dirty) {
        // Preserve dirty edits - just get SHA for saving
        try {
          const { sha } = await getFile(token, targetFile)
          setCurrentSha(sha)
          setReadOnly(false)
          setStatus('Connected')
        } catch {
          // File doesn't exist yet, that's fine
          setCurrentSha(null)
          setReadOnly(false)
          setStatus('Ready to create')
        }
      } else if (targetFile) {
        // No dirty edits, load fresh
        await loadFileWithApi(targetFile)
        setStatus('')
      } else {
        setStatus(`${fileList.length} files`)
      }
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }, [token, fileParam, currentFile, dirty, loadFileWithApi, captureMode, initCaptureMode])

  // Auto-load file from URL param immediately (read-only)
  useEffect(() => {
    // Handle capture mode
    if (captureParam) {
      const content = captureParam === 'today' ? '' : decodeURIComponent(captureParam)
      setCaptureContent(content)
      setCaptureMode(true)

      if (token) {
        initCaptureMode()
      } else {
        setPanelOpen(true)
        setStatus('Connect to capture')
      }
      return
    }

    if (fileParam && !currentFile) {
      // If we have a stored token, try to connect and load with API
      if (token) {
        connect()
      } else {
        // Otherwise load read-only
        loadFileRaw(fileParam)
        setPanelOpen(true)
      }
    } else if (!fileParam && !token) {
      setPanelOpen(true)
    }
  }, [])

  const handleSave = async () => {
    if (!currentFile || !viewRef.current || !token) return

    setSaving(true)
    setStatus('Saving...')
    try {
      const content = viewRef.current.state.doc.toString()
      if (currentSha) {
        // Update existing file
        const result = await saveFile(
          token,
          currentFile,
          content,
          currentSha,
          `Update ${currentFile.split('/').pop()}`
        )
        setCurrentSha(result.sha)
      } else {
        // Create new file
        const result = await createFile(
          token,
          currentFile,
          content,
          `Add ${currentFile.split('/').pop()}`
        )
        setCurrentSha(result.sha)
        // Refresh file list
        const fileList = await listFiles(token)
        setFiles(fileList)
      }
      savedContentRef.current = content
      setDirty(false)
      clearBackup()
      setStatus('Saved')
      setReadOnly(false)
      // Clear status after delay
      setTimeout(() => setStatus(''), 2000)
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
    setSaving(false)
  }

  const handleNewFile = async () => {
    const name = prompt('Note title:')
    if (!name) return

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    const path = `docs/${slug}.md`
    const template = `---
title: ${name}
status: seedling
created: ${new Date().toISOString().split('T')[0]}
---

`

    savedContentRef.current = ''
    viewRef.current?.dispatch({
      changes: { from: 0, to: viewRef.current.state.doc.length, insert: template },
    })
    setCurrentFile(path)
    setCurrentSha(null)
    setDirty(true)
    saveBackup(path, template)
    setReadOnly(false)
    setStatus('New')
    setPanelOpen(false)
  }

  const handleBack = () => {
    if (currentFile) {
      const slug = currentFile.replace(/^docs\//, '').replace(/\.md$/, '')
      window.location.href = `/${slug}.html`
    } else {
      window.location.href = '/'
    }
  }

  const canSave = connected && currentFile && !saving && !readOnly
  const canCreate = connected && currentFile && !currentSha && !saving
  const showSaveButton = canSave || canCreate

  return (
    <div className="editor-app">
      {/* Fixed toolbar */}
      <header className="editor-toolbar">
        <button className="toolbar-btn back-btn" onClick={handleBack} title="Back">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4L6 10L12 16" />
          </svg>
        </button>

        <div className="toolbar-title">
          <span className="file-name">{dirty ? '* ' : ''}{getFileName(currentFile)}</span>
          {status && <span className="toolbar-status">{status}</span>}
        </div>

        <div className="toolbar-actions">
          {showSaveButton && (
            <button
              className="toolbar-btn save-btn"
              onClick={handleSave}
              disabled={saving}
              title={canCreate ? 'Create' : 'Save'}
            >
              {saving ? (
                <span className="saving-indicator" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 10L8 13L15 6" />
                </svg>
              )}
            </button>
          )}

          <button
            className={`toolbar-btn menu-btn ${panelOpen ? 'active' : ''}`}
            onClick={() => setPanelOpen(!panelOpen)}
            title="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* Settings panel */}
      {panelOpen && (
        <div className="settings-panel">
          <div className="panel-section">
            <label className="panel-label">GitHub Token</label>
            <div className="panel-row">
              <input
                type="password"
                className="panel-input"
                placeholder="Personal access token"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value)
                  storeToken(e.target.value)
                }}
              />
              <button
                className="panel-btn"
                onClick={connect}
                disabled={connected || !token}
              >
                {connected ? 'Connected' : 'Connect'}
              </button>
            </div>
          </div>

          {connected && (
            <>
              <div className="panel-section">
                <label className="panel-label">Open File</label>
                <select
                  className="panel-select"
                  value={currentFile || ''}
                  onChange={(e) => loadFileWithApi(e.target.value)}
                >
                  <option value="">Select...</option>
                  {files.map((f) => (
                    <option key={f.path} value={f.path}>
                      {f.name.replace(/\.md$/, '')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="panel-section panel-actions">
                <button className="panel-btn-full" onClick={handleNewFile}>
                  New Note
                </button>
                <button
                  className="panel-btn-full panel-btn-secondary"
                  onClick={() => {
                    setCaptureMode(true)
                    setCaptureContent('')
                    initCaptureMode()
                  }}
                >
                  Today's Log
                </button>
              </div>
            </>
          )}

          {!connected && (
            <p className="panel-hint">
              Enter a GitHub PAT with repo scope to edit files.
            </p>
          )}
        </div>
      )}

      {/* Editor area */}
      <div className="editor-area" ref={editorRef} />
    </div>
  )
}
