# First prototype implementation plan

Status: ready to begin  
Last updated: 2026-11-12

## Prototype outcome

One facilitator can create a semester and genre boards, manually enter advisors
and students, conduct the synchronous pairing workflow, resolve remaining
students, undo mistakes, resume after refresh, and produce print/PDF, CSV, and
copied-table results. All participant data stays in the browser and can be
exported, reset, or cleared.

## Delivery rule: every milestone is testable

Work is organized as vertical browser slices. At the end of every milestone:

- `npm run dev` exposes the new workflow through the real app navigation;
- the listed automated checks pass;
- the manual checkpoint can be completed without developer tools, fixture
  injection, or editing localStorage;
- refresh behavior is testable as soon as persistence is introduced;
- the user receives the local URL, what changed, and the short test script.

Do not accumulate several invisible domain milestones before exposing a usable
screen. Domain rules are still implemented before or alongside their UI within
each slice.

Status values are `Not started`, `In progress`, `Blocked`, and `Done`. Sizes
(`S`, `M`, `L`) describe relative risk, not calendar time.

## Milestone 0 — runnable foundation

Status: Done
Completed: 2026-11-12
Size: M  
Depends on: none

### Tasks

- **M0.1** Initialize Git with `main` if still needed and scaffold current stable
  React, TypeScript, and Vite.
- **M0.2** Add an accessible, neutral app shell and honest empty semester state.
  Do not add sample or promotional placeholder content.
- **M0.3** Configure ESLint, strict TypeScript, Vitest 5, React Testing Library,
  user-event, jest-dom, jsdom, and V8 coverage.
- **M0.4** Configure Vitest's Node `unit` project and jsdom `ui` project. Add
  deterministic ID/clock test utilities and provider-aware render helpers.
- **M0.5** Add `dev`, `lint`, `typecheck`, `test`, `test:watch`, `test:coverage`,
  and `build` scripts.
- **M0.6** Add CI for lint, typecheck, test, and build; add Pages-ready base-path
  configuration without requiring the final repository URL yet.

### Automated acceptance

- Standard verification commands in `AGENTS.md` pass.
- The app-shell behavior test passes in jsdom.
- Production output works beneath a simulated repository base path.

### Manual checkpoint

1. Run the documented install and development commands.
2. Open the local URL in desktop Chrome.
3. Confirm the shell loads a neutral **Semesters** page with an honest empty
   state rather than Vite starter or promotional placeholder content.
4. Refresh and confirm there are no console-visible or on-screen errors.

## Milestone 1 — create semesters and boards

Status: Done
Completed: 2026-11-12
Size: M  
Depends on: Milestone 0

### Tasks

- **M1.1** Define the versioned document root, opaque IDs, Semester, and Board
  entities plus validation and fixture builders.
- **M1.2** Implement pure commands/selectors for create, edit, open, and delete.
  Enforce Spring/Fall and at most one board per genre per semester.
- **M1.3** Implement the validated, namespaced localStorage adapter and safe load,
  save, corrupt-data, and write-failure behavior.
- **M1.4** Build the semester list/create screen and semester dashboard.
- **M1.5** Build guided board creation for Fiction, Poetry, and Creative
  Nonfiction with safe back navigation.

### Automated acceptance

- Duplicate semester/genre boards and invalid references are rejected.
- Commands never partially mutate state.
- Persistence round-trips and invalid stored data fails safely.
- UI tests create a semester and board using labels and roles.

### Manual checkpoint

1. Create a Spring semester and enter a year.
2. Add a Fiction board and try to add a second Fiction board.
3. Add another genre board and navigate between the semester and its boards.
4. Refresh the browser and confirm the same semester/boards return.
5. Delete a test board and verify the confirmation names its scope.

## Milestone 2 — enter advisors and capacities

Status: Done
Completed: 2026-11-12
Size: M  
Depends on: Milestone 1

### Tasks

- **M2.1** Add the Advisor entity and pure add/edit/remove commands. Enforce
  single-board membership and integer capacity of at least 1, defaulting to 3.
- **M2.2** Build keyboard-first advisor entry with separate first/last name
  inputs, capacity, native tab order, validation, and focus return after add.
- **M2.3** Build the advisor roster with safe edit/remove behavior and capacity
  totals.
- **M2.4** Persist and restore the advisor roster through the existing adapter.

### Automated acceptance

- Capacity boundary and membership tests pass in Node.
- UI tests cover keyboard entry, default capacity, validation, edit, and removal.
- Duplicate names remain separate stable identities.

### Manual checkpoint

1. Open a board and add several advisors using only Tab and typing.
2. Confirm capacity defaults to 3; add advisors with capacity 1 and a larger
   valid value.
3. Try zero, negative, decimal, and blank capacities and inspect the inline
   feedback.
4. Edit one advisor, remove another, refresh, and confirm the roster persists.

## Milestone 3 — enter students, preferences, and history

Status: Done
Completed: 2026-11-12
Size: L  
Depends on: Milestone 2

### Tasks

- **M3.1** Add Student and PreviousAdvisingRelationship entities and pure
  commands. Store given/family names separately.
- **M3.2** Add soft student-requested advisor selections.
- **M3.3** Add previous-advisor entry and matching: auto-link one exact normalized
  current-board match, retain zero matches as removable text, and request a
  choice for ambiguous matches.
- **M3.4** Derive an advisor's previous-student view from linked relationships and
  make linked previous advisors ineligible for that student.
- **M3.5** Build keyboard-first student entry, roster edit/remove, and visible
  stage/preferences/history.
- **M3.6** Show total capacity versus student count without blocking roster
  edits, but prevent pairing while the counts differ.
- **M3.7** Guide each board through separate Advisors, Students, and Review
  routes. Allow roster editing from Review and gate Pairing until total advisor
  capacity exactly equals the nonzero student count.
- **M3.8** Keep advisor count and total capacity visible above student entry and
  use concise, consistent labels and setup messages.

### Automated acceptance

- Student preferences never alter eligibility.
- Linked previous advisors are ineligible; unmatched history creates no advisor.
- Name matching handles case/whitespace and never guesses between duplicates.
- UI tests cover full keyboard entry and relationship states.
- UI tests cover isolated advisor/student steps, Review editing, exact-capacity
  gating, and the transition to Pairing.

### Manual checkpoint

1. Add students in all program stages using only the keyboard.
2. Add requested advisors and confirm active advisors use an outlined indicator
   with a background and an info icon.
3. Add a previous advisor who is on the board and confirm the same active style;
   hover the info icon and confirm it says “Excluded from pairing.”
4. Enter previous advisors on separate lines and separated by commas. Confirm an
   absent advisor uses an outline-only indicator whose hover text says “Not active.”
5. Create duplicate advisor names and confirm the app asks which one is meant.
6. Confirm new boards move through Advisors → Students → Review with only the
   relevant entry form on each setup screen.
7. Test both too little and too much advisor capacity. Confirm Review shows an
   error and disables Pairing until total slots exactly equal student count.
8. Edit either roster from Review, refresh, and confirm the roster and current
   route persist.

## Milestone 4 — run the first pairing pass

Status: In progress — implementation and automated acceptance complete; awaiting manual checkpoint
Size: L  
Depends on: Milestone 3

### Tasks

- **M4.1** Add PairingSession, AdvisorRequest, and AdvisingAssignment entities,
  pure commands, invariants, and selectors.
- **M4.2** Start pairing immediately in family-name order and persist the
  materialized student order.
- **M4.3** Build the student presenter with stage, preferences, history, progress,
  eligible advisors, remaining capacity, and visible exclusion reasons.
- **M4.4** Toggle advisor requests separately from assignment.
- **M4.5** Provide explicit confirmation beside a sole requester. Permit deferral
  instead; defer multiple/no requests while preserving request history.
- **M4.6** Update capacity-derived eligibility everywhere after confirmation and
  guard against double submission.

### Automated acceptance

- Tests cover sole/multiple/no requests, explicit confirmation, previous-advisor
  exclusion, capacity exhaustion, duplicate assignment prevention, and
  impossible capacity.
- A request never assigns; no command can exceed capacity.
- Refresh restores the current student and fixed order.

### Manual checkpoint

1. Start pairing and confirm students appear alphabetically by last name without
   an order-selection screen.
2. Add one request and verify nothing is assigned until confirmation.
3. Defer a sole request, multiple requests, and no request.
4. Confirm several pairings until an advisor becomes full.
5. Confirm that advisor disappears from available choices but remains visible on
   earlier request history as unavailable.
6. Refresh midway and continue at the same student.

## Milestone 5 — resolve, undo, reset, and reopen

Status: In progress — direct resolution and repeated unpaired passes implemented
Size: L  
Depends on: Milestone 4

### Tasks

- **M5.1** Build resolution with contested students first and no-request students
  afterward.
- **M5.2** Allow explicit confirmation of any eligible advisor, including a
  non-requester; never allow a previous advisor or capacity override.
- **M5.2a** Allow selecting any unpaired student after a pass or starting another
  alphabetical pass containing only unpaired students; preserve request history.
- **M5.3** Implement persisted multi-step undo for requests, deferrals/advances,
  assignments, and board reopening. Cap each board at 50 actions.
- **M5.4** Add deliberate revisit, roster-preserving board reset, and completed
  board reopen controls with scoped warnings.
- **M5.5** Keep insufficient-capacity boards visibly incomplete until setup
  changes produce valid capacity.

### Automated acceptance

- Undo atomically restores assignment, requests, cursor, considered status, and
  capacity-derived eligibility; the 51st action evicts only the oldest.
- Resolution may choose an eligible non-requester but rejects all ineligible
  advisors.
- Reset clears pairing state/history and preserves the roster.

### Manual checkpoint

1. Complete a first pass containing conflicts and no-request students.
2. Resolve one student with a requester and another with an eligible
   non-requester.
3. Undo several actions, refresh, and continue undoing.
4. Verify capacity and available names change correctly in both directions.
5. Reset a board and confirm its roster remains.
6. Complete and reopen a board; create insufficient capacity and confirm the
   board cannot be falsely marked complete.

## Milestone 6 — results and local data controls

Status: Not started  
Size: L  
Depends on: Milestone 5

### Tasks

- **M6.1** Build complete and incomplete result views with sorting/grouping by
  student, advisor, program stage, and board.
- **M6.2** Add print CSS and a Chrome print/save-PDF action.
- **M6.3** Add standards-compliant CSV download without internal IDs.
- **M6.4** Add equivalent TSV/plain-text and HTML-table clipboard output with a
  plain-text fallback.
- **M6.5** Add canonical JSON backup and validate/preview/replace restore.
- **M6.6** Add delete-board, delete-semester, and clear-all controls with scoped
  confirmations and backup prompts.

### Automated acceptance

- Every assigned student appears exactly once and counts reconcile.
- PDF view, CSV, and clipboard outputs project the same rows.
- Commas, quotes, and non-ASCII names export correctly.
- Invalid JSON never overwrites current data; reset tests prove exact scope.

### Manual checkpoint

1. Complete a board and inspect all result sort/group options.
2. Save/preview the print result as PDF.
3. Open the downloaded CSV and paste the copied table into a spreadsheet or
   document; compare all three outputs.
4. Export a JSON backup, clear the app, restore the backup, and confirm the
   complete session and undo history return.
5. Exercise board, semester, and clear-all deletion with disposable data.

## Milestone 7 — release hardening and deployment

Status: Not started  
Size: M  
Depends on: Milestone 6

### Tasks

- **M7.1** Complete keyboard, focus, labeling, live-announcement, contrast, and
  non-color-status review through the full workflow.
- **M7.2** Test current and previous stable desktop Chrome; resolve supported
  browser defects.
- **M7.3** Add a small Playwright release smoke suite: full happy path,
  refresh/resume, and repository-base navigation.
- **M7.4** Verify corrupt-data recovery, quota/write failure handling, privacy
  messaging, and every destructive action with anonymized realistic data.
- **M7.5** Set the GitHub owner/repository/base URL, enable Pages Actions, deploy,
  and run the complete rehearsal at the public prototype URL.

### Automated acceptance

- Lint, typecheck, Vitest, coverage, build, and Playwright smoke checks pass.
- Domain/storage coverage meets or exceeds 90% lines/functions/statements and
  85% branches.

### Manual checkpoint

1. Run the full setup-to-export workflow using only the keyboard where practical.
2. Repeat the critical flow in both supported Chrome versions.
3. Complete a rehearsal with an anonymized representative semester at the
   GitHub Pages URL without developer intervention or data repair.
4. Export and erase the rehearsal data.

## Deferred after the manual prototype

### D1 Strict-template CSV roster import

Status: Deferred  
Size: M

- Import advisors first, then students, from documented templates.
- Validate and preview the entire file before one atomic append.
- Resolve student preference/history names against the advisor roster.
- Exclude flexible mapping, merge synchronization, and spreadsheet integration.

## Non-blocking decisions

- Final GitHub owner/repository URL and Pages visibility
- Whether to add a service worker after the first online-loaded prototype
- Exact visual identity beyond an accessible neutral prototype theme
- Institution-specific requirements beyond the recorded privacy/accessibility
  baseline
- Runtime schema library choice, to be recorded during Milestone 1

## Recommended next implementation batch

Begin Milestone 1: deliver persisted semester and board creation through the real
browser workflow, then stop for its automated and manual checkpoint.
