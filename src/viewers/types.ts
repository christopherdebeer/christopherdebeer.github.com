// Viewer transform function type
export interface ViewerMeta {
  lang: string
  filename?: string
  tags: string[]
  directives: string[]
  attrs: Record<string, string>
  source?: string
  output?: string
  isOutput: boolean
  raw: string
}

// Build-time viewer: transforms content to HTML at build time
export type BuildViewer = (content: string, meta: ViewerMeta) => string

// Client-side viewer config: specifies how to render on client
export interface ClientViewer {
  // Module to import (CDN URL or local path)
  module: string
  // Initialization code template (receives: block, source, target, content)
  init: string
}

// Viewer definition can be either build-time or client-side
export type ViewerDef =
  | { type: 'build'; transform: BuildViewer }
  | { type: 'client'; config: ClientViewer }
