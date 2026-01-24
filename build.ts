import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'fs'
import { join, dirname, relative } from 'path'
import { marked } from 'marked'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Page } from './src/components/Page.js'
import { StubPage } from './src/components/StubPage.js'
import { LogPage } from './src/components/LogPage.js'
import type { BacklinkItem, PageMeta, PageData, LinkInfo, LogPageMeta, DateInfo } from './src/components/types.js'

const SRC = './docs'
const OUT = './dist'

// ============================================================================
// Date utilities for log system
// ============================================================================

// Get ISO week number for a date
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Parse a date string (YYYY-MM-DD) into DateInfo
function parseDateInfo(dateStr: string): DateInfo | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const [, year, month, day] = match
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`)
  if (isNaN(date.getTime())) return null

  const weekNum = getWeekNumber(date)
  const weekStr = `${year}-w${weekNum.toString().padStart(2, '0')}`

  return {
    date: dateStr,
    year,
    month: `${year}-${month}`,
    week: weekStr,
  }
}

// Get all date slugs a note should link to based on its dates
function getDateSlugs(meta: PageMeta): { created: DateInfo | null; updated: DateInfo | null } {
  return {
    created: meta.created ? parseDateInfo(meta.created) : null,
    updated: meta.updated ? parseDateInfo(meta.updated) : null,
  }
}

// Log entry tracking which notes were created/updated on which dates
interface LogEntry {
  slug: string
  title: string
}

interface LogData {
  // Maps date slug (e.g., "2024-01-15", "2024-w03", "2024-01", "2024") to notes
  created: Map<string, LogEntry[]>
  updated: Map<string, LogEntry[]>
  // All date slugs that have activity
  allDates: Set<string>
}

// Parse YAML frontmatter (minimal implementation)
function parseFrontmatter(content: string): { meta: PageMeta; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }

  const meta: Record<string, string> = {}
  match[1].split('\n').forEach((line) => {
    const [key, ...rest] = line.split(':')
    if (key && rest.length) meta[key.trim()] = rest.join(':').trim()
  })

  return { meta: meta as PageMeta, body: match[2] }
}

// Get all .md files recursively (excluding components dir)
function getFiles(dir: string, files: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const path = join(dir, f)
    if (statSync(path).isDirectory()) {
      if (f !== 'components') getFiles(path, files)
    } else if (f.endsWith('.md')) {
      files.push(path)
    }
  }
  return files
}

// Convert path to slug (src/foo/bar.md -> foo/bar)
const toSlug = (p: string): string => relative(SRC, p).replace(/\.md$/, '')

// Convert slug to output path
const toOut = (slug: string): string => join(OUT, slug + '.html')

// Extract [[wiki-links]] from content
function extractLinks(content: string): LinkInfo[] {
  const links: LinkInfo[] = []
  content.replace(/\[\[([^\]]+)\]\]/g, (_, link: string) => {
    const parts = link.split('|')
    const slug = parts[0].trim()
    const linkText = parts[1]?.trim() || null
    links.push({ slug, linkText })
    return ''
  })
  return links
}

// Convert [[wiki-links]] to HTML links
function convertLinks(content: string, allSlugs: Set<string>): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, link: string) => {
    const parts = link.split('|')
    const slug = parts[0].trim()
    const text = (parts[1] || parts[0]).trim()
    const exists = allSlugs.has(slug)
    const cls = exists ? '' : ' class="broken"'
    return `<a href="/${slug}.html"${cls}>${text}</a>`
  })
}

// Build slug collision map (for disambiguation)
function buildSlugCollisions(allSlugs: Set<string>): Map<string, string[]> {
  const byBaseName = new Map<string, string[]>()
  for (const slug of allSlugs) {
    const baseName = slug.split('/').pop()!
    if (!byBaseName.has(baseName)) byBaseName.set(baseName, [])
    byBaseName.get(baseName)!.push(slug)
  }
  // Only return entries with collisions
  const collisions = new Map<string, string[]>()
  for (const [name, slugs] of byBaseName) {
    if (slugs.length > 1) collisions.set(name, slugs)
  }
  return collisions
}

// Main build
function build(): void {
  // Clean output
  if (existsSync(OUT)) rmSync(OUT, { recursive: true })
  mkdirSync(OUT, { recursive: true })

  // Parse all files
  const files = getFiles(SRC)
  const pages = new Map<string, PageData>()
  const allSlugs = new Set<string>()

  for (const file of files) {
    const slug = toSlug(file)
    allSlugs.add(slug)
    const raw = readFileSync(file, 'utf8')
    const { meta, body } = parseFrontmatter(raw)
    const links = extractLinks(body)
    pages.set(slug, { slug, meta, body, links, file })
  }

  // Backlink entry: source page slug + the link text used (if any)
  interface BacklinkEntry {
    sourceSlug: string
    linkText: string | null
  }

  // Build backlinks index (deduplicated by source slug, keeps first linkText)
  const backlinks = new Map<string, BacklinkEntry[]>()
  for (const [slug, page] of pages) {
    const seen = new Set<string>() // dedupe multiple links to same target
    for (const link of page.links) {
      if (seen.has(link.slug)) continue
      seen.add(link.slug)
      if (!backlinks.has(link.slug)) backlinks.set(link.slug, [])
      backlinks.get(link.slug)!.push({ sourceSlug: slug, linkText: link.linkText })
    }
  }

  // Find missing slugs (linked but no file exists)
  const missingSlugs = new Set<string>()
  for (const page of pages.values()) {
    for (const link of page.links) {
      if (!allSlugs.has(link.slug)) {
        missingSlugs.add(link.slug)
      }
    }
  }

  // Detect slug collisions for disambiguation
  const collisions = buildSlugCollisions(allSlugs)

  // Helper to convert backlink entries to BacklinkItem with titles and link text
  const toBacklinkItems = (entries: BacklinkEntry[]): BacklinkItem[] =>
    entries.map((e) => ({
      slug: e.sourceSlug,
      title: pages.get(e.sourceSlug)?.meta.title || e.sourceSlug.split('/').pop() || e.sourceSlug,
      linkText: e.linkText || undefined,
    }))

  // Render each page
  for (const [slug, page] of pages) {
    const converted = convertLinks(page.body, allSlugs)
    const html = marked.parse(converted) as string
    const title = page.meta.title || slug.split('/').pop() || slug
    const bl = backlinks.get(slug) || []

    const element = React.createElement(Page, {
      title,
      content: html,
      meta: page.meta,
      slug,
      backlinks: toBacklinkItems(bl),
    })

    const out = '<!DOCTYPE html>\n' + renderToStaticMarkup(element)
    const outPath = toOut(slug)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, out)
    console.log(`  ${slug}`)
  }

  // Generate stub pages for missing links
  let stubCount = 0
  for (const slug of missingSlugs) {
    const bl = backlinks.get(slug) || []
    const baseName = slug.split('/').pop()!

    // Check if this is an ambiguous short link to existing pages
    const disambiguate = collisions.has(baseName)
      ? collisions.get(baseName)!.map((s) => ({
          slug: s,
          title: pages.get(s)?.meta.title || s.split('/').pop() || s,
        }))
      : undefined

    const element = React.createElement(StubPage, {
      slug,
      backlinks: toBacklinkItems(bl),
      disambiguate,
    })

    const out = '<!DOCTYPE html>\n' + renderToStaticMarkup(element)
    const outPath = toOut(slug)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, out)
    console.log(`  ${slug} (stub)`)
    stubCount++
  }

  // ============================================================================
  // Build log system - date-based pages with temporal navigation
  // ============================================================================

  const logData: LogData = {
    created: new Map(),
    updated: new Map(),
    allDates: new Set(),
  }

  // Collect all date entries from pages
  for (const [slug, page] of pages) {
    // Skip log pages themselves
    if (slug.startsWith('log/')) continue

    const title = page.meta.title || slug.split('/').pop() || slug
    const entry: LogEntry = { slug, title }
    const dates = getDateSlugs(page.meta)

    if (dates.created) {
      // Add to day, week, month, year
      for (const dateSlug of [dates.created.date, dates.created.week, dates.created.month, dates.created.year]) {
        if (!logData.created.has(dateSlug)) logData.created.set(dateSlug, [])
        logData.created.get(dateSlug)!.push(entry)
        logData.allDates.add(dateSlug)
      }
    }

    if (dates.updated && dates.updated.date !== dates.created?.date) {
      // Add to day, week, month, year (only if different from created)
      for (const dateSlug of [dates.updated.date, dates.updated.week, dates.updated.month, dates.updated.year]) {
        if (!logData.updated.has(dateSlug)) logData.updated.set(dateSlug, [])
        logData.updated.get(dateSlug)!.push(entry)
        logData.allDates.add(dateSlug)
      }
    }
  }

  // Helper to determine log period from slug
  function getLogPeriod(dateSlug: string): LogPageMeta['period'] {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateSlug)) return 'day'
    if (/^\d{4}-w\d{2}$/.test(dateSlug)) return 'week'
    if (/^\d{4}-\d{2}$/.test(dateSlug)) return 'month'
    if (/^\d{4}$/.test(dateSlug)) return 'year'
    return 'day'
  }

  // Helper to build LogPageMeta from date slug
  function buildLogMeta(dateSlug: string): LogPageMeta {
    const period = getLogPeriod(dateSlug)
    const year = dateSlug.slice(0, 4)

    const meta: LogPageMeta = { period, date: dateSlug, year }

    if (period === 'day') {
      const dateInfo = parseDateInfo(dateSlug)
      if (dateInfo) {
        meta.month = dateInfo.month
        meta.week = dateInfo.week
        meta.day = dateSlug
      }
    } else if (period === 'week') {
      meta.week = dateSlug
      // Approximate month from week (use middle of week)
      const weekNum = parseInt(dateSlug.split('-w')[1], 10)
      const approxMonth = Math.min(12, Math.max(1, Math.ceil(weekNum / 4.33)))
      meta.month = `${year}-${approxMonth.toString().padStart(2, '0')}`
    } else if (period === 'month') {
      meta.month = dateSlug
    }

    return meta
  }

  // Helper to get child periods for a log page
  function getLogChildren(dateSlug: string, period: LogPageMeta['period']): { slug: string; title: string; count: number }[] {
    const children: { slug: string; title: string; count: number }[] = []

    if (period === 'year') {
      // Get all months in this year
      const year = dateSlug
      for (let m = 1; m <= 12; m++) {
        const monthSlug = `${year}-${m.toString().padStart(2, '0')}`
        const count = (logData.created.get(monthSlug)?.length || 0) + (logData.updated.get(monthSlug)?.length || 0)
        if (count > 0 || logData.allDates.has(monthSlug)) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          children.push({ slug: monthSlug, title: monthNames[m - 1], count })
        }
      }
    } else if (period === 'month') {
      // Get all days in this month that have activity
      const [year, month] = dateSlug.split('-')
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
      for (let d = 1; d <= daysInMonth; d++) {
        const daySlug = `${dateSlug}-${d.toString().padStart(2, '0')}`
        const count = (logData.created.get(daySlug)?.length || 0) + (logData.updated.get(daySlug)?.length || 0)
        if (count > 0) {
          children.push({ slug: daySlug, title: d.toString(), count })
        }
      }
    } else if (period === 'week') {
      // Get all days in this week that have activity
      const [year, weekPart] = dateSlug.split('-w')
      const weekNum = parseInt(weekPart, 10)
      // Find first day of week (approximate)
      const jan1 = new Date(parseInt(year), 0, 1)
      const daysOffset = (weekNum - 1) * 7 - jan1.getDay() + 1
      for (let i = 0; i < 7; i++) {
        const d = new Date(parseInt(year), 0, daysOffset + i + 1)
        if (d.getFullYear() === parseInt(year) || (weekNum === 1 && d.getMonth() === 11)) {
          const daySlug = d.toISOString().split('T')[0]
          const count = (logData.created.get(daySlug)?.length || 0) + (logData.updated.get(daySlug)?.length || 0)
          if (count > 0) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            children.push({ slug: daySlug, title: `${dayNames[d.getDay()]} ${d.getDate()}`, count })
          }
        }
      }
    }

    return children
  }

  // Convert log entries to BacklinkItems
  const toLogBacklinkItems = (entries: LogEntry[]): BacklinkItem[] =>
    entries.map((e) => ({ slug: e.slug, title: e.title }))

  // Render log pages
  let logCount = 0
  mkdirSync(join(OUT, 'log'), { recursive: true })

  for (const dateSlug of logData.allDates) {
    const meta = buildLogMeta(dateSlug)
    const created = logData.created.get(dateSlug) || []
    const updated = logData.updated.get(dateSlug) || []
    const children = getLogChildren(dateSlug, meta.period)
    const bl = backlinks.get(`log/${dateSlug}`) || []

    const element = React.createElement(LogPage, {
      meta,
      backlinks: toBacklinkItems(bl),
      created: toLogBacklinkItems(created),
      updated: toLogBacklinkItems(updated),
      children: children.length > 0 ? children : undefined,
    })

    const out = '<!DOCTYPE html>\n' + renderToStaticMarkup(element)
    writeFileSync(join(OUT, 'log', `${dateSlug}.html`), out)
    console.log(`  log/${dateSlug}`)
    logCount++
  }

  // Generate log index page
  const years = Array.from(logData.allDates)
    .filter((d) => /^\d{4}$/.test(d))
    .sort()
    .reverse()

  const logIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Log — Garden</title>
  <link rel="stylesheet" href="/assets/styles.css" />
</head>
<body>
  <header class="site-header">
    <a href="/" class="site-name">Garden</a>
  </header>
  <main class="page log-index">
    <article>
      <h1>Log</h1>
      <p class="log-description">Notes organized by when they were created or updated.</p>
      ${years.length > 0 ? `
      <ul class="log-years">
        ${years.map((y) => {
          const count = (logData.created.get(y)?.length || 0)
          return `<li><a href="/log/${y}.html">${y}</a> <span class="log-count">${count} notes</span></li>`
        }).join('\n        ')}
      </ul>
      ` : '<p class="stub-notice">No dated notes yet.</p>'}
    </article>
  </main>
  <footer class="site-footer">
    <a href="/edit.html?capture=today">Capture to Today</a>
  </footer>
</body>
</html>`

  writeFileSync(join(OUT, 'log.html'), logIndexHtml)
  console.log('  log (index)')

  console.log(`\nBuilt ${pages.size} pages, ${stubCount} stubs, ${logCount} log pages`)
}

build()
