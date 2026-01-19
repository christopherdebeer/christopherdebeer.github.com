# Garden

`npm install && npm run build`

## Structure

```
src/**/*.md  ->  docs/**/*.html
```

## Frontmatter

```yaml
---
title: Note title as complete thought
status: seedling | budding | evergreen
created: YYYY-MM-DD
---
```

## Linking

`[[slug]]` or `[[slug|display text]]`

Slugs match file paths sans extension: `src/tools/vim.md` -> `[[tools/vim]]`

Backlinks auto-generated. Broken links styled distinctly.

## Principles

**Atomic.** One idea per note. Title captures the claim. If you can't name it, split it.

**Linked.** Every note connects. Isolation is death. Create the link first, write the note second.

**Evolved.** Notes grow. Seedlings become evergreen. Update > append > new file.

**Standalone.** Each note self-sufficient. Synthesis notes link to atoms, never replace them.

## Writing

- Titles are assertions: "Spaced repetition works because testing is learning" not "Spaced repetition"
- Write for future self, not audience
- Link liberally, especially to non-existent notes (they signal intent)
- Prefer many small notes to few large ones

## Status

- **seedling** &#127793; rough, incomplete, just planted
- **budding** &#127807; developing, has structure, needs work
- **evergreen** &#127795; mature, stable, reliably useful

## When editing

1. If concept doesn't exist: create atomic note first
2. Then link from synthesis
3. Update status as notes mature
4. Backlinks appear automatically
