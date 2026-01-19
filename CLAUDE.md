# Garden

`npm install && npm run build`

## Structure

```
src/**/*.md  ->  docs/**/*.html
```

Filenames are kebab-case slugs: `spaced-repetition-works.md`

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

Slugs match filenames sans extension: `src/vim-basics.md` -> `[[vim-basics]]`

Backlinks auto-generated. Broken links styled distinctly (and are fine—they signal intent).

## Core Principles

**Atomic.** One idea per note. Title captures the claim. If you can't name it in one sentence, split it.

**Linked.** Every note connects. Isolation is death. Create the link first, write the note second.

**Evolved.** Notes grow. Seedlings become evergreen. Update > append > new file.

**Standalone.** Each note self-sufficient. Synthesis notes link to atoms, never replace them.

## Titles

Titles are assertions, not topics:
- Good: "Spaced repetition works because testing is learning"
- Bad: "Spaced repetition"
- Good: "Links signal intent before content exists"
- Bad: "Wiki links"

## Status

- **seedling** - rough, incomplete, just planted
- **budding** - developing, has structure, needs work
- **evergreen** - mature, stable, reliably useful

## When Contributing

1. **Search first.** Does a note for this concept exist? Update it instead of creating a duplicate.

2. **Atomic notes first.** If referencing a concept without a note, create the atomic note, then link to it.

3. **Link liberally.** Broken links are fine—they surface what's missing.

4. **Status honestly.** New rough ideas are seedlings. Don't inflate status.

5. **Evolve existing notes.** Adding to a note > creating a new one. Update status as notes mature.

## File Conventions

- Filename = slug = `[[link-target]]`
- Use kebab-case: `my-new-note.md`
- No special characters, no spaces
- Frontmatter title can differ from filename (title is for display)

## Examples

Creating a new note:
```markdown
---
title: Testing is retrieval practice
status: seedling
created: 2026-01-19
---

Taking a test isn't just assessment—it's [[active-recall]], one of the most effective learning strategies.

See also: [[spaced-repetition-works-because-testing-is-learning]]
```

Linking to non-existent note (valid and encouraged):
```markdown
This connects to [[future-note-i-havent-written]] which I'll flesh out later.
```

## Build

After changes to `src/`, run `npm run build` to regenerate `docs/`.

GitHub Actions auto-deploys on push to main.

## Editor

`/edit.html` provides browser-based editing via GitHub API (requires PAT with repo scope).
