# Agent Guide

## Purpose

This repository contains a browser-based prototype for pairing students with
academic advisors. The prototype is intentionally static-hostable: no server,
database, accounts, or remote persistence unless a later architecture decision
explicitly changes that constraint.

## Sources of truth

- `plan/product-spec.md` records product behavior, terminology, scope, and open
  product questions.
- `plan/architecture.md` records technical decisions, data design, quality
  requirements, and open architecture questions.
- `plan/implementation-plan.md` is the ordered prototype backlog and records
  task status and acceptance criteria.
- Update the relevant plan file in the same change whenever implementation
  changes a recorded decision.
- User instructions override these documents. When they conflict, implement the
  user's direction and reconcile the documents.

## Repository map

The repository is currently in planning. Expected implementation locations are:

- `src/domain/`: framework-independent types, invariants, and pairing rules
- `src/storage/`: local persistence, schema migration, import/export, and reset
- `src/features/`: feature-oriented React UI
- `src/test/`: shared test fixtures and test utilities
- `plan/`: living product and architecture decisions
- `.github/workflows/`: CI and GitHub Pages deployment

Update this map when the actual structure differs. Do not create placeholder
directories solely to match it.

## Working method

1. Read this file, then only the sections of the two plan documents relevant to
   the task. Use `rg` before opening many files.
2. Inspect the working tree and preserve unrelated user changes.
3. State the smallest viable change and implement it end to end.
4. Keep domain rules outside React components and storage calls behind one
   adapter boundary.
5. Add or update tests for pairing invariants and destructive data controls.
6. Run the narrowest relevant check first, then the standard verification suite.
7. Keep the app runnable and manually testable at each implementation milestone.
   Update that milestone's manual checkpoint when behavior changes.
8. Summarize changed behavior, automated and manual verification, and any
   remaining decision—not a
   transcript of commands.

## Compact-context guidance

- Prefer links to canonical files over duplicating their contents in new docs.
- Record durable decisions in the `Decision log` tables; do not leave important
  rationale only in chat or commit messages.
- Keep open questions numbered and remove or resolve them promptly. On
  resolution, move the outcome into the specification and decision log.
- Avoid broad repository scans after compaction. Re-read this guide, inspect
  `git status`, and use the plan status and decision logs to resume.
- Use concise names consistently: `semester` means an academic term; `program
  stage` means 1st, 2nd, Essay, Final, or Extra.
- Never infer that generated artifacts or dependency directories are source.

## Engineering rules

- Use TypeScript for application code and strict compiler settings.
- Keep persisted data serializable and versioned. Never persist derived values
  such as `isFull` or assigned counts as independent sources of truth.
- Pairing transitions must be deterministic, validated domain operations. UI
  components must not mutate assignment/request state directly.
- Treat names and advising history as personal data. Do not add analytics,
  logging, network sync, or third-party data services without an explicit
  decision.
- Reset and import actions require clear scope, confirmation, and validation.
- Prefer accessible native controls, keyboard operation, and visible status over
  gesture-only interactions.
- Keep dependencies minimal and justify new runtime dependencies in
  `plan/architecture.md`.
- Use Vitest for automated tests. Run domain logic in a Node environment and
  React behavior in jsdom with Testing Library and `user-event`.
- Prefer explicit behavior assertions and accessible queries. Do not add broad
  snapshot tests or test implementation details.

## Verification

Commands will be finalized when the app is scaffolded. The intended baseline is:

```sh
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

Do not claim a check passed unless it was run. For pairing changes, test at
least: sole-request explicit confirmation, conflict deferral, capacity exhaustion,
request eligibility after capacity exhaustion, undo, and impossible-capacity
handling.

Each completed milestone in `plan/implementation-plan.md` also has a manual
browser checkpoint. Provide the exact local URL/run command and do not mark the
milestone done until its current UI path can be exercised without developer
tools or hand-editing stored data.

## Current constraints

- Static deployment to GitHub Pages
- No backend or cross-device synchronization in the prototype
- Browser persistence only, with straightforward export/import and reset
- One facilitator operates the app during a synchronous advising meeting
- Each student and advisor belongs to exactly one board per semester
- Each semester has at most one board for each supported genre
- Support the current and previous stable desktop Chrome releases
- Roster setup is manual and sequential: semester, board, advisors, students
- Person entry uses separate given/family names and a keyboard-first tab order
- Persist the latest 50 reversible pairing actions per board for undo
- Pairing order is board-selectable: entry order (default) or last-name order
- Product and architecture questions marked `Open` are not implementation
  decisions
