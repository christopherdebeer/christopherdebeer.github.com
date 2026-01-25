// Table of Contents viewer - generates a TOC from markdown headings
import type { BuildViewer } from './types.js'

export const toc: BuildViewer = (content, meta) => {
  const lines = content.split('\n')
  const headings: { level: number; text: string; slug: string }[] = []

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2]
      const slug = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      headings.push({ level, text, slug })
    }
  }

  if (headings.length === 0) {
    return '<p class="toc-empty">No headings found</p>'
  }

  const minLevel = Math.min(...headings.map(h => h.level))

  let html = '<nav class="toc-viewer"><ul>'
  for (const h of headings) {
    const indent = h.level - minLevel
    const padding = indent > 0 ? ` style="padding-left: ${indent * 1}em"` : ''
    html += `<li${padding}><a href="#${h.slug}">${h.text}</a></li>`
  }
  html += '</ul></nav>'

  return html
}
