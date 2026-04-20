# Five Hints — UX Redesign Design Spec

**Date:** 2026-04-19  
**Scope:** Gameplay redesign (solo + group) and Create mode  
**Out of scope (this phase):** Profile/history screen

---

## 1. Goals

- Replace the functional-but-developer-feels UI with a clean, game-native experience
- Make group play (same room, multiple devices) a first-class feature
- Preserve all existing solo play behaviour — no regressions
- Mobile-first layout that also works well on desktop

---

## 2. Design System

### Colors

| Token | Hex | Usage |
|---|---|---|
| Primary | `#10b981` | CTA buttons, active hint border, correct state |
| Primary Dark | `#059669` | Hover/pressed state |
| Slate 900 | `#0f172a` | Headings, host badge, "Next Entry" button |
| Page BG | `#f8fafc` | App background |
| Card BG | `#ffffff` | All panels and cards |
| Border | `#e2e8f0` | Default card/input borders |
| Red | `#ef4444` | Wrong guess state |
| Amber | `#f59e0b` | Streak counter, "still playing" indicator |

The existing navy (`#0c4863`) and amber (`#ffb53a`) are replaced. Green is the single primary accent — it maps cleanly to "correct" and "active", reducing cognitive load.

### Typography

**Font:** Inter (already loaded via system stack; add Google Fonts import as fallback)

| Role | Size | Weight | Notes |
|---|---|---|---|
| Display | 48px | 900 | Game/category titles |
| Heading | 24px | 800 | Screen headings |
| Subheading | 18px | 700 | Section labels |
| Hint text | 14px | 500 | Line height 1.55 |
| Label | 11px | 700 | Uppercase, +0.1em tracking |

### Hint Card States

Five distinct visual states for hint rows:

| State | Background | Border | Usage |
|---|---|---|---|
| Locked | `#f8fafc` · 50% opacity | `#f1f5f9` | Not yet unlocked |
| Revealed | `#ffffff` | `#e2e8f0` | Shown but no guess yet |
| Active | `#f0fdf9` | `#6ee7b7` + 3px glow | Current hint — guess now |
| Wrong | `#fff5f5` | `#fecaca` | Shown after wrong guess; inline tag shows what was guessed |
| Correct | `#f0fdf4` | `#86efac` | Shown in results after correct answer |

### Spacing & Shape

- Border radius: `10px` (rows), `12px` (cards), `16px` (major panels), `999px` (pills/avatars)
- Card shadow: none by default; `0 0 0 3px rgba(16,185,129,0.08)` on active input card
- Layout max-width: `680px` (solo), `720px` (group gameplay), `560px` (results/lobby)

---

## 3. Navigation Changes

### Current → New

**Current:** Collapsible accordion sidebar with category tree + game chips. Always visible, competes with gameplay area.

**New:** Breadcrumb in the header bar.

```
five.hints  |  All Games  ›  Geography  ›  World Capitals      [Solo | Group]  [PJ]
```

- Tapping any crumb opens a dropdown/modal to switch at that level
- Breadcrumb collapses on mobile to show only the active game chip
- Solo / Group toggle lives in the header — switching to Group triggers the group setup flow

### Header Structure

```
[Logo]  |  [Breadcrumb nav]              [Solo|Group toggle]  [Avatar]
```

Mobile collapses to:
```
[Logo]              [Active game chip]  [Avatar]
```

---

## 4. Solo Gameplay Screen

### Layout (top to bottom)

1. **Header** — breadcrumb + mode toggle + avatar
2. **Stats row** — Solved / Points / Streak (three equal pills)
3. **Progress bar** — spans the full game (e.g. 7/20), with label "Entry 7 of 20 · 14 remaining"
4. **Game label** — category name + game name in small caps, with entry description below
5. **Hints stack** — vertical list of 5 hint rows (see states above)
6. **Input card** — guess field + submit button + attempt dots + "reveal next hint" link
7. **Wrong message** (conditional) — inline below input card, dismisses on next keystroke
8. **Correct state** (conditional) — replaces input card with answer confirmation + points + "Next →" button

### Hint Row Anatomy

```
[Num badge]  [Label (e.g. "Hint 3 · Guess now")]
             [Hint text]
                                        [Wrong guess tag (if applicable)]
```

- Wrong guess tag appears on the right side of the row that triggered the wrong answer
- Active hint has full-width green left-border accent + background tint

### Input Card

```
[Text input: "Type your answer…"]  [Guess → button]
[● ● ○ ○ ○  Attempt 3 of 5]       [▸ Reveal next hint (−1 pt)]
```

- Input card is sticky at the bottom on mobile
- Attempt dots: red = used, amber = current (pulsing), grey = remaining
- "Reveal next hint" is a text link, not a button — avoids accidental taps

### Correct Answer State

```
[✓ green circle]  Correct on hint 3!
                  Ankara
                  +3 points · Streak 🔥4
                                         [Next →]
```

---

## 5. Group Session Flow

Group play uses a **Session Host + Polling** model. The host creates a session on the backend, others join via a 4-digit code or shared link. The backend stores session state. Each player's client polls (every 2–3 seconds) to detect when all players have submitted, then reveals results simultaneously.

### 5a. Create / Join Screen

Reached by switching the header toggle from Solo → Group.

**Host tab:**
- Nickname (pre-filled from localStorage)
- Category selector
- Game selector
- Number of entries (10 / 20 / All)
- "Create Session →" button → creates session via API, navigates to lobby

**Join tab:**
- Nickname
- 4-digit code input (large, spaced, numeric)
- "Join →" button → validates code via API, navigates to lobby
- "Open Shared Link" fallback

### 5b. Lobby Screen

**Session code display** — large (2.2rem), letter-spaced, easy to read aloud. Copy and Share Link buttons alongside.

**Player list** — shows each joined player with status (Joined / Ready). Host has a "Host" badge. Maximum 8 players.

**Waiting slot** — dashed empty row below last player to signal room for more.

**Game settings** — read-only summary (game, entry count, reveal mode). Host can edit entry count before starting.

**Start button** — only visible to host. Label shows current player count ("Start Game ▶ (3 players)"). Disabled until at least 2 players have joined. All players navigate to gameplay simultaneously on start.

### 5c. Group Gameplay Screen

Identical to solo gameplay with two additions:

**Player strip** (inside the game header card, above hints):
- One chip per player showing name + presence indicator
- Green chip + solid dot = you (playing)
- Blue chip + solid dot = submitted this entry
- Default chip + pulsing amber dot = still playing

**Waiting banner** (shown after you submit while others are still going):
```
⏳ Raj has submitted · waiting for Sam…      Results reveal when everyone submits
```

Each player plays fully independently — own pace, own attempts, own hints revealed. Submitting locks your answer for this entry. Results screen appears automatically when all players submit (or host-configurable timeout elapses).

### 5d. Entry Results Screen

Shown simultaneously to all players when the last submission arrives (via polling).

**Answer reveal box** — prominent, centered, green-bordered card showing the correct answer and which hint was the key one.

**Per-player result rows** — ranked by points earned this entry:
- Rank icon (🥇🥈🥉 or number)
- Avatar + name
- Their guess (✓ correct with hint badge, or ✗ didn't get it)
- Points earned this entry + running delta

**Running totals** — compact leaderboard below results

**Actions:**
- "Next Entry →" (host only triggers advance; all players' screens update via poll)
- "Leave" — returns to solo mode

---

## 6. Backend Session API (new endpoints required)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/sessions/create` | Create session, returns `{ sessionId, code }` |
| `POST` | `/api/sessions/join` | Join by code, returns session state |
| `GET` | `/api/sessions/:id` | Poll session state (players, current entry, submissions) |
| `POST` | `/api/sessions/:id/submit` | Submit answer for current entry |
| `POST` | `/api/sessions/:id/next` | Host advances to next entry |
| `DELETE` | `/api/sessions/:id/leave` | Remove player from session |

Session state payload (polled every 2–3 seconds):

```json
{
  "sessionId": "abc123",
  "code": "4827",
  "status": "playing",
  "currentEntry": 7,
  "totalEntries": 20,
  "players": [
    { "name": "Priya", "isHost": true, "submitted": true, "score": 27 },
    { "name": "Raj",   "isHost": false, "submitted": true, "score": 23 },
    { "name": "Sam",   "isHost": false, "submitted": false, "score": 18 }
  ],
  "revealReady": false
}
```

`revealReady` becomes `true` when all players have submitted. Clients transition to the results screen when they detect this via polling.

---

## 7. Component Decomposition

The existing `App.jsx` (2145 lines, monolithic) will be decomposed as part of this work. New structure:

```
src/
  components/
    layout/
      AppHeader.jsx        — logo, breadcrumb, mode toggle, avatar
      Breadcrumb.jsx       — category/game nav with dropdowns
    gameplay/
      StatsRow.jsx         — solved / points / streak pills
      ProgressBar.jsx      — entry progress
      HintStack.jsx        — renders all 5 hint rows
      HintRow.jsx          — single hint with state variants
      InputCard.jsx        — guess input, attempt dots, reveal link
      CorrectState.jsx     — post-correct answer + next button
      WrongMessage.jsx     — inline wrong answer feedback
    group/
      GroupSetup.jsx       — create/join tabs
      Lobby.jsx            — session code, player list, start button
      PlayerStrip.jsx      — player chips with status indicators
      WaitingBanner.jsx    — "waiting for others" bar
      EntryResults.jsx     — per-player results + running totals
    shared/
      Avatar.jsx
      ModeToggle.jsx
  hooks/
    useGameSession.js      — solo game state (current entry, guesses, score)
    useGroupSession.js     — group session polling, submit, advance
  App.jsx                  — routing shell only (thin)
```

---

## 8. Create Mode

The Create mode is accessed via a Play ↔ Create toggle in the header (replacing the current mode dropdown). It has four screens navigated sequentially.

### 8a. Create Form

Three visible sections, plus a hidden Advanced panel:

**Section 1 — What & How many**
- "What should players identify?" — free text input with example chips ("Identify the Animal", "Identify the Actor", "Guess the Country", etc.) that tap-to-fill
- Game Name — shown to players in the game picker
- Number of entries — 10 / 20 / 30 / 50

**Section 2 — Category**
- Visual chip grid showing existing categories with emoji icons
- Last chip is "＋ New category…" — tapping reveals an inline text input; no modal required
- Selected chip shows green highlight

**Section 3 — Options**
- Include audio hint (No / Yes)
- Visibility (Public / Private)

**Advanced panel** (collapsed by default, toggled by a "⚙ Advanced — customize AI prompts" row):
- Shown with an info note: "Leave blank to use smart defaults"
- Contains the 4 existing prompt fields: Game prompt, Title prompt, Clues prompt, Audio prompt
- All fields are optional

Submit button: "✨ Generate Game" → POSTs to existing `/Create5HintGame` endpoint → navigates to job status screen.

### 8b. Job Status Screen

Replaces the current raw status panel with a visual step-progress view:

1. ✓ Job queued
2. ✓ Generating entries
3. … Quality check (active / pulsing)
4. ○ Ready to review

Auto-refreshes every 5 seconds (replaces manual refresh button). A "go play" card below encourages the user to leave the page — the game will appear in My Games when ready.

### 8c. Review & Publish Screen

**Header card** — game name, category, entry count, pending badge count.

**Approve All button** — one tap publishes all generated entries.

**Entry list** — each entry is a collapsible row:
- Collapsed: entry number badge, answer word, Pending/Approved status, individual Approve button
- Expanded: all 5 hints shown as numbered rows, plus an "Edit hints" button for corrections
- Approved entries show a green checkmark badge; Approve button disappears

### 8d. My Games List

Always visible when in Create mode (above the create form, or as a separate tab). Shows all games created by the current user with:
- Category icon + game name + entry count + relative date
- Status badge: Published (green) / Pending review (amber) / Generating (amber pulsing)
- Actions: Review (if pending), Play + Share (if published), Status (if generating)
- "＋ New Game" button in the header of this section

### Component additions

```
src/
  components/
    create/
      CreateForm.jsx        — 3-section form + advanced toggle
      CategoryPicker.jsx    — chip grid + inline new-category input
      JobStatus.jsx         — step-progress view with auto-poll
      ReviewEntries.jsx     — collapsible entry list + approve actions
      MyGamesList.jsx       — created games with status badges
```

---

## 9. Out of Scope (Phase 2)

- Profile / session history screen
- WebSocket upgrade (real-time vs. polling)
- Leaderboards across sessions
- Audio hint UI changes
