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

## Design System — Liquid Glass

The app follows an Apple-inspired "Liquid Glass" aesthetic. All new UI work must follow these patterns.

### Ambient Glow
- Every screen has a `<div className="ambient-glow" />` providing 3 colored radial gradients behind all content
- In `<Layout>` it's automatic. Standalone routes (`game-detail`, `game-form`, `play-log-form`, `welcome`) add their own
- Content sits on `relative z-[1]` above the glow

### Glass Classes (defined in `src/index.css`)
| Class | Use for | Blur |
|-------|---------|------|
| `.glass` | Cards, panels | 40px + saturate 1.3 |
| `.glass-light` | Secondary panels (rules, notes) | 32px + saturate 1.2 |
| `.glass-strong` | Nav bar, bottom sheets, modals, dropdowns | 60px + saturate 1.8 |
| `.glass-pill` | Inactive tag chips, buttons, nav tab chip | 32px + saturate 1.5 |
| `.glass-input` | All form inputs (Input, Textarea, inline inputs) | 20px + focus ring glow |

All glass classes include a specular top-edge highlight (`inset 0 1px 0 rgba(255,255,255,0.06)`) and use `--primary-rgb` for subtle inner glow.

### Glow Utilities
| Class | Use for |
|-------|---------|
| `.fab-halo` | FAB buttons — accent glow halo |
| `.tag-glow` | Active/selected tags, badges, pills |
| `.nav-glow` | Bottom nav pill |
| `.card-active-glow` | Card press state (`:active`) |
| `.header-fade::after` | Gradient fade below sticky headers (legacy, prefer gradient approach) |

### Accent Colors
Each accent (indigo, emerald, red, blue, amber, purple) defines `--primary-rgb`, `--glow-secondary-rgb`, `--glow-tertiary-rgb` for `rgba()` glow effects.

### Headers
- **Do NOT use `glass-strong`** for sticky page headers — it creates a visible rectangle
- Use `bg-gradient-to-b from-background from-60% to-transparent` for seamless blending
- Standalone form headers (game-form) use `bg-background` (opaque, no glass)

### Bottom Navigation
- Two separate elements in a flex row: nav pill (`glass-strong rounded-2xl`) + search area (48px)
- Search area always rendered (all tabs) to keep nav pill width consistent; search button only visible on Collection tab via opacity
- **Active tab indicator**: `motion.div` with `layoutId="active-tab-chip"` and `glass-pill` — slides between tabs via framer-motion shared layout
- **Search stretch animation**: CSS `flex` transitions (`cubic-bezier(0.32, 0.72, 0, 1)`), NOT framer-motion flex animation (unreliable). Nav pill: `flex: 1 1 0%` → `0 0 52px`. Search area: `0 0 48px` → `1 1 0%`
- Content crossfade (tabs ↔ home, button ↔ input) via inline `opacity` + `transition`

### Game Cards
- `glass rounded-2xl`, `aspect-[3/2] max-h-32` for image area
- `card-active-glow` on press, `depth-1` shadow
- `active:scale-[0.97]` press feedback

### Game Detail
- Entrance animation: `motion.div` with `scale: 0.82, y: 40 → 1, 0` using spring (`stiffness: 260, damping: 28`)
- Hero image: `rounded-2xl aspect-[16/9] depth-2` card with `px-4` margins (NOT full-bleed)
- Top action bar (back/edit/delete) is a regular row above the image, not floating over it

### FAB Buttons
- `fab-halo` instead of `depth-float`
- Positioned `bottom-24 right-4` to clear floating nav
- Hide FAB when search panel is open (collection page)

### Tags/Badges Active State
- Active/selected pills: `bg-primary text-white tag-glow`
- Inactive: `glass-pill text-text-secondary`
- Applies to: `tag-filter-bar`, `tag-picker`, `badge` (active variant), `game-night-picker` presets, `play-log-form` winner pills, `settings` threshold presets

### Animation Patterns
- **Springs**: `{ type: 'spring', stiffness: 400, damping: 30 }` for snappy UI (nav, modals). `stiffness: 260, damping: 28` for page transitions
- **CSS transitions**: Use for flex/width animations on the nav bar. Framer-motion `flexGrow`/`flexBasis` is unreliable
- **Shared layout**: `layoutId` for the active tab chip only. Avoid `layoutId` across routes (causes jank)
- **Bottom sheets** (game-picker, game-night-picker, tag-picker): `motion.div` with `y: '100%' → 0`, spring `damping: 30, stiffness: 300`
- **Crossfades**: Use always-mounted layers with `opacity` + `pointer-events-none` instead of `AnimatePresence` for nav state changes (avoids mount/unmount jank)

### Filter/Search State
- `collection-filter-store.ts` (Zustand, NOT persisted) — holds search, tagIds, sort, `isSearchOpen`
- `use-collection-filter.ts` hook reads from the store, computes `filteredGames` via `useMemo`
- Filter state preserved when collapsing search; indicator dot shown on search button

## Conventions

- Pages live in `src/app/<route>/page.tsx`
- Reusable UI primitives in `src/components/ui/`
- Feature components directly in `src/components/`
- Business logic and utilities in `src/lib/`
- All stores exported via barrel `src/stores/index.ts`

## Workflow

- **Roles**: Claude is the SR fullstack engineer — owns day-to-day implementation decisions, proposes solutions, handles code patterns and structure autonomously. The user is the tech lead AND PO.
- **Tech lead**: Major architectural decisions, new dependencies, and significant refactors require user approval before implementation.
- **PO**: UX flows, feature behavior, and any user-facing change that alters how the product works requires user sign-off.
- **Process**: The user defines the task or goal. Claude designs the approach (checking in on major decisions) and creates a PR targeting `main`. Everything is behind a PR so we can roll back if needed.
- **Review**: The user reviews and approves the PR. Claude does NOT merge — only the user merges.
- **Branching**: Always use a **git worktree** for each task to avoid branch conflicts in the main working directory. Use `isolation: "worktree"` when spawning agents, or manually create worktrees with `git worktree add`. Branch naming: `feat/<short-name>`, `fix/<short-name>`, etc. Commit all work in the worktree, push, and open a PR with `gh pr create`.
- **Build check**: Always run `npm run build` inside the worktree before pushing to ensure no type errors or build failures.
- **Autonomy**: Claude should work autonomously in the background and notify the user when the PR is ready for review.
- **Cleanup**: After a PR is merged, remove the worktree with `git worktree remove <path>`.

## Deployment

- Hosted on Vercel as static SPA, auto-deploys on merge to `main`
- `vercel.json` rewrites all routes to `index.html`
- Build output: `dist/`
