# Architecture plan

Status: discovery draft  
Last updated: 2026-11-12

## Architecture goals

- Run entirely as static files on GitHub Pages.
- Work offline after assets have loaded; no application data leaves the browser.
- Support one facilitator on one device; no realtime or multi-user layer.
- Survive refresh/close on one browser while making export and erasure obvious.
- Encode pairing rules once in a deterministic, testable domain layer.
- Keep the prototype small enough to revise rapidly after live-program feedback.

## Proposed stack

| Area | Choice | Status |
| --- | --- | --- |
| Language | TypeScript 6, strict mode | Accepted |
| UI | React 19.3 stable | Accepted |
| Build | Vite 8 stable line | Accepted |
| Styling | Plain CSS with design tokens and component-level styles | Accepted |
| State | React reducer + context, with domain commands | Proposed |
| Persistence | Versioned JSON document in `localStorage` behind an adapter | Proposed |
| Validation | Zod (or equivalent small schema validator) at storage/import boundaries | Proposed |
| Tests | Vitest 5 stable line + React Testing Library + user-event; Playwright release smoke test | Accepted |
| Deployment | GitHub Actions to GitHub Pages | Required |

React's official version page listed 19.3 as latest stable on 2026-11-12. The
scaffold installed React 19.3.1, Vite 8.3.8, and Vitest 5.1.0; the lockfile is
authoritative for exact versions. TypeScript is held to the supported 6.0 line
rather than npm's TypeScript 7 latest because the current TypeScript ESLint
release requires TypeScript below 6.1. jsdom is held to 29 because jsdom 30/31
requires Node 24.15 or newer while the development machine uses Node 24.14.1.
No Node upgrade is required for the selected toolchain.

## System shape

```text
React views
   │ dispatch typed commands / render projections
   ▼
Application store (reducer + context)
   │ delegates rule-sensitive transitions
   ▼
Domain model and pairing engine
   │ emits a new serializable state + domain result
   ▼
Persistence adapter ── localStorage
          ├──────────── JSON export/import
          └──────────── scoped reset/clear
```

No UI component reads from or writes to `localStorage` directly. The store loads
through the adapter once, persists validated state after successful transitions,
and exposes a save status. Domain functions remain browser- and React-independent.

## Repository structure

```text
src/
  app/
    components/        reusable forms, lists, layout, confirmations
    pages/             route-level containers
    App.tsx            thin page selection and composition
    routing.ts         hash route adapter
    use-document-store.ts
  domain/
    commands/          one command set per aggregate
    selectors/         one selector set per entity
    validation/        field validators plus document validator
    *.ts               one model/entity per file
  storage/             schema, migrations, local adapter, import/export
  styles/              tokens and global styles
  test/                fixtures and test utilities
plan/
.github/workflows/
```

Page containers may compose components and domain operations. Domain and storage
layers must not import from React or app folders. Keep `App.tsx` limited to
provider-independent orchestration and page selection. Use Mantine components
for accessible controls, layout, feedback, and dialogs; keep custom CSS minimal.

The setup UI is a guided sequence rather than one large form: create/open a
semester, create its genre board, add advisors and capacities, add students,
then review both rosters. Board hash subroutes (`advisors`, `students`, `review`,
and `pairing`) make refresh and back/forward navigation predictable without
persisting transient setup-step state. A board URL without a step infers the
first incomplete setup screen. Back navigation is allowed, and Review always
recalculates its gate from current data: at least one student must exist and
total advisor capacity must exactly equal the student count before Pairing can
open. Direct navigation to Pairing is guarded by the same derived rule.

Roster forms use native controls in DOM order so Tab moves predictably through
each row. Successful add resets the fields and focuses the next row's given-name
input. Do not implement spreadsheet-like custom keyboard handling unless native
tab behavior proves insufficient in usability testing.

## Data model

Persist a single versioned application document. IDs are opaque strings created
with `crypto.randomUUID()`.

```ts
type AppDocument = {
  schemaVersion: 1;
  semesters: Record<SemesterId, Semester>;
  boards: Record<BoardId, Board>;
  students: Record<StudentId, Student>;
  advisors: Record<AdvisorId, Advisor>;
  previousAdvisingRelationships: Record<PreviousAdvisingRelationshipId, PreviousAdvisingRelationship>;
  assignments: Record<AssignmentId, AdvisingAssignment>;
  pairingSessions: Record<BoardId, PairingSession>;
};

type Semester = {
  id: SemesterId;
  term: "spring" | "fall";
  year: number;
  boardIds: BoardId[];
};

type Board = {
  id: BoardId;
  semesterId: SemesterId;
  // Derived from genre; retained in schema v1 for stored-data compatibility.
  name: string;
  genre: "fiction" | "poetry" | "creative-nonfiction";
  studentIds: StudentId[];
  advisorIds: AdvisorId[];
};

// Invariant: [semesterId, genre] is unique.

type Student = {
  id: StudentId;
  semesterId: SemesterId;
  boardId: BoardId;
  givenName: string;
  familyName: string;
  programStage: "first" | "second" | "essay" | "final" | "extra";
  previousAdvisingRelationshipIds: PreviousAdvisingRelationshipId[];
  studentRequestedAdvisorIds: AdvisorId[];
};

type Advisor = {
  id: AdvisorId;
  semesterId: SemesterId;
  boardId: BoardId;
  givenName: string;
  familyName: string;
  capacity: number;
};

type PreviousAdvisingRelationship = {
  id: PreviousAdvisingRelationshipId;
  studentId: StudentId;
  previousAdvisorName: string;
  // Present only when this person is also an advisor on the current board.
  matchedCurrentAdvisorId?: AdvisorId;
};

type AdvisingAssignment = {
  id: AssignmentId;
  semesterId: SemesterId;
  boardId: BoardId;
  studentId: StudentId;
  advisorId: AdvisorId;
  assignedAt: string;
};

type AdvisorRequest = {
  advisorId: AdvisorId;
  requestedAt: string;
};

type PairingSession = {
  boardId: BoardId;
  status: "setup" | "pairing" | "resolving" | "complete";
  studentOrderMode: "last-name";
  orderedStudentIds: StudentId[];
  cursor: number;
  requestsByStudentId: Record<StudentId, AdvisorRequest[]>;
  consideredStudentIds: StudentId[];
  undoStack: PairingUndoEntry[];
};
```

`undoStack` is persisted and capped at 50 entries per board. On the 51st
reversible action, discard the oldest entry. A new action after an undo discards
any abandoned forward history; redo is not part of the prototype.

Each entry stores the prior pairing-session state without nested undo history,
the board's prior assignments, and a short action label. Restoring that snapshot
atomically restores requests, pass position, considered students, assignments,
capacity-derived eligibility, and the remaining undo stack without copying
unrelated boards.

A targeted student unassignment creates its own undo entry, removes only that
assignment, returns the session to resolution, and uses the original assignment
entry—when still within the 50-action window—to restore request records removed
when the advisor filled or the student was confirmed.

`orderedStudentIds` is materialized in last-name order when pairing starts and
then persisted. Sorting uses locale-aware comparison, preserves entry order for
equal sort keys, and does not change mid-session when names are edited; a board
reset is required to generate a new session order. Starting another pass filters
that fixed order to currently unassigned students, resets the cursor, and keeps
all request and assignment records intact.

This is a starting schema, not a frozen API. An advisor record is board-specific:
advisors are not shared across boards, so capacity and eligibility are calculated
within that board. If longitudinal advisor identity later becomes important,
introduce a stable `Person` profile while retaining board-specific participation.

Previous advising is stored once as a relationship owned by the current student.
When its optional advisor link is present, the advisor's previous-student list is
derived from these relationships. An unlinked name records history without
inventing a global or current-semester advisor identity.

### Derived data

Do not persist these as authoritative fields:

- student's final paired advisor: derive from assignment by student ID
- advisor assigned count: count assignments for that advisor on their board
- advisor remaining capacity: `capacity - assignedCount`
- advisor `isFull`: `remainingCapacity === 0`
- eligible requesters: requests filtered through current board membership,
  capacity, and previous-advising exclusions
- advisor's previous students: linked previous-advising relationships
- board progress and completion

Student-requested advisors affect presentation and sorting only. They do not
alter the eligible-advisor selector.

### Previous-advisor matching

When a previous-advisor name is entered, normalize whitespace and case only for
candidate lookup against the current advisors' composed names; preserve the
entered name for display. Link automatically only if exactly one advisor on the
same board matches. Leave zero matches unlinked and require facilitator selection
for ambiguous matches. Re-run candidate lookup when the board's advisor roster
changes, but never create or change a link silently after the history record's
initial entry.

## Pairing state transitions

Expose rule-sensitive operations as pure functions returning either a new state
or a typed error:

- `startBoardPairing(boardId)`
- `setAdvisorRequest(boardId, studentId, advisorId, requested)`
- `deferStudent(studentId, reason)`
- `confirmAssignment(studentId, advisorId, source)`
- `undoLastPairingEvent(boardId)`
- `reopenBoard(boardId)`
- `resetBoardPairing(boardId)`

Requests and assignments are distinct transitions. Adding the first or only
request never assigns a student. `confirmAssignment` is always a separate
facilitator action and may select any eligible advisor, regardless of whether
that advisor requested the student. The first-pass UI surfaces confirmation next
to a sole requester; multiple or zero requests lead to deferral unless the
facilitator makes an explicit valid assignment. Every assignment validates board
membership, assignment uniqueness, remaining capacity, previous-advisor
exclusion, session status, and whether a complete matching remains possible
before changing state. Feasibility uses capacity-aware bipartite matching across
all remaining students and advisor slots.

Request changes, student deferrals/advances, confirmed assignments, and reopening
a completed board are undoable pairing actions. Roster/setup edits and
destructive reset/delete/clear operations are not part of this stack. Board reset
clears the stack after its explicit confirmation.

`startBoardPairing` always materializes last-name order and validates that all
students have a usable last-name sort value.

When an assignment fills an advisor, the assignment command removes that advisor
from every other student's stored request list on the board. It also removes all
other requesters from the assigned student's list. The paired advisor remains on
that student's list only when they had requested the student.

## Persistence and lifecycle

### Storage key and writes

- One namespaced key, e.g. `wwww-pairing/app-document`.
- A schema version at the root supports future migrations.
- Validate on load; never render unchecked imported or stored structures.
- Persist after successful domain transitions, preferably synchronously at this
  prototype's expected data size. Surface storage quota/write failures.
- Persist each board's latest 50 reversible pairing events. Undo restores all
  affected domain state atomically, including assignment, capacity-derived
  eligibility, requests, considered status, and cursor position.
- Keep ephemeral UI state (dialogs, focus, drafts) out of the persisted document.

### Import/export

- Export canonical JSON with schema version, export timestamp, and application
  version metadata.
- Parse and validate before offering replace/merge. Start with replace-only if
  merge semantics are not explicitly designed.
- Downloaded exports contain personal data; label them accordingly.
- Initial roster entry is manual; no CSV import parser is required.
- Results export projects assignments to CSV without exposing internal IDs.
- “Copy table” writes tab-separated text plus an HTML table to the clipboard
  when supported, with a plain-text fallback.
- PDF output uses a dedicated print stylesheet and the browser's print/save-PDF
  flow; do not add a PDF-generation dependency for the prototype.

### Deferred CSV roster import

Keep CSV ingestion behind the storage/import boundary rather than inside form
components. The smallest safe version uses two fixed templates:

- advisors: `given_name`, `family_name`, `capacity`
- students: `given_name`, `family_name`, `program_stage`, with optional
  `requested_advisors` and `previous_advisors`

Import advisors before students so student relationship names can be resolved
against the completed board roster. Parse, normalize, validate, and preview the
entire file before one atomic append. Invalid rows must not cause a partial
import. Flexible column mapping, spreadsheet synchronization, and record merging
are separate future features.

### Reset behavior

- Board reset removes requests, assignments, session progress, and undo events
  for that board; it preserves roster/setup.
- Board/semester deletion removes owned records after referential-integrity
  checks.
- Clear-all removes only the app's namespaced keys, then verifies and reports the
  empty state.
- Before destructive actions, offer JSON backup and require scoped confirmation.

## Navigation

Prefer a small view-state router or hash-based URLs so GitHub Pages refreshes do
not require server rewrites. Expected views:

- semester list
- semester dashboard
- board setup
- live pairing
- conflict resolution
- results
- data/settings

If a routing library is introduced, it must support the repository base path and
static hosting without a 404 fallback.

## GitHub Pages deployment

- Build static assets to `dist/` with Vite.
- Set Vite `base` to `/<repository-name>/` for a project site, or `/` for a user
  site/custom domain. The final value depends on the GitHub repository URL.
- Deploy from the default branch using the official Pages Actions flow:
  configure Pages, upload `dist`, and deploy the artifact.
- Run lint, typecheck, tests, and build before deployment.
- Keep all application data client-side; the Pages artifact contains code and
  static assets only.

## Quality strategy

### Test framework and configuration

- Use the current stable Vitest 5 patch installed during scaffolding. Vitest
  shares Vite's transformation/configuration path and runs TypeScript directly.
- Configure two Vitest projects/environments:
  - `unit`: Node environment for `src/domain/` and browser-independent
    `src/storage/` tests;
  - `ui`: jsdom environment for React components and browser-adapter integration.
- Use React Testing Library, `@testing-library/user-event`, and
  `@testing-library/jest-dom` matchers. Query by role, label, name, and visible
  status before considering test IDs.
- Use V8 coverage with text and HTML reports. Include source files explicitly so
  unimported code is visible in coverage results.
- Co-locate `*.test.ts` and `*.test.tsx` with implementation. Keep reusable
  factories, an in-memory storage implementation, and a provider-aware render
  helper in `src/test/`.
- `npm test` runs `vitest run`; `npm run test:watch` runs watch mode; and
  `npm run test:coverage` runs the full suite with V8 coverage.

Coverage is a regression signal, not a substitute for scenario coverage. Start
with thresholds of 90% lines/functions/statements and 85% branches across
`src/domain/` and `src/storage/`, then ratchet upward rather than weakening them.
UI code is governed by required workflow tests instead of an arbitrary global
percentage.

### Test design rules

- Inject IDs and clocks into domain commands so tests are deterministic.
- Test public commands/selectors and observable UI behavior, not reducer internals
  or component state.
- Mock browser boundaries only: localStorage, clipboard, downloads, print, and
  time/UUID sources. Do not mock the pairing engine in feature tests.
- Avoid broad snapshots. Use explicit assertions; narrow golden fixtures are
  acceptable for versioned migrations and CSV output.
- Every defect fix adds a failing regression test before or with the fix.
- Use table-driven tests for capacity, eligibility, and state-transition edge
  cases.

### Manual stage verification

Delivery uses vertical slices. Every milestone must leave `npm run dev` serving
a coherent browser workflow that the product owner can test with manually
entered data. The implementation backlog defines a short manual checkpoint for
each slice. A milestone is not complete merely because its domain tests pass;
its exposed UI path, refresh behavior, validation, and keyboard flow must also be
usable. Temporary developer-only forms are not substitutes for the planned
facilitator workflow.

### Domain unit tests

- one requester remains a request until explicitly confirmed as an assignment
- multiple requesters defer without losing requests
- zero requesters remains unresolved
- assignment consumes exactly one slot
- full advisor becomes ineligible across the correct scope
- previous advisor is ineligible for the same student
- a student preference does not change eligibility
- adding a request never creates an assignment
- explicit assignment may choose an eligible non-requester
- no student gets two assignments
- capacity cannot be exceeded by normal commands
- undo restores assignment, capacity, eligibility, cursor, and requests
- insufficient capacity is detected without hiding students

### Storage tests

- round-trip persisted document
- missing/corrupt/unknown-version data fails safely
- migration fixtures upgrade deterministically
- invalid import does not overwrite existing state
- reset affects exactly its declared scope

### UI tests

- keyboard-only first pass and conflict resolution
- capacity and unresolved status do not rely on color
- destructive confirmation names its target
- refresh resumes the saved session
- project-base deployment assets and navigation resolve correctly
- print layout contains the complete assignment table and excludes controls
- CSV and copied-table outputs contain the same result rows

An end-to-end browser smoke test is useful once the core flow stabilizes, but the
pairing engine must remain covered without a browser. Add a small Playwright
release suite only after the manual flow stabilizes; it should cover one complete
happy path, refresh/resume, and the deployed repository base path rather than
duplicating all Vitest scenarios.

## Privacy and security

- No authentication is meaningful without a backend; do not present local data
  as access-controlled.
- Do not send names/history to analytics, error-reporting, fonts, or other third
  parties.
- Prefer bundled assets and system fonts.
- Escape/render imported content as text; never interpret it as HTML.
- Document that browser profiles, backups, exports, and shared computers can
  expose local data.
- Provide an obvious “data stored on this device” status and clear-all control.

## Performance and scale assumptions

Assume tens of boards and hundreds—not tens of thousands—of participants per
semester. A single JSON document and synchronous localStorage are suitable at
that scale. Revisit IndexedDB or a backend only if measured payload size,
multi-user operation, or institutional retention requirements demand it.

## Browser support

Support the current and immediately previous stable desktop Chrome releases.
Use progressive enhancement for rich clipboard output and retain a plain-text
copy fallback. Other modern browsers may work but are not an acceptance target.

## Open architecture questions

1. Should the app register a service worker for offline repeat visits? This adds
   cache-update complexity and is not proposed for the first slice.

## Delivery plan

The actionable dependency-ordered backlog is maintained in
`plan/implementation-plan.md`. It controls execution and is organized as these
manually testable vertical slices:

1. runnable app and test foundation;
2. semester and board creation with persistence;
3. advisor and capacity entry;
4. student, preference, and history entry;
5. first-pass pairing;
6. conflict resolution, undo, reset, and reopen;
7. results, exports, and local data controls;
8. release hardening and GitHub Pages deployment.

Each slice implements its domain rules, persistence, UI, automated tests, and
manual checkpoint together. `plan/implementation-plan.md` is authoritative for
task status and acceptance details.

## Architecture decision log

| Date | Decision | Status | Rationale |
| --- | --- | --- | --- |
| 2026-11-12 | Use a static, browser-only architecture for the prototype. | Accepted | Required by the product constraint and compatible with GitHub Pages. |
| 2026-11-12 | Use React 19.3 + TypeScript + Vite 8 stable line. | Accepted | Current stable React and Vite provide a small static build with familiar tooling. |
| 2026-11-12 | Put pairing logic in pure domain functions. | Accepted | Protects invariants and makes the highest-risk behavior easy to test. |
| 2026-11-12 | Use a versioned localStorage document behind an adapter. | Accepted | Meets resumability and easy-erasure needs at the expected scale without a backend. |
| 2026-11-12 | Treat fullness and final advisor links as derived data. | Proposed | Avoids inconsistent duplicated state. |
| 2026-11-12 | Preserve request history while deriving current eligibility. | Proposed | Reversible, explainable behavior matches the product workflow. |
| 2026-11-12 | Scope each advisor record and its capacity to one board. | Accepted | Boards are genre cohorts and advisors are not shared between them. |
| 2026-11-12 | Use one facilitator-operated client with no synchronization layer. | Accepted | The session is synchronous and other participants do not interact with the app. |
| 2026-11-12 | Store previous advising as a name plus optional current-board advisor link. | Accepted | Advisors can differ by semester; linked history enforces ineligibility without requiring global identities. |
| 2026-11-12 | Keep request and assignment commands separate. | Accepted | Every final pairing requires explicit facilitator confirmation. |
| 2026-11-12 | Enforce unique genre per semester and single-board membership. | Accepted | Each board is the semester's cohort for one genre. |
| 2026-11-12 | Do not support capacity overrides during assignment. | Accepted | Invalid capacity leaves the board incomplete until setup changes. |
| 2026-11-12 | Use guided manual setup and defer CSV roster import. | Accepted | The facilitator will create semester, board, advisors/capacities, then students. |
| 2026-11-12 | Produce PDF through print CSS, plus CSV and clipboard-table projections. | Accepted | Meets all required result formats without adding a PDF runtime. |
| 2026-11-12 | Target the latest two stable desktop Chrome releases. | Accepted | Matches the known operating environment. |
| 2026-11-12 | Ship without sample/demo data. | Accepted | Avoids mixing demonstration and real participant data. |
| 2026-11-12 | Persist a 50-entry undo stack per board. | Accepted | Supports recovery across refreshes with a predictable local-storage bound. |
| 2026-11-12 | Materialize last-name order when pairing starts. | Accepted | Keeps presentation deterministic without adding a facilitator choice; entry order breaks ties. |
| 2026-11-12 | Store given/family names separately and use native tab order for roster entry. | Accepted | Supports reliable sorting and efficient keyboard entry without custom focus machinery. |
| 2026-11-12 | Design CSV import as a later strict-template, validate-preview-commit adapter. | Accepted | Keeps initial scope manual while avoiding a future domain-model rewrite. |
| 2026-11-12 | Use Vitest with Node and jsdom projects, Testing Library, user-event, and V8 coverage. | Accepted | Aligns with Vite while keeping domain tests fast and UI tests user-centered. |
| 2026-11-12 | Use `burrata/wwww-prototype`, `main`, and `/wwww-prototype/` as the Pages repository/base. | Accepted | Confirmed by the configured Git remote; the workflow builds explicitly for the project subpath. |
| 2026-11-12 | Use TypeScript 6 and jsdom 29 with the current Node 24.14 runtime. | Accepted | Keeps the lint/test peer dependency tree compatible and audit-clean without requiring a machine update. |
| 2026-11-12 | Use a hand-written schema-version-1 document validator. | Accepted | The current schema is small enough to validate without adding a runtime dependency; tests cover malformed fields and broken references. |
| 2026-11-12 | Use hash-based navigation without a routing dependency. | Accepted | Hash URLs survive GitHub Pages refreshes and cover the prototype's small view hierarchy. |
| 2026-11-12 | Use Mantine 9 for UI primitives and keep containers/components modular. | Accepted | Mantine supports React 19 and Vite, supplies accessible controls and dialogs, and avoids maintaining a bespoke component layer; entity-focused modules keep behavior independently testable. |
| 2026-11-12 | Represent board onboarding as guarded hash subroutes rather than persisted step state. | Accepted | Refresh/back navigation remains stable while Review and Pairing eligibility are always derived from the current rosters. |
| 2026-11-12 | Lock roster commands after a pairing session starts. | Accepted | Preserves fixed order and prevents roster or capacity changes from invalidating an active session; reset will reopen setup in Milestone 5. |

## Reference links

- [React versions](https://react.dev/versions)
- [React versioning policy](https://react.dev/community/versioning-policy)
- [Vite releases](https://vite.dev/releases)
- [Vite static deployment and GitHub Pages](https://vite.dev/guide/static-deploy.html)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
