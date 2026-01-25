---
title: State machines make implicit logic explicit
status: seedling
created: 2026-01-25
---

A computational model where behavior depends on current state plus input. Transitions between states are explicit, enumerable, predictable.

The power: you can't be in two states at once. Edge cases become visible. The diagram *is* the specification.

Variations: finite state machines, hierarchical state machines (statecharts), Petri nets for concurrency.

In practice: UI flows, protocol handlers, game logic, workflow engines. Anywhere "mode" matters.

See also: [[dygram]], [[domain-specific-languages]]
