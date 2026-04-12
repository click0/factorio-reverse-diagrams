# Factorio Reverse Diagrams — Project Plan

---

## 1. Project Overview

### 1.1 What We Are Building

A comprehensive reverse-engineering documentation of Factorio's simulation, inspired by Chaim Gingold's SimCity Reverse Diagrams (2016). The project translates the internal rules of Factorio (base 2.0 + Space Age expansion) into visual diagrams that make the simulation legible, shareable, and discussable.

### 1.2 Scope

- 10 Parts, approximately 40–50 individual diagrams
- Covering: simulation core, transport, production, energy, combat, circuits, map generation, Space Age/2.0 changes, meta-systems, and emergent feedback loops
- Content plan document: complete (see `Factorio_Reverse_Diagrams_Plan.md`)

### 1.3 Deliverables

| # | Deliverable | Format | Audience |
|---|-------------|--------|----------|
| 1 | Content plan (English) | Markdown | Contributors, reviewers |
| 2 | Content plan (Ukrainian) | Markdown | Contributors, reviewers |
| 3 | Interactive diagram set | HTML/React web app | Players, designers, researchers |
| 4 | Static reference document | PDF (printable) | Archival, offline, academic citation |
| 5 | Source data files | JSON/YAML | Developers, modders, tool builders |

---

## 2. English Content Plan — Status & Structure

### 2.1 Current State

The English content plan (`Factorio_Reverse_Diagrams_Plan.md`) is complete at ~1,570 lines covering all 10 Parts. Each Part includes: diagram content description, key data points, formulas, source references to FFF posts and wiki.

### 2.2 Structure Summary

| Part | Title | Sections | Est. Diagrams |
|------|-------|----------|---------------|
| I | Simulation Core | 1.1–1.4 | 4 |
| II | Transport & Logistics | 2.1–2.5 | 5–7 |
| III | Production | 3.1–3.5 | 5–6 |
| IV | Energy | 4.1–4.3 | 4–5 |
| V | Pollution, Evolution & Combat | 5.1–5.4 | 4–5 |
| VI | Circuit Network | 6.1–6.3 | 3–4 |
| VII | Map Generation | 7.1–7.3 | 3 |
| VIII | 2.0 & Space Age | 8.1–8.16 | 12–16 |
| IX | Meta-Systems | 9.1–9.3 | 3 |
| X | System of Systems | (single) | 1–2 |
| | **Total** | **~50 sections** | **~44–57** |

### 2.3 Remaining Work on English Plan

- Verify numerical data against current wiki (post-2.0.67 patches may have changed values)
- Cross-reference all FFF citations — ensure linked posts match described content
- Add missing data: exact quality probability tables, spoilage timer durations, asteroid composition per route
- Peer review by Factorio community members for accuracy
- Add a "confidence level" annotation per section: HIGH (verified from source code/wiki), MEDIUM (inferred from FFF + gameplay), LOW (estimated/approximated)

---

## 3. Ukrainian Content Plan

### 3.1 Approach

The Ukrainian version is not a mechanical translation — it is a localized adaptation. Key principles:

**Terminology strategy:**
- Game-specific terms that have no established Ukrainian equivalent retain the English term with Ukrainian transcription on first use: e.g., "інсертер (inserter)", "сплітер (splitter)"
- Where the Ukrainian Factorio community has established terms (from the Ukrainian localization of the game), those are preferred
- Technical terms (tick, chunk, UPS, FPS, DAG) remain in English as they are universal
- Section headings are translated; diagram labels are bilingual (Ukrainian primary, English in parentheses)

**Content parity:**
- All 10 Parts are translated in full
- Formulas, tables, and data remain identical
- Source references remain in English (FFF posts, wiki links are English-only)
- Appendices (comparison table, source index) are translated except for proper nouns and URLs

### 3.2 Production Workflow

| Step | Task | Input | Output |
|------|------|-------|--------|
| 1 | Terminology glossary | English plan + UA game localization | UA glossary (~200 terms) |
| 2 | Section-by-section translation | English plan + glossary | Raw UA text |
| 3 | Technical review | Raw UA text | Corrected UA text |
| 4 | Community review | Corrected UA text | Final UA plan |
| 5 | Formatting | Final UA plan | `Factorio_Reverse_Diagrams_Plan_UA.md` |

### 3.3 Estimated Effort

- Glossary: 2–4 hours
- Translation: 15–25 hours (1,570 lines of dense technical content)
- Review: 5–8 hours
- Total: ~25–40 hours

---

## 4. Feasibility Analysis: Interactive HTML/React Diagrams

### 4.1 Assessment Framework

For each of the 10 Parts, we evaluate:

- **Data availability**: can we obtain the exact numerical values needed?
- **Interactivity value**: does making it interactive add understanding, or is static sufficient?
- **Complexity**: how hard is the diagram to implement as an interactive component?
- **Dependencies**: does this diagram need data from other diagrams?

### 4.2 Per-Part Feasibility

#### Part I — Simulation Core (4 diagrams)

**1.1 Game Loop & Tick** — HIGHLY FEASIBLE
- Data: well-documented in FFF-70, FFF-150; tick phases are known
- Interactivity: animated timeline showing one tick executing; slider for game.speed; UPS/FPS decoupling visualization
- Complexity: LOW — linear timeline with annotations
- Implementation: SVG animation or React timeline component

**1.2 Chunk System** — FEASIBLE
- Data: chunk size (32×32) is fixed; generation pipeline described in wiki
- Interactivity: zoom into world grid, click chunk to see state (active/inactive/uncharted); visualize radar scan pattern
- Complexity: MEDIUM — requires tile grid rendering
- Implementation: Canvas-based grid with zoom

**1.3 Entity Lifecycle** — FEASIBLE
- Data: state transitions known from API docs
- Interactivity: click entity type → see state diagram animate through lifecycle
- Complexity: MEDIUM — state machine visualization
- Implementation: D3.js force-directed graph or custom SVG state diagram

**1.4 Determinism & Multiplayer** — STATIC PREFERRED
- Data: conceptual, not numerical
- Interactivity: limited value — this is explanatory, not computational
- Complexity: LOW as static
- Implementation: annotated diagram with hover tooltips explaining concepts

#### Part II — Transport & Logistics (5–7 diagrams)

**2.1 Belt Mechanics** — HIGHEST VALUE INTERACTIVE
- Data: slot counts, speeds, item positions all precisely known
- Interactivity: EXTREME value — animate belt slots moving, side-loading behavior, splitter priority, compression visualization; adjustable belt speed tier
- Complexity: HIGH — requires physics-like item slot simulation
- Implementation: Canvas animation with per-frame item position updates; this is essentially a mini belt simulator
- Note: this is the "hero diagram" — the one most likely to go viral in the community

**2.2 Inserter Cycle** — HIGHLY FEASIBLE
- Data: tick timings well-documented by community measurements
- Interactivity: HIGH value — animate inserter swing cycle; show tick-by-tick progress; toggle inserter types; adjust stack size
- Complexity: MEDIUM — sprite animation with timing overlay
- Implementation: SVG animation with tick counter

**2.3 Train System** — FEASIBLE WITH CAVEATS
- Data: pathfinding penalties are partially known; signal logic is documented
- Interactivity: HIGH value — interactive signal/block demo; place signals on mini rail network, see block coloring; interrupt evaluation visualizer
- Complexity: HIGH — requires rail graph + pathfinding visualization
- Implementation: Custom canvas renderer; could reuse concepts from community train planners
- Caveat: exact pathfinding penalty values are not fully public

**2.4 Robot Logistics** — FEASIBLE
- Data: speeds, ranges documented; job assignment heuristic partially known
- Interactivity: MEDIUM value — visualize roboport coverage zones, charging queue
- Complexity: MEDIUM
- Implementation: SVG overlay on grid

**2.5 Fluid System** — FEASIBLE, HIGH VALUE
- Data: 2.0 fluid model is simpler than 1.1, but exact equations are not fully public
- Interactivity: HIGH value — pipe network builder; show pressure/flow in real time; demonstrate why long pipes lose throughput
- Complexity: HIGH — requires fluid simulation
- Implementation: Canvas + iterative flow solver
- Caveat: exact 2.0 flow equations may need reverse-engineering from gameplay testing

#### Part III — Production (5–6 diagrams)

**3.1 Recipe Execution** — HIGHLY FEASIBLE
- Data: all formulas documented in wiki
- Interactivity: HIGH — set machine type, modules, beacon count → see crafting speed, ticks per craft, power consumption, pollution; real-time calculation
- Complexity: LOW-MEDIUM — essentially a calculator UI
- Implementation: React form + computed outputs

**3.2 Module & Beacon System** — HIGHLY FEASIBLE
- Data: all module effects documented; beacon distribution factor known
- Interactivity: HIGH — spatial beacon layout editor; drag beacons and machines; see effect overlap and total bonuses
- Complexity: MEDIUM — 2D spatial layout with range circles
- Implementation: Canvas interactive layout tool

**3.3 Mining & Smelting** — FEASIBLE
- Data: mining speed, depletion, oil yield formulas all documented
- Interactivity: MEDIUM — oil yield decay curve visualization; mining productivity research scaling
- Complexity: LOW
- Implementation: Recharts/D3 line charts with adjustable parameters

**3.4 Full Recipe DAG** — FEASIBLE, HIGHEST COMPLEXITY
- Data: all recipes available in data.raw (public Lua files on GitHub: wube/factorio-data)
- Interactivity: EXTREME — the "killer feature"; click any item → see full dependency tree; adjust module configuration → see ratio changes propagate; Sankey flow diagram with adjustable throughput target
- Complexity: VERY HIGH — hundreds of nodes, layout algorithm needed
- Implementation: D3.js Sankey or Dagre layout; alternatively, integrate with factoriolab data
- Note: could potentially leverage factoriolab.github.io or kirkmcdonald.github.io as data sources rather than rebuilding from scratch

**3.5 Science & Research** — FEASIBLE
- Data: technology tree in data.raw
- Interactivity: MEDIUM — tech tree explorer with cost calculations
- Complexity: MEDIUM
- Implementation: Tree/DAG layout component

#### Part IV — Energy (4–5 diagrams)

**4.1 Electric Network Topology** — FEASIBLE
- Interactivity: MEDIUM — pole placement demo showing network formation; supply area visualization
- Complexity: MEDIUM
- Implementation: Canvas grid with connection graph

**4.2 Power Generation** — HIGHLY FEASIBLE
- Data: all ratios precisely documented
- Interactivity: HIGH — ratio calculator for each power type; solar/accumulator sizing; nuclear neighbor bonus layout; interactive day/night solar curve
- Complexity: MEDIUM — multiple calculator UIs + one animation (solar curve)
- Implementation: React calculator components + Recharts

**4.3 Power Failure Dynamics** — FEASIBLE
- Interactivity: HIGH — simulate brownout cascade: slider for satisfaction ratio → show effect on each system
- Complexity: MEDIUM
- Implementation: cascade visualization with animated thresholds

#### Part V — Pollution, Evolution & Combat (4–5 diagrams)

**5.1 Pollution Diffusion** — HIGHLY FEASIBLE, HIGH VALUE
- Data: pollution per entity documented; diffusion rate known
- Interactivity: EXTREME — heatmap simulation of pollution spreading from factory; adjustable entity placement; tree absorption visualization; real-time diffusion
- Complexity: HIGH — 2D cellular automaton simulation
- Implementation: Canvas with per-frame diffusion calculation; WebGL for performance at scale

**5.2 Evolution** — HIGHLY FEASIBLE
- Data: evolution formula fully documented
- Interactivity: HIGH — evolution curve visualization; sliders for time, pollution, destruction rates; see unit composition change as evolution increases
- Complexity: LOW-MEDIUM — chart with adjustable parameters + stacked area chart
- Implementation: Recharts/D3

**5.3 Biter AI** — FEASIBLE WITH CAVEATS
- Data: attack behavior partially documented; exact spawner absorption rates less certain
- Interactivity: MEDIUM — animated attack wave formation and pathfinding demo
- Complexity: HIGH
- Caveat: internal AI heuristics are not fully public

**5.4 Defence Systems** — FEASIBLE
- Data: damage formulas, turret stats documented
- Interactivity: MEDIUM — damage calculator; range circle overlay
- Complexity: LOW
- Implementation: Calculator + SVG range visualization

#### Part VI — Circuit Network (3–4 diagrams)

**6.1 Wire & Signal Model** — FEASIBLE
- Interactivity: MEDIUM — mini circuit simulator; connect entities, see signals propagate
- Complexity: MEDIUM
- Implementation: interactive node-wire editor

**6.2 Combinators** — HIGHLY FEASIBLE, HIGH VALUE
- Data: all combinator behaviors precisely defined
- Interactivity: EXTREME — interactive combinator sandbox; wire combinators together, set inputs, step through ticks, see outputs; 1-tick delay visualization
- Complexity: HIGH — essentially a circuit simulator
- Implementation: custom node graph editor + tick-based evaluator
- Note: Factsim (github.com/Factsimguru/Factsim) already does this in Python — could be ported to web

**6.3 Common Patterns** — FEASIBLE
- Interactivity: HIGH — pre-built circuit patterns that user can step through; modify inputs, see behavior change
- Complexity: MEDIUM (reuses 6.2 engine)
- Implementation: templates loaded into 6.2 simulator

#### Part VII — Map Generation (3 diagrams)

**7.1 Noise Functions** — FEASIBLE, HIGH VALUE
- Data: noise expression system documented; specific functions known
- Interactivity: EXTREME — live noise function visualizer; adjust parameters (frequency, amplitude, octaves) → see terrain change in real time; layer combination
- Complexity: MEDIUM-HIGH — noise generation in WebGL/Canvas
- Implementation: WebGL shader-based noise rendering; could use simplex-noise.js library

**7.2 Resource Placement** — FEASIBLE
- Interactivity: MEDIUM — threshold visualization on noise output → ore patch shapes
- Complexity: MEDIUM (extends 7.1)
- Implementation: layered canvas renders

**7.3 Cliffs & Water** — FEASIBLE
- Interactivity: LOW — mostly static diagram with elevation contour demonstration
- Complexity: LOW
- Implementation: contour plot from 7.1 noise output

#### Part VIII — 2.0 & Space Age (12–16 diagrams)

**8.1 Engine Changes** — STATIC PREFERRED
- Conceptual comparison; limited interactivity value
- Implementation: side-by-side before/after diagrams

**8.2 Train 2.0** — FEASIBLE
- Interactivity: HIGH — interrupt evaluation simulator; define interrupts + conditions → step through train decision tree
- Complexity: MEDIUM
- Implementation: decision tree visualizer

**8.3 Circuit 2.0** — extends Part VI implementation
- New components added to existing simulator

**8.4 Multi-Surface Architecture** — FEASIBLE
- Interactivity: MEDIUM — surface hierarchy tree; click surface → see subsystems
- Complexity: LOW
- Implementation: interactive tree/accordion

**8.5 Space Platforms** — FEASIBLE
- Interactivity: MEDIUM — thruster/width ratio calculator; asteroid encounter timeline
- Complexity: MEDIUM
- Implementation: calculator + timeline animation

**8.6 Quality System** — HIGHLY FEASIBLE, HIGH VALUE
- Data: quality probabilities documented; Markov chain is mathematically tractable
- Interactivity: EXTREME — quality grind calculator: set modules, quality target → see expected iterations, resource cost, time; Markov chain state diagram with animated probability flow; recycler loop visualization
- Complexity: MEDIUM — Markov chain math + animated state diagram
- Implementation: React calculator + D3 state diagram

**8.7 New Machines** — FEASIBLE
- Data: crafting speeds, module slots, base productivity all known
- Interactivity: MEDIUM — comparison calculator: foundry vs. furnace, EM plant vs. assembler
- Complexity: LOW
- Implementation: comparison table/calculator

**8.8 Spoilage System** — FEASIBLE, HIGH VALUE
- Interactivity: HIGH — spoilage timeline: set belt length, speed, processing time → see which items survive; just-in-time vs. buffered comparison
- Complexity: MEDIUM
- Implementation: timeline visualization with decay overlay

**8.9 Interplanetary Logistics** — FEASIBLE
- Interactivity: MEDIUM — rocket cargo calculator; transit time; throughput per rocket
- Complexity: LOW
- Implementation: calculator UI

**8.10–8.13 Planet Details** — FEASIBLE
- Per-planet interactive resource chain diagrams (mini Sankey per planet)
- Complexity: MEDIUM per planet
- Implementation: reuse Part III.4 Sankey component with planet-specific data

**8.14 Tech Tree** — FEASIBLE
- Data: complete tech tree in data.raw
- Interactivity: HIGH — interactive tech tree explorer with planet-gating annotations
- Complexity: MEDIUM
- Implementation: DAG layout with color-coded planet requirements

**8.15 Elevated Rails** — STATIC PREFERRED
- Simple concept; static diagram sufficient

**8.16 QoL & Minor** — STATIC PREFERRED
- Catalog of features; no computation to interact with

#### Part IX — Meta-Systems (3 diagrams)

**9.1 Save File** — STATIC PREFERRED
- Structural diagram; no interactivity value

**9.2 Performance Anatomy** — FEASIBLE
- Interactivity: MEDIUM — UPS budget calculator: input entity counts → estimate UPS cost per subsystem
- Complexity: MEDIUM — requires performance heuristics (from community benchmarks)
- Implementation: stacked bar chart showing UPS budget breakdown

**9.3 Mod API** — STATIC PREFERRED
- Architecture diagram; tooltips on hover for API surface descriptions
- Implementation: SVG with hover annotations

#### Part X — System of Systems (1–2 diagrams)

**MOST IMPORTANT DIAGRAM** — HIGHLY FEASIBLE, EXTREME VALUE
- Data: all connections defined in previous Parts
- Interactivity: EXTREME — the "master diagram" where every subsystem is a clickable node; hover → highlight connected subsystems; click → navigate to that Part's diagram; feedback loops animated with flowing particles; toggle "what-if" scenarios (e.g., disable pollution → see which loops break)
- Complexity: HIGH — large node-link diagram with rich interaction
- Implementation: D3 force-directed layout or custom positioned SVG; particle animations on edges

### 4.3 Summary Feasibility Matrix

| Category | Count | Interactive Value | Implementation Effort |
|----------|-------|-------------------|-----------------------|
| Highly interactive, high value | 12–15 | Core experience | 3–5 days each |
| Moderately interactive | 15–20 | Enhanced understanding | 1–3 days each |
| Static preferred | 8–10 | Low interactivity value | 0.5–1 day each |
| Very high complexity | 5–7 | Flagship features | 5–10 days each |

**Total estimated effort for full interactive implementation: 150–300 developer-days** (one experienced developer, including design, data gathering, implementation, and testing).

### 4.4 Recommended Phased Approach

**Phase 1 — Foundation & Heroes (8–12 weeks)**
- Build shared component library (grid, node-link, calculator, timeline, chart)
- Implement 5 "hero" diagrams that demonstrate the concept and attract community interest:
  1. Belt Mechanics (2.1) — the animated belt slot simulator
  2. Recipe DAG (3.4) — interactive production graph
  3. Pollution Diffusion (5.1) — heatmap simulation
  4. Quality Grind Calculator (8.6) — Markov chain visualizer
  5. System of Systems (X) — master overview with navigation

**Phase 2 — Core Systems (8–12 weeks)**
- Implement remaining Parts I–V diagrams
- Train interrupt simulator (8.2)
- Combinator sandbox (6.2)
- Solar/nuclear ratio calculators (4.2)
- Noise function visualizer (7.1)

**Phase 3 — Space Age & Polish (6–10 weeks)**
- Planet-specific diagrams (8.10–8.13)
- Spoilage timeline (8.8)
- Tech tree explorer (8.14)
- All static diagrams
- Cross-linking between diagrams
- Mobile responsiveness
- Performance optimization

**Phase 4 — Community & Maintenance**
- Open source release
- Community contributions (data corrections, translations, new diagrams)
- Update tracking for Factorio patches

---

## 5. Technology Analysis

### 5.1 Frontend Framework Options

| Technology | Pros | Cons | Verdict |
|-----------|------|------|---------|
| **React + D3** | Rich ecosystem; D3 handles complex visualizations; React manages state; huge community | Two rendering systems (React DOM + D3 SVG) can conflict; steep learning curve | **RECOMMENDED for complex diagrams** |
| **React + Canvas** | Best performance for particle effects, large grids, fluid simulation; 60fps animations | Loses DOM interactivity (hover, click); accessibility challenges; manual hit-testing | **RECOMMENDED for simulations** (belt, pollution, noise) |
| **React + Recharts** | Simple charts out of the box; good for calculators | Limited for custom visualizations | **RECOMMENDED for calculators** (ratio, evolution curves) |
| **Svelte + D3** | Smaller bundle; more direct DOM manipulation; faster renders | Smaller ecosystem; fewer developers available | VIABLE ALTERNATIVE |
| **Vue + D3** | Similar to React approach; slightly simpler reactivity | Smaller community for data-viz; fewer existing examples | VIABLE |
| **Plain HTML/JS + D3** | No framework overhead; maximum control; simpler deployment | State management becomes painful at scale; no component reuse | NOT RECOMMENDED at this scale |
| **Observable/Observable Framework** | Built for data visualization; notebook-style; easy iteration | Less conventional; hosting constraints; harder to package | INTERESTING for prototyping |
| **WebGL (Three.js / Pixi.js)** | Hardware-accelerated rendering; handles 100k+ entities | Overkill for most diagrams; accessibility issues; higher complexity | **RECOMMENDED only for** pollution heatmap and noise visualizer |

**Recommended stack:** React + hybrid rendering (D3 for node-link diagrams, Canvas for simulations, Recharts for simple charts, WebGL only where needed).

### 5.2 Data Layer Options

| Source | Format | Coverage | Update Frequency |
|--------|--------|----------|------------------|
| `wube/factorio-data` (GitHub) | Lua tables | Complete prototype definitions: every recipe, entity, technology | Updated with each Factorio release |
| Factorio Wiki | HTML (scraping) | Formulas, descriptions, community-verified values | Community-maintained; may lag behind patches |
| factoriolab.github.io | JSON (API) | Pre-computed recipe ratios, Sankey data | Community-maintained |
| FFF blog posts | Prose | Architecture insights, internal formulas, design rationale | Historical; not updated |
| In-game `/data-raw-dump` | JSON | Runtime prototype data including mod-applied values | Requires running Factorio instance |

**Recommended approach:**
- Primary data: parse `wube/factorio-data` Lua files → JSON (build step)
- Supplementary: hardcode FFF-sourced architectural knowledge (tick phases, pathfinding, fluid model)
- Verification: cross-reference with wiki for community-validated values
- Update pipeline: when Factorio updates, re-parse `factorio-data` → regenerate JSON → diagrams auto-update

### 5.3 Hosting & Deployment Options

| Option | Pros | Cons |
|--------|------|------|
| **GitHub Pages** | Free; version-controlled; community can fork and PR | Static only; no server-side rendering | **RECOMMENDED** |
| **Vercel / Netlify** | Free tier; automatic deploys from GitHub; serverless functions if needed | Vendor dependency |
| **Self-hosted** | Full control | Maintenance burden; cost |
| **Factorio Mod Portal** | Directly accessible by players | Not a web hosting platform; wrong medium |

### 5.4 Internationalization (i18n)

For English/Ukrainian bilingual support:

| Approach | Effort | Flexibility |
|----------|--------|-------------|
| **react-i18next** | MEDIUM — standard i18n library; JSON translation files | HIGH — easy to add languages; community can contribute translations |
| **Separate builds** | LOW initial — just duplicate and translate | LOW — every change requires updating both versions |
| **URL-based routing** | MEDIUM — `/en/`, `/ua/` prefixes | HIGH — SEO-friendly; shareable links per language |

**Recommended:** react-i18next with URL-based routing. Translation keys in JSON, community-contributable.

---

## 6. Static PDF: Backward Compatibility & Archival

### 6.1 Why PDF Matters

- **Archival**: Gingold's original SimCity diagrams are static images/PDFs — they remain readable decades later; web apps may break
- **Academic citation**: researchers need a fixed, versioned document to reference
- **Offline use**: conferences, classrooms, print-outs on walls
- **Accessibility**: some audiences prefer reading over interacting
- **Poster format**: the original inspiration is a poster; a large-format PDF preserves this

### 6.2 PDF Generation Strategy

| Approach | Pros | Cons |
|----------|------|------|
| **Manual design in Figma/Illustrator** | Highest visual quality; full design control; can match Gingold's aesthetic exactly | Enormous manual effort; hard to keep in sync with data; not auto-updatable |
| **Generate from React components** | Single source of truth; auto-updates with data changes; Puppeteer can screenshot components | Layout may not suit print; interactive elements lost; pagination challenges |
| **LaTeX/TikZ** | Excellent for technical diagrams; version-controlled; reproducible builds | Steep learning curve for complex visual design; limited interactivity preview |
| **D3 → SVG export → PDF** | Diagrams are already SVG; SVG → PDF is straightforward | Layout and pagination require manual composition |
| **Hybrid: interactive web + hand-designed PDF posters** | Best of both worlds; PDF is the "art piece," web is the "tool" | Double the work for each diagram |

**Recommended:** Hybrid approach.
- The interactive web app is the primary deliverable — it's where the data lives, where calculations happen, and where the community engages
- The PDF is a curated, hand-composed subset: 4–6 large-format posters (A1 or larger), each covering 1–2 Parts, designed for visual impact and printability
- PDF posters reference the web app with QR codes and URLs
- PDF is versioned (v1.0, v1.1...) and updated with major Factorio releases, not with every patch

### 6.3 PDF Poster Plan

| Poster | Parts Covered | Focus |
|--------|--------------|-------|
| 1 — The Tick | I, IX.2 | Game loop, tick architecture, UPS anatomy |
| 2 — The Factory Floor | II, III | Belts, inserters, machines, recipe DAG |
| 3 — Power & Pollution | IV, V | Energy systems, pollution diffusion, evolution, combat loops |
| 4 — The Mind | VI, VII | Circuit network, combinators, map generation |
| 5 — The Expansion | VIII (selected) | Quality, spoilage, multi-surface, key SA mechanics |
| 6 — The Machine | X | System of systems — the master feedback loop diagram |

---

## 7. Other Technologies Worth Considering

### 7.1 Bret Victor-Style Explorable Explanations

Gingold's paper explicitly references Bret Victor's "Media for Thinking the Unthinkable" and "Nile Visualization" as the future direction. The explorable explanation format (as seen on Nicky Case's work, Bartosz Ciechanowski's articles, or Amit Patel's Red Blob Games) is perhaps the most natural fit.

**Format:** long-form scrollable article with inline interactive widgets. Each concept is explained in prose with an embedded simulation/calculator immediately below or beside it.

**Pros:** narrative structure guides understanding; progressive disclosure; works on mobile; inherently accessible.

**Cons:** monolithic; harder to link to individual diagrams; longer initial load.

**Tools:** Idyll, Observable, Svelte + custom components, or vanilla React.

**Verdict:** STRONGLY CONSIDER as the primary format, with individual diagram pages as secondary navigation.

### 7.2 Jupyter / Observable Notebooks

**Format:** computational notebooks where each cell contains either prose, code, or a visualization. The user can modify parameters and re-run cells.

**Pros:** fully transparent — the computation is visible alongside the result; easy for researchers to verify and extend; existing data science tooling.

**Cons:** requires understanding of notebook paradigm; less polished than custom web app; harder to make beautiful.

**Verdict:** EXCELLENT for the data layer and prototyping. Consider publishing an Observable notebook collection alongside the web app, aimed at developers and researchers who want to dig deeper.

### 7.3 Game Engine (Godot / Phaser)

**Format:** build the diagram set as an actual interactive application using a 2D game engine.

**Pros:** pixel-perfect rendering; animation system built-in; can closely match Factorio's own visual style; handles complex simulations efficiently.

**Cons:** not web-native (Godot has web export but with caveats); harder to deploy and update; overkill for static diagrams; accessibility challenges.

**Verdict:** NOT RECOMMENDED for the main deliverable. Possible for a single "hero" demo (e.g., the belt simulator).

### 7.4 Figma / FigJam Interactive Prototype

**Format:** high-fidelity design prototype with limited interactivity (clickable hotspots, overlays).

**Pros:** visual design workflow; easy to iterate on layout and aesthetics; collaborative; can produce both interactive prototype and print-ready PDF.

**Cons:** not truly computational — no real simulation, just canned states; limited scalability; requires Figma account.

**Verdict:** USEFUL for design exploration and poster layout. Not a final delivery format.

### 7.5 Mermaid / Markmap / Graph-as-Code

**Format:** text-based diagram description languages that render as SVG.

**Pros:** version-controlled; easy to maintain; can be embedded in markdown; Mermaid is supported in GitHub/GitLab/Notion.

**Cons:** limited interactivity; rigid layout; can't handle complex simulations; visual quality is mediocre for publication.

**Verdict:** USEFUL for the content plan and documentation. Not suitable for the final diagrams, but valuable as intermediate representations and for the static markdown version.

---

## 8. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Factorio data changes with patches | Diagrams become inaccurate | HIGH (patches are frequent) | Automated data pipeline from `factorio-data`; version-tag diagrams |
| Exact internal formulas unknown | Some diagrams are approximate | MEDIUM | Mark confidence levels; community can verify via gameplay testing |
| Scope creep (too many diagrams) | Project never ships | HIGH | Phased approach; Phase 1 delivers value independently |
| Single contributor burnout | Project stalls | HIGH for solo work | Open source early; attract contributors with Phase 1 demos |
| Web technologies become obsolete | Interactive version breaks | MEDIUM (over 5+ years) | PDF provides archival backup; use standard, well-supported libraries |
| Copyright/IP concerns | Wube Software objects to deep reverse-engineering | LOW (Factorio has very mod-friendly culture) | Use only publicly available data; credit all sources; this is educational/analytical, not competitive |

---

## 9. Project Timeline (Estimated)

| Phase | Duration | Milestone |
|-------|----------|-----------|
| **Planning** (current) | Complete | Content plan finalized |
| **Data gathering** | 2–4 weeks | JSON data files extracted from factorio-data; FFF formulas catalogued |
| **Phase 1: Heroes** | 8–12 weeks | 5 hero diagrams live on GitHub Pages |
| **Community feedback** | 2–4 weeks | Gather feedback from r/factorio, Factorio forums |
| **Phase 2: Core** | 8–12 weeks | Parts I–VII complete |
| **Phase 3: Space Age** | 6–10 weeks | Part VIII complete; all diagrams live |
| **Ukrainian localization** | 3–5 weeks (parallel) | UA version available |
| **PDF posters** | 4–6 weeks | 6 poster PDFs published |
| **Total** | **~10–14 months** | Full project delivered |

---

## 10. Open Questions

1. **Community collaboration model**: should this be a solo passion project with open source, or actively seek collaborators from the start?

2. **Wube Software relationship**: should we reach out to Wube for endorsement, additional data, or even official hosting? Their developer blog culture suggests they would be receptive.

3. **Factorio version targeting**: target stable 2.0 only, or also track experimental branches?

4. **Mod support**: should diagrams be extensible to show modded content (e.g., Space Exploration, Krastorio)? This would significantly increase scope but also audience.

5. **Monetization**: is this a free community resource, or could it support itself (e.g., through Patreon, merch of printed posters)?

6. **Academic angle**: should this be accompanied by a paper (like Gingold's), submitted to a game studies or visualization venue?

---

## Appendix: Key External Resources

| Resource | URL | Use |
|----------|-----|-----|
| Factorio Data (prototypes) | github.com/wube/factorio-data | Primary data source |
| Factorio Wiki | wiki.factorio.com | Formula verification |
| Friday Facts archive | factorio.com/blog | Architecture insights |
| Factorio Lua API | lua-api.factorio.com | Entity/event documentation |
| FactorioLab calculator | factoriolab.github.io | Recipe ratio data |
| Kirk McDonald calculator | kirkmcdonald.github.io | Alternative ratio data |
| Foreman2 | github.com/DanielKote/Foreman2 | Flowchart reference |
| Factorio Cheat Sheet | factoriocheatsheet.com | Community-verified data |
| Gingold's SimCity diagrams | (in original PDF) | Visual style reference |
| Bret Victor — Nile | worrydream.com | Interactive diagram inspiration |
| Nicky Case — Explorable Explanations | ncase.me | Format inspiration |
| Red Blob Games | redblobgames.com | Interactive tutorial reference |
| Bartosz Ciechanowski | ciechanow.ski | Engineering visualization reference |
