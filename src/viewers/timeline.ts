// Timeline viewer - renders date-prefixed lines as a visual timeline
import type { BuildViewer } from './types.js'

export const timeline: BuildViewer = (content, meta) => {
  const lines = content.trim().split('\n').filter(l => l.trim())
  const events: { date: string; text: string }[] = []

  for (const line of lines) {
    // Match lines like "2024-01-15: Event description" or "2024: Year event"
    const match = line.match(/^(\d{4}(?:-\d{2})?(?:-\d{2})?)[:\s]+(.+)$/)
    if (match) {
      events.push({ date: match[1], text: match[2].trim() })
    }
  }

  if (events.length === 0) {
    return '<p class="timeline-empty">No timeline events found</p>'
  }

  let html = '<div class="timeline-viewer">'
  for (const event of events) {
    html += `<div class="timeline-event">`
    html += `<span class="timeline-date">${event.date}</span>`
    html += `<span class="timeline-text">${event.text}</span>`
    html += `</div>`
  }
  html += '</div>'

  return html
}
