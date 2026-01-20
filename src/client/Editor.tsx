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
        setStatus('Restored unsaved changes from backup.')
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
      setStatus(content ? '(read-only)' : '(new file)')
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
      } catch (e) {
        // If API fails, fall back to raw
        if ((e as Error).message.includes('404')) {
          savedContentRef.current = ''
          setCurrentFile(path)
          setCurrentSha(null)
          setDirty(false)
          setReadOnly(false)
          setStatus('(new file)')
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
          setStatus(`Connected. Unsaved changes preserved.`)
        } catch (e) {
          // File doesn't exist yet, that's fine
          setCurrentSha(null)
          setReadOnly(false)
          setStatus(`Connected. Ready to create file.`)
        }
      } else if (targetFile) {
        // No dirty edits, load fresh
        await loadFileWithApi(targetFile)
        setStatus(`Connected. ${fileList.length} files found.`)
      } else {
        setStatus(`Connected. ${fileList.length} files found.`)
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
        setStatus('Enter a PAT with repo scope to save changes.')
      }
    } else if (!fileParam) {
      setStatus('Enter a PAT with repo scope to edit files.')
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
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
    setSaving(false)
  }

  const handleNewFile = async () => {
    const name = prompt('Filename (without .md):')
    if (!name) return

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
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
    setStatus('(new file)')
  }

  const canSave = connected && currentFile && !saving && !readOnly
  const canCreate = connected && currentFile && !currentSha && !saving

  return (
    <div className="editor-container">
      <header className="editor-header">
        <a href="/" className="site-name">Garden</a>
        <span className="editor-title">Edit</span>
      </header>

      <div className="auth-section">
        <div className="row">
          <input
            type="password"
            placeholder="GitHub Personal Access Token"
            value={token}
            onChange={(e) => {
              setToken(e.target.value)
              storeToken(e.target.value)
            }}
          />
          <button onClick={connect} disabled={connected || !token}>
            {connected ? 'Connected' : 'Connect'}
          </button>
        </div>
        {status && <div className="status">{status}</div>}
      </div>

      <div className="editor-main">
        {connected && (
          <div className="row">
            <select
              id="files"
              value={currentFile || ''}
              onChange={(e) => loadFileWithApi(e.target.value)}
            >
              <option value="">Select a file...</option>
              {files.map((f) => (
                <option key={f.path} value={f.path}>
                  {f.name}
                </option>
              ))}
            </select>
            <div className="button-group">
              <button onClick={handleSave} disabled={!canSave && !canCreate}>
                {canCreate ? 'Create' : 'Save'}
              </button>
              <button onClick={handleNewFile}>New</button>
            </div>
          </div>
        )}
        {!connected && currentFile && (
          <div className="row">
            <div className="button-group">
              <button onClick={handleSave} disabled={!connected}>
                Save
              </button>
            </div>
          </div>
        )}
        {currentFile && (
          <div className="file-meta">
            {dirty ? '* ' : ''}{currentFile}{status ? ` ${status}` : ''}
          </div>
        )}
        <div ref={editorRef} />
      </div>
    </div>
  )
}
