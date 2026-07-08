# STEMdle (Wordle game wanabe for Engineer Student)

An engineering and computer science term guessing game. Like Wordle, but for STEM nerds.

Players search for and select the correct term from the already provided list. They start with one hint, and incorrect guesses reveal additional, increasingly specific hints (up to 5). 

Features 6 game modes (for now, I'll add more in the future):
- **Mechanical** (Mechanical Engineering)
- **Electro** (Electrical Engineering)
- **Civil** (Civil Engineering)
- **Chem** (Chemical Engineering)
- **CS** (Computer Science & IT)
- **True Engineer** (Mixed mode pulling from all sections, this one is kinda useless)

## Tech Stack
Simple, zero-build-step architecture:
- **Frontend:** Plain HTML / CSS / JS
- **Database:** SQLite (via `better-sqlite3`) for user stats
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

# Inspiration
Of course, this project isn't possible without inspiration from wordle. But the biggest inspiratioon that motivates me to create this project is [doctordle](doctordle.org). All mechanics are inspired by doctordle, with some custom tweaks to fit the STEM context.

When I watched a doctor playing doctordle, I realized how much fun it is to play a word game with a mechanic similar to doctordle. This project is my attempt to bring that fun back to the STEM world.

# Future
Of course, this project is just a fun side project for me. But I have big plans for expanding it into a full-fledged STEM word game platform if it's possible.
