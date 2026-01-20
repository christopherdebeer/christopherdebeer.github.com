import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'fs'
import { join, dirname, relative } from 'path'
import { marked } from 'marked'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Page } from './src/components/Page.js'
import { StubPage } from './src/components/StubPage.js'
import type { BacklinkItem, PageMeta, PageData, LinkInfo } from './src/components/types.js'

const SRC = './docs'
const OUT = './dist'

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

// Anchor mapping: target slug -> anchor ID
type AnchorMap = Map<string, string>

// Convert [[wiki-links]] to HTML links, adding anchors and returning the mapping
function convertLinks(content: string, allSlugs: Set<string>, sourceSlug: string): { html: string; anchors: AnchorMap } {
  const anchors: AnchorMap = new Map()
  const counter = new Map<string, number>()

  const html = content.replace(/\[\[([^\]]+)\]\]/g, (_, link: string) => {
    const parts = link.split('|')
    const targetSlug = parts[0].trim()
    const text = (parts[1] || parts[0]).trim()
    const exists = allSlugs.has(targetSlug)
    const cls = exists ? '' : ' class="broken"'

    // Generate anchor ID (only first link to each target gets an anchor for backlinks)
    const count = counter.get(targetSlug) || 0
    counter.set(targetSlug, count + 1)

    if (count === 0) {
      // First link to this target - add anchor
      const anchorId = `ref-${targetSlug.replace(/[^a-z0-9-]/gi, '-')}`
      anchors.set(targetSlug, anchorId)
      return `<a id="${anchorId}" href="/${targetSlug}.html"${cls}>${text}</a>`
    }

    return `<a href="/${targetSlug}.html"${cls}>${text}</a>`
  })

  return { html, anchors }
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

  // Backlink entry: source page slug + the link text used (if any) + anchor ID
  interface BacklinkEntry {
    sourceSlug: string
    linkText: string | null
    anchorId?: string
  }

  // Store converted HTML and anchor maps per page
  const convertedPages = new Map<string, { html: string; anchors: AnchorMap }>()
  for (const [slug, page] of pages) {
    convertedPages.set(slug, convertLinks(page.body, allSlugs, slug))
  }

  // Build backlinks index (deduplicated by source slug, keeps first linkText)
  const backlinks = new Map<string, BacklinkEntry[]>()
  for (const [slug, page] of pages) {
    const seen = new Set<string>() // dedupe multiple links to same target
    const anchors = convertedPages.get(slug)!.anchors
    for (const link of page.links) {
      if (seen.has(link.slug)) continue
      seen.add(link.slug)
      if (!backlinks.has(link.slug)) backlinks.set(link.slug, [])
      backlinks.get(link.slug)!.push({
        sourceSlug: slug,
        linkText: link.linkText,
        anchorId: anchors.get(link.slug),
      })
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

  // Helper to convert backlink entries to BacklinkItem with titles, link text, and anchors
  const toBacklinkItems = (entries: BacklinkEntry[]): BacklinkItem[] =>
    entries.map((e) => ({
      slug: e.sourceSlug,
      title: pages.get(e.sourceSlug)?.meta.title || e.sourceSlug.split('/').pop() || e.sourceSlug,
      linkText: e.linkText || undefined,
      anchorId: e.anchorId,
    }))

  // Render each page
  for (const [slug, page] of pages) {
    const converted = convertedPages.get(slug)!.html
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

  console.log(`\nBuilt ${pages.size} pages, ${stubCount} stubs`)
}

build()
