---
name: digital-garden
description: A framework for creating and maintaining digital gardens - networks of atomic, interconnected notes that evolve over time. Use this skill when creating knowledge bases, personal wikis, evergreen notes, or any system where ideas should compound through linking.
license: MIT
metadata:
  author: christopherdebeer
  version: "2.0.0"
---

# Digital Garden Framework

A digital garden is a network of evolving ideas that rejects the blog's tyranny of chronology. Instead of finished posts sorted by date, you cultivate atomic notes organized by connection.

## When to Apply

Use this framework when:
- Creating or editing notes in a digital garden
- Building a personal wiki or knowledge base
- Implementing evergreen notes or Zettelkasten
- Writing documentation that should compound over time
- Managing interconnected ideas that evolve

## Core Principles

### 1. Atomic

One idea per note. The title captures the complete claim.

**Test:** If you can't name it in one sentence, split it.

**Why:** Atomicity forces clarity. Large notes hide confusion. They let you gesture at ideas without pinning them down.

### 2. Linked

Every note connects. Isolation is death. Create the link first, write the note second.

**Why:** Bi-directional links create emergent structure. When A links to B, B knows about A. No need to pre-organize—link patterns reveal clusters naturally.

**Rules:**
- Link liberally
- Broken links are fine—they surface what's missing
- Links signal intent before content exists

### 3. Evolved

Notes grow. Seedlings become evergreen. Update > append > new file.

**Why:** A note's value compounds with each revision. The practice transforms note-taking from storage into thinking.

### 4. Standalone

Each note is self-sufficient. Synthesis notes link to atoms, never replace them.

**Why:** Notes remain useful because they capture refined understanding, not raw material.

## File Format

### Frontmatter

```yaml
---
title: Note title as complete thought
status: seedling
created: YYYY-MM-DD
---
```

### Filenames

- Filename = slug = link target
- Use kebab-case: `my-new-note.md`
- No special characters, no spaces
- Title in frontmatter can differ (title is for display)

Example: `docs/spaced-repetition-works.md` → `[[spaced-repetition-works]]`

## Linking

### Wiki-Links

```markdown
[[slug]]                    # Basic link
[[slug|display text]]       # Link with custom text
[[slug#section]]            # Link to section
```

Broken links are valid and encouraged—they signal intent.

### Transclusion

Embed content from other notes inline:

```
```md < [[slug]]
```
```

This renders the referenced note's content and creates a backlink. Works with:
- Regular notes: `[[any-note]]`
- Sections: `[[note#section-heading]]`
- Virtual pages: `[[recent]]`, `[[random]]`, `[[missing]]`

## Status

Status is flexible—any text becomes an implicit wikilink:

```yaml
status: seedling      # Links to /seedling.html
status: draft         # Links to /draft.html
status: needs-review  # Links to /needs-review.html
```

Common conventions (define your own):
- **seedling** - rough, incomplete, just planted
- **budding** - developing, has structure, needs work
- **evergreen** - mature, stable, reliably useful

Create notes for status concepts to define what they mean in your garden. The status becomes part of the link graph—you can see all seedlings by visiting the seedling page's backlinks.

## Virtual Pages

Generated at build time, linkable and transcludable:

| Slug | Content |
|------|---------|
| `[[recent]]` | 10 most recently created/updated notes |
| `[[random]]` | 5 random notes (static per build) |
| `[[missing]]` | All broken links awaiting content |

## Temporal Navigation

The log system generates pages from `created`/`updated` dates:

- `/log.html` - index by year
- `/log/2026.html` - year view
- `/log/2026-01.html` - month view
- `/log/2026-w04.html` - week view
- `/log/2026-01-25.html` - day view

Virtual slugs resolve to current period:
- `[[today]]`, `[[yesterday]]`
- `[[this-week]]`, `[[this-month]]`, `[[this-year]]`

## Title Guidelines

Titles are assertions, not topics:

| Bad | Good |
|-----|------|
| Spaced repetition | Spaced repetition works because testing is learning |
| Wiki links | Links signal intent before content exists |
| Digital gardens | Digital gardens are networks of evolving ideas |
| Note-taking | Atomicity forces clarity of thought |

The title carries the insight. "X is Y" not just "X".

## Workflow

### Creating a Note

1. **Search first.** Does a note for this concept exist? Update it instead of creating a duplicate.

2. **Choose an atomic claim.** What is this note actually about? If the answer sprawls, split the note.

3. **Title as assertion.** Write the insight as a complete thought.

4. **Set status honestly.** New rough ideas are seedlings. Don't inflate.

5. **Link immediately.** Connect to existing notes. Create broken links for future notes.

### Example Note

```markdown
---
title: Testing is retrieval practice
status: seedling
created: 2026-01-19
---

Taking a test isn't just assessment—it's [[active-recall]], one of the most effective learning strategies.

The act of retrieving strengthens memory more than passive review. This is why [[spaced-repetition-works-because-testing-is-learning]].

See also: [[desirable-difficulties]], [[generation-effect]]
```

### Evolving Notes

1. **Update existing notes** rather than creating new ones
2. **Promote status** as notes mature (seedling → budding → evergreen)
3. **Add links** as connections become apparent
4. **Refine titles** to better capture the insight

## Build System

After creating or editing notes in `docs/`:

```bash
npm run build
```

This generates `dist/*.html` with:
- Rendered markdown with syntax highlighting
- Resolved wiki-links (broken links styled distinctly)
- Auto-generated backlinks section
- Status as link to concept page
- Transcluded content with source attribution

## Anti-Patterns

Avoid these common mistakes:

1. **Topic titles** - "Machine Learning" instead of "Machine learning requires large datasets because..."

2. **Orphan notes** - Notes without any links (in or out)

3. **Mega notes** - Notes covering multiple ideas (split them)

4. **Status inflation** - Calling rough ideas "evergreen"

5. **Duplicate concepts** - Creating new notes instead of updating existing ones

6. **Missing links** - Mentioning concepts without linking to them

## Quick Reference

| Element | Format |
|---------|--------|
| Filename | `kebab-case-slug.md` |
| Title | Complete assertion |
| Status | Any text (implicit wikilink) |
| Link | `[[slug]]` or `[[slug\|text]]` |
| Transclude | ` ```md < [[slug]] ``` ` |
| Location | `docs/` directory |
| Build | `npm run build` |
