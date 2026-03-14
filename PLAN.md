# Boardgame Shelf — V1 Plan

## Vision

A personal board game management PWA. Offline-first, no backend. Solves the real problems of owning a growing board game collection: forgetting what you have, picking the right game for the night, tracking unfinished sessions, and managing a wishlist.

## Core Concept

The **Game Card** is the central unit. Everything revolves around it — sessions link to it, play logs reference it, wishlisted items graduate into it, sharing is built on it, tags filter it.

---

## Features

### 1. Collection (Home Tab)

The game library. Every game you own lives here as a card.

**Game Card fields:**
- Name
- Photo (camera or gallery)
- Description (brief, personal)
- Player count (min–max)
- Estimated play time
- Complexity (1–5)
- Personal rating
- Expansions (list of owned / not owned)
- Quick rules notes (stuff you always forget)
- General notes (free-form: anything goes)
- Tags (system + custom)

**Actions from Collection:**
- Add game (manual entry; v2: barcode/QR scan)
- Game Night Picker (filter overlay: player count + time + tags → filtered list, with random pick option)
- Share a single game card, a filtered list, or full collection
- Sort/filter by any field or tag

### 2. Tag System

Unified tag system for smart filtering across the entire app.

**System tags (auto-managed):**
- `new` — auto-applied when game is added, auto-removed on first play log
- `up for trade` — user toggles on/off
- `not played recently` — auto-applied if no play log in configurable period (e.g. 3 months)
- `favorite` — user toggles on/off

**Default tags (pre-populated, editable/deletable):**
- strategy, party, cooperative, deck-builder, worker-placement, area-control, dice, card, family
- (These replace the old hardcoded "category" field — categories are just tags)

**User tags (fully custom):**
- User creates whatever they need ("grandparents house", "date night", "needs big table", etc.)
- Same filtering behavior as system/default tags

**Filtering:**
- Multi-tag filter (AND logic): "4 players + under 90 min + grandparents house"
- Tags are reusable across the app (collection, wishlist)

### 3. Sessions (Tab)

Track in-progress games, paused games, and multi-day campaigns.

**Session fields:**
- Linked game (from collection)
- Players involved
- Status: active / completed / abandoned
- Scores (per player)
- Photos (capture board state)
- Notes
- Date started / last updated
- Campaign info (session number, chapter/scenario — optional)

**Key behaviors:**
- Multiple sessions per game (e.g. 20 Gloomhaven sessions)
- Each session is independently editable
- Can be deleted (abandoned or finished)
- Sessions list grouped by game, sorted by last updated

### 4. Live Scorekeeper

An ephemeral tool launched from a game card or active session.

- Select players
- +/- score counter per player
- Optional round tracking
- On end → save to play log or attach to active session
- Replaces paper score sheets

### 5. Play Log

Simple historical record per game. Not sessions (which track in-progress state), but a quick stamp.

**Play log entry:**
- Date
- Players
- Winner(s)
- Optional: duration, notes

**Value:**
- Powers the `new` and `not played recently` system tags
- "Last played" sort on collection
- Feeds player stats over time
- Spot games collecting dust

### 6. Wishlist (Tab)

Games or expansions you want to buy.

**Wishlist item fields:**
- Name
- Type: game / expansion (if expansion, link to owned game)
- Price found
- Store / link (e.g. Amazon URL)
- Notes
- Tags

**Key behaviors:**
- Quick access at a store — "is this on my list? what price did I find before?"
- Shareable with friends (gift ideas)
- When purchased, can convert to a collection game card

### 7. Sharing

Share game info with friends so they can browse before game night.

**Shareable units:**
- Single game card (detail view)
- Filtered collection list (e.g. "games for 4 players under 60 min")
- Wishlist (for gift ideas)
- Trade list (filtered by `up for trade` tag)

**Mechanism:** Generate a shareable view/link or image. Friends don't need the app — they see a read-only card/list. (Implementation TBD: could be image export, deep link, or web share API.)

### 8. Settings (Tab)

- Theme (dark/light)
- Accent color
- Data export/import (JSON backup)
- "Not played recently" threshold config
- Default tags management

---

## Deferred to V2+

- **Player Profiles** — management page to add people you often play with (name, color/avatar). Linked to play logs, sessions, and scorekeeper for quick selection. Stats over time: games played, win rate, favorite games. Helps pre-fill players when starting a session or logging a play.
- Barcode/QR scan to auto-add games (camera + external DB lookup)
- LLM integration (ask questions about your collection, rules, recommendations)
- Smart suggestions ("you haven't played X in 6 months", "this fits tonight's group")
- BGG (BoardGameGeek) quick lookup integration
- House rules as a separate section from quick rules notes
- Multiplayer/social features beyond sharing

---

## Build Order

> **Status legend:** `[ ]` not started · `[~]` in progress · `[?]` in review · `[x]` done

### Phase 1 — Foundation `[?]`
- [x] Game Card: add, edit, delete, detail view
- [x] Tag system: system tags + default tags + custom tags + filtering
- [x] Collection list with search and tag filters

### Phase 2 — Game Night Experience `[ ]`
- [ ] Game Night Picker (filter overlay + random pick)
- [ ] Play Log (quick log entries per game)
- [ ] System tag automation (`new`, `not played recently`)

### Phase 3 — Session Tracking `[ ]`
- [ ] Sessions: create, edit, delete, status management
- [ ] Live Scorekeeper
- [ ] Campaign tracking (session numbering, chapter info)

### Phase 4 — Wishlist & Sharing `[ ]`
- [ ] Wishlist: add, edit, delete, expansion linking
- [ ] Sharing: game card export, list sharing
- [ ] Trade list (filter by `up for trade`)

### Phase 5 — Polish `[ ]`
- [ ] Player profiles + stats
- [ ] Settings: full config, data export/import
- [ ] Onboarding / Welcome flow refinement
