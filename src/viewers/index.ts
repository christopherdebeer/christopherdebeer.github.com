// Custom viewers registry
// Add new viewers here and they'll be available as viewer=name in code fences

import type { BuildViewer, ClientViewer } from './types.js'
import { toc } from './toc.js'
import { timeline } from './timeline.js'

// Build-time viewers (transform content to HTML at build time)
export const buildViewers: Record<string, BuildViewer> = {
  toc,
  timeline,
}

// Client-side viewers (render on client with JS)
export const clientViewers: Record<string, ClientViewer> = {
  // Example: graphviz/dot diagrams via viz.js
  // dot: {
  //   module: 'https://unpkg.com/viz.js@2.1.2/viz.js',
  //   init: `Viz().then(viz => { target.innerHTML = viz.renderSVGElement(content); })`
  // }
}

// Re-export types
export type { BuildViewer, ClientViewer, ViewerMeta, ViewerDef } from './types.js'
