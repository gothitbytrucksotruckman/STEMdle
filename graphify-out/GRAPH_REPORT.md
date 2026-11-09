# Graph Report - .  (2026-07-13)

## Corpus Check
- 16 files · ~66,801 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 93 nodes · 130 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Game Modes|Game Modes]]
- [[_COMMUNITY_Brand Identity|Brand Identity]]
- [[_COMMUNITY_Product Requirements|Product Requirements]]
- [[_COMMUNITY_Project Metadata|Project Metadata]]
- [[_COMMUNITY_Application State|Application State]]
- [[_COMMUNITY_Visual Branding|Visual Branding]]
- [[_COMMUNITY_Game Interface|Game Interface]]
- [[_COMMUNITY_Product Overview|Product Overview]]
- [[_COMMUNITY_Guess Submission|Guess Submission]]
- [[_COMMUNITY_Game Navigation|Game Navigation]]
- [[_COMMUNITY_Results and Stats|Results and Stats]]
- [[_COMMUNITY_Server Setup|Server Setup]]
- [[_COMMUNITY_Doctordle Concept|Doctordle Concept]]
- [[_COMMUNITY_Wordle Concept|Wordle Concept]]

## God Nodes (most connected - your core abstractions)
1. `$()` - 11 edges
2. `showLevels()` - 9 edges
3. `startGame()` - 9 edges
4. `showView()` - 8 edges
5. `handleRoute()` - 8 edges
6. `STEMdle` - 8 edges
7. `Six Game Modes` - 8 edges
8. `STEMdle Product Requirements Document v3` - 7 edges
9. `STEMdle Logo` - 7 edges
10. `STEMdle Logo Image` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Landing Mode Select` --conceptually_related_to--> `Six Game Modes`  [INFERRED]
  index.html → README.md
- `Game Screen` --implements--> `Daily Guessing Game`  [INFERRED]
  index.html → stemdle-prd-v3.md
- `Result Screen` --conceptually_related_to--> `Scoring Rules`  [INFERRED]
  index.html → stemdle-prd-v3.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **STEMdle Section Modes** — readme_mechanical, readme_electro, readme_civil, readme_chem, readme_cs, readme_true_engineer [EXTRACTED 1.00]
- **STEMdle Gameplay Components** — index_hint_panel, index_search_area, index_guess_history, index_result_screen [EXTRACTED 1.00]
- **STEM Visual Identity** — assets_html_logo, stemdle_branding, stem_education [EXTRACTED 1.00]
- **STEM-Themed Logo Icon Cluster** — assets_logo_stemdle_fixed, stemdle_wordmark, stem_education_theme [INFERRED 0.95]

## Communities (14 total, 2 thin omitted)

### Community 0 - "Game Modes"
Cohesion: 0.18
Nodes (11): STEMdle HTML Interface, Landing Mode Select, Level Select, Stats Screen, Chem, Civil, CS, Electro (+3 more)

### Community 1 - "Brand Identity"
Cohesion: 0.22
Nodes (9): STEMdle Logo Image, Atom Symbol, Gear Icon, Lightning Bolt, Microchip Icon, STEM Education Theme, STEMdle Wordmark, Technical Drawing Compass (+1 more)

### Community 2 - "Product Requirements"
Cohesion: 0.25
Nodes (9): Result Screen, STEMdle Product Requirements Document v3, Content Authoring Workflow, Guest Mode, Scoring Rules, Section Registry, SQLite Backend, Term Bank JSON (+1 more)

### Community 3 - "Project Metadata"
Cohesion: 0.22
Nodes (8): dependencies, express, description, main, name, scripts, start, version

### Community 4 - "Application State"
Cohesion: 0.29
Nodes (7): currentBank, dayIndex(), EPOCH, getUrlParam(), init(), loadSections(), sections

### Community 5 - "Visual Branding"
Cohesion: 0.25
Nodes (8): STEMdle Logo, Electricity Lightning Symbol, Engineering Gear Symbol, Mathematics Compass Symbol, Science Atom Symbol, STEM Education, STEMdle Branding, Technology Microchip Symbol

### Community 6 - "Game Interface"
Cohesion: 0.25
Nodes (8): Game Screen, Guess History, Hint Panel, Search Area, Autocomplete Term Selection, Daily Guessing Game, Five Hint Escalation, Give Up

### Community 7 - "Product Overview"
Cohesion: 0.25
Nodes (8): README, Doctordle, Engineering and Computer Science Term Guessing Game, Progressive Hints, Plain HTML CSS JavaScript, SQLite, Static JSON Content, STEMdle

### Community 8 - "Guess Submission"
Cohesion: 0.60
Nodes (6): addGuessLog(), icon(), renderHints(), submitGuess(), toggleSidebar(), $()

### Community 9 - "Game Navigation"
Cohesion: 0.80
Nodes (6): handleRoute(), loadBank(), setUrlParam(), showLevels(), showView(), startGame()

### Community 10 - "Results and Stats"
Cohesion: 0.40
Nodes (5): endRound(), getLocalStats(), saveLocalResult(), showStats(), TIERS

### Community 11 - "Server Setup"
Cohesion: 0.50
Nodes (3): app, express, path

## Knowledge Gaps
- **52 isolated node(s):** `EPOCH`, `sections`, `currentBank`, `name`, `version` (+47 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Six Game Modes` connect `Game Modes` to `Product Overview`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `STEMdle HTML Interface` connect `Game Modes` to `Product Requirements`, `Game Interface`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `EPOCH`, `sections`, `currentBank` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._