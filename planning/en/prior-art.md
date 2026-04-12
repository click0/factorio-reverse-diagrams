# Factorio Reverse Diagrams — Prior Art & Analogues

A catalogue of existing implementations that solve problems identical or closely related to specific diagrams in our plan. For each, we assess: what it does, how it's built, what we can learn, and what we'd need to change.

---

## 1. The Gold Standard: Bartosz Ciechanowski (ciechanow.ski)

**What it is:** Long-form engineering articles with 50–100+ inline interactive 3D/2D simulations per article. Topics include mechanical watches, gears, GPS, internal combustion engines, cameras, earth and sun.

**Why it matters for us:** This is the closest existing implementation to what we want to build. Every Ciechanowski article is structurally identical to a chapter of our project: prose explanation with embedded interactive widgets, progressive disclosure, scroll-driven narrative.

**Technical implementation:**
- Custom WebGL rendering (not Three.js — hand-written `watch.js`, `gears.js`, etc.)
- No React or framework — vanilla JS with custom rendering pipeline
- Each article is a single HTML page with inline `<canvas>` elements
- Animations are play/pause toggleable; global pause button affects all widgets
- Drag-to-rotate on 3D models; sliders for parameter adjustment
- Extremely polished visual design — dark background, consistent color palette

**What we can learn:**
- One developer can produce this quality (Ciechanowski works solo)
- WebGL is viable for complex mechanical simulations in-browser
- The prose-to-widget ratio matters: enough text to provide context, not so much that it buries the interactives
- Global animation controls (pause all) are essential for readability
- No framework needed if scope per page is manageable

**What we'd change:**
- We need multi-page navigation (Ciechanowski has independent articles)
- We need i18n (he doesn't)
- We need data-driven content (his content is hand-coded per article)
- We probably don't need full WebGL for most diagrams — Canvas2D and SVG suffice for 2D Factorio mechanics

**Relevance:** ALL parts. This is our format reference.

**URL:** https://ciechanow.ski/

---

## 2. Red Blob Games — A* Pathfinding Tutorial (redblobgames.com)

**What it is:** Interactive tutorial on graph search algorithms (BFS, Dijkstra, A*) using grid-based maps with draggable start/end points, animated frontier expansion, and cost visualization.

**Why it matters for us:** Directly relevant to Part II.3 (Train Pathfinding) and Part VII (Map Generation). Amit Patel's implementation style — inline interactive grids with parameter controls — is exactly what our belt simulator and pollution heatmap need.

**Technical implementation:**
- Custom JS + SVG/Canvas (no framework in older articles; Vue.js in some newer ones)
- Grid rendering as SVG or Canvas depending on complexity
- Drag-and-drop for placing walls, start, end points
- Algorithm visualization: step-by-step or continuous animation with speed control
- Side-by-side comparison of algorithms
- Reactive data flow: changing one input triggers recalculation and redraw

**What we can learn:**
- Grid-based simulations work beautifully with SVG for small grids and Canvas for large ones
- Algorithm visualization is most effective when user can step through tick-by-tick (parallels our "step through ticks" pattern)
- Side-by-side comparison is powerful for "before/after" diagrams (1.1 vs 2.0 fluid, furnace vs foundry)
- Amit Patel wrote extensively about his implementation approach (see simblob.blogspot.com) — invaluable technical reference
- Observer pattern for linking multiple widgets on the same page

**What we'd adapt:**
- Train pathfinding: replace square grid with rail graph; show penalty values on edges; animate train choosing lowest-cost path
- Pollution diffusion: replace pathfinding frontier with diffusion wavefront; each cell has pollution value instead of binary visited/unvisited
- Belt mechanics: replace grid with linear slot array; animate items advancing

**Relevance:** Parts II.3, V.1, VII.1

**URLs:**
- https://www.redblobgames.com/pathfinding/a-star/introduction.html
- https://www.redblobgames.com/grids/hexagons/
- https://simblob.blogspot.com/2018/02/how-i-implement-my-interactive-diagrams.html (implementation notes)

---

## 3. Setosa — "Markov Chains Explained Visually" (setosa.io/ev/markov-chains)

**What it is:** Interactive explorable explanation of Markov chains with editable transition matrix, animated state diagram, and probability flow visualization.

**Why it matters for us:** Directly relevant to Part VIII.6 (Quality System). The Factorio quality grind IS a Markov chain — Normal → Uncommon → Rare → Epic → Legendary, with transition probabilities determined by quality modules.

**Technical implementation:**
- D3.js for state diagram rendering
- Editable text fields for transition matrix
- Animated tokens moving between states
- Real-time steady-state distribution calculation
- Small, focused — one concept, one page

**What we can learn:**
- Editable transition matrices are intuitive for users who understand the math
- Animated probability flow (particles flowing along edges proportional to transition probability) makes abstract math tangible
- Steady-state calculation shown alongside diagram helps users understand long-run behavior

**What we'd adapt:**
- States become quality tiers (Normal through Legendary)
- Transition probabilities come from quality module configuration (user-selectable)
- Add "expected iterations to reach target quality" calculation
- Add resource cost per iteration (ingredients × expected iterations = total cost)
- Add recycler loop: failed quality → recycle → recraft, as additional transition edges

**Existing Factorio-specific Markov models:** Several community members have published quality grind calculators (spreadsheet-based), but none as an interactive visual Markov chain. This would be novel.

**Relevance:** Part VIII.6

**URL:** https://setosa.io/ev/markov-chains/

---

## 4. Nicky Case — "Loopy" and Explorable Explanations (ncase.me)

**What it is:** Interactive tools for thinking in systems. "Loopy" lets users draw causal loop diagrams and simulate them. Other explorables ("Parable of the Polygons," "Evolution of Trust") use game-like interactions to teach systems concepts.

**Why it matters for us:** Directly relevant to Part X (System of Systems). Our master feedback loop diagram — showing how pollution, combat, production, research, and power interconnect — is exactly the kind of causal loop that Loopy visualizes.

**Technical implementation:**
- "Loopy": custom JS canvas app; users draw nodes and edges; simulation runs flow along edges; positive/negative feedback labeled
- Other explorables: custom HTML/JS per project; game-like interactions; heavy on animation and user agency
- Open source (public domain)

**What we can learn:**
- Causal loop diagrams need to be PLAYABLE — not just static node-link graphs
- "What happens if I remove this connection?" is the key interaction
- Positive vs. negative feedback loops should be visually distinct (reinforcing vs. balancing)
- Simple simulation of flow through the system makes abstract feedback tangible

**What we'd adapt:**
- Pre-built Factorio system-of-systems diagram (not user-drawn)
- Each node links to its Part's chapter page
- Toggle: "remove pollution" → watch combat loop break; "remove power" → watch production loop collapse
- Animated particles flowing through edges showing causal chains

**Relevance:** Part X

**URLs:**
- https://ncase.me/loopy/
- https://ncase.me/trust/
- https://blog.ncase.me/explorable-explanations/ (design principles)

---

## 5. Factorio Community Tools (factoriolab, Kirk McDonald, Foreman2)

**What they are:** Production ratio calculators and flowchart generators for Factorio.

**Why they matter for us:** These tools solve Part III.4 (Recipe DAG) — they already parse recipe data and visualize production chains. We don't need to rebuild this from scratch.

**Implementations:**

### FactorioLab (factoriolab.github.io)
- Angular app; full recipe database for vanilla + SA + mods
- Sankey diagram output showing resource flow
- Box-line diagram alternative
- Module and beacon configuration
- Quality support (Space Age)
- Open source: github.com/factoriolab

### Kirk McDonald Calculator (kirkmcdonald.github.io)
- Vanilla JS; Sankey diagram using D3-sankey
- Older but well-established
- Simpler UI, focused on ratio calculation

### Foreman2 (github.com/DanielKote/Foreman2)
- Desktop app (Windows); node-based flowchart
- Drag-and-drop recipe graph construction
- Not web-based

**What we can learn:**
- Recipe data parsing is solved — FactorioLab already handles `data.raw` including Space Age
- Sankey diagrams for production flow are well-understood by the Factorio community
- Quality calculations are already implemented in FactorioLab

**What we'd do differently:**
- Our Recipe DAG is not a calculator — it's an EXPLANATION of the structure
- We show the full graph topology (what connects to what), not just ratios for a target item
- We add prose context: WHY is the green circuit node so connected? WHAT does this mean for factory design?
- We allow exploration: click any node to see its subgraph, dependencies, and dependents
- We potentially reuse FactorioLab's data layer or link to it for detailed calculations

**Relevance:** Part III.4, VIII.14

**URLs:**
- https://factoriolab.github.io
- https://kirkmcdonald.github.io
- https://github.com/DanielKote/Foreman2

---

## 6. CelLab — Cellular Automata in Browser (fourmilab.ch/cellab)

**What it is:** Browser-based cellular automaton simulator. Users can define rules, create initial patterns, and watch them evolve. Includes predefined rules for heat flow, diffusion, chemical reactions.

**Why it matters for us:** Directly relevant to Part V.1 (Pollution Diffusion). Factorio's pollution system IS a cellular automaton — each chunk has a pollution value, and each tick, pollution diffuses to neighboring chunks with absorption.

**Technical implementation:**
- JavaScript + HTML5 Canvas (formerly Java applet)
- Grid of cells with color-coded states
- User-definable rules via JavaScript
- Animation controls: run, step, speed
- Pre-built rules for diffusion, heat flow, reaction-diffusion

**What we can learn:**
- Diffusion on a grid is well-understood and efficient to simulate in-browser
- Color mapping (heatmap) is the natural visualization
- User should be able to place "sources" (factories) and "sinks" (trees) and watch pollution evolve
- Step-by-step mode is essential for understanding the diffusion rule

**What we'd adapt:**
- Fixed grid with Factorio-like chunk scale (not arbitrary CA rules)
- Pollution sources = factory entities with known pollution/minute values
- Absorption = tile-type-dependent (tree tiles absorb more than desert)
- Show numerical values per chunk, not just colors
- Overlay: when pollution reaches a spawner, show biter attack trigger

**Also relevant:** Biological Modeling diffusion tutorial (biologicalmodeling.org) — Python/Jupyter implementation of diffusion CA with laplacian convolution kernel. The math is identical to Factorio's pollution model.

**Relevance:** Part V.1

**URL:** https://www.fourmilab.ch/cellab/

---

## 7. Factsim — Factorio Circuit Network Simulator (github.com/Factsimguru/Factsim)

**What it is:** Python tool that imports Factorio blueprint strings, extracts circuit network connections, and simulates combinator logic tick-by-tick with a visual diagram.

**Why it matters for us:** Directly relevant to Part VI.2–6.3 (Combinators, Circuit Patterns). This is the only existing tool that simulates Factorio's circuit network outside the game.

**Technical implementation:**
- Python 3 with tkinter GUI
- Parses blueprint JSON to extract entities and wire connections
- Renders circuit diagram with entity icons and wire connections
- Tick-by-tick simulation: step forward/backward, inspect signal values per entity per tick
- Handles arithmetic, decider, constant combinators

**What we can learn:**
- Blueprint string parsing is straightforward (base64 → JSON → entity list)
- Tick-accurate simulation of combinator logic is feasible and not computationally expensive
- Step-by-step inspection (see all signals at tick N) is the key interaction
- The 1-tick delay per combinator is correctly modeled

**What we'd adapt:**
- Port to web (JavaScript/TypeScript) instead of Python/tkinter
- Visual design: use Factorio-style icons, wire colors, signal icons
- Add selector combinator (2.0) and display panel
- Add pre-built pattern library (SR latch, clock, train dispatcher)
- Make it embeddable as a widget within our chapter page
- Allow users to modify circuits (add/remove combinators, change settings) without importing blueprints

**Relevance:** Part VI.2, VI.3

**URL:** https://github.com/Factsimguru/Factsim

---

## 8. Game Mechanic Explorer (gamemechanicexplorer.com)

**What it is:** Collection of interactive JavaScript demos for game mechanics (movement, collision, pathfinding, particles, etc.), each with progressive complexity from basic to advanced.

**Why it matters for us:** The pedagogical structure — start simple, add complexity incrementally — is exactly what we need for each Part. E.g., belt mechanics: start with one lane, add items, add two lanes, add side-loading, add splitter...

**Technical implementation:**
- Phaser.js game framework
- Each mechanic has 3–5 progressive examples
- Interactive: keyboard/mouse input
- Source code visible per example
- No prose explanation — just code + interactive demo

**What we can learn:**
- Progressive complexity works: each example builds on the previous one
- Game frameworks (Phaser) can render belt-like animations efficiently
- But: the lack of prose explanation makes it hard to understand WHY something works the way it does — we must combine with text

**What we'd adapt:**
- Replace Phaser with Canvas2D (simpler, no game framework dependency)
- Add substantial prose between progressive examples
- Focus on Factorio-specific mechanics rather than generic game mechanics

**Relevance:** General approach, especially Parts II.1, II.2

**URL:** https://gamemechanicexplorer.com/

---

## 9. Machinations Framework (machinations.io)

**What it is:** Visual language and simulation tool for game economy design. Users draw resource flow diagrams (sources, pools, drains, gates, converters) and simulate them.

**Why it matters for us:** The Machinations framework is designed for exactly the kind of resource-flow analysis we're doing in Parts III and X. Factorio IS a resource economy, and Machinations can model it.

**Technical implementation:**
- Web-based editor (commercial product, free tier available)
- Node-based diagram: pools store resources, sources generate, drains consume, gates route
- Real-time simulation: resources flow through the diagram
- Visualization: pool sizes change, flow rates shown on edges

**What we can learn:**
- Resource flow diagrams are a powerful abstraction for factory games
- The pool/source/drain/converter vocabulary maps directly to Factorio entities (chest=pool, miner=source, consumer=drain, assembler=converter)
- Simulation of resource flow makes bottlenecks visible immediately

**What we'd adapt:**
- We don't need a general-purpose Machinations editor — we'd pre-build Factorio-specific diagrams
- Our diagrams are annotated with exact Factorio numbers (items/second, tick timings)
- We show the ACTUAL simulation mechanic (discrete items in slots), not the abstract Machinations model

**Relevance:** Parts III, X

**URL:** https://machinations.io/

---

## 10. Factorio Cheat Sheet (factoriocheatsheet.com)

**What it is:** Community-maintained reference of common Factorio data: belt throughput, ratio calculations, power ratios, oil processing, tips and tricks.

**Why it matters for us:** This is the closest existing "static reference" to our project. It demonstrates what data the community considers most important.

**Technical implementation:**
- Static HTML + CSS (Bootstrap)
- Hand-maintained data (not auto-generated from game files)
- Organized by topic: belts, inserters, power, oil, combat, etc.
- Includes some embedded images and diagrams (static)

**What we can learn:**
- The community's mental model of "what matters" is already visible here
- Belt throughput, inserter timing, power ratios, and oil processing are the most-consulted topics
- The cheat sheet format works for reference, but fails at explanation — it tells you WHAT the numbers are but not WHY

**What we'd do differently:**
- Our project explains the WHY behind every number
- Interactive simulations let users verify the numbers themselves
- Our data is auto-generated from game files, not hand-maintained
- We cover systems the cheat sheet doesn't: tick architecture, fluid model, circuit logic, evolution, Space Age

**Relevance:** All parts (as a baseline of community expectations)

**URL:** https://factoriocheatsheet.com/

---

## 11. FactorishJS — Factorio Clone in Browser (github.com/msakuta/FactorishJS)

**What it is:** A fully playable Factorio-like game implemented in pure HTML5 + JavaScript. Belts carry items, inserters move them, assemblers craft, boilers produce steam — all running in a browser canvas.

**Why it matters for us:** This is a WORKING implementation of Factorio's core mechanics (belts, inserters, assemblers, power) in JavaScript. The belt slot model, inserter swing, and crafting progress are all implemented and can be studied.

**Technical implementation:**
- Pure JavaScript, no frameworks — single HTML file + JS modules
- Canvas2D rendering at ~60fps
- Discrete item slots on belts (matching Factorio's model)
- Inserter pickup/drop cycle with rotation animation
- Assembler recipe execution with progress tracking
- Power grid (boiler → steam engine chain)
- Also exists as Rust/WASM port: `msakuta/FactorishWasm`

**What we can learn:**
- Belt slot mechanics CAN be simulated in JavaScript at 60fps in a browser
- The code is readable and demonstrates exactly how discrete item transport works
- Inserter timing is implemented with tick counting
- The WASM port shows performance ceiling when JS isn't enough

**What we'd extract:**
- Belt rendering approach (Canvas2D item slot grid)
- Inserter swing animation logic
- Item movement algorithm (advance per tick, collision/compression)
- NOT the full game — just the visualization/simulation layer

**Relevance:** Parts II.1, II.2, III.1

**URLs:**
- https://github.com/msakuta/FactorishJS
- https://github.com/msakuta/FactorishWasm
- Live demo: https://msakuta.github.io/FactorishJS/

---

## 12. Factorio-SAT — Optimal Belt Layouts with SAT Solvers (github.com/R-O-C-K-E-T/Factorio-SAT)

**What it is:** A Python tool that uses SAT (Boolean satisfiability) solvers to find provably optimal belt balancer layouts. Each tile is modeled as boolean variables (direction, underground state, splitter side); constraints ensure valid belts; the solver finds minimal layouts.

**Why it matters for us:** Demonstrates formal modeling of Factorio's belt mechanics as a constraint satisfaction problem. The tile encoding and constraint rules are essentially a mathematical specification of belt behavior.

**Technical implementation:**
- Python + SAT solver (Cadical/Glucose)
- Tiles encoded as boolean variables: direction (4), underground entrance/exit, splitter left/right, color
- Constraints encode: belt connectivity, splitter pairing, underground tunneling rules, flow conservation
- Outputs: blueprint strings, rendered images, animated GIFs of item flow
- Also includes a Graphviz renderer for splitter networks

**What we can learn:**
- The constraint encoding IS a formal specification of belt rules — exactly what our diagrams aim to explain informally
- The animated blueprint renderer already visualizes item flow on belts
- Splitter network graphs (generated via Graphviz) are similar to what we'd draw for Part II.1

**What we'd adapt:**
- Use the constraint descriptions as reference for our prose explanations ("a belt tile has direction D, accepts input from tiles facing D...")
- The animation renderer could be adapted for our belt simulator widget
- We wouldn't use SAT solving itself — but the formal model informs our diagram content

**Also related:** `alegnani/verifactory` — a verifier for Factorio blueprints using Z3 SMT solver. Parses blueprint strings, converts to logical formulas, proves belt-balancing properties. Another formal model of belt mechanics.

**Relevance:** Part II.1 (belt formal model), Part III.4 (constraint-based thinking)

**URLs:**
- https://github.com/R-O-C-K-E-T/Factorio-SAT
- https://github.com/alegnani/verifactory
- https://github.com/gianluca-venturini/factorio-tools

---

## 13. FactorioSimulation — Belt Balancer Analyzer (github.com/d4rkc0d3r/FactorioSimulation)

**What it is:** C# tools for analyzing Factorio belt systems, including a belt balancer throughput analyzer that simulates item flow to verify balancer correctness.

**Why it matters for us:** Contains an actual tick-level simulation of belt item flow — items moving through slots, being split, merged, and routed. The throughput analysis tests every combination of blocked/unblocked inputs/outputs.

**Technical implementation:**
- C# / .NET
- Imports blueprint strings
- Simulates belt flow tick by tick
- Tests throughput under various load scenarios
- Outputs pass/fail for balancing properties

**What we can learn:**
- Another reference implementation of belt slot mechanics
- The throughput testing methodology (test all 2^N combinations of blocked outputs) could inspire an interactive "what-if" widget

**Relevance:** Part II.1

**URL:** https://github.com/d4rkc0d3r/FactorioSimulation

---

## 14. piebro/factorio-blueprint-visualizer — SVG Blueprint Art

**What it is:** A web tool that imports Factorio blueprint strings and renders them as artistic SVG visualizations. Shows buildings, belts, pipes, rails, inserters, wire connections with customizable drawing styles.

**Why it matters for us:** Demonstrates blueprint parsing in JavaScript and SVG rendering of Factorio entities — exactly the skills needed for our diagram widgets.

**Technical implementation:**
- JavaScript (ported from Python/Pyodide)
- Blueprint string → JSON → SVG rendering
- Customizable drawing settings (colors, line widths, which layers to show)
- All output is vector (SVG) — infinitely zoomable
- Supports Factorio 2.0 blueprints

**What we can learn:**
- Blueprint JSON parsing is solved in JS
- SVG rendering of Factorio entities is achievable and looks good
- Drawing settings can be exposed as user controls — we'd do similar for our diagram widgets
- SVG output is directly exportable for our PDF posters

**Relevance:** All parts (rendering infrastructure), especially PDF poster production

**URL:** https://github.com/piebro/factorio-blueprint-visualizer

---

## 15. ingmar/factorio-trees — Recipe & Tech Tree GraphViz Generator

**What it is:** Lua scripts that parse Factorio's `data.raw` files and generate Graphviz DOT files for recipe dependency and technology dependency trees.

**Why it matters for us:** Directly produces the graphs we need for Part III.4 (Recipe DAG) and Part VIII.14 (Tech Tree). The Lua-to-DOT pipeline is a working example of our data extraction approach.

**Technical implementation:**
- Lua scripts reading Factorio data files directly
- Outputs `.dot` files for Graphviz rendering
- Generates both recipe dependencies and technology prerequisites
- Handles multi-output recipes and circular dependencies

**What we can learn:**
- Lua data parsing patterns (how to navigate `data.raw` structure)
- Graph construction from recipe data (which items depend on which)
- DOT/Graphviz as intermediate format — we could convert to D3-compatible JSON

**What we'd change:**
- Output to JSON instead of DOT (for D3/web consumption)
- Add Space Age recipes and technologies
- Add interactive features (click, hover, filter) that static Graphviz can't provide
- Run the pipeline in CI, not manually

**Relevance:** Parts III.4, VIII.14

**URL:** https://github.com/ingmar/factorio-trees

---

## 16. JanSharp/inserter-throughput-lib — Inserter Throughput Calculator

**What it is:** A Factorio mod library that calculates inserter throughput for various setups. Handles the complexity of pickup timing, drop positions, stack sizes, and belt interactions.

**Why it matters for us:** Contains the most precise community model of inserter timing — exactly the data needed for Part II.2.

**Technical implementation:**
- Lua library (Factorio mod API)
- Estimation-based approach (not simulation — too expensive for real-time in-game use)
- Models: pickup/drop arc angles, extension/rotation tick counts, stack size effects, belt chasing behavior
- Documents why certain configurations are faster/slower than others

**What we can learn:**
- The inserter timing model is MORE complex than simple tables suggest — belt chasing, swing angle, and stack size all interact
- Estimation beats simulation for real-time use; we'd use estimation for our calculator widget but simulation for our animation widget
- The documented edge cases (inserter getting stuck chasing items, belt stacking interactions) inform our prose explanation

**What we'd adapt:**
- Extract the timing formulas into our data files
- Use estimation model for the inserter throughput calculator
- Use a simplified simulation model for the inserter swing animation
- Document the difference between the two approaches in our prose

**Relevance:** Part II.2

**URL:** https://github.com/JanSharp/inserter-throughput-lib

---

## 17. Factorio Learning Environment (github.com/JackHopkins/factorio-learning-environment)

**What it is:** An academic project providing a Python API to interact with Factorio programmatically — for training AI agents to play Factorio. Includes a headless Factorio server wrapper.

**Why it matters for us:** Demonstrates that Factorio's simulation can be driven externally. The observation/action space definition implicitly documents what state variables exist and what actions are possible — a machine-readable specification of game mechanics.

**Technical implementation:**
- Python wrapper around Factorio's RCON interface
- Observation space: entity positions, inventory contents, research progress
- Action space: place/remove entities, configure machines, move player
- Used for reinforcement learning research

**What we can learn:**
- The observation space definition is a list of "what matters in Factorio state" — useful as a checklist for our diagrams
- The reward functions encode game objectives formally — relevant to Part X (feedback loops)
- Demonstrates external interaction with Factorio — could potentially be used to gather exact simulation data for our diagrams

**Relevance:** Parts I.3 (entity state), IX.3 (API surface), data verification

**URL:** https://github.com/JackHopkins/factorio-learning-environment

---

## 18. OS Game Clones Registry — Factorio Clones List

**What it is:** A curated list of open-source clones and reimplementations of commercial games, including Factorio.

**Known Factorio clones/inspired projects:**
- **FactorishJS** (covered above) — most complete JS clone
- **FactorishWasm** — Rust/WASM port
- **Mindustry** — open source (Java/libGDX), not a clone but heavily inspired; has belt/turret/production mechanics
- **Shapez** — open source (JS), simplified factory game; belt mechanics visible in source
- Various prototype/abandoned projects

**Why it matters for us:** Each clone is a re-implementation of some subset of Factorio's mechanics. Reading their source code reveals how other developers understood and modeled the same systems we're diagramming.

**Relevance:** All parts (cross-reference implementations)

**URL:** https://osgameclones.com/factorio/

---

## Summary: Coverage Matrix

| Our Plan Section | Existing Analogue | Gap (What's Missing) |
|-----------------|-------------------|----------------------|
| I.1 Game Loop | Ciechanowski (Mechanical Watch: escapement tick) | No Factorio-specific implementation exists |
| II.1 Belt Mechanics | **FactorishJS** (working JS belt sim), **Factorio-SAT** (formal belt model), **FactorioSimulation** (C# flow analyzer) | Implementations exist but not as educational explorable — need prose + interactive combo |
| II.2 Inserter Cycle | **inserter-throughput-lib** (Lua timing model) | Timing data exists; visualization doesn't |
| II.3 Train Pathfinding | Red Blob Games (A* tutorial) | No rail-graph-specific demo; no interrupt logic |
| III.4 Recipe DAG | **FactorioLab** (web calculator), **factorio-trees** (GraphViz generator) | Tools exist; none are explorable explanations |
| V.1 Pollution Diffusion | CelLab (browser CA), academic papers | No Factorio-specific parameters; no biter trigger |
| VI.2 Combinators | **Factsim** (Python tick-accurate simulator) | Exists in Python; needs web port and 2.0 components |
| VIII.6 Quality Grind | Setosa Markov Chains (generic visualizer) | Generic Markov exists; needs Factorio quality mapping |
| X System of Systems | Nicky Case Loopy (generic causal loop tool) | Generic tool exists; needs pre-built Factorio model |
| Visual style | **blueprint-visualizer** (SVG from blueprints) | Artistic rendering exists; not explanatory diagrams |
| Data pipeline | **wube/factorio-data** (official Lua prototypes), **`--dump-data`** (JSON export) | Data source is solved; parsing pipeline needs to be built |
| Format/style | Ciechanowski, Red Blob Games | Format proven; content is the work |

**Updated key finding:** The Factorio community has built an impressive ecosystem of tools — SAT solvers for optimal layouts, throughput estimators, blueprint visualizers, circuit simulators, recipe calculators, and even AI training environments. What's missing is the synthesis: nobody has taken these scattered implementations and composed them into a coherent educational narrative about how the simulation works as a whole. Every piece exists; the puzzle hasn't been assembled.
