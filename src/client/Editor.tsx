import { useState, useEffect, useRef, useCallback } from 'react'
import { EditorView, basicSetup, ViewUpdate } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorState } from '@codemirror/state'
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

const BACKUP_KEY = 'editor-backup'

interface EditorBackup {
  path: string | null
  content: string
  timestamp: number
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

  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const savedContentRef = useRef<string>('')
  const currentFileRef = useRef<string | null>(null)

  const fileParam = new URLSearchParams(window.location.search).get('file')

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

    const state = EditorState.create({
      doc: '',
      extensions: [basicSetup, markdown(), EditorView.lineWrapping, updateListener],
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

  const connect = useCallback(async () => {
    if (!token) return

    setStatus('Connecting...')
    try {
      const fileList = await listFiles(token)
      setFiles(fileList)
      setConnected(true)
      storeToken(token)

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
  }, [token, fileParam, currentFile, dirty, loadFileWithApi])

  // Auto-load file from URL param immediately (read-only)
  useEffect(() => {
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

              <div className="panel-section">
                <button className="panel-btn-full" onClick={handleNewFile}>
                  New Note
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
