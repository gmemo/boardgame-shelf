# Boardgame Shelf — V2 / Next Phase Roadmap

> Draft ideas for evolving the app from a personal local-first collection manager into a social, intelligent boardgame companion — while keeping the core principles: beautiful Liquid Glass UI, fast PWA experience, and delightful interactions.

---

## 1. User Accounts & Social Graph

### 1.1 Authentication & Profiles
- User accounts (email, OAuth, or passkey-based)
- Profile with avatar, display name, favorite game genres, and a public game shelf
- Sync local IndexedDB data to cloud on account creation (migration path from v1)

### 1.2 Friends System
- Add friends by username, QR code, or invite link
- Friends list with online status and "last played" indicator
- Friend profiles show their public collection, favorite games, and shared play history

### 1.3 Friend-Aware Game Sessions
- When logging a play session, select from your friends list instead of typing names
- Sessions are linked to friend accounts — both players see the session in their history
- Guest mode still available for one-off players (backwards compatible with v1 `Player` model)

---

## 2. Live Game Sessions

### 2.1 Real-Time Session Lobby
- Create a live session, invite friends via link or push notification
- Lobby shows who's joined, which game is being played, and session status

### 2.2 Collaborative Score Tracking
- Each player updates their own score from their device in real-time
- Shared scoreboard view with live updates (WebSocket or Firebase Realtime DB)
- Support for different scoring models: cumulative, round-based, team-based

### 2.3 Game Timer & Turn Tracker
- Optional per-turn timer with notifications
- Turn order display so everyone knows who's next
- Pause/resume for breaks

---

## 3. Smart Game Suggestions

### 3.1 Personal Recommendations
- Based on your ratings, play frequency, and complexity preferences
- "You haven't played this in a while" nudges
- "Based on games you love" discovery (collaborative filtering when social data exists)

### 3.2 Group Matchmaking
- When planning a session with specific friends, suggest games from the intersection of collections
- Filter by player count, shared high-ratings, and complexity sweet spot of the group
- "New to the group" suggestions — games one person owns that others haven't tried

### 3.3 Mood / Context Filters
- Quick-pick presets: "Quick game (< 30 min)", "Epic night (2h+)", "Party game (6+ players)"
- Combined with group matchmaking for situational recommendations

---

## 4. Social Scoreboard & Rivalry

### 4.1 Head-to-Head Stats
- Win/loss record between any two friends
- "Rivalry" cards: who dominates which game, longest win streak, closest matchups

### 4.2 Group Leaderboards
- Create persistent groups (e.g., "Friday Night Crew")
- Leaderboard by total wins, win rate, games played, variety of games won
- Seasonal resets or all-time views

### 4.3 Achievements & Milestones
- Personal: "Played 100 games", "Tried 10 different genres", "5-game win streak"
- Social: "Beat every friend at least once", "Hosted 20 game nights"
- Game-specific: "Played Catan 50 times", "Won 3 different strategy games in one night"

---

## 5. Smart Game Import & Data Enrichment

### 5.1 Search & Auto-Fill from Web
- Search by game name, pull data from BoardGameGeek (BGG) API or similar
- Auto-populate: name, description, player count, play time, complexity, image, categories/tags
- User confirms and edits before saving — no silent overwrites

### 5.2 Barcode / QR Scanning
- Scan the game box barcode (UPC/EAN) using device camera
- Look up the barcode against a game database to auto-fill details
- Fallback to manual entry if barcode not found

### 5.3 Expansion Management
- After importing a base game, show a dropdown of known expansions
- Mark owned expansions vs. missing ones
- "Add to wishlist" for unowned expansions — feeds into a dedicated wishlist view

### 5.4 Wishlist
- Games and expansions you want but don't own yet
- Price tracking or "notify me" when a friend is selling/lending one (ties into Community)
- Shareable wishlist for gift ideas

---

## 6. Intelligent Rulebook Assistant

### 6.1 Rulebook Ingestion
- Upload rulebook photos — OCR + LLM processing to extract structured rules
- Download rulebook PDFs from the web (with publisher permission / public sources)
- Store processed rules per game, searchable and browsable

### 6.2 In-Game Rule Q&A (LLM-Powered)
- "Can I build a road here?" — ask natural language questions mid-game
- Context-aware: knows which game you're playing, which expansions are active
- Cites the specific rule section in the answer
- Works offline with a cached/local model or online with cloud LLM

### 6.3 Quick Rules Summary
- Auto-generate a "teach this game in 2 minutes" summary from the full rulebook
- Highlight differences when expansions are added
- Extends the existing `quickRulesNotes` field with AI-generated content

---

## 7. Community & Lending

### 7.1 Lending Tracker
- Lend a game to a friend — record who has it and since when
- Automatic reminders after a configurable period ("It's been 30 days...")
- Push notification to borrower: "Hey, ready to return Wingspan?"

### 7.2 Borrower Reputation
- After a game is returned, rate the borrower (1-5 stars)
- Criteria: condition returned, timeliness
- Visible on their profile — builds trust for future lending

### 7.3 Community Marketplace (Future)
- List games for sale, trade, or permanent lending within your friend network
- "Looking for" posts — match against friends' collections
- Local pickup coordination

### 7.4 Game Reviews & Notes
- Write and share reviews for games in your collection
- See friends' reviews when browsing a game
- Community average rating alongside your personal rating

---

## 8. Advanced Analytics & Discovery

### 8.1 Deep Personal Stats
- Play time by genre, complexity tier, day of week, month
- "Your gaming personality" — profile based on what you play most
- Trends over time: "You've been gravitating toward heavier games this year"

### 8.2 Filterable Analytics Dashboard
- Filter stats by game type, player count, time period, friend group
- Visualizations: heatmaps, bar charts, trend lines
- Exportable reports (PDF/image for sharing)

### 8.3 Boardgame Event Discovery
- Surface nearby boardgame events, meetups, conventions
- Based on location and game preferences
- Integration with Meetup, BGG events, or a custom event feed

### 8.4 Enterprise / Publisher Add-Ons (Stretch)
- Sponsored game suggestions (clearly labeled)
- Publisher-provided digital rulebooks and errata
- Promotional expansions or demo sessions at events

---

## 9. Additional Ideas

### 9.1 Game Night Planner
- Schedule a game night, invite friends, vote on games to play
- Automatic suggestions based on group preferences and available time
- RSVP tracking and reminders

### 9.2 Collection Insights
- "Collection gaps" — genres or player counts you're underserved in
- "Shelf of shame" — games you own but have never played
- Estimated collection value (via marketplace data)

### 9.3 Cross-Platform Sync
- Cloud sync so the app works seamlessly across phone, tablet, and desktop
- Offline-first remains core — sync when connectivity is available
- Conflict resolution for simultaneous edits

### 9.4 Customizable Game Tracking Templates
- Some games have unique scoring (e.g., golf-style lowest wins, team scores)
- Let users define custom score templates per game
- Reusable across sessions for that game

### 9.5 Photo Journal
- Attach photos to play sessions (the table setup, victory moment)
- Gallery view in game detail and play history
- Shared photos visible to session participants

---

## Implementation Phases (Suggested)

| Phase | Focus | Key Features |
|-------|-------|--------------|
| **Phase 1 — Foundation** | Accounts + Cloud Sync | Auth, profiles, data migration from local, cross-device sync |
| **Phase 2 — Social Core** | Friends + Sessions | Friends system, friend-aware sessions, head-to-head stats |
| **Phase 3 — Smart Import** | Data Enrichment | BGG search, barcode scanning, expansion management, wishlist |
| **Phase 4 — Intelligence** | LLM Features | Rulebook ingestion, in-game Q&A, smart suggestions |
| **Phase 5 — Community** | Lending + Social | Lending tracker, reputation, group leaderboards, achievements |
| **Phase 6 — Discovery** | Analytics + Events | Advanced stats, event discovery, collection insights |
| **Phase 7 — Live** | Real-Time Play | Live sessions, collaborative scoring, turn tracking |

---

*This document is a living draft. Ideas will be refined, merged, or deprioritized as development progresses.*
