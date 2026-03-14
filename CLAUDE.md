# CLAUDE.md

## Project Overview

Boardgame Shelf — a web-first PWA for managing a board game collection, logging play sessions, tracking players, and viewing gaming stats. All data is local (IndexedDB), no backend.

## Commands

```bash
npm run dev       # Start dev server (Vite, port 5173)
npm run build     # TypeScript type-check + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

## Architecture

- **Routing**: React Router 7 with 4 tabs (Collection `/`, Plays `/plays`, Stats `/stats`, Settings `/settings`) + Welcome screen (`/welcome`, first launch only)
- **State**: Zustand stores with `persist` middleware backed by IndexedDB (via `idb-keyval` and custom `idb-storage.ts` adapter)
- **Styling**: Tailwind CSS 4 with CSS custom properties for theming. Theme variables defined in `src/index.css`. Dark/light mode via `data-theme` attribute on `<html>`, accent colors via `data-accent` attribute. Glass morphism effects throughout.
- **Components**: Radix UI headless primitives wrapped in `src/components/ui/`. Custom components in `src/components/`.
- **Animations**: Framer Motion 12 — page transitions, card interactions, list stagger
- **PWA**: `vite-plugin-pwa` with Workbox precaching. Manifest configured in `vite.config.ts`.
- **IDs**: Generated with `crypto.randomUUID()`

## Key Types (src/types/index.ts)

- `BoardGame` — name, player range, play time, category, complexity (1-5), rating, favorite flag
- `Player` — name, color
- `PlaySession` — linked to gameId, playerIds, winnerId, scores, duration, date
- `UserPreferences` — theme, accent color, hasSeenWelcome

## Conventions

- Pages live in `src/app/<route>/page.tsx`
- Reusable UI primitives in `src/components/ui/`
- Feature components directly in `src/components/`
- Business logic and utilities in `src/lib/`
- All stores exported via barrel `src/stores/index.ts`

## Workflow

- **Roles**: Claude is the SR fullstack engineer — owns technical decisions, proposes solutions, and makes architectural calls to meet requirements. The user is the tech lead / PO.
- **Process**: The user defines the task or goal. Claude designs the approach, makes implementation decisions, and creates a PR targeting `main`. Everything is behind a PR so we can roll back if needed.
- **Review**: The user reviews and approves the PR. Claude does NOT merge — only the user merges.
- **Branching**: Create a feature branch per task (`feat/<short-name>`), commit all work there, push, and open a PR with `gh pr create`.
- **Build check**: Always run `npm run build` before pushing to ensure no type errors or build failures.
- **Autonomy**: Claude should work autonomously in the background and notify the user when the PR is ready for review.

## Deployment

- Hosted on Vercel as static SPA, auto-deploys on merge to `main`
- `vercel.json` rewrites all routes to `index.html`
- Build output: `dist/`
