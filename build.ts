import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'fs'
import { join, dirname, relative } from 'path'
import { marked } from 'marked'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Page } from './src/components/Page.js'
import { StubPage } from './src/components/StubPage.js'
import type { BacklinkItem, PageMeta, PageData } from './src/components/types.js'

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
function extractLinks(content: string): string[] {
  const links: string[] = []
  content.replace(/\[\[([^\]]+)\]\]/g, (_, link: string) => {
    const [slug] = link.split('|')
    links.push(slug.trim())
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

  // Build backlinks index (deduplicated)
  const backlinks = new Map<string, string[]>()
  for (const [slug, page] of pages) {
    for (const link of new Set(page.links)) {
      if (!backlinks.has(link)) backlinks.set(link, [])
      const bl = backlinks.get(link)!
      if (!bl.includes(slug)) bl.push(slug)
    }
  }

  // Find missing slugs (linked but no file exists)
  const missingSlugs = new Set<string>()
  for (const page of pages.values()) {
    for (const link of page.links) {
      if (!allSlugs.has(link)) {
        missingSlugs.add(link)
      }
    }
  }

  // Detect slug collisions for disambiguation
  const collisions = buildSlugCollisions(allSlugs)

  // Helper to convert backlink slugs to BacklinkItem with titles
  const toBacklinkItems = (slugs: string[]): BacklinkItem[] =>
    slugs.map((s) => ({
      slug: s,
      title: pages.get(s)?.meta.title || s.split('/').pop() || s,
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

  console.log(`\nBuilt ${pages.size} pages, ${stubCount} stubs`)
}

build()
