# Domain docs

Single-context layout.

- `CONTEXT.md` at repo root — the project's ubiquitous language / domain glossary
- `docs/adr/` — architectural decision records (ADR-NNNN-*.md)

Skills that read domain docs (`improve-codebase-architecture`, `diagnosing-bugs`, `tdd`, etc.) read from these locations. ADRs are consumed in numeric order; `CONTEXT.md` is the authoritative glossary.

When making a decision that conflicts with an existing ADR, either supersede it (new ADR referencing the old) or revise it in place with a dated revision note.
