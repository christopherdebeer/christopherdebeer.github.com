import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'fs'
import { join, dirname, basename, relative } from 'path'
import { marked } from 'marked'

const SRC = './src'
const OUT = './docs'

// Parse YAML frontmatter (minimal implementation)
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }
  const meta = {}
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':')
    if (key && rest.length) meta[key.trim()] = rest.join(':').trim()
  })
  return { meta, body: match[2] }
}

// Get all .md files recursively
function getFiles(dir, files = []) {
  for (const f of readdirSync(dir)) {
    const path = join(dir, f)
    if (statSync(path).isDirectory()) getFiles(path, files)
    else if (f.endsWith('.md')) files.push(path)
  }
  return files
}

// Convert path to slug (src/foo/bar.md -> foo/bar)
const toSlug = p => relative(SRC, p).replace(/\.md$/, '')

// Convert slug to output path
const toOut = slug => join(OUT, slug + '.html')

// Extract [[wiki-links]] from content
function extractLinks(content) {
  const links = []
  content.replace(/\[\[([^\]]+)\]\]/g, (_, link) => {
    const [slug] = link.split('|')
    links.push(slug.trim())
  })
  return links
}

// Convert [[wiki-links]] to HTML links
function convertLinks(content, allSlugs) {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, link) => {
    const parts = link.split('|')
    const slug = parts[0].trim()
    const text = (parts[1] || parts[0]).trim()
    const exists = allSlugs.has(slug)
    const cls = exists ? '' : ' class="broken"'
    return `<a href="/${slug}.html"${cls}>${text}</a>`
  })
}

// Minimal HTML template
function template(title, content, backlinks, meta) {
  const status = meta.status || 'seedling'
  const statusIcon = { seedling: '&#127793;', budding: '&#127807;', evergreen: '&#127795;' }[status] || ''
  const blHtml = backlinks.length
    ? `<section class="backlinks"><h2>Linked from</h2><ul>${backlinks.map(b => `<li><a href="/${b}.html">${b}</a></li>`).join('')}</ul></section>`
    : ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
:root { --bg: #fffcf7; --fg: #2d2d2d; --link: #3366cc; --broken: #cc3366; --muted: #888; }
@media (prefers-color-scheme: dark) { :root { --bg: #1a1a1a; --fg: #e0e0e0; --link: #6699ff; --broken: #ff6699; --muted: #666; } }
* { box-sizing: border-box; }
body { font: 18px/1.6 Georgia, serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; background: var(--bg); color: var(--fg); }
a { color: var(--link); }
a.broken { color: var(--broken); border-bottom: 1px dashed; }
h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
.meta { color: var(--muted); font-size: 0.85rem; margin-bottom: 2rem; }
.backlinks { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--muted); font-size: 0.9rem; }
.backlinks h2 { font-size: 1rem; color: var(--muted); }
.backlinks ul { padding-left: 1.2rem; }
</style>
</head>
<body>
<article>
<h1>${statusIcon} ${title}</h1>
<div class="meta">${meta.created || ''}</div>
${content}
</article>
${blHtml}
</body>
</html>`
}

// Main build
function build() {
  // Clean output
  if (existsSync(OUT)) rmSync(OUT, { recursive: true })
  mkdirSync(OUT, { recursive: true })

  // Parse all files
  const files = getFiles(SRC)
  const pages = new Map()
  const allSlugs = new Set()

  for (const file of files) {
    const slug = toSlug(file)
    allSlugs.add(slug)
    const raw = readFileSync(file, 'utf8')
    const { meta, body } = parseFrontmatter(raw)
    const links = extractLinks(body)
    pages.set(slug, { meta, body, links, file })
  }

  // Build backlinks index (deduplicated)
  const backlinks = new Map()
  for (const [slug, page] of pages) {
    for (const link of new Set(page.links)) {
      if (!backlinks.has(link)) backlinks.set(link, [])
      if (!backlinks.get(link).includes(slug)) backlinks.get(link).push(slug)
    }
  }

  // Render each page
  for (const [slug, page] of pages) {
    const converted = convertLinks(page.body, allSlugs)
    const html = marked.parse(converted)
    const title = page.meta.title || slug.split('/').pop()
    const bl = backlinks.get(slug) || []
    const out = template(title, html, bl, page.meta)
    const outPath = toOut(slug)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, out)
    console.log(`  ${slug}`)
  }

  console.log(`\nBuilt ${pages.size} pages`)
}

build()
