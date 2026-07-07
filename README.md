# STEMdle

A daily engineering and computer science term guessing game. Like Wordle, but for STEM nerds.

Players search for and select the correct term from an autocomplete list. They start with one hint, and incorrect guesses reveal additional, increasingly specific hints (up to 5). 

Features 6 game modes:
- **Mechanical** (Mechanical Engineering)
- **Electro** (Electrical Engineering)
- **Civil** (Civil Engineering)
- **Chem** (Chemical Engineering)
- **CS** (Computer Science & IT)
- **True Engineer** (Mixed mode pulling from all sections)

## Tech Stack
Minimalist, zero-build-step architecture:
- **Frontend:** Plain HTML / CSS / JS (No React, no bundlers)
- **Backend:** Node.js + Express
- **Database:** SQLite (via `better-sqlite3`) for user stats
- **Auth:** Custom JWT + bcrypt (username/password only, no email)
- **Content:** Served directly from static JSON files

## How to run locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open `http://localhost:3000` in your browser.

*Note: The SQLite database (`stemdle.db`) is created automatically on first run.*

## Adding new terms

Content is completely decoupled from game logic. To add new words:
1. Open the relevant file in `/data` (e.g., `cs.json`)
2. Copy an existing term block and increment the `number`
3. Add the `answer`, `searchTags`, and exactly 5 `hints` (from vague to specific)
4. Save. The game will automatically include it in the daily rotation.
