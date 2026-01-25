# Garden

`npm install && npm run build`

## Structure

```
docs/**/*.md  ->  dist/**/*.html
```

Filenames are kebab-case slugs: `spaced-repetition-works.md`

## Frontmatter

```yaml
---
title: Note title as complete thought
status: seedling
created: YYYY-MM-DD
---
```

## Linking

`[[slug]]` or `[[slug|display text]]`

Slugs match filenames sans extension: `docs/vim-basics.md` -> `[[vim-basics]]`

Backlinks auto-generated. Broken links styled distinctly (and are fine—they signal intent).

## Status

Status is flexible—any text becomes an implicit wikilink to its concept page:

```yaml
status: seedling      # Links to /seedling.html
status: draft         # Links to /draft.html
status: needs-review  # Links to /needs-review.html
```

Common conventions (but not required):
- **seedling** - rough, incomplete, just planted
- **budding** - developing, has structure, needs work
- **evergreen** - mature, stable, reliably useful

Create notes for your status concepts to define what they mean in your garden.

## Transclusion

Embed content from other notes using code fence syntax:

```
```md < [[slug]]
```
```

This renders the note's content inline and creates a backlink. Works with:
- Regular notes: `[[any-note]]`
- Sections: `[[note#section-heading]]`
- Virtual pages: `[[recent]]`, `[[random]]`, `[[missing]]`

## Virtual Pages

Generated at build time, can be linked or transcluded:

- `[[recent]]` - 10 most recently created/updated notes
- `[[random]]` - 5 random notes (static per build)
- `[[missing]]` - all broken links awaiting content

## Log

Temporal navigation generated from `created`/`updated` dates:

- `/log.html` - index by year
- `/log/2026.html` - year view
- `/log/2026-01.html` - month view
- `/log/2026-w04.html` - week view
- `/log/2026-01-25.html` - day view

Virtual slugs resolve to current period:
- `[[today]]`, `[[yesterday]]`
- `[[this-week]]`, `[[this-month]]`, `[[this-year]]`

## Core Principles

**Atomic.** One idea per note. Title captures the claim. If you can't name it in one sentence, split it.

**Linked.** Every note connects. Isolation is death. Create the link first, write the note second.

**Evolved.** Notes grow. Seedlings become evergreen. Update > append > new file.

**Standalone.** Each note self-sufficient. Synthesis notes link to atoms, never replace them.

## Titles

Titles are assertions, not topics:
- Good: "Spaced repetition works because testing is learning"
- Bad: "Spaced repetition"

## When Contributing

1. **Search first.** Does a note exist? Update it instead of creating a duplicate.

2. **Atomic notes first.** If referencing a concept without a note, create the atomic note, then link to it.

3. **Link liberally.** Broken links are fine—they surface what's missing.

4. **Status honestly.** New rough ideas are seedlings. Don't inflate.

5. **Evolve existing notes.** Adding to a note > creating a new one.

## File Conventions

- Filename = slug = `[[link-target]]`
- Use kebab-case: `my-new-note.md`
- No special characters, no spaces
- Frontmatter title can differ from filename (title is for display)

## Example

```markdown
---
title: Testing is retrieval practice
status: seedling
created: 2026-01-19
---

Taking a test isn't just assessment—it's [[active-recall]], one of the most effective learning strategies.

See also: [[spaced-repetition-works-because-testing-is-learning]]
```

## Build

After changes to `docs/`, run `npm run build` to regenerate `dist/`.

## Editor

`/edit.html` provides browser-based editing via GitHub API (requires PAT with repo scope). Supports wikilink autocomplete.
