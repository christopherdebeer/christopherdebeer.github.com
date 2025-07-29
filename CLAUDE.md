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

## Digital Garden Implementation

This site **fully embodies** a **Digital Garden** philosophy - a free-form, living artifact that grows organically through interconnected content and ideas.

**Status**: ✅ **Vision Realized** (July 2025) - Complete transformation from traditional website structure to organic digital garden achieved. See `digital-garden-transformation.md` for full implementation details.

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

### Active Garden Principles

**Currently Implemented & Working**:
- ✅ **Emergent Themes** (`/tags/`): Topics surface by connection frequency, not artificial categories
- ✅ **Explorations & Experiments** (`/projects/`): Narrative presentation of maker's journey over portfolio grid
- ✅ **Ongoing Thoughts** (`/blog/`): Idea development over chronological publication
- ✅ **Garden Entry Point** (`/`): Contextual exploration invitation vs. structured navigation
- ✅ **Automatic Backlinks**: "Referenced by" sections on all content pages
- ✅ **Contextual Linking**: Links embedded naturally within descriptive content

---

## Claude Interaction Guidelines

### Digital Garden Node Creation

**CRITICAL REQUIREMENT**: When Claude makes ANY changes to this site, Claude MUST create connected digital garden nodes to document the change process and outcomes.

**Node Creation Protocol**:
1. **Create Process Node**: Document what is being changed and why
2. **Create Connection Threads**: Link the new node to related existing content
3. **Update Backlinks**: Ensure bidirectional connections are established
4. **Add Temporal Context**: Date and context for future garden evolution

**Example Pattern**:
```markdown
# [Change Description] - Garden Evolution Node

**Date**: [Current Date]  
**Context**: [What prompted this change]  
**Connected to**: [[related-page-1]], [[related-page-2]]

## What Changed
[Description of changes made]

## Garden Impact  
[How this affects the overall garden structure]

## Future Growth
[How this creates space for future development]
```

### Self-Documentation Requirements

**Every Claude Interaction Must**:
1. **Document the Process**: Create nodes showing the thinking and implementation
2. **Explain Garden Impact**: How changes affect the overall garden ecosystem
3. **Preserve Evolution History**: Link to previous transformation moments
4. **Enable Future Growth**: Identify opportunities for organic expansion

**Meta-Documentation Principle**: The garden should contain its own evolutionary story. Changes aren't just implemented - they're woven into the living documentation of how the garden grows.

### Organic Growth Guidelines

**When Making Changes**:
- **Link-First Approach**: Create links to non-existent pages that might naturally develop
- **Connection over Categorization**: Focus on relationships between ideas rather than filing them away
- **Process Transparency**: Show the work, don't just present outcomes
- **Emergent Structure**: Let organization arise from content connections rather than imposing structure

**Content Creation Pattern**:
1. Start with connections to existing content
2. Document the exploration process
3. Create stubs for future development
4. Update backlinks and cross-references
5. Add to the garden's evolutionary narrative

---

*This is a living document. Like the garden it describes, it will grow and evolve with the site. Every interaction with Claude should contribute to this ongoing evolutionary story.*