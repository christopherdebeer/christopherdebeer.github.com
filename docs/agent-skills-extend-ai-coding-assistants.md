---
title: Agent skills extend AI coding assistants with reusable knowledge
status: seedling
created: 2026-01-20
---

Agent skills are folders of instructions that AI coding assistants can discover and use. They package [[knowledge-work-should-accrete|procedural knowledge]] into portable, version-controlled units.

The format uses `SKILL.md` files with YAML frontmatter and markdown instructions. Skills work across Claude Code, Cursor, Codex, and other compatible agents.

## Installing Skills

Use the `skills` CLI to add skills from GitHub repos:

```bash
# Install from a GitHub repository
npx skills add owner/repo

# List available skills without installing
npx skills add owner/repo --list

# Install specific skill to specific agent
npx skills add owner/repo --skill skill-name --agent claude-code
```

## Installing the Digital Garden Skill

This garden's framework is available as an installable skill:

```bash
npx skills add christopherdebeer/garden --skill digital-garden
```

This teaches Claude Code the [[digital-gardens|digital garden]] conventions:
- [[atomicity-forces-clarity|Atomic notes]] with assertion titles
- [[bi-directional-links|Wiki-links]] using `[[slug]]` syntax
- Status levels (seedling → budding → evergreen)
- File conventions and build workflow

## Creating Skills

A minimal skill requires one file:

```
skill-name/
└── SKILL.md
```

The `SKILL.md` format:

```yaml
---
name: skill-name
description: What this skill does and when to use it.
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
---

# Skill Title

Instructions the agent follows when this skill activates.
```

See the specification at [agentskills.io](https://agentskills.io/specification).
