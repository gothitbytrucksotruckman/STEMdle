# STEMdle — Product Requirements Document (v3)

**Status:** Draft v3
**Owner:** Rangga
**Type:** Simple web game (Wordle/Doctordle-style daily guessing game)

### Changelog from v2
- Renamed the game from Enginerdle to **STEMdle**. Sections are now named plainly: Mechanical, Electro, Civil, Chem, CS, and **True Engineer** (the Mix mode).
- CS is one unified mode covering general CS/IT knowledge — no separate "Error of the Day" sub-mode.
- Accounts simplified to username + password only. No email, no verification step, no OAuth.
- Difficulty tagging removed. Each term is simply numbered sequentially within its section (#1, #2, #3...), same spirit as Wordle's puzzle-number branding.
- Added a **Give Up** button that reveals the answer and ends the round immediately.
- Added an explicit content-authoring workflow so new terms can be added to any section by editing a single JSON file, with no code changes required.

---

## 1. Overview

STEMdle is a daily guessing game for engineering and computer science terms, inspired by Wordle and Doctordle. Players search for and select the correct term from an autocomplete-style input rather than typing free text. They start with one hint and reveal additional hints with each incorrect guess, up to 5 hints total. After all 5 hints are shown, guessing continues without limit — there's no loss state. Players can also give up at any point to reveal the answer outright. The final score is based on total guesses used.

Sections: **Mechanical, Electro, Civil, Chem, CS**, and **True Engineer** (the mixed mode pulling from all sections). The section list is designed to be extendable — adding a new discipline later should be low-effort (see Section 7.3).

---

## 2. Goals

- Build a lightweight, replayable daily word-guessing game themed around engineering and CS.
- Make it approachable for non-specialists too (hints escalate from general knowledge to field-specific jargon).
- Keep content additions dead simple — adding a new term should mean editing one JSON file, nothing else.
- Support lightweight accounts so stats persist, without the overhead of email verification or third-party auth.
- Keep the core loop failure-free — score reflects efficiency (fewer guesses), not pass/fail.

### Non-Goals (for v3)

- No OAuth / third-party login providers.
- No email verification or password recovery flow (site is for fun, not high-stakes).
- No difficulty tagging or adaptive rotation logic.
- No real-time multiplayer or monetization.

---

## 3. Target Audience

- Engineering/CS students and professionals who enjoy trivia and daily word games.
- Wordle/Doctordle players looking for a niche variant.
- Casual players who enjoy learning trivia even outside their field.

---

## 4. Core Gameplay Loop

1. Player selects a section: Mechanical, Electro, Civil, Chem, CS, or True Engineer.
2. The game reveals **Hint 1** for that section's puzzle of the day.
3. Player types into the search input. Matching valid answers from that section's term bank appear directly below the input as they type.
4. Player **clicks** an answer from the list to submit it as a guess.
5. **If correct:** round ends, result screen shows total guesses used.
6. **If incorrect:** the guess is logged in guess history. If fewer than 5 hints have been revealed, the next hint is shown.
7. **Once all 5 hints are revealed:** guessing continues without limit; every guess still adds to the counter.
8. **At any point**, the player may press **Give Up**, which immediately reveals the correct answer and ends the round. Give-up rounds are recorded as not solved (see Section 10) rather than being averaged into guess-count stats.
9. Final score for a solved round = total number of guesses made before getting it right.

---

## 5. Sections

| Section | Covers | Example Terms |
|---|---|---|
| Mechanical | Mechanical Engineering | Torque, Resonance, Fatigue |
| Electro | Electrical Engineering | Impedance, Capacitor, Ohm's Law |
| Civil | Civil Engineering | Load-bearing, Shear force, Rebar |
| Chem | Chemical Engineering | Distillation, Catalyst, Viscosity |
| CS | Computer Science / IT (general) | Recursion, API, NullPointerException |
| **True Engineer** | Mix of all sections above | Any of the above |

New sections can be added later (e.g., Aerospace, Industrial) by following the same term bank + config pattern in Section 7.3 — no core gameplay code should need to change.

---

## 6. Hint Design Guidelines

Every entry needs exactly 5 hints, ordered from **vague and broadly accessible** to **highly specific/technical**.

1. **Hint 1** — Broad category or general-knowledge framing.
2. **Hint 2** — Narrows the field or adds a defining property.
3. **Hint 3** — A well-known example, application, or related historical fact.
4. **Hint 4** — A specific, real-world, relatable use case.
5. **Hint 5** — The most technical/precise clue (formula, exact definition, symbol, or naming convention).

Example (Electro — "Impedance"):
1. A property describing opposition to current flow in a circuit
2. Extends the idea of resistance to AC circuits as a complex number
3. Combines resistance and reactance into one value
4. Symbol Z, measured in ohms
5. The key thing you match between speakers and amplifiers for max power transfer

---

## 7. Data Model

### 7.1 Term bank schema (per section JSON file)

Each section is one JSON file. Terms are numbered sequentially — this number is both the internal ID and the "puzzle number" shown to players (e.g., "Mechanical #23").

```json
{
  "section": "electro",
  "terms": [
    {
      "number": 1,
      "answer": "Impedance",
      "searchTags": ["impedance", "impedence", "AC resistance"],
      "hints": [
        "A property describing opposition to current flow in a circuit",
        "Extends the idea of resistance to AC circuits as a complex number",
        "Combines resistance and reactance into one value",
        "Symbol Z, measured in ohms",
        "The key thing you match between speakers and amplifiers for max power transfer"
      ]
    },
    {
      "number": 2,
      "answer": "Capacitor",
      "searchTags": ["capacitor", "cap"],
      "hints": [
        "A passive component found in nearly every circuit",
        "Stores energy in an electric field between two plates",
        "Blocks DC while letting AC pass through",
        "Measured in Farads",
        "Common types include electrolytic and ceramic"
      ]
    }
  ]
}
```

**`searchTags`** just helps the live search surface the term even with a misspelling or alternate name — since selection is click-based, this field only affects search visibility, never correctness logic.

### 7.2 How to add a new term (content workflow)

This is intentionally simple so you can add words without touching any game logic:

1. Open the relevant section's JSON file (e.g., `electro.json`).
2. Copy an existing term object as a template.
3. Set `number` to the next unused number in that file (e.g., if the last term is `#40`, the new one is `#41`).
4. Fill in `answer`, `searchTags` (at least the answer itself, plus common misspellings/synonyms), and exactly 5 `hints` ordered vague → specific.
5. Save the file. No other file needs to change — the puzzle rotation (Section 7.3) automatically includes the new term in the cycle.

### 7.3 Section registry (for future extensibility)

A small config file lists all active sections, so adding a brand-new discipline later doesn't require touching game logic — just add a term bank file and one entry here:

```json
{
  "sections": [
    { "id": "mechanical", "label": "Mechanical", "file": "mechanical.json" },
    { "id": "electro", "label": "Electro", "file": "electro.json" },
    { "id": "civil", "label": "Civil", "file": "civil.json" },
    { "id": "chem", "label": "Chem", "file": "chem.json" },
    { "id": "cs", "label": "CS", "file": "cs.json" }
  ]
}
```

"True Engineer" is not its own file — it's generated at runtime by merging all files listed in the registry, so it automatically includes any new section the moment it's added here.

### 7.4 User account schema

```json
{
  "userId": "abc123",
  "username": "rangga",
  "passwordHash": "...",
  "createdAt": "2026-07-07",
  "stats": {
    "gamesPlayed": 42,
    "gamesSolved": 38,
    "gamesGivenUp": 4,
    "totalGuesses": 156,
    "averageGuesses": 3.7,
    "bestGuessCount": 1,
    "currentStreak": 5,
    "longestStreak": 12,
    "perSection": {
      "mechanical": { "played": 10, "avgGuesses": 3.2 },
      "electro": { "played": 8, "avgGuesses": 4.1 }
    }
  }
}
```

---

## 8. UI/UX Flow

1. **Landing / Mode Select screen** — logo, tagline, buttons for each section (Mechanical, Electro, Civil, Chem, CS, True Engineer). Sign-in/sign-up entry point visible if not logged in.
2. **Sidebar (logged-in users)** — Stats, Account settings, Sign out.
3. **Game screen:**
   - Hint panel at top, showing revealed hints in order.
   - Search input below hints; typing filters that section's term bank live.
   - Clickable results list under the input; clicking submits the guess.
   - **Give Up** button, always visible near the input.
   - Guess history list, showing past wrong guesses alongside which hint followed each.
   - Running guess counter.
4. **Result screen:**
   - If solved: total guesses used, term definition/fun fact, "Share result" button.
   - If given up: the correct answer is shown directly, marked distinctly from a solved result (e.g., no guess-count score, just "revealed").
   - Updates account stats in the background if logged in.
5. **Stats page** (via sidebar) — games played, solved vs. given up, average guesses, best score, current/longest streak, per-section breakdown.

---

## 9. Technical Architecture (Suggested)

- **Frontend:** React (or plain HTML/CSS/JS if keeping it minimal).
- **Content storage:** Static JSON files — one per section, plus the section registry from 7.3.
- **Accounts & auth:** Simple custom auth — username + password only, no email, no verification flow. Passwords should still be hashed server-side (e.g., bcrypt) even without verification, since storing plaintext passwords is never a good idea regardless of how low-stakes the site is. A minimal backend (e.g., Node/Express with SQLite or Postgres) is enough; no need for a full auth-as-a-service provider given the simplified requirements.
- **Sessions:** Basic session token or JWT after login; no password reset flow needed for v3 (could be a manual "contact me" fallback if someone forgets their password, given no email is on file).
- **Puzzle rotation:** Each section cycles through its own term bank independently, incrementing by one term per day and wrapping back to `#1` after the last term. Because each section can have a different number of terms, they don't need to stay in sync with each other — this also means new terms added to a section extend its cycle automatically with no extra configuration.
- **Guest mode:** Players can still play without an account; stats simply aren't saved. Prompt sign-up after a completed round.

---

## 10. Scoring Rules

- **Primary metric:** total guesses used to solve (lower is better). Only counted for solved rounds.
- **Give-up rounds:** counted toward `gamesPlayed` and `gamesGivenUp`, but excluded from `averageGuesses` and `bestGuessCount` — giving up isn't a guess-efficiency data point.
- Suggested cosmetic tiers for the result screen: 1 guess = "Genius," 2 = "Expert," 3 = "Solid," 4–5 = "Steady," 6+ = "Marathon."
- **Streak** = consecutive calendar days with a *solved* round. A given-up round does not extend the streak (reasonable default — flag if you'd rather giving up still count as "played today").
- **Best score** = fewest guesses ever used on a solved round, tracked overall and per section.

---

## 11. Content Roadmap

| Phase | Scope |
|---|---|
| Phase 1 (MVP) | 2 sections fully seeded (~30–50 terms each) + guest play, no accounts yet |
| Phase 2 | Simple username/password accounts, stats sidebar, per-user persistence |
| Phase 3 | Remaining sections (Civil, Chem, remaining CS terms) seeded to ~30–50 terms each |
| Phase 4 | True Engineer mix mode enabled once at least 3 sections have enough content |
| Phase 5 | Share-result grid, sound/animation polish, optional future sections (Aerospace, Industrial, etc.) |

---

## 12. Open Questions / Decisions Needed

- **Streak on give-up:** Confirmed default is that giving up breaks/doesn't extend the streak. Flag if you'd prefer give-ups to still count as "played today" for streak purposes.
- **Minimum term bank size before a section goes live:** how many terms should a section have before it's playable, so players don't hit repeats too quickly?
- **True Engineer eligibility:** should every section be included in the mix from day one, or only sections that have crossed the minimum term count above?

---

## 13. Future Enhancements (Post-v3)

- New sections (Aerospace, Industrial, Biomedical, etc.) via the registry pattern in 7.3.
- Shareable result emoji grid (Wordle-style spoiler-free sharing).
- Sound effects / subtle animations on hint reveal and correct guess.
- Community-submitted term suggestions (with moderation).
- Optional leaderboards once the account system has enough active users to make it interesting.
