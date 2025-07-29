# CLAUDE.md

## Project Setup

This is a personal blog and Digital Garden hosted at [christopherdebeer.github.io](https://christopherdebeer.github.io) and [christopherdebee.com](https://christopherdebeer.com).

### Quick Start
```bash
npm install
npm run dev
```

### Build and Deploy
```bash
npm run build
npm run preview
```

## Framework & Architecture

**Core Framework**: Astro 4.0
- **Static Site Generation**: Pre-rendered pages with minimal JavaScript
- **Content Collections**: Blog posts and projects managed via `src/content/`
- **TypeScript**: Full TypeScript support with type checking

**Key Dependencies**:
- **ProseMirror**: Rich text editing for in-browser content editing
- **Content Collections**: Astro's built-in content management for blog posts
- **Automatic Backlinks**: Custom utility for bi-directional page linking

## Implementation Details

### Content Structure
```
src/content/blog/     # Blog posts
projects/            # Project documentation
src/components/      # Astro components
src/layouts/         # Page layouts
src/pages/           # Route definitions
```

### Backlink System
The site implements automatic backlinks via `src/utils/backlinks.ts`:
- Scans all markdown files for internal links `[text](/path)`
- Generates "Referenced by" sections on linked pages
- Supports both blog posts and project pages
- Creates a living web of interconnected content

### Stub Page Generation
`scripts/generate-stubs.js` creates placeholder pages for referenced but non-existent content, enabling fluid content creation.

---

## Digital Garden Vision

This site embodies a **Digital Garden** philosophy - a free-form, living artifact that grows organically through interconnected content and ideas.

### Content Philosophy

**Three Types of Content**:
- **🌱 Seedling Pages**: Early ideas, rough notes, works in progress
- **🌿 Evergreen Pages**: Mature, well-developed content that remains relevant
- **🔬 Exploratory Pages**: Experimental ideas, temporary investigations

### Navigation Principles

**Fluid Textual Interface**: All navigation happens through markdown links within content. No rigid hierarchies or forced categorization.

**Automatic Back-references**: Every link creates a bidirectional connection. When you link to a page, that page automatically shows it's "Referenced by" your page.

**Link-First Creation**: Links to non-existent pages should enable quick page creation. The presence of a link signals intent and creates space for future expansion.

### Styling Guidelines

**Minimal Aesthetic**: Clean typography, ample whitespace, focus on readability.

**Contextual Hierarchy**: Visual weight follows content importance, not arbitrary structural rules.

**Progressive Enhancement**: Core functionality works without JavaScript; rich interactions enhance the experience.

### Interface Guidelines

**Literate Programming Approach**: The site should feel like reading and writing interconnected documents, not navigating a traditional website.

**Moldable Content**: Easy in-place editing, rapid content creation, low friction for extending ideas.

**Organic Growth**: New content should naturally connect to existing ideas through linking, creating a web of knowledge over time.

### Garden Maintenance

**Living Document**: Content evolves. Update, refine, and connect ideas over time.

**Link Rot Prevention**: Regular auditing of internal links. Stub generation helps identify missing connections.

**Emergent Structure**: Let natural topic clusters and connection patterns emerge rather than imposing artificial organization.

---

*This is a living document. Like the garden it describes, it will grow and evolve with the site.*