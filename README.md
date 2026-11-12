# Advising Matching Prototype

A local-first React prototype for facilitating student–advisor matching meetings.
The product and architecture decisions live in `plan/`.

## Requirements

- Node.js 24 or newer
- npm 11 or newer
- Current or previous stable desktop Chrome for manual verification

## Local development

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173/`).

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

## Current manual checkpoint

1. Open the app in desktop Chrome.
2. Confirm the app shows an empty **Semesters** page.
3. Refresh and confirm the shell returns without an error.
