# QA Enhancements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all QA-identified bugs and ship Wishlist overhaul, Scorekeeper card layout, Game Night Picker redesign, Visual Share Cards, and Settings enhancements in one PR.

**Architecture:** All changes on a single feature branch branched from `main`. Data model and shared utilities first, then component bug fixes, then feature redesigns. No new external dependencies except `html-to-image` (share cards, additive — can be skipped if dep approval is pending).

**Tech Stack:** React 18, TypeScript, Zustand with IndexedDB persistence, Tailwind CSS 4, Framer Motion 12, React Router 7, Vite, `html-to-image` (new dep for share cards only)

**Spec:** `docs/superpowers/specs/2026-03-29-qa-enhancements-design.md`

**Verification:** This project has no test suite. Every task ends with `npm run build` to catch TypeScript errors. Visual verification steps are noted where important.

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `src/lib/use-scroll-lock.ts` | Hook: locks body scroll when a bottom sheet is open |
| `src/lib/share-image.ts` | Utility: generate PNG from DOM node, trigger share/download |
| `src/components/share-card.tsx` | Component: flat 1080×1080 share card, two variants |
| `src/app/wishlist/[id]/page.tsx` | Page: wishlist item detail view |

### Modified files
| File | Change summary |
|------|---------------|
| `src/types/index.ts` | Add optional game fields + `quickRulesNotes` to `WishlistItem` |
| `src/stores/wishlist-store.ts` | Add `onRehydrateStorage` migration for new fields |
| `src/App.tsx` | Register `/wishlist/:id` route; hex accent color logic |
| `src/components/bottom-nav.tsx` | Nav chip: `inset-0` → `inset-y-1 inset-x-0.5` |
| `src/components/game-card.tsx` | 4-row info layout |
| `src/components/game-picker.tsx` | Add scroll lock |
| `src/components/game-night-picker.tsx` | Redesign: tags collapsible, "Pick one", scroll lock |
| `src/components/wishlist-item-card.tsx` | Image, full-card tap → detail, remove inline actions |
| `src/components/game-detail.tsx` | Add share button entry point |
| `src/components/play-log-detail.tsx` | Add share button entry point |
| `src/components/wishlist-item-form.tsx` | Add new optional fields, two collapsible sections |
| `src/app/scorekeeper/page.tsx` | Remove table/rounds, card-per-player layout |
| `src/app/collection/page.tsx` | Add Select button |
| `src/app/wishlist/page.tsx` | Grid layout, FAB, non-sticky header |
| `src/app/sessions/page.tsx` | Remove sticky header bg |
| `src/app/stats/page.tsx` | Remove sticky header bg |
| `src/app/settings/page.tsx` | pb-24, light label, custom accent color |
| `src/components/play-log-form.tsx` | Date field max-w |

---

## Chunk 1: Foundation — Types, Store Migration, Shared Utilities

### Task 1: Update `WishlistItem` type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Update `WishlistItem` interface**

In `src/types/index.ts`, replace the existing `WishlistItem` interface (lines 62–75) with:

```typescript
export interface WishlistItem {
  id: string;
  name: string;
  type: 'game' | 'expansion';
  linkedGameId: string | null;
  imageUrl: string | null;
  // Optional game fields (null = not set)
  minPlayers: number | null;
  maxPlayers: number | null;
  playTimeMinutes: number | null;
  complexity: (1 | 2 | 3 | 4 | 5) | null;
  tagIds: string[];
  notes: string;
  quickRulesNotes: string;
  // Wishlist-specific optional
  price: string;
  store: string;
  link: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Run build to surface type errors**

```bash
cd /Users/memo/Projects/meyane/boardgame-shelf && npm run build 2>&1 | head -60
```

Expected: TypeScript errors in `wishlist-store.ts` and `wishlist-item-form.tsx` because the new fields are not yet provided. That is expected — fix those in the next tasks.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: extend WishlistItem type with optional game fields"
```

---

### Task 2: Update wishlist store with migration

**Files:**
- Modify: `src/stores/wishlist-store.ts`

- [ ] **Step 1: Add migration function and `onRehydrateStorage`**

Replace the entire content of `src/stores/wishlist-store.ts` with:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIDBStorage } from '../lib/idb-storage';
import type { WishlistItem } from '../types';

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>) => WishlistItem;
  updateItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteItem: (id: string) => void;
  setItems: (items: WishlistItem[]) => void;
}

// Idempotent: existing fields in `raw` override the defaults via spread order
function migrateWishlistItem(raw: Record<string, unknown>): WishlistItem {
  return {
    minPlayers: null,
    maxPlayers: null,
    playTimeMinutes: null,
    complexity: null,
    quickRulesNotes: '',
    ...raw,
  } as WishlistItem;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => {
        const now = new Date().toISOString();
        const newItem: WishlistItem = { ...item, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        set((state) => ({ items: [newItem, ...state.items] }));
        return newItem;
      },
      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
          ),
        }));
      },
      deleteItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setItems: (items) => set({ items }),
    }),
    {
      name: 'bg-shelf-wishlist',
      storage: createIDBStorage<WishlistState>(),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.items = state.items.map((item) =>
            migrateWishlistItem(item as unknown as Record<string, unknown>)
          );
        }
      },
    }
  )
);
```

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | head -60
```

Expected: No errors in `wishlist-store.ts`. Remaining errors are in components that haven't been updated yet.

- [ ] **Step 3: Commit**

```bash
git add src/stores/wishlist-store.ts
git commit -m "feat: add wishlist store migration for new optional fields"
```

---

### Task 3: Create `useScrollLock` hook

**Files:**
- Create: `src/lib/use-scroll-lock.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/lib/use-scroll-lock.ts
import { useEffect } from 'react';

export function useScrollLock(active: boolean) {
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

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | head -30
```

Expected: Clean compile for the new file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/use-scroll-lock.ts
git commit -m "feat: add useScrollLock hook"
```

---

## Chunk 2: Bug Fixes

### Task 4: Fix nav chip overflow

**Files:**
- Modify: `src/components/bottom-nav.tsx`

- [ ] **Step 1: Update active chip positioning**

In `src/components/bottom-nav.tsx`, find the `motion.div` with `layoutId="active-tab-chip"`:

```tsx
// BEFORE
className="absolute inset-0 rounded-xl glass-pill"

// AFTER
className="absolute inset-y-1 inset-x-0.5 rounded-xl glass-pill"
```

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/bottom-nav.tsx
git commit -m "fix: nav chip inset to prevent overflow at pill corners"
```

---

### Task 5: Remove sticky headers (Sessions, Wishlist, Stats)

**Files:**
- Modify: `src/app/sessions/page.tsx`
- Modify: `src/app/wishlist/page.tsx`
- Modify: `src/app/stats/page.tsx`

- [ ] **Step 1: Fix sessions page header**

In `src/app/sessions/page.tsx`, find the header div:

```tsx
// BEFORE
<div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gradient-to-b from-background from-60% to-transparent">

// AFTER
<div className="px-4 pt-4 pb-3">
```

- [ ] **Step 2: Fix wishlist page header**

In `src/app/wishlist/page.tsx`, find the header div:

```tsx
// BEFORE
<div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gradient-to-b from-background from-60% to-transparent">

// AFTER
<div className="px-4 pt-4 pb-3">
```

- [ ] **Step 3: Fix stats page header**

In `src/app/stats/page.tsx`, find the header div:

```tsx
// BEFORE
<div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gradient-to-b from-background from-60% to-transparent">

// AFTER
<div className="px-4 pt-4 pb-3">
```

- [ ] **Step 4: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/sessions/page.tsx src/app/wishlist/page.tsx src/app/stats/page.tsx
git commit -m "fix: remove sticky gradient headers from sessions/wishlist/stats"
```

---

### Task 6: Settings — bottom padding, light theme label, date field width

**Files:**
- Modify: `src/app/settings/page.tsx`
- Modify: `src/components/play-log-form.tsx`

- [ ] **Step 1: Fix settings bottom padding**

In `src/app/settings/page.tsx`, find the content wrapper:

```tsx
// BEFORE
<div className="flex flex-col gap-4 px-4 pb-8">

// AFTER
<div className="flex flex-col gap-4 px-4 pb-24">
```

- [ ] **Step 2: Add light theme fun label**

In `src/app/settings/page.tsx`, find the `ToggleGroup` for theme (inside the "Appearance" section). Add the label immediately after it:

```tsx
<ToggleGroup
  options={THEME_OPTIONS}
  value={preferences.theme}
  onChange={(theme) => setPreferences({ theme })}
  layoutId="theme-toggle"
/>
{preferences.theme === 'light' && (
  <p className="text-xs text-text-secondary/60 italic mt-1 text-center">
    why would anyone want light? are you ok?
  </p>
)}
```

- [ ] **Step 3: Fix log play date field width**

In `src/components/play-log-form.tsx`, around line 126, find the `{/* Date */}` section. The date input is an `<Input>` component. Wrap it with a constraining div:

```tsx
{/* Date */}
<div className="max-w-[180px]">
  <Input
    label="Date"
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
  />
</div>
```

- [ ] **Step 4: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/settings/page.tsx src/components/play-log-form.tsx
git commit -m "fix: settings pb-24, light theme label, date field width"
```

---

### Task 7: Scorekeeper quick fixes (rounds, empty players, touch targets)

**Files:**
- Modify: `src/app/scorekeeper/page.tsx`

These are the three smallest fixes in the scorekeeper. The full card-per-player refactor is Task 9.

- [ ] **Step 1: Remove `round` state and UI**

In `src/app/scorekeeper/page.tsx`:

1. Remove the `round` state declaration:
```tsx
// DELETE this line:
const [round, setRound] = useState(() => existingSession?.round ?? 1);
```

2. In the top bar JSX, remove the entire round counter block (the `<div className="flex items-center gap-1">` containing the `Minus`/`Plus` buttons and `Rd {round}` span).

3. In `handlePause`, remove the `round` field from the data object:
```tsx
// BEFORE
const data = {
  gameId,
  date: new Date().toISOString().split('T')[0],
  playerNames: validPlayerNames,
  categories,
  playerScores: buildPlayerScores(),
  round,
  notes: '',
};

// AFTER
const data = {
  gameId,
  date: new Date().toISOString().split('T')[0],
  playerNames: validPlayerNames,
  categories,
  playerScores: buildPlayerScores(),
  notes: '',
};
```

4. Remove the `Minus` import from lucide — it was only used by the round counter. `Plus` is still used elsewhere — keep it. The `−` character in the card layout (Task 10) is a plain text string, not the `Minus` icon.

> Note: Do NOT remove `round` from the `PlaySession` type in `src/types/index.ts` — the field stays in the type for backward compatibility.

- [ ] **Step 2: Initialize `playerNames` as empty array**

In `src/app/scorekeeper/page.tsx`, find the `playerNames` state initialization:

```tsx
// BEFORE
const [playerNames, setPlayerNames] = useState<string[]>(() => {
  if (existingSession) return existingSession.playerNames.length >= 2 ? existingSession.playerNames : [...existingSession.playerNames, ...Array(2 - existingSession.playerNames.length).fill('')];
  return ['', ''];
});

// AFTER
const [playerNames, setPlayerNames] = useState<string[]>(() => {
  if (existingSession) return existingSession.playerNames;
  return [];
});
```

- [ ] **Step 3: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/scorekeeper/page.tsx
git commit -m "fix: scorekeeper remove round counter, empty default players"
```

---

### Task 8: Apply scroll lock to existing bottom sheets

**Files:**
- Modify: `src/components/game-picker.tsx`
- Modify: `src/components/game-night-picker.tsx` (partial — full redesign in Task 11)
- Modify: `src/app/scorekeeper/page.tsx`

- [ ] **Step 1: Add scroll lock to `GamePicker`**

In `src/components/game-picker.tsx`:

1. Add import at the top:
```tsx
import { useScrollLock } from '../lib/use-scroll-lock';
```

2. Inside the component body, add the hook call after the existing state:
```tsx
useScrollLock(open);
```

- [ ] **Step 2: Add scroll lock to `GameNightPicker`**

In `src/components/game-night-picker.tsx`:

1. Add import:
```tsx
import { useScrollLock } from '../lib/use-scroll-lock';
```

2. Add hook call after existing state declarations:
```tsx
useScrollLock(open);
```

- [ ] **Step 3: Add scroll lock to `ScorekeeperPage`**

In `src/app/scorekeeper/page.tsx`:

1. Add import:
```tsx
import { useScrollLock } from '../../lib/use-scroll-lock';
```

2. Add hook call after the existing sheet state declarations:
```tsx
useScrollLock(addCategorySheetOpen || addPlayerSheetOpen || endSheetOpen);
```

- [ ] **Step 4: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/components/game-picker.tsx src/components/game-night-picker.tsx src/app/scorekeeper/page.tsx
git commit -m "fix: apply scroll lock to all bottom sheets"
```

---

## Chunk 3: Game Card Layout + Scorekeeper Card Refactor

### Task 9: Collection game card — 4-row layout

**Files:**
- Modify: `src/components/game-card.tsx`

- [ ] **Step 1: Rewrite the info section**

In `src/components/game-card.tsx`, replace the `{/* Info */}` section (the `<div className="p-3 flex flex-col gap-1.5 flex-1">` block and its contents) with:

```tsx
{/* Info */}
<div className="p-3 flex flex-col gap-2 flex-1">
  {/* Row 1: Name */}
  <h3 className="text-sm font-semibold text-text-primary truncate">
    {game.name}
  </h3>

  {/* Row 2: Players + Time */}
  <div className="flex items-center gap-3 text-text-secondary">
    <span className="inline-flex items-center gap-1 text-xs">
      <Users size={12} />
      {game.minPlayers === game.maxPlayers
        ? game.minPlayers
        : `${game.minPlayers}–${game.maxPlayers}`}
    </span>
    <span className="inline-flex items-center gap-1 text-xs">
      <Clock size={12} />
      {game.playTimeMinutes}m
    </span>
  </div>

  {/* Row 3: Complexity */}
  <ComplexityDots value={game.complexity} size="sm" />

  {/* Row 4: Tags */}
  {displayTags.length > 0 && (
    <div className="flex gap-1 flex-wrap">
      {displayTags.map((tag) => (
        <span
          key={tag!.id}
          className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] text-text-secondary"
        >
          {tag!.name}
        </span>
      ))}
      {extraTagCount > 0 && (
        <span className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] text-text-secondary">
          +{extraTagCount}
        </span>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/game-card.tsx
git commit -m "feat: game card 4-row layout with dedicated rows per info type"
```

---

### Task 10: Scorekeeper — card-per-player layout (full refactor)

**Files:**
- Modify: `src/app/scorekeeper/page.tsx`

This is the largest single task. Replace the table-based rendering with a card-per-player layout. All existing state and sheet logic is preserved — only the JSX between `{/* Table area */}` and `{/* Bottom bar */}` is replaced.

- [ ] **Step 1: Remove the table area JSX**

In `src/app/scorekeeper/page.tsx`, find and delete the entire `{/* Table area */}` section — from `<div className="flex-1 flex flex-col overflow-hidden relative z-[1]">` through its closing `</div>` (before `{/* Bottom bar */}`).

- [ ] **Step 2: Add the card-per-player layout**

In its place, insert:

```tsx
{/* Player cards area */}
<div className="flex-1 overflow-y-auto relative z-[1] px-3 pb-4">
  {/* Controls row */}
  <div className="py-2 flex items-center justify-between">
    <span className="text-xs text-text-secondary">
      {categories.length} {categories.length === 1 ? 'category' : 'categories'}
    </span>
    <button
      onClick={() => setAddCategorySheetOpen(true)}
      className="flex items-center gap-1 text-xs text-primary glass-pill px-3 py-1.5 rounded-full"
    >
      <Plus size={12} /> Category
    </button>
  </div>

  <div className="flex flex-col gap-3">
    {playerNames.map((playerName, idx) => {
      const total = categories.reduce(
        (sum, cat) => sum + getScore(playerName, cat.id),
        0
      );
      return (
        <div
          key={idx}
          className="glass rounded-2xl overflow-hidden"
          style={{ borderLeft: playerColors[playerName] ? `3px solid ${playerColors[playerName]}` : undefined }}
        >
          {/* Player header */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ backgroundColor: rowBg(playerName, 0.1) }}
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: playerColors[playerName] ?? 'rgba(128,128,128,0.4)' }}
            />
            <input
              type="text"
              placeholder={`Player ${idx + 1}`}
              value={playerName}
              onChange={(e) => updatePlayerName(idx, e.target.value)}
              className="flex-1 bg-transparent text-sm font-semibold text-text-primary focus:outline-none placeholder:text-text-secondary/50"
            />
            <span className="text-xs text-text-secondary shrink-0">
              Total: <span className="font-bold text-text-primary">{total}</span>
            </span>
            {playerNames.length > 1 && (
              <button
                onClick={() => removePlayer(idx)}
                className="text-text-secondary/50 hover:text-danger transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category rows */}
          <div className="divide-y divide-white/5">
            {categories.map((cat) => {
              const score = getScore(playerName, cat.id);
              const isEditing =
                editingScore?.playerName === playerName &&
                editingScore?.categoryId === cat.id;

              return (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-2">
                  {/* Category name */}
                  <div className="flex-1 min-w-0">
                    {editingCategoryId === cat.id ? (
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onBlur={commitCategoryName}
                        onKeyDown={(e) => e.key === 'Enter' && commitCategoryName()}
                        autoFocus
                        className="text-xs font-medium text-text-primary bg-transparent focus:outline-none border-b border-primary w-full"
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditCategoryName(cat)}
                          className="text-xs font-medium text-text-secondary truncate"
                        >
                          {cat.name}
                        </button>
                        {categories.length > 1 && (
                          <button
                            onClick={() => deleteCategory(cat.id)}
                            className="text-text-secondary/30 hover:text-danger transition-colors shrink-0"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => changeScore(playerName, cat.id, -cat.increment)}
                      className="w-11 h-11 rounded-full glass-pill flex items-center justify-center text-text-secondary active:scale-90 transition-all text-lg font-medium"
                    >
                      −
                    </button>
                    {isEditing ? (
                      <input
                        type="number"
                        className="glass-input rounded-lg w-16 text-center text-base font-bold text-text-primary focus:outline-none py-1"
                        autoFocus
                        value={editingScoreValue}
                        onChange={(e) => setEditingScoreValue(e.target.value)}
                        onBlur={() => {
                          const n = parseInt(editingScoreValue, 10);
                          if (!isNaN(n)) setScoreDirect(playerName, cat.id, n);
                          setEditingScore(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const n = parseInt(editingScoreValue, 10);
                            if (!isNaN(n)) setScoreDirect(playerName, cat.id, n);
                            setEditingScore(null);
                          }
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingScore({ playerName, categoryId: cat.id });
                          setEditingScoreValue(String(score));
                        }}
                        className="w-16 text-center font-bold text-text-primary text-base"
                      >
                        {score}
                      </button>
                    )}
                    <button
                      onClick={() => changeScore(playerName, cat.id, cat.increment)}
                      className="w-11 h-11 rounded-full glass-pill flex items-center justify-center text-text-secondary active:scale-90 transition-all text-lg font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    })}

    {/* Add Player */}
    <button
      onClick={() => setAddPlayerSheetOpen(true)}
      className="flex items-center gap-1.5 text-sm text-primary glass-pill px-4 py-3 rounded-2xl w-full justify-center"
    >
      <Plus size={16} /> Add Player
    </button>
  </div>
</div>
```

- [ ] **Step 3: Verify imports**

The table-related code is gone. `ChevronLeft`, `Plus`, `X` are all still used in the new layout — keep them. `Minus` was already removed in Task 7 Step 1. If it is somehow still present, remove it now. `−` in the score buttons is a plain text character, not the `Minus` icon.

- [ ] **Step 4: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -30
```

Fix any TypeScript errors before proceeding.

- [ ] **Step 5: Commit**

```bash
git add src/app/scorekeeper/page.tsx
git commit -m "feat: scorekeeper card-per-player layout, remove table"
```

---

## Chunk 4: Wishlist Overhaul

### Task 11: Update `WishlistItemCard` — image + full-card tap

**Files:**
- Modify: `src/components/wishlist-item-card.tsx`

- [ ] **Step 1: Rewrite `WishlistItemCard`**

Replace the entire file content with:

```typescript
import { useNavigate } from 'react-router-dom';
import type { WishlistItem } from '../types';

interface WishlistItemCardProps {
  item: WishlistItem;
}

export default function WishlistItemCard({ item }: WishlistItemCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/wishlist/${item.id}`)}
      className="glass rounded-2xl overflow-hidden text-left transition-all active:scale-[0.97] card-active-glow depth-1 flex flex-col w-full"
    >
      {/* Image */}
      <div className="relative aspect-[3/2] max-h-32 bg-surface overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-text-secondary/15">
              {item.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Type badge */}
        <span
          className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            item.type === 'expansion'
              ? 'bg-surface/80 text-text-secondary'
              : 'bg-primary/80 text-white'
          }`}
        >
          {item.type === 'expansion' ? 'Exp' : 'Game'}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
        {item.price ? (
          <p className="text-xs text-text-secondary">{item.price}</p>
        ) : null}
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/wishlist-item-card.tsx
git commit -m "feat: wishlist card with image, tap to detail, remove inline actions"
```

---

### Task 12: Update wishlist list page — grid, FAB, non-sticky header

**Files:**
- Modify: `src/app/wishlist/page.tsx`

- [ ] **Step 1: Rewrite the wishlist list page**

Replace the entire content of `src/app/wishlist/page.tsx`:

```typescript
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Plus } from 'lucide-react';
import { useWishlistStore } from '../../stores';
import WishlistItemCard from '../../components/wishlist-item-card';
import EmptyState from '../../components/ui/empty-state';

type FilterType = 'all' | 'game' | 'expansion';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'game', label: 'Games' },
  { value: 'expansion', label: 'Expansions' },
];

export default function WishlistPage() {
  const navigate = useNavigate();
  const { items } = useWishlistStore();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Wishlist</h1>
            {items.length > 0 && (
              <span className="text-xs font-medium text-text-secondary glass-pill px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </div>
        </div>

        {/* Filter pills */}
        {items.length > 0 && (
          <div className="flex gap-2 mt-3">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === opt.value
                    ? 'bg-primary text-white tag-glow'
                    : 'glass-pill text-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {items.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={48} strokeWidth={1.5} />}
            title="No items yet"
            description="Add games or expansions you want to buy to your wishlist."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matches"
            description="No items match the selected filter."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => (
              <WishlistItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/wishlist/new')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center fab-halo active:scale-95 transition-transform z-30"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/wishlist/page.tsx
git commit -m "feat: wishlist list page grid layout with FAB"
```

---

### Task 13: Create wishlist detail page

**Files:**
- Create: `src/app/wishlist/[id]/page.tsx`
- Modify: `src/App.tsx` (route registration)

- [ ] **Step 1: Create the detail page**

Create `src/app/wishlist/[id]/page.tsx`:

```typescript
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWishlistStore, useGameStore, useTagStore } from '../../../stores';
import Button from '../../../components/ui/button';
import IconButton from '../../../components/ui/icon-button';
import ConfirmDialog from '../../../components/ui/confirm-dialog';
import ComplexityDots from '../../../components/ui/complexity-dots';
import { useState } from 'react';

export default function WishlistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, deleteItem, updateItem } = useWishlistStore();
  const { games, addGame } = useGameStore();
  const { tags } = useTagStore();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const item = items.find((i) => i.id === id);
  if (!item) return <Navigate to="/wishlist" replace />;

  const linkedGame = item.linkedGameId ? games.find((g) => g.id === item.linkedGameId) : null;

  const handleAddToCollection = () => {
    if (item.type === 'expansion' && item.linkedGameId) {
      const parent = games.find((g) => g.id === item.linkedGameId);
      if (parent) {
        const expansionEntry = { id: crypto.randomUUID(), name: item.name, owned: true };
        useGameStore.getState().updateGame(parent.id, {
          expansions: [...parent.expansions, expansionEntry],
        });
        deleteItem(item.id);
        navigate(`/game/${parent.id}`);
        return;
      }
    }
    // Treat as game (or expansion with no linked game)
    const newGame = addGame({
      name: item.name,
      description: '',
      minPlayers: item.minPlayers ?? 1,
      maxPlayers: item.maxPlayers ?? 4,
      playTimeMinutes: item.playTimeMinutes ?? 60,
      complexity: item.complexity ?? 3,
      rating: null,
      imageUrl: item.imageUrl,
      notes: item.notes,
      quickRulesNotes: item.quickRulesNotes,
      tagIds: item.tagIds,
      expansions: [],
    });
    deleteItem(item.id);
    navigate(`/game/${newGame.id}`);
  };

  const handleDelete = () => {
    deleteItem(item.id);
    navigate('/wishlist', { replace: true });
  };

  const itemTags = item.tagIds
    .map((tagId) => tags.find((t) => t.id === tagId))
    .filter(Boolean);

  return (
    <div className="flex flex-col min-h-full">
      <div className="ambient-glow" />

      <motion.div
        initial={{ scale: 0.82, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="flex flex-col flex-1 relative z-[1]"
      >
        {/* Top action bar */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <IconButton onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </IconButton>
          <div className="flex-1" />
          <IconButton onClick={() => navigate(`/wishlist/${item.id}/edit`)}>
            <Pencil size={18} />
          </IconButton>
          <IconButton onClick={() => setDeleteConfirmOpen(true)}>
            <Trash2 size={18} />
          </IconButton>
        </div>

        {/* Hero image */}
        {item.imageUrl && (
          <div className="px-4 mb-4">
            <div className="rounded-2xl overflow-hidden aspect-[16/9] depth-2">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-4 px-4 pb-32">
          {/* Name + type badge */}
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-bold text-text-primary flex-1">{item.name}</h1>
            <span
              className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full mt-1 ${
                item.type === 'expansion' ? 'glass-pill text-text-secondary' : 'bg-primary/20 text-primary'
              }`}
            >
              {item.type === 'expansion' ? 'Expansion' : 'Game'}
            </span>
          </div>

          {linkedGame && (
            <p className="text-sm text-text-secondary -mt-2">For: {linkedGame.name}</p>
          )}

          {/* Game details section */}
          {(item.minPlayers != null || item.playTimeMinutes != null || item.complexity != null) && (
            <div className="glass rounded-2xl p-4 flex flex-col gap-3">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Game Details</h2>
              <div className="flex flex-wrap gap-4">
                {item.minPlayers != null && (
                  <div>
                    <p className="text-[10px] text-text-secondary">Players</p>
                    <p className="text-sm font-semibold text-text-primary">
                      {item.minPlayers === item.maxPlayers
                        ? item.minPlayers
                        : `${item.minPlayers}–${item.maxPlayers ?? '?'}`}
                    </p>
                  </div>
                )}
                {item.playTimeMinutes != null && (
                  <div>
                    <p className="text-[10px] text-text-secondary">Play Time</p>
                    <p className="text-sm font-semibold text-text-primary">{item.playTimeMinutes}m</p>
                  </div>
                )}
                {item.complexity != null && (
                  <div>
                    <p className="text-[10px] text-text-secondary">Complexity</p>
                    <ComplexityDots value={item.complexity} size="sm" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Purchase info */}
          {(item.price || item.store || item.link) && (
            <div className="glass rounded-2xl p-4 flex flex-col gap-2">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Purchase Info</h2>
              {item.price && <p className="text-sm text-text-primary">{item.price}</p>}
              {item.store && <p className="text-sm text-text-secondary">{item.store}</p>}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline break-all"
                >
                  {item.link}
                </a>
              )}
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="glass rounded-2xl p-4">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Notes</h2>
              <p className="text-sm text-text-primary leading-relaxed">{item.notes}</p>
            </div>
          )}

          {/* Quick notes */}
          {item.quickRulesNotes && (
            <div className="glass-light rounded-2xl p-4">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Quick Note</h2>
              <p className="text-sm text-text-primary leading-relaxed">{item.quickRulesNotes}</p>
            </div>
          )}

          {/* Tags */}
          {itemTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {itemTags.map((tag) => (
                <span key={tag!.id} className="rounded-full glass-pill px-3 py-1 text-xs text-text-secondary">
                  {tag!.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] glass-strong z-10">
        <Button className="w-full" size="lg" onClick={handleAddToCollection}>
          <ArrowRight size={18} />
          Add to Collection
        </Button>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete ${item.name}?`}
        description="This will permanently remove this wishlist item."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

- [ ] **Step 2: Register the route in `App.tsx`**

In `src/App.tsx`, add the import at the top:

```tsx
import WishlistDetailPage from './app/wishlist/[id]/page';
```

Then add the route inside the `<Routes>` block, before the `/wishlist/:id/edit` route:

```tsx
<Route path="/wishlist/:id" element={<WishlistDetailPage />} />
```

> Important: `/wishlist/:id` must come BEFORE `/wishlist/:id/edit` in the route list so React Router matches `/wishlist/new` correctly. Since `/wishlist/new` is already registered separately before both, order is fine — but verify the new route is placed correctly.

- [ ] **Step 3: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -30
```

Fix any TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/wishlist/[id]/page.tsx src/App.tsx
git commit -m "feat: add wishlist detail page with add-to-collection flow"
```

---

### Task 14: Update wishlist item form — new optional fields + collapsible sections

**Files:**
- Modify: `src/components/wishlist-item-form.tsx`

The existing form already has a "More details" toggle. We need to restructure it into two explicit collapsible sections and add the new fields.

- [ ] **Step 1: Rewrite `WishlistItemForm`**

Replace the entire content of `src/components/wishlist-item-form.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import type { BoardGame, WishlistItem } from '../types';
import { useWishlistStore } from '../stores';
import Button from './ui/button';
import Input from './ui/input';
import Textarea from './ui/textarea';
import ToggleGroup from './ui/toggle-group';
import GamePicker from './game-picker';
import TagPicker from './tag-picker';
import IconButton from './ui/icon-button';
import ImagePicker from './ui/image-picker';
import ComplexityDots from './ui/complexity-dots';

type ItemType = 'game' | 'expansion';

const TYPE_OPTIONS: { value: ItemType; label: string }[] = [
  { value: 'game', label: 'Game' },
  { value: 'expansion', label: 'Expansion' },
];

interface WishlistItemFormProps {
  item?: WishlistItem;
}

function hasGameDetails(item?: WishlistItem) {
  return (
    item?.minPlayers != null ||
    item?.maxPlayers != null ||
    item?.playTimeMinutes != null ||
    item?.complexity != null
  );
}

function hasPurchaseInfo(item?: WishlistItem) {
  return !!(item?.price || item?.store || item?.link);
}

export default function WishlistItemForm({ item }: WishlistItemFormProps) {
  const navigate = useNavigate();
  const { addItem, updateItem } = useWishlistStore();
  const isEdit = !!item;

  const [imageUrl, setImageUrl] = useState<string | null>(item?.imageUrl ?? null);
  const [name, setName] = useState(item?.name ?? '');
  const [type, setType] = useState<ItemType>(item?.type ?? 'game');
  const [linkedGameId, setLinkedGameId] = useState<string | null>(item?.linkedGameId ?? null);
  const [linkedGameName, setLinkedGameName] = useState<string>('');
  const [showGamePicker, setShowGamePicker] = useState(false);
  // Note: linkedGameName starts empty on edit (shows "Selected" instead of the game name).
  // This is acceptable for this initial implementation — the link itself is preserved.

  // Optional game details
  const [showGameDetails, setShowGameDetails] = useState(() => hasGameDetails(item));
  const [minPlayers, setMinPlayers] = useState<string>(item?.minPlayers?.toString() ?? '');
  const [maxPlayers, setMaxPlayers] = useState<string>(item?.maxPlayers?.toString() ?? '');
  const [playTimeMinutes, setPlayTimeMinutes] = useState<string>(item?.playTimeMinutes?.toString() ?? '');
  const [complexity, setComplexity] = useState<number | null>(item?.complexity ?? null);

  // Purchase info
  const [showPurchaseInfo, setShowPurchaseInfo] = useState(() => hasPurchaseInfo(item));
  const [price, setPrice] = useState(item?.price ?? '');
  const [store, setStore] = useState(item?.store ?? '');
  const [link, setLink] = useState(item?.link ?? '');

  // Notes
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [quickRulesNotes, setQuickRulesNotes] = useState(item?.quickRulesNotes ?? '');
  const [tagIds, setTagIds] = useState<string[]>(item?.tagIds ?? []);

  const handleSelectGame = (game: BoardGame) => {
    setLinkedGameId(game.id);
    setLinkedGameName(game.name);
    setShowGamePicker(false);
  };

  const handleSave = () => {
    const trimName = name.trim();
    if (!trimName) return;

    const data: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'> = {
      name: trimName,
      imageUrl,
      type,
      linkedGameId: type === 'expansion' ? linkedGameId : null,
      minPlayers: minPlayers ? parseInt(minPlayers, 10) : null,
      maxPlayers: maxPlayers ? parseInt(maxPlayers, 10) : null,
      playTimeMinutes: playTimeMinutes ? parseInt(playTimeMinutes, 10) : null,
      complexity: complexity as WishlistItem['complexity'],
      price: price.trim(),
      store: store.trim(),
      link: link.trim(),
      notes: notes.trim(),
      quickRulesNotes: quickRulesNotes.trim(),
      tagIds,
    };

    if (isEdit) {
      updateItem(item.id, data);
      navigate(-1);
    } else {
      addItem(data);
      navigate('/wishlist', { replace: true });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="ambient-glow" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 bg-gradient-to-b from-background from-60% to-transparent sticky top-0 z-10">
        <IconButton onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </IconButton>
        <h1 className="text-lg font-semibold text-text-primary">
          {isEdit ? 'Edit Item' : 'New Wishlist Item'}
        </h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto relative z-[1]">
        <div className="flex flex-col gap-5 p-4 pb-28">
          {/* Image */}
          <ImagePicker value={imageUrl} onChange={setImageUrl} />

          {/* Name */}
          <Input
            label="Name"
            placeholder="Game or expansion name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Type</label>
            <ToggleGroup
              options={TYPE_OPTIONS}
              value={type}
              onChange={setType}
              layoutId="wishlist-type"
            />
          </div>

          {/* Linked game — expansion only */}
          {type === 'expansion' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Linked Game (optional)</label>
              <button
                onClick={() => setShowGamePicker(true)}
                className="flex items-center gap-3 rounded-xl glass-input px-4 py-3 text-left"
              >
                {linkedGameId ? (
                  <span className="text-sm text-text-primary">{linkedGameName || 'Selected'}</span>
                ) : (
                  <span className="text-sm text-text-secondary/70">Select game (optional)</span>
                )}
              </button>
            </div>
          )}

          {/* ── Collapsible: Game Details ── */}
          <button
            onClick={() => setShowGameDetails((v) => !v)}
            className="flex items-center justify-between text-sm font-medium text-text-secondary glass-pill px-4 py-2.5 rounded-xl"
          >
            <span>Game Details</span>
            {showGameDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showGameDetails && (
            <div className="flex flex-col gap-4 -mt-2">
              <div className="flex gap-3">
                <Input
                  label="Min Players"
                  type="number"
                  inputMode="numeric"
                  placeholder="1"
                  value={minPlayers}
                  onChange={(e) => setMinPlayers(e.target.value)}
                />
                <Input
                  label="Max Players"
                  type="number"
                  inputMode="numeric"
                  placeholder="4"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                />
              </div>
              <Input
                label="Play Time (minutes)"
                type="number"
                inputMode="numeric"
                placeholder="60"
                value={playTimeMinutes}
                onChange={(e) => setPlayTimeMinutes(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Complexity</label>
                <div className="flex gap-2">
                  {([1, 2, 3, 4, 5] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setComplexity(complexity === v ? null : v)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                        complexity === v
                          ? 'bg-primary text-white tag-glow'
                          : 'glass-pill text-text-secondary'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Collapsible: Purchase Info ── */}
          <button
            onClick={() => setShowPurchaseInfo((v) => !v)}
            className="flex items-center justify-between text-sm font-medium text-text-secondary glass-pill px-4 py-2.5 rounded-xl"
          >
            <span>Purchase Info</span>
            {showPurchaseInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showPurchaseInfo && (
            <div className="flex flex-col gap-4 -mt-2">
              <Input
                label="Price (optional)"
                placeholder="e.g. €24.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <Input
                label="Store (optional)"
                placeholder="e.g. Amazon, FLGS"
                value={store}
                onChange={(e) => setStore(e.target.value)}
              />
              <Input
                label="Link (optional)"
                type="url"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          )}

          {/* Notes + Quick Note */}
          <Textarea
            label="Notes"
            placeholder="Why you want it..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Textarea
            label="Quick Note"
            placeholder="e.g. saw it at Dragon's Lair, booth 12"
            value={quickRulesNotes}
            onChange={(e) => setQuickRulesNotes(e.target.value)}
          />

          <TagPicker selectedIds={tagIds} onChange={setTagIds} />
        </div>
      </div>

      {/* Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass-strong z-10">
        <Button className="w-full" size="lg" onClick={handleSave} disabled={!name.trim()}>
          {isEdit ? 'Save Changes' : 'Add to Wishlist'}
        </Button>
      </div>

      <GamePicker
        open={showGamePicker}
        onClose={() => setShowGamePicker(false)}
        onSelect={handleSelectGame}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -30
```

Fix any TypeScript errors — pay attention to the `complexity` field cast.

- [ ] **Step 3: Commit**

```bash
git add src/components/wishlist-item-form.tsx
git commit -m "feat: wishlist form with game details and purchase info sections"
```

---

## Chunk 5: Game Night Picker + Collection Select + Settings

### Task 15: Redesign Game Night Picker

**Files:**
- Modify: `src/components/game-night-picker.tsx`

- [ ] **Step 1: Add collapsible "More filters" state**

In `src/components/game-night-picker.tsx`, add one state variable after the existing state declarations:

```tsx
const [showMoreFilters, setShowMoreFilters] = useState(false);
```

Add import for `ChevronDown`, `ChevronUp` from `lucide-react`.

- [ ] **Step 2: Replace the tag filter section and actions row**

Find the current `{/* Tag Filter Chips */}` section and the `{/* Actions row */}` section and replace them with:

```tsx
{/* More filters collapsible */}
<div className="mb-4">
  <button
    onClick={() => setShowMoreFilters((v) => !v)}
    className="flex items-center justify-between w-full text-sm font-medium text-text-secondary glass-pill px-4 py-2.5 rounded-xl"
  >
    <span>More Filters</span>
    {showMoreFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
  </button>
  {showMoreFilters && filterableTags.length > 0 && (
    <div className="mt-3">
      <span className="text-xs text-text-secondary block mb-2">Tags</span>
      <div className="flex flex-wrap gap-1.5">
        {filterableTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              selectedTagIds.includes(tag.id)
                ? 'bg-primary text-white tag-glow'
                : 'glass-pill text-text-secondary'
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  )}
</div>

{/* Actions row */}
<div className="flex gap-2 mb-4">
  <button
    onClick={pickRandom}
    disabled={results.length === 0}
    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-3 font-medium active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
  >
    <Shuffle size={18} />
    Pick one ({results.length})
  </button>

  {results.length > 0 && (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 rounded-xl glass-pill px-4 py-3 font-medium text-text-secondary active:scale-95 transition-all"
    >
      <Share2 size={18} />
      {shareStatus === 'copied' ? 'Copied!' : 'Share'}
    </button>
  )}
</div>
```

- [ ] **Step 3: Cap results list to 5**

In the `{/* Results List */}` section, update the `results.map(...)` to only render the first 5:

```tsx
{results.slice(0, 5).map((game) => (
```

- [ ] **Step 4: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/components/game-night-picker.tsx
git commit -m "feat: game night picker tags behind collapsible, results capped at 5"
```

---

### Task 16: Collection — add Select button

**Files:**
- Modify: `src/app/collection/page.tsx`

- [ ] **Step 1: Add Select button to the header action row**

In `src/app/collection/page.tsx`, find the header action row. It currently has sort, dice (game night picker), and share buttons. Add a "Select" button before the sort button:

```tsx
{/* Select mode button — before the sort button */}
{!selectMode && (
  <button
    onClick={() => setSelectMode(true)}
    className="text-xs font-medium text-text-secondary glass-pill px-3 py-1.5 rounded-full hover:text-text-primary transition-colors"
  >
    Select
  </button>
)}
```

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/collection/page.tsx
git commit -m "feat: add visible Select button to collection header"
```

---

### Task 17: Settings — custom accent color + fix

**Files:**
- Modify: `src/app/settings/page.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update `useApplyTheme` in `App.tsx` for hex accent support**

In `src/App.tsx`, replace the `useApplyTheme` function:

```tsx
function useApplyTheme() {
  const { preferences } = usePreferencesStore();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', preferences.theme);

    const accentColor = preferences.accentColor;
    if (accentColor.startsWith('#')) {
      // Custom hex color: compute RGB components and set CSS var directly
      const r = parseInt(accentColor.slice(1, 3), 16);
      const g = parseInt(accentColor.slice(3, 5), 16);
      const b = parseInt(accentColor.slice(5, 7), 16);
      root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
      root.removeAttribute('data-accent');
    } else {
      // Named preset: use data-accent attribute (existing CSS handles the rest)
      root.setAttribute('data-accent', accentColor);
      root.style.removeProperty('--primary-rgb');
    }

    const themeColor = preferences.theme === 'dark' ? '#0c0c10' : '#FAFAFA';
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeColor);
  }, [preferences.theme, preferences.accentColor]);
}
```

- [ ] **Step 2: Add custom swatch to settings accent color section**

In `src/app/settings/page.tsx`, add a hidden `<input type="color">` ref and the custom swatch. First add the ref:

```tsx
import { useState, useRef } from 'react';
// add useRef to the existing import
```

Then inside the component, add:

```tsx
const colorInputRef = useRef<HTMLInputElement>(null);
```

Find the `{/* Accent color */}` section. Add a 7th "Custom" swatch after the existing `ACCENT_COLORS.map(...)`:

```tsx
{/* Existing swatches */}
{ACCENT_COLORS.map((accent) => (
  /* ... existing code unchanged ... */
))}

{/* Custom swatch */}
<button
  onClick={() => colorInputRef.current?.click()}
  className="relative w-10 h-10 rounded-full transition-transform overflow-hidden"
  style={{
    background: preferences.accentColor.startsWith('#')
      ? preferences.accentColor
      : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
    transform: preferences.accentColor.startsWith('#') ? 'scale(1.15)' : 'scale(1)',
  }}
  title="Custom color"
>
  {preferences.accentColor.startsWith('#') && (
    <div className="absolute inset-0 flex items-center justify-center">
      <Check size={18} className="text-white drop-shadow" />
    </div>
  )}
</button>
<input
  ref={colorInputRef}
  type="color"
  className="sr-only"
  value={
    preferences.accentColor.startsWith('#') ? preferences.accentColor : '#6366F1'
  }
  onChange={(e) => setPreferences({ accentColor: e.target.value })}
/>
```

- [ ] **Step 3: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/app/settings/page.tsx
git commit -m "feat: custom accent color picker with hex support"
```

---

## Chunk 6: Visual Share Cards

> If `html-to-image` dependency approval is pending, skip Tasks 18–20. The feature is fully additive — all other changes in this plan are unaffected.

### Task 18: Install `html-to-image` and create share utilities

**Files:**
- Create: `src/lib/share-image.ts`

- [ ] **Step 1: Install dependency**

```bash
npm install html-to-image
```

- [ ] **Step 2: Create `src/lib/share-image.ts`**

```typescript
import { toPng } from 'html-to-image';

export async function generateShareImage(node: HTMLElement): Promise<File> {
  const dataUrl = await toPng(node, { width: 1080, height: 1080, pixelRatio: 1 });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], 'meeply-share.png', { type: 'image/png' });
}

export async function shareImage(file: File): Promise<void> {
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Meeply' });
  } else {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meeply-share.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
```

- [ ] **Step 3: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/share-image.ts package.json package-lock.json
git commit -m "feat: add html-to-image dep and share-image utility"
```

---

### Task 19: Create `<ShareCard>` component

**Files:**
- Create: `src/components/share-card.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/share-card.tsx
import { forwardRef } from 'react';
import type { BoardGame, PlayLog } from '../types';

interface ShareCardGameProps {
  variant: 'game';
  game: BoardGame;
}

interface ShareCardSessionProps {
  variant: 'session';
  gameName: string;
  log: PlayLog;
}

type ShareCardProps = ShareCardGameProps | ShareCardSessionProps;

// Fixed 1080×1080px flat card — no glass, no backdrop-filter (html-to-image compatibility)
// Positioned offscreen via style prop on the wrapping div in the caller
const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>((props, ref) => {
  if (props.variant === 'game') {
    const { game } = props;
    return (
      <div
        ref={ref}
        style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif', backgroundColor: '#0c0c10', color: '#f0f0f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Image — upper 60% */}
        <div style={{ flex: '0 0 648px', overflow: 'hidden', position: 'relative' }}>
          {game.imageUrl ? (
            <img src={game.imageUrl} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' }}>
              <span style={{ fontSize: 200, fontWeight: 700, color: 'rgba(255,255,255,0.08)' }}>
                {game.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        {/* Accent band */}
        <div style={{ height: 6, backgroundColor: 'var(--band-color, #6366f1)' }} />
        {/* Info */}
        <div style={{ flex: 1, padding: '40px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, margin: 0 }}>{game.name}</p>
            <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>
              {game.minPlayers === game.maxPlayers ? game.minPlayers : `${game.minPlayers}–${game.maxPlayers}`} players · {game.playTimeMinutes} min
            </p>
          </div>
          <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>Meeply</p>
        </div>
      </div>
    );
  }

  // Session variant
  const { gameName, log } = props;
  const dateFormatted = (() => {
    const [y, m, d] = log.date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  })();

  return (
    <div
      ref={ref}
      style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif', backgroundColor: '#0c0c10', color: '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 56px', textAlign: 'center' }}
    >
      <p style={{ fontSize: 36, color: 'rgba(255,255,255,0.4)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Just played</p>
      <p style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, margin: '0 0 48px' }}>{gameName}</p>
      {log.winnerName && (
        <>
          <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Winner</p>
          <p style={{ fontSize: 56, fontWeight: 700, color: '#6366f1', marginBottom: 48 }}>{log.winnerName}</p>
        </>
      )}
      {log.playerNames.length > 0 && (
        <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.4)', marginBottom: 48 }}>
          {log.playerNames.join(' · ')}
        </p>
      )}
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end' }}>
        <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.25)' }}>{dateFormatted}</p>
        <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.25)' }}>Meeply</p>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';
export default ShareCard;
```

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/share-card.tsx
git commit -m "feat: add ShareCard component for game and session variants"
```

---

### Task 20: Add share entry points

**Files:**
- Modify: `src/components/game-detail.tsx`
- Modify: `src/components/play-log-detail.tsx`
- Modify: `src/app/collection/page.tsx`

- [ ] **Step 1: Add share to game detail**

In `src/components/game-detail.tsx`:

1. Add imports:
```tsx
import { useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareCard from './share-card';
import { generateShareImage, shareImage } from '../lib/share-image';
```

2. Add ref and loading state inside the component:
```tsx
const shareCardRef = useRef<HTMLDivElement>(null);
const [sharing, setSharing] = useState(false);
```

3. Add the share handler:
```tsx
const handleShare = async () => {
  if (!shareCardRef.current || sharing) return;
  setSharing(true);
  try {
    const file = await generateShareImage(shareCardRef.current);
    await shareImage(file);
  } catch (e) {
    console.error('Share failed', e);
  } finally {
    setSharing(false);
  }
};
```

4. Add the share button to the top action bar (alongside back/edit/delete):
```tsx
<button
  onClick={handleShare}
  disabled={sharing}
  className="text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
>
  <Share2 size={20} />
</button>
```

5. Render the `<ShareCard>` offscreen at the end of the component, just before the closing `</div>`:
```tsx
{/* Offscreen share card — not visible to user */}
<div style={{ position: 'absolute', left: -9999, top: 0, visibility: 'hidden' }} aria-hidden="true">
  <ShareCard ref={shareCardRef} variant="game" game={game} />
</div>
```

- [ ] **Step 2: Add share to play log detail**

In `src/components/play-log-detail.tsx`:

> **CRITICAL:** `log` is typed `PlayLog | null` in this component's props. Passing `log` directly to `<ShareCard>` will cause a TypeScript error because `ShareCard` expects `log: PlayLog` (non-null). The offscreen `<ShareCard>` render MUST go inside the existing `{open && log && (...)}` guard at line 84, where TypeScript narrows `log` to `PlayLog`. Use `log` directly (no `!` assertion needed inside the guard).

1. Add imports at the top of the file:
```tsx
import { useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareCard from './share-card';
import { generateShareImage, shareImage } from '../lib/share-image';
```

2. Add ref and state inside the component body (at the top, alongside existing state):
```tsx
const shareCardRef = useRef<HTMLDivElement>(null);
const [sharing, setSharing] = useState(false);
```

3. Add the share handler:
```tsx
const handleShare = async () => {
  if (!shareCardRef.current || sharing) return;
  setSharing(true);
  try {
    const file = await generateShareImage(shareCardRef.current);
    await shareImage(file);
  } catch (e) {
    console.error('Share failed', e);
  } finally {
    setSharing(false);
  }
};
```

4. In the action bar (lines ~109–124, inside the `{open && log && ...}` guard), add the share button to the `<div className="flex gap-1">` row alongside edit/delete:
```tsx
<button
  onClick={handleShare}
  disabled={sharing}
  className="p-2 text-text-secondary hover:text-primary transition-colors disabled:opacity-50"
>
  <Share2 size={18} />
</button>
```

5. Render the offscreen ShareCard INSIDE the `{open && log && (...)}` guard, just before the guard's closing `</>` (after all the sheet content). Because we are inside `open && log &&`, TypeScript knows `log` is `PlayLog` here — use it directly:
```tsx
{/* Offscreen share card — positioned offscreen so html-to-image can capture it */}
<div style={{ position: 'absolute', left: -9999, top: 0, visibility: 'hidden' }} aria-hidden="true">
  <ShareCard ref={shareCardRef} variant="session" gameName={game?.name ?? ''} log={log} />
</div>
```

- [ ] **Step 3: Add share to collection multi-select toolbar**

In `src/app/collection/page.tsx`, find the multi-select mode action area. Add a "Share as image" button. This requires generating a collage ShareCard — for simplicity in this initial implementation, share the first selected game as a single game card:

```tsx
// Add imports at top
import { useRef, useState } from 'react'; // if not already imported
import { Share2 } from 'lucide-react'; // if not already imported
import ShareCard from '../../components/share-card';
import { generateShareImage, shareImage } from '../../lib/share-image';

// Inside component
const shareCardRef = useRef<HTMLDivElement>(null);
const [sharingSingle, setSharingSingle] = useState(false);
const firstSelectedGame = filteredGames.find((g) => selectedIds.has(g.id));

const handleShareSelectedAsImage = async () => {
  if (!shareCardRef.current || !firstSelectedGame || sharingSingle) return;
  setSharingSingle(true);
  try {
    const file = await generateShareImage(shareCardRef.current);
    await shareImage(file);
  } catch (e) {
    console.error('Share failed', e);
  } finally {
    setSharingSingle(false);
  }
};
```

In the select mode toolbar, add the share-as-image button alongside the existing share (text) button:

```tsx
{firstSelectedGame && (
  <button
    onClick={handleShareSelectedAsImage}
    disabled={sharingSingle}
    className="flex items-center gap-1.5 text-xs glass-pill px-3 py-2 rounded-full text-text-secondary disabled:opacity-50"
  >
    <Share2 size={14} />
    Image
  </button>
)}
```

Render the offscreen share card for the first selected game:
```tsx
{firstSelectedGame && (
  <div style={{ position: 'absolute', left: -9999, top: 0, visibility: 'hidden' }} aria-hidden="true">
    <ShareCard ref={shareCardRef} variant="game" game={firstSelectedGame} />
  </div>
)}
```

- [ ] **Step 4: Run build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -30
```

Fix any TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/game-detail.tsx src/components/play-log-detail.tsx src/app/collection/page.tsx
git commit -m "feat: add share-as-image entry points to game detail, play log, and collection"
```

---

## Chunk 7: Final Build Check + PR

### Task 21: Full build verification

- [ ] **Step 1: Run complete build**

```bash
cd /Users/memo/Projects/meyane/boardgame-shelf && npm run build
```

Expected: Clean build with no TypeScript errors and no Vite build failures.

If there are errors, fix them before proceeding.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 3: Push branch and open PR**

```bash
git push -u origin HEAD
```

Then create the PR targeting `main` using the `workflow:pr` skill or:

```bash
gh pr create \
  --title "feat: QA enhancements — wishlist overhaul, scorekeeper cards, share, game night picker" \
  --assignee gmemo \
  --body "$(cat <<'EOF'
## Summary

Post-QA round of bug fixes and feature enhancements.

**Bug fixes:**
- Modal scroll lock on all bottom sheets (game picker, game night picker, scorekeeper sheets)
- Remove black gradient from Sessions/Wishlist/Stats headers
- Nav chip overflow fixed (inset-0 → inset-y-1 inset-x-0.5)
- Settings page scrolls fully without content hidden behind nav
- Log play date field constrained width
- Scorekeeper: remove round counter, no default empty player slots

**Features:**
- Collection game cards: 4-row layout (name / players+time / complexity / tags)
- Scorekeeper: card-per-player layout replaces table entirely
- Wishlist: grid layout matching collection, image on cards, detail page, quick form with collapsible sections, add-to-collection flow (supports expansion attachment to parent game)
- Game Night Picker: tags behind "More Filters" collapsible, results capped at 5
- Collection: visible Select button for multi-select mode
- Settings: custom accent color via color picker, light theme fun label
- Visual share cards: share game cards and session results as PNG to Photos / download

## Test plan

- [ ] All modals/sheets lock background scroll on iOS PWA
- [ ] Sessions, Wishlist, Stats headers scroll away with content (no black band)
- [ ] Nav active chip doesn't overflow pill corners
- [ ] Settings scrolls fully to bottom without nav overlap
- [ ] Game cards show 4 rows with right-edge padding
- [ ] Scorekeeper starts empty, cards show per player with 44px +/- buttons
- [ ] Wishlist items show image, tap opens detail, Add to Collection works
- [ ] Game Night Picker tags are collapsed by default
- [ ] Custom color picker in settings updates accent color live
- [ ] Share button on game detail generates and shares/downloads PNG
- [ ] `npm run build` clean

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---
