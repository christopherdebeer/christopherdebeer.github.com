---
title: DyGram makes state machines executable from first sketch
status: seedling
created: 2026-01-25
---

A [[project]] and [[domain-specific-languages|DSL]] for rapid prototyping of [[state-machines]] and workflows. The name suggests dynamic diagrams—sketches that run.

Core insight: designs should execute immediately, not after implementation. Start rough, refine through iteration.

**Rails-based execution**: Claude agents navigate predetermined paths. Deterministic transitions fire instantly; complex decisions invoke AI reasoning. The machine provides structure, the agent provides judgment.

Language features:
- 15+ node types (Tasks, States, Contexts, Inputs, Outputs, Resources, Processes, Concepts, Implementations)
- 7 arrow types for relationship semantics (flow, composition, aggregation, bidirectional)
- Hierarchical namespaces with automatic context inheritance

Dual editor: Monaco for desktop (full LSP), CodeMirror 6 for mobile. Same syntax everywhere.

Tech: TypeScript, [[langium]], Vite, Graphviz for visualization.

```
npx dygram execute your-file.dy --model claude-3-5-sonnet-20241022
```

Live: [dygram.parc.land](https://dygram.parc.land)
Source: [github.com/christopherdebeer/machine](https://github.com/christopherdebeer/machine)

See also: [[parc-land]], [[simcap]], [[literate-programming]]
