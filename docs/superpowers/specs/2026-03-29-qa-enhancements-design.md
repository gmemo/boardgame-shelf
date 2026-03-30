# QA Enhancements — Design Spec
**Date:** 2026-03-29
**Branch strategy:** Single PR targeting `main`
**Status:** Approved by PO

---

## Overview

Post-QA round of bug fixes and feature enhancements across Collection, Scorekeeper, Wishlist, Game Night Picker, and Settings. Delivered as one PR to avoid sequential branch dependency complexity.

---

## 1. Data Model Changes

### 1.1 `WishlistItem` (updated type)

Wishlist items are a superset of collection game data — they include optional BoardGame fields plus wishlist-specific fields. Only `name` is required.

```typescript
interface WishlistItem {
  id: string;
  name: string;                          // required
  type: 'game' | 'expansion';            // default 'game'
  linkedGameId: string | null;           // for expansions: parent game in collection
  // Optional game fields
  imageUrl: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playTimeMinutes: number | null;
  complexity: (1 | 2 | 3 | 4 | 5) | null;
  tagIds: string[];
  notes: string;
  quickRulesNotes: string;               // quick convention notes
  // Wishlist-specific optional
  price: string;
  store: string;
  link: string;
  createdAt: string;
  updatedAt: string;
}
```

**Migration:** Existing persisted `WishlistItem` records in IndexedDB won't have the new fields. The wishlist store must coalesce missing fields at runtime. Add a `migrateWishlistItem` function called in `onRehydrateStorage`. The spread pattern (`{ defaults, ...raw }`) is inherently idempotent — existing fields always override the defaults, so re-running migration is safe:

```ts
function migrateWishlistItem(raw: Record<string, unknown>): WishlistItem {
  return {
    // Defaults placed first — existing fields in `raw` override them
    minPlayers: null,
    maxPlayers: null,
    playTimeMinutes: null,
    complexity: null,
    quickRulesNotes: '',
    ...raw,
  } as WishlistItem;
}
// In onRehydrateStorage:
// state.items = state.items.map(migrateWishlistItem);
```

No versioning field required — the spread is safe to run on already-migrated records.

No changes to `BoardGame`, `Expansion`, or any other type.

### 1.2 "Add to Collection" — field mapping

**Game field mapping from `WishlistItem` → `BoardGame`:**

| WishlistItem field | BoardGame field | Null default |
|--------------------|----------------|--------------|
| `name` | `name` | — (required) |
| `imageUrl` | `imageUrl` | `null` |
| `minPlayers` | `minPlayers` | `1` |
| `maxPlayers` | `maxPlayers` | `4` |
| `playTimeMinutes` | `playTimeMinutes` | `60` |
| `complexity` | `complexity` | `3` |
| `tagIds` | `tagIds` | `[]` |
| `notes` | `notes` | `''` |
| `quickRulesNotes` | `quickRulesNotes` | `''` |
| *(none)* | `description` | `''` |
| *(none)* | `rating` | `null` |
| *(none)* | `expansions` | `[]` |

`price`, `store`, `link`, `linkedGameId`, `type` are dropped (wishlist-only).

**Logic:**
- `type: 'game'` → create `BoardGame` per mapping above; delete wishlist item; navigate to `/game/:newId`.
- `type: 'expansion'` + `linkedGameId` resolves to a game in the game store → append `{ id: crypto.randomUUID(), name: item.name, owned: true }` to parent game's `expansions[]`; delete wishlist item; navigate to `/game/:linkedGameId`.
- `type: 'expansion'` + no linked game (or game not found in store) → treat same as `type: 'game'`. The expansion classification is dropped silently (acceptable — user can edit the resulting game card). No confirmation required.

---

## 2. Bug Fixes & Polish

### 2.1 Modal scroll lock

**Problem:** When any bottom sheet is open, swipes propagate to the background page.

**Fix:** New hook at `src/lib/use-scroll-lock.ts`:

```ts
function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [active]);
}
```

**Applied to (named explicitly):**
- `GamePicker` — pass `open` prop to the hook
- `GameNightPicker` — pass `open` prop to the hook
- `ScorekeeperPage` — three sheets: `addCategorySheetOpen`, `addPlayerSheetOpen`, `endSheetOpen` — pass `addCategorySheetOpen || addPlayerSheetOpen || endSheetOpen` to the hook

### 2.2 Sticky header black background (Sessions, Wishlist, Stats)

**Problem:** `sticky top-0 z-10 bg-gradient-to-b from-background from-60% to-transparent` renders a solid dark band.

**Fix:** Remove `sticky`, `z-10`, and the gradient. Use `px-4 pt-4 pb-3` only — matching Collection and Settings exactly. Headers scroll away with content.

Files: `src/app/sessions/page.tsx`, `src/app/wishlist/page.tsx`, `src/app/stats/page.tsx`

### 2.3 Nav chip overflow (first/last tabs)

**Problem:** In `bottom-nav.tsx`, each tab button renders `{active && <motion.div layoutId="active-tab-chip" className="absolute inset-0 rounded-xl glass-pill" />}`. The `inset-0` chip on the first and last tabs bleeds past the nav pill's rounded corners.

**Fix:** Change only the chip's className: `absolute inset-0` → `absolute inset-y-1 inset-x-0.5` (keeps the `rounded-xl glass-pill` classes unchanged).

File: `src/components/bottom-nav.tsx`

### 2.4 Settings page bottom content clipped by nav

**Problem:** Scrolling to the bottom of Settings clips the last content behind the floating nav.

**Fix:** `pb-8` → `pb-24` on the `<div className="flex flex-col gap-4 px-4 pb-8">` wrapper.

File: `src/app/settings/page.tsx`

### 2.5 Log play date field width

**Problem:** Date `<input>` stretches full width unnecessarily.

**Fix:** Add `max-w-[180px]` to the date input wrapper in `PlayLogForm`.

File: `src/components/play-log-form.tsx`

### 2.6 Scorekeeper: remove round counter

**Remove entirely from `ScorekeeperPage`:** the `round` state variable, `setRound` calls, and the `Rd {round}` display with its `+/-` buttons from the top bar.

**Note:** `PlaySession` has a `round` field in `src/types/index.ts`. Do **not** remove it from the type — existing persisted sessions may have it. The field simply stops being written or read by the scorekeeper UI. No migration needed.

File: `src/app/scorekeeper/page.tsx`

### 2.7 Scorekeeper: no default empty player slots

**Fix:** Change `useState<string[]>(() => { ... return ['', '']; })` to return `[]` when there is no `existingSession`.

File: `src/app/scorekeeper/page.tsx`

### 2.8 Scorekeeper: touch target size

**Fix:** Score `+/-` buttons: `w-6 h-6` → `w-11 h-11`. Icon size unchanged. This applies in the new card-per-player layout (see Section 4).

### 2.9 Settings: light theme fun label

**Fix:** After the `ToggleGroup` for theme in `SettingsPage`:

```tsx
{preferences.theme === 'light' && (
  <p className="text-xs text-text-secondary/60 italic mt-1 text-center">
    why would anyone want light? are you ok?
  </p>
)}
```

File: `src/app/settings/page.tsx`

---

## 3. Collection Game Cards

### Layout change

Current: name + players/time/complexity dots crammed into one row.

New — image retained at top, four stacked info rows below:

```
[Image — aspect-[3/2] max-h-32, existing behaviour]
─────────────────────────────────────────────────────
Row 1: Name (full width, truncated, text-sm font-semibold)
Row 2: 👥 X–Y  ·  🕐 Xm   (text-xs text-secondary)
Row 3: ComplexityDots (left-aligned, size="sm")
Row 4: Tag chips max 2 + "+N" badge (text-[10px])
```

`gap-2` between rows, `p-3` padding all sides (ensures right-edge clearance). Info section uses `flex-1 flex flex-col` to fill card height naturally.

File: `src/components/game-card.tsx`

---

## 4. Scorekeeper — Card-Per-Player Layout (in-place refactor)

**Approach:** In-place refactor of `src/app/scorekeeper/page.tsx`. Table rendering is replaced entirely. No new component file. All existing state (scores, categories, playerNames, playerColors, sheets) is preserved.

### Player card structure

Each player rendered as a `glass rounded-2xl p-4` card:

```
┌──────────────────────────────────────┐
│ ● Player Name              Total: 42 │  ← header row
├──────────────────────────────────────┤
│ Score        [−]    12    [+]        │  ← category row (44px buttons)
│ VP           [−]     8    [+]        │
└──────────────────────────────────────┘
```

- Header: color dot + editable name input + `×` remove button + computed total (sum of all category scores)
- Each category row: category name (tappable to rename, existing) + `−` button (w-11 h-11) + score value (tappable to direct edit, existing) + `+` button (w-11 h-11)
- Inline category name editing and inline score editing behaviour unchanged

### Page layout

```
[Top bar: back + game name]
[Controls row: category count + "Add Category" button]
[Scrollable area:]
  [flex flex-col gap-3]
    [Player card × N]
    [Add Player button]
[Bottom bar: Pause + End Game]
```

- Sheets (Add Category, Add Player, End Game) unchanged — no new sheets introduced in this section
- `round` state removed (see 2.6)
- Default player slots removed (see 2.7)
- Scroll lock covers exactly these three sheets: `addCategorySheetOpen || addPlayerSheetOpen || endSheetOpen` (see 2.1)

---

## 5. Wishlist Overhaul

### 5.1 List page (`/wishlist`) — updated

- Layout: `grid grid-cols-2 gap-3` (matching Collection)
- Card (`WishlistItemCard` updated): image thumbnail (`aspect-[3/2]` same as game card), name, type badge, price badge if set
- Tap → `/wishlist/:id` (new detail route)
- FAB (`<Plus>`) positioned `bottom-24 right-4` for adding new items
- Existing filter pills (All / Games / Expansions) retained in header

### 5.2 Detail page (`/wishlist/:id`) — new

**New files:**
- `src/app/wishlist/[id]/page.tsx`
- Register route in `src/App.tsx`: `<Route path="/wishlist/:id" element={<WishlistDetailPage />} />`

**Layout:**
- Entrance animation matching game detail: `motion.div` with `scale: 0.82, y: 40 → 1, 0`, spring `stiffness: 260, damping: 28`
- Ambient glow div
- Top action bar (back / edit / delete) as a row above content (not floating). Edit button navigates to `/wishlist/:id/edit`.
- Image (if set): `rounded-2xl aspect-[16/9] depth-2 px-4 mx-0` matching game detail hero style
- Content sections (only shown if fields are non-empty/non-null):
  - Name + type badge
  - Game details: players / time / complexity (if any are set)
  - Purchase info: price / store / link (if any are set)
  - Notes (if set)
  - Quick notes (if set)
- Bottom CTA: "Add to Collection" button (full width, primary variant)
- Back navigation: `navigate(-1)` (returns to wishlist list or wherever user came from)

### 5.3 Quick form (`/wishlist/new` and `/wishlist/:id/edit`) — updated

**Required section (always visible):**
- Name input
- Type toggle: Game / Expansion
- If Expansion: linked game picker (existing `GamePicker` component, optional)
- Image picker (existing component)

**Collapsible "Game details" section:**
- Min players, Max players (two adjacent number inputs)
- Play time (minutes, number input)
- Complexity (1–5 dot picker)

**Collapsible "Purchase info" section:**
- Price (text input)
- Store (text input)
- Link (text input)

**Always visible below:**
- Notes textarea
- Quick notes textarea (labelled "Quick note, e.g. where you saw it")

Collapsible sections start collapsed. **On edit (existing item):** each section's initial open state is `useState(() => hasValueInSection(item))` — computed once on mount from the item's current data. Sections snap open immediately (no animation on initial render). A section is considered to "have a value" if any of its fields is non-null and non-empty-string.

### 5.4 Wishlist item cards (`WishlistItemCard`) — updated

- Add image area (same structure as `GameCard` image area)
- Remove inline "Add to Collection" and "Edit" buttons — those actions live in the detail page
- Entire card is a `<button>` navigating to `/wishlist/:id`

---

## 6. Game Night Picker

### 6.1 Multi-select discoverability

- Add a `Select` button to the Collection header action row (text button, alongside sort + dice icons)
- Tapping enters select mode — same as long-pressing a card
- Long-press behaviour unchanged

File: `src/app/collection/page.tsx`

### 6.2 Suggestion flow (redesigned sheet)

**Structural changes to `GameNightPicker`:**

- **Always visible:** player count stepper + time preset pills (unchanged)
- **"More filters" collapsible:** tag filter chips section, collapsed by default, toggled by a `ChevronDown/Up` button
- **Results area:** compact list of top 5 matching games (unchanged row style)
- **"Pick one" button:** renamed from "Pick! (N)" to "Pick one", highlights a single random game in a large card (existing `pickedGame` behaviour)
- Share button behaviour unchanged (shares text list)

File: `src/components/game-night-picker.tsx`

---

## 7. Visual Share Cards

> **Dependency:** `html-to-image` is a new npm dependency. This feature is fully additive — if the dependency is not approved, simply omit the share buttons at the entry points (Section 7.4). All other sections in this spec are unaffected.

### 7.1 `<ShareCard>` component

New file: `src/components/share-card.tsx`

- Flat design — no glass, no backdrop-filter. Uses `bg-[var(--background)]` with solid fills and standard box shadows.
- Fixed render dimensions: `1080px × 1080px` (CSS `width` / `height`, not viewport units)
- Positioned offscreen for capture: `position: absolute; left: -9999px; top: 0; visibility: hidden` (use `style` prop, not Tailwind, to avoid purging). **Do not use `position: fixed`** — fixed positioning on iOS PWA causes safe-area / scroll-position rendering bugs with html-to-image.

**Variants (controlled via `variant` prop):**

`variant="game"`:
```
[Game image — fills upper 60%, object-cover]
[Accent color band — 4px]
[Name — large, bold]
[Players · Time metadata row]
[Meeply branding — bottom right, small]
```

`variant="session"`:
```
[Game name — large, centered, upper area]
[Winner name — accented, large, center]
[Player list — small, comma-separated]
[Date — small, bottom]
[Meeply branding — bottom right]
```

### 7.2 Image generation

New file: `src/lib/share-image.ts`

```ts
import { toPng } from 'html-to-image';

export async function generateShareImage(node: HTMLElement): Promise<File> {
  const dataUrl = await toPng(node, { width: 1080, height: 1080 });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], 'meeply-share.png', { type: 'image/png' });
}
```

### 7.3 Sharing

```ts
export async function shareImage(file: File): Promise<void> {
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Meeply' });
  } else {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meeply-share.png';
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

### 7.4 Entry points

| Location | Trigger | Variant | Data |
|----------|---------|---------|------|
| Collection multi-select toolbar | "Share as image" button (shown when ≥1 game selected) | `game` (grid of up to 4 thumbnails — single card if 1 selected) | selected games |
| Game detail page | Share icon button in top action bar | `game` | current game |
| Play log detail | Share icon button in action bar | `session` | play log + game name |

Each entry point: renders `<ShareCard>` offscreen, calls `generateShareImage`, calls `shareImage`.

---

## 8. Settings Enhancements

### 8.1 Custom accent color

**`UserPreferences` type change:** `accentColor` remains `string`. When the value starts with `#` it is treated as a raw hex custom color; otherwise it is treated as a named preset (`'indigo'`, `'emerald'`, etc.).

No migration needed — existing named values (`'indigo'`, etc.) continue to work unchanged.

**UI:** Add a "Custom" swatch as the 7th circle in the accent color row. The swatch displays the current custom hex if set, otherwise a rainbow gradient. Tapping it calls `.click()` on a hidden `<input type="color">`. The selected hex is stored as `preferences.accentColor`.

**CSS var update in `App.tsx`:**
```ts
if (accentColor.startsWith('#')) {
  const r = parseInt(accentColor.slice(1,3), 16);
  const g = parseInt(accentColor.slice(3,5), 16);
  const b = parseInt(accentColor.slice(5,7), 16);
  root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
  root.removeAttribute('data-accent');
} else {
  root.setAttribute('data-accent', accentColor);
  root.style.removeProperty('--primary-rgb');
}
```

### 8.2 Light theme fun label

```tsx
{preferences.theme === 'light' && (
  <p className="text-xs text-text-secondary/60 italic mt-1 text-center">
    why would anyone want light? are you ok?
  </p>
)}
```

---

## Files Affected

| File | Change type |
|------|-------------|
| `src/types/index.ts` | Update `WishlistItem` type |
| `src/stores/wishlist-store.ts` | Migration in `onRehydrateStorage` |
| `src/lib/use-scroll-lock.ts` | New hook |
| `src/lib/share-image.ts` | New utility |
| `src/components/share-card.tsx` | New component |
| `src/components/game-picker.tsx` | Add scroll lock |
| `src/components/game-night-picker.tsx` | Redesign + scroll lock |
| `src/components/game-card.tsx` | 4-row layout |
| `src/components/bottom-nav.tsx` | Nav chip inset fix |
| `src/components/wishlist-item-card.tsx` | Image + tap-to-detail, remove inline actions |
| `src/app/scorekeeper/page.tsx` | Card layout (in-place refactor), remove table/rounds |
| `src/app/collection/page.tsx` | Select button in header |
| `src/app/wishlist/page.tsx` | Grid layout, FAB, non-sticky header |
| `src/app/wishlist/[id]/page.tsx` | New detail route |
| `src/app/wishlist/[id]/edit/page.tsx` | Updated form |
| `src/app/wishlist/new/page.tsx` | Updated quick form |
| `src/app/sessions/page.tsx` | Remove sticky header bg |
| `src/app/stats/page.tsx` | Remove sticky header bg |
| `src/app/settings/page.tsx` | pb-24, light label, custom color |
| `src/app/plays/log/page.tsx` / `src/components/play-log-form.tsx` | Date field width |
| `src/App.tsx` | Register `/wishlist/:id` route, custom color var logic |
