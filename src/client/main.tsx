import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Editor } from './Editor'
import '../styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Editor />
  </StrictMode>
)
