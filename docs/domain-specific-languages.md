---
title: Domain-specific languages trade generality for expressiveness
status: seedling
created: 2026-01-25
---

A DSL is a small language optimized for a specific problem domain. SQL for queries, regex for patterns, CSS for styling.

The bargain: you give up Turing completeness (usually) and get clarity, safety, and domain-native abstractions in return.

Internal DSLs embed in host languages (fluent APIs, Ruby blocks). External DSLs have their own syntax and parser.

Building DSLs is easier now—tools like [[langium]] handle grammar, parsing, and editor integration.

See also: [[dygram]], [[state-machines]], [[literate-programming]]
