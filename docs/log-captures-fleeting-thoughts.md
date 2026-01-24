---
title: Log captures fleeting thoughts before they escape
status: seedling
created: 2026-01-24
---

The log is a temporal inbox for the garden. It solves the friction problem: when an idea strikes, you need somewhere to put it *now*, not after deciding which note it belongs to.

## The Problem

[[atomicity-forces-clarity]] is valuable but creates friction. If every note must be atomic and well-titled, capturing becomes slow. Ideas escape while you're deciding where they belong.

## The Solution

Daily log files accept anything:
- Links to read later
- Half-formed thoughts
- Quotes that resonated
- Questions to explore

The log is organized by time, not topic. Organization comes later, during review.

## How It Works

Each day gets a file at `docs/log/YYYY-MM-DD.md`. The [[bi-directional-links|backlink]] system automatically connects notes to their creation dates:

```
/log/2026-01-24.html  → Day view (notes created/updated)
/log/2026-w04.html    → Week view
/log/2026-01.html     → Month view
/log/2026.html        → Year view
```

Notes with `created` or `updated` frontmatter appear on their corresponding date pages.

## Capture Methods

### Editor
Navigate to `/edit.html?capture=today` to open today's log for editing.

### Bookmarklet
Drag this to your bookmarks bar to capture the current page:

```javascript
javascript:(function(){
  location.href='https://YOURSITE/edit.html?capture='+
    encodeURIComponent('- [ ] ['+document.title+']('+location.href+')');
})()
```

### iOS Shortcut
Create a shortcut that:
1. Accepts share sheet input
2. Formats as markdown checkbox with link
3. Opens the capture URL

### URL with Content
Pass content directly: `/edit.html?capture=Some%20text%20to%20capture`

## The Workflow

1. **Capture** — throw it in today's log, don't think
2. **Review** — periodically scan recent logs
3. **Promote** — move mature ideas to proper notes
4. **Link** — connect the new note back to the garden

This mirrors [[knowledge-work-should-accrete]]—nothing is lost, everything can grow.

## Inspired By

This pattern comes from [[dotlit]]'s Input Buffer, which itself drew from apps like mymind. The core insight: separate capture (fast, frictionless) from organization (thoughtful, later).

See also: [[writing-for-yourself-reduces-friction]], [[thinking-in-public]]
