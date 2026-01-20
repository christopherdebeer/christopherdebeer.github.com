import { useState, useEffect, useRef, useCallback } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorState } from '@codemirror/state'
import {
  listFiles,
  getFile,
  saveFile,
  createFile,
  getStoredToken,
  storeToken,
  type GitHubFile,
} from './github'

export function Editor() {
  const [token, setToken] = useState(getStoredToken)
  const [connected, setConnected] = useState(false)
  const [files, setFiles] = useState<GitHubFile[]>([])
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [currentSha, setCurrentSha] = useState<string | null>(null)
  const [status, setStatus] = useState('Enter a PAT with repo scope to edit files.')
  const [fileMeta, setFileMeta] = useState('')
  const [saving, setSaving] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  const fileParam = new URLSearchParams(window.location.search).get('file')

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return

    const state = EditorState.create({
      doc: '',
      extensions: [basicSetup, markdown(), EditorView.lineWrapping],
    })

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    })

    return () => {
      viewRef.current?.destroy()
      viewRef.current = null
    }
  }, [connected])

  const loadFile = useCallback(
    async (path: string) => {
      if (!path || !token) {
        viewRef.current?.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: '' },
        })
        setCurrentFile(null)
        setCurrentSha(null)
        setFileMeta('')
        return
      }

      setFileMeta('Loading...')
      try {
        const { content, sha } = await getFile(token, path)
        viewRef.current?.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
        })
        setCurrentFile(path)
        setCurrentSha(sha)
        setFileMeta(path)
      } catch (e) {
        setFileMeta(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
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
      setStatus(`Connected. ${fileList.length} files found.`)
      storeToken(token)

      // Auto-load file if specified in URL
      if (fileParam && fileList.some((f) => f.path === fileParam)) {
        setTimeout(() => loadFile(fileParam), 100)
      }
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }, [token, fileParam, loadFile])

  // Auto-connect if token stored and file param provided
  useEffect(() => {
    if (token && fileParam && !connected) {
      connect()
    }
  }, [])

  const handleSave = async () => {
    if (!currentFile || !currentSha || !viewRef.current) return

    setSaving(true)
    setFileMeta('Saving...')
    try {
      const content = viewRef.current.state.doc.toString()
      const result = await saveFile(
        token,
        currentFile,
        content,
        currentSha,
        `Update ${currentFile.split('/').pop()}`
      )
      setCurrentSha(result.sha)
      setFileMeta(`${currentFile} (saved)`)
    } catch (e) {
      setFileMeta(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
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
    const path = `src/${slug}.md`
    const template = `---
title: ${name}
status: seedling
created: ${new Date().toISOString().split('T')[0]}
---

`

    setFileMeta('Creating...')
    try {
      await createFile(token, path, template, `Add ${slug}.md`)
      const fileList = await listFiles(token)
      setFiles(fileList)
      await loadFile(path)
    } catch (e) {
      setFileMeta(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="editor-container">
      <h1>Edit Garden</h1>

      <div>
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
          <button onClick={connect} disabled={connected}>
            Connect
          </button>
        </div>
        <div className="status">{status}</div>
      </div>

      {connected && (
        <div style={{ marginTop: '1rem' }}>
          <div className="row">
            <select
              id="files"
              value={currentFile || ''}
              onChange={(e) => loadFile(e.target.value)}
            >
              <option value="">Select a file...</option>
              {files.map((f) => (
                <option key={f.path} value={f.path}>
                  {f.name}
                </option>
              ))}
            </select>
            <div className="button-group">
              <button onClick={handleSave} disabled={!currentFile || saving}>
                Save
              </button>
              <button onClick={handleNewFile}>New</button>
            </div>
          </div>
          <div className="file-meta">{fileMeta}</div>
          <div ref={editorRef} />
        </div>
      )}
    </div>
  )
}
