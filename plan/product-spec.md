# Product specification

Status: discovery draft  
Last updated: 2026-11-12

## Product intent

The prototype is named **Who Works With Whom?**

Help an academic program run a live, transparent advising-matching session with
less bookkeeping and fewer capacity errors. One facilitator should be able to
create a term, prepare one or more genre boards, record advisor interest as each
student is considered, resolve contested students later, and publish a final
matching list.

The first release is a local, single-browser prototype operated by one
facilitator during a synchronous meeting with advisors. It is not a student or
advisor portal and does not synchronize participants' devices.

## Terminology

- **Semester:** an academic term identified by season (`Spring` or `Fall`) and
  year, such as Fall 2027.
- **Program stage:** a student's stage: `1st semester`, `2nd semester`, `Essay semester`, `Final semester`, or
  `Extra`. This avoids confusing the supplied student field named “semester”
  with the academic term.
- **Board:** one genre cohort within a semester, associated with exactly one
  genre: `Fiction`, `Poetry`, or `Creative Nonfiction`. A semester has at most
  one board per genre.
- **Capacity:** the maximum number of students an advisor may receive on their
  board. Default 3; minimum 1. Advisors are not shared between boards.
- **Request:** an advisor's expression of interest in advising a student during
  the live session.
- **Assignment:** the final match of one student with one advisor.

## Users and operating model

### Primary user

An academic-program facilitator operating the app during a meeting. The
facilitator enters or imports participants, advances through students, records
advisor requests, resolves conflicts, and exports results.

### Other participants

Students and advisors participate in the synchronous discussion but do not use
the prototype directly. The facilitator records their requests and confirms
assignments. Multi-user participation is not prototype scope.

## Core workflow

### 1. Semester setup

1. Create a semester by selecting Spring or Fall and entering a year.
2. Open an existing semester or delete it after confirmation.
3. View each board's student and advisor counts. After matching starts, an
   incomplete board also shows resolved and unresolved student counts.
4. Display boards as responsive summary cards, with up to three cards per row
   on large screens.

### 2. Board setup

1. Add up to three boards to a semester: at most one for each supported genre.
2. Choose exactly one genre. The genre is the board's display name; the user
   does not enter a separate board name.
3. Creating a board starts a guided onboarding flow. The first screen adds only
   advisors and capacities. Capacity defaults to 3 and must be at least 1.
4. Continue to a student-only entry screen. Add students with their program
   stage, advisor preferences, and previous-advisor history. Each student and
   advisor belongs to exactly one board in that semester. Above the student
   form, show a compact overview with advisor count and total capacity.
5. Continue to Review, which displays both rosters and allows either roster to
   be edited.
6. Review shows an error whenever total advisor capacity does not exactly equal
   the student count, whether capacity is too low or too high. Matching cannot
   begin until the counts match and at least one student exists.
7. When Review passes, continue to the separate matching screen. Later edits that
   invalidate requests or assignments require an explicit warning.

### Keyboard-first roster entry

- Student and advisor forms label the two name fields **First name** and **Last
  name**. The data model retains separate given-name and family-name fields.
- Inputs follow a predictable native tab order without focus traps.
- Advisor entry tabs through first name, last name, and capacity before the
  add/save action.
- Student entry tabs through first name, last name, program stage, preferences,
  previous-advisor history, and the add/save action.
- After adding a person, return focus to the first field for the next entry while
  preserving the facilitator's place in the roster.
- Last-name matching order uses the explicit family-name field and falls back to
  entry order when family names are identical.

### 3. Live matching: first pass

1. Starting matching orders students alphabetically by last name. The materialized
   order stays fixed unless the board is reset; equal last names retain entry order.
2. Present one unassigned student prominently, with program stage, previous
   advisors, student-requested advisors, and progress.
3. Show eligible advisors with remaining capacity and relevant history in the
   same responsive card grid used for the post-pass student list.
4. The facilitator toggles advisor requests for the current student. A request
   never creates an assignment by itself.
5. If exactly one eligible advisor has requested the student, show a separate
   **Confirm match** action for that advisor. The facilitator may confirm it or
   defer the student.
6. If more than one advisor requests the student, defer the student to conflict
   resolution and preserve the complete request list.
7. If no advisor requests the student, defer the student as unresolved.
8. Each confirmed assignment consumes one capacity slot.
9. When an advisor becomes full, they cease to be eligible for all other
   unassigned students and are removed from those students' request lists.
   Confirming a student removes every other requester from that student's list.
10. Advance until every student has been considered once.

The facilitator can step backward through the latest 50 reversible matching
actions for that board and can deliberately revisit a previously considered
student. Undo history is saved locally with the board and survives refreshes and
browser restarts.

### 4. Conflict resolution

1. List unresolved students, contested students first, with currently eligible
   requesters and their soft-preference context. Show program stage as subdued
   text above the student name. Use up to three cards per row on large screens
   and collapse the grid to full-width rows on small screens. Within each card,
   show requesters as a vertical list rather than an inline row.
2. Allow the facilitator to select and confirm any eligible advisor from the
   board, including one who did not request the student.
3. Recalculate capacity and eligibility after every assignment. Reject a
   match that would make it impossible to assign every remaining student
   within capacity and previous-advisor restrictions.
4. Keep unresolved students visible if capacity makes completion impossible.
5. From the post-pass list, allow the facilitator to open any unmatched student
   directly or start another alphabetical pass through all unmatched students.
   Preserve remaining requests and assignments across passes.
6. Allow the facilitator to undo a specific student's assignment from the
   post-pass list. Return that student to unresolved status, free the advisor's
   capacity, and restore requests removed by that assignment when retained undo
   history is available.

### 5. Results

1. When every student is assigned, show a **Complete board** action. The board
   becomes complete and locks assignment changes only after the facilitator
   selects it; then show the final student–advisor matches and mark the Matching
   setup step complete.
2. Allow sorting/grouping by student, advisor, program stage, or board.
   Board result lists are titled with semester and genre, such as
   `Spring 2027 - Fiction`, and allow the facilitator to include or omit the
   Student, Program stage, and Advisor columns while keeping at least one.
   Semester-level results include every completed board and omit incomplete
   boards from both the preview and print/PDF output. The semester screen shows
   only a compact completion summary and opens results on a dedicated view. A
   print option can start each completed board on a separate page.
   Print settings are collapsed by default behind **Show customizations**, which
   toggles to **Hide customizations** and reveals Sort, Columns, and Preferences
   sections. Preferences is omitted when the current print scope has no
   preference controls.
3. Provide all three facilitator-friendly outputs:
   - a print-optimized page that can be saved as PDF through the browser;
   - a downloadable CSV;
   - a tabular clipboard copy suitable for pasting into a document or sheet.
4. A completed board can be reopened after a clear warning; subsequent changes
   use the same matching-action reversal model.

## Product rules and invariants

- A student has zero or one final advisor.
- An assignment always refers to a student and advisor in the same academic
  semester and on the same board.
- A student belongs to exactly one board in a semester.
- An advisor belongs to exactly one board in a semester and is never shared
  across boards.
- A semester has no more than one board for a given genre.
- An advisor cannot exceed capacity through the normal workflow.
- Capacity must be a positive integer and defaults to 3.
- `is full` is derived from assignments and capacity, never edited directly.
- An unavailable advisor cannot submit a new request.
- Adding an advisor to a request list never assigns that advisor. Every match
  requires a separate, explicit confirmation by the facilitator.
- Student-requested advisors are soft guidance and do not change eligibility.
- A current-board advisor who previously advised a student is ineligible for
  that student.
- Removing an advisor or student with requests/assignments requires an explicit
  resolution step.
- A confirmed student retains only the assigned advisor from their request list,
  if that advisor requested them. A full advisor is removed from every other
  student's request list.
- Completion means all students are assigned, not merely considered.
- A board with insufficient total eligible capacity remains incomplete until
  capacities are increased or other valid roster changes provide enough slots;
  capacity cannot be overridden during assignment.
- Duplicate names are allowed; the UI uses stable IDs and enough context to
  distinguish people.

## Data entry and portability

Prototype baseline:

- Manual entry is the only roster-entry workflow for the initial prototype.
- Setup proceeds one step at a time: semester, board, advisors and capacities,
  then students.
- JSON export/import provides backup, transfer, and recovery.
- CSV roster import is out of scope for now; CSV results export is required.
- A later CSV-import enhancement should use separate advisor and student
  templates that follow the same guided order. It must preview and validate all
  rows before changing the board.
- Import validates the entire payload and previews changes before replacing or
  merging data.
- The app clearly states that data stays in this browser unless exported.

## Local data controls

- Reset the current board's matching activity while preserving its roster.
  This also clears that board's undo history.
- Keep a completed board locked until the facilitator confirms reopening it;
  reopening preserves assignments and becomes an undoable action.
- Delete one board.
- Delete one semester and all of its boards.
- Clear all locally stored app data.
- Export a backup before any broad reset.
- Destructive actions identify their scope and require confirmation. “Clear all”
  uses stronger wording and is not placed beside routine controls.

## UX and accessibility requirements

- Optimize the live session for a laptop connected to a projector, while
  remaining usable on tablet and desktop widths.
- Display progress, capacity, conflicts, and saved state without relying on color
  alone.
- All matching controls are keyboard accessible, with visible focus and large
  click targets.
- Announce assignment and validation changes to assistive technology.
- Prevent accidental double submission and make undo continuously discoverable.
- Never hide an unresolved student simply because an advisor became full.

## Out of scope for the prototype

- Accounts, authentication, roles, or permissions
- A backend database or cloud synchronization
- Simultaneous multi-device participation
- Automated or algorithmic matching recommendations
- Email, messaging, notifications, or calendar integration
- Publishing names to a public server
- A permanent audit log across browsers/devices

## Success criteria

- A facilitator can set up a representative semester and board without
  developer assistance.
- The app never silently over-assigns an advisor or loses an unresolved student.
- A session can be refreshed or closed and resumed on the same browser.
- All saved data can be exported, restored, and completely cleared.
- A complete result can be printed or moved into the program's existing records.
- Results can be saved as PDF, downloaded as CSV, or copied as a table.
- The deployed prototype works from its GitHub Pages project URL.

## Previous-advisor history behavior

- Previous advising relationships are entered for a student by advisor name.
- The entry field accepts one previous advisor per line or comma-separated names.
- On entry, the app looks for that advisor among the student's current board.
- If exactly one current advisor matches, link the history record to that advisor
  and make the advisor ineligible for that student.
- If no current advisor matches, retain the previous advisor's name as unlinked
  history. Because advisors may differ each semester, do not create a new current
  advisor or global advisor profile. The facilitator can remove the unlinked
  history entry.
- If more than one current advisor could match, the app must ask the facilitator
  to choose the correct advisor instead of guessing.
- If a matching advisor is added to the board later, the app should offer to link
  the unlinked history record.
- An advisor's “previous students” view is derived from linked history records,
  preventing two editable copies of the same relationship.
- Requested and previous advisors appear as rounded indicators with an info icon.
  Current-board advisors have an outline and background; advisors not active on
  the board have an outline only. Hover/focus identifies ineligible history as
  “Excluded from matching” and absent history as “Not active,” without adding
  separate status text to the roster.

## Open product questions

These can be decided during interaction design; none changes the agreed
single-facilitator architecture.

1. Are there institutional accessibility or student-record privacy requirements
   beyond the baseline above?

## Product decision log

| Date | Decision | Status | Rationale |
| --- | --- | --- | --- |
| 2026-11-12 | Prototype is a facilitator-operated, local-first web app. | Accepted | One facilitator records a synchronous meeting; no participant devices or remote interaction are needed. |
| 2026-11-12 | Remove a full advisor from other students' request lists and remove competing requests once a student is matched. | Accepted | Keeps the working list focused on advisors who can still be assigned and makes the confirmed match definitive. |
| 2026-11-12 | “Semester” and “program stage” are distinct terms. | Accepted | Removes a collision in the supplied data fields. |
| 2026-11-12 | A board represents one genre cohort; advisors belong to only one board. | Accepted | Confirmed by the product owner; capacity and eligibility are therefore board-local. |
| 2026-11-12 | Students belong to one board, and each semester has at most one board per genre. | Accepted | Confirmed by the product owner. |
| 2026-11-12 | Advisor requests and assignments are separate; every assignment is explicitly confirmed. | Accepted | Prevents a request from silently becoming a final match. |
| 2026-11-12 | Preferences are soft guidance, while previous advising makes a current advisor ineligible. | Accepted | Confirmed matching policy; history is linked only when the advisor exists on the current board. |
| 2026-11-12 | Conflict resolution may select any eligible advisor. | Accepted | The facilitator retains final assignment authority. |
| 2026-11-12 | Capacity has no assignment override. | Accepted | A board remains incomplete until enough valid capacity exists. |
| 2026-11-12 | Semester terms are Spring and Fall only. | Accepted | Confirmed by the product owner. |
| 2026-11-12 | Setup is a manual sequence: semester, board, advisors/capacities, students. | Accepted | Matches the facilitator's intended preparation workflow; CSV roster import is deferred. |
| 2026-11-12 | Results support print-to-PDF, CSV download, and copied table. | Accepted | All three outputs are required for the initial prototype. |
| 2026-11-12 | Do not include sample data initially. | Accepted | Confirmed by the product owner. |
| 2026-11-12 | Support the latest two stable desktop Chrome releases. | Accepted | Matches the meeting environment. |
| 2026-11-12 | Persist up to 50 undoable matching actions per board. | Accepted | Provides multi-step recovery across refreshes while keeping local history bounded. |
| 2026-11-12 | Always match students alphabetically by last name. | Accepted | Removes an unnecessary setup choice; entry order remains the stable tie-breaker for equal last names. |
| 2026-11-12 | Store given and family names separately and optimize roster forms for Tab-key entry. | Accepted | Makes last-name ordering reliable and repeated manual entry efficient. |
| 2026-11-12 | Defer CSV roster import but preserve a clean import boundary. | Accepted | Manual entry remains first scope; a strict-template importer can be added without changing the domain model. |
| 2026-11-12 | Show requested and previous advisors as info-bearing rounded indicators; accept previous advisors by line or comma. | Accepted | Makes active, inactive, and excluded relationships visible without adding explanatory status text to every roster row. |
| 2026-11-12 | Use a board onboarding flow of Advisors → Students → Review → Matching and require exact capacity equality at Review. | Accepted | Keeps roster entry focused and prevents starting a session with either missing or excess advisor slots. |
| 2026-11-12 | Use “matching,” “match,” and “matches” in facilitator-facing language. | Accepted | The terminology is clearer and more natural for the academic advising workflow. |
| 2026-11-12 | Name the app “Who Works With Whom?” | Accepted | The name directly describes the facilitator's task in approachable language. |
| 2026-11-12 | Use “First name” and “Last name” as form labels and summarize advisor count/capacity above student entry. | Accepted | Uses familiar language and keeps the capacity constraint visible while entering students. |
