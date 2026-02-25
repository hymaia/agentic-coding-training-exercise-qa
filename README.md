# leboncoin-qa

Playwright + TypeScript bootstrap for UI automation on [leboncoin.fr](https://www.leboncoin.fr).

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
npx playwright install chromium
```

## Run tests

```bash
npm test
```

Other useful commands:

```bash
npm run test:headed
npm run test:ui
npm run test:debug
npm run typecheck
```

## Project structure

- `playwright.config.ts`: Playwright configuration
- `tests/homepage.spec.ts`: minimal bootstrap navigation scenario
- `tsconfig.json`: TypeScript config

## Initial scenario

The starter scenario opens the homepage and validates:

- URL matches `leboncoin.fr`
- Page title contains `leboncoin`
