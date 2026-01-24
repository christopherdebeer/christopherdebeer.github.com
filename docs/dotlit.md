---
title: dotlit extends markdown into executable documents
status: seedling
created: 2026-01-24
---

[[project]]

.lit is a plain text document format that extends Markdown with sections, cells, and executable code blocks. It synthesizes ideas from [[literate-programming]], interactive notebooks, [[digital-gardens]], and wikis.

## Philosophy

The core aim is "guided learning"—teaching through hands-on examples rather than passive explanation. Unlike typical notebook tools, .lit is designed as "an acceptable development environment" itself, not a stepping stone to something else.

## Key Features

- **Executable code blocks** that run directly in documents
- **Sections and cells** for structured organization beyond standard Markdown
- **Plugin system** with viewers, REPLs, parsers, renderers, menu items, and lifecycle hooks
- **Transclusion** for embedding content from other documents
- **[[bi-directional-links|Wikilinks]]** with fragment support
- **File system** using LightningFS with GitHub API backend
- **In-place editing** through client-side JavaScript/React hydration

## Implementation

Built on the unified/remark ecosystem for parsing. Renders to HTML with optional React hydration for interactivity. Available as [@dotlit/dotlit on npm](https://www.npmjs.com/package/@dotlit/dotlit).

Source: [github.com/dotlitdev/dotlit](https://github.com/dotlitdev/dotlit)

See: [dotlit.org](https://dotlit.org)

## Relation to this Garden

This garden's build system shares DNA with dotlit's approach—Markdown source, wikilinks, backlinks. The key difference is simplicity: this garden is static-only, while dotlit enables interactive execution and in-browser editing.

See also: [[literate-programming]], [[knowledge-work-should-accrete]]
