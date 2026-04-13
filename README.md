# Factorio Reverse Diagrams

> Mapping and translating the rules of Factorio's simulation into interactive explorable explanations.

Inspired by [Chaim Gingold's SimCity Reverse Diagrams (2016)](assets/reference/SimCity_Reverse_Diagrams_Gingold_2016.pdf) and the explorable explanation tradition of [Bret Victor](https://worrydream.com/), [Bartosz Ciechanowski](https://ciechanow.ski/), [Red Blob Games](https://www.redblobgames.com/), and [Nicky Case](https://ncase.me/).

---

## What Is This?

A comprehensive reverse-engineering documentation of **Factorio's simulation** (base 2.0 + Space Age expansion), presented as:

- **Interactive web chapters** — prose explanations with embedded live simulations
- **Embeddable widgets** — standalone interactive diagrams for forums, Reddit, wikis
- **PDF posters** — hand-designed large-format archival prints
- **Open data** — JSON files extracted from game prototypes

Available in **English** and **Ukrainian**.

## Status: Phase 1 — Interactive Diagrams (v0.33)

Five flagship interactive diagrams implemented:

1. **Belt Mechanics** — Canvas animation with 3 belt tiers, side-loading, splitter logic
2. **Recipe DAG** — D3 + dagre dependency graph with search, pan/zoom, dependency tracing
3. **Pollution Diffusion** — Canvas heatmap with cellular automaton, entity placement, tile absorption
4. **Quality Grind** — Markov chain visualizer with module config and expected iterations calculator
5. **System of Systems** — Causal loop diagram with 5 toggleable feedback loops

## Author

**Vladyslav V. Prodan**
- GitHub: [github.com/click0](https://github.com/click0)
- Phone: +38(099)6053340

## Embedding in Your Website

Any diagram can be embedded into an external website via iframe. Embed pages render **only the widget** — no sidebar, no header, no navigation.

### URL Format

```
https://click0.github.io/factorio-reverse-diagrams/#/embed/{widget-id}
```

### Example: Embed Belt Mechanics

```html
<iframe
  src="https://click0.github.io/factorio-reverse-diagrams/#/embed/belt-simulator"
  width="800"
  height="500"
  frameborder="0"
  style="border: 1px solid #2a2a4e; border-radius: 8px;"
></iframe>
```

### Available Widget IDs

| Category | Widget ID | Description |
|----------|-----------|-------------|
| Transport | `belt-simulator` | Belt slot animation with side-loading, splitter |
| Transport | `inserter-cycle` | Inserter swing arc with tick timing |
| Transport | `fluid-system` | Pipe pressure/flow simulator |
| Transport | `train-pathfinding` | Rail block and signal visualization |
| Transport | `train-interrupts` | Train 2.0 interrupt simulator |
| Production | `recipe-dag` | Full recipe dependency graph |
| Production | `beacon-layout` | Beacon/module placement calculator |
| Production | `new-machines` | Machine comparison (incl. Space Age) |
| Production | `mining-productivity` | Infinite research scaling curve |
| Energy | `power-calculator` | Solar/nuclear ratio calculator |
| Energy | `solar-curve` | Day/night solar output simulation |
| Energy | `electric-network` | Power pole topology |
| Energy | `power-failure` | Brownout cascade simulator |
| Combat | `pollution-heatmap` | Pollution diffusion heatmap |
| Combat | `evolution-curve` | Evolution factor visualization |
| Combat | `defense-calculator` | Turret DPS and range calculator |
| Combat | `biter-ai` | Biter attack wave simulator |
| Circuit | `combinator-sandbox` | Interactive circuit network simulator |
| Circuit | `circuit-2` | Circuit 2.0 (selector, display panel) |
| Space Age | `quality-markov` | Quality grind Markov chain |
| Space Age | `spoilage-timeline` | Spoilage survival calculator |
| Space Age | `space-platform` | Interplanetary route calculator |
| Space Age | `multi-surface` | Surface hierarchy viewer |
| Space Age | `planet-chains` | Per-planet resource chains |
| Map Gen | `noise-visualizer` | Perlin noise terrain generator |
| Core | `game-tick` | Game loop phases timeline |
| Core | `chunk-system` | Chunk grid with radar scan |
| Core | `entity-lifecycle` | Entity state machine |
| Meta | `system-overview` | System of systems causal loops |
| Meta | `blueprint-analyzer` | Blueprint JSON analyzer |
| Meta | `ups-optimizer` | UPS budget calculator |
| Meta | `tech-tree` | Technology tree explorer |
| Meta | `robot-logistics` | Roboport coverage visualizer |

### Notes

- Widgets inherit the dark Factorio theme automatically
- Language can be set via URL: append `?lng=uk` for Ukrainian
- All interactive controls (play/pause, sliders) work inside iframe
- No X-Frame-Options or CSP headers blocking — embedding is unrestricted
- Each widget is lazy-loaded (2–10 KB gzip per widget)

## Repository Structure

```
factorio-reverse-diagrams/
│
├── README.md                          ← You are here
├── LICENSE-CODE.md                    ← BSD 3-Clause (code)
├── LICENSE-CONTENT.md                 ← CC BY-NC-SA 4.0 (text, diagrams, PDFs)
├── NOTICE.md                          ← Third-party attributions & disclaimers
│
├── docs/                              ← Content plan (the "what")
│   ├── en/
│   │   └── content-plan.md            ← Full 10-part diagram content specification
│   └── uk/
│       └── (content-plan.md)          ← Ukrainian translation (pending)
│
├── planning/                          ← Project planning (the "how")
│   ├── en/
│   │   ├── project-plan.md            ← Phases, timeline, technology, risks
│   │   ├── output-format.md           ← Format deep-dive: web, PDF, widgets, i18n
│   │   ├── prior-art.md               ← 18 existing analogues analysed
│   │   └── legal-plan.md              ← IP, copyright, licensing, AI images
│   └── uk/
│       ├── project-plan.md
│       ├── output-format.md
│       ├── prior-art.md
│       └── legal-plan.md
│
├── data/                              ← Game data (auto-generated from factorio-data)
│   └── (empty — populated by build pipeline)
│
├── src/                               ← Interactive widget source code
│   └── (empty — implementation phase)
│
└── assets/
    └── reference/
        └── SimCity_Reverse_Diagrams_Gingold_2016.pdf
```

## Content Plan Overview

| Part | Title | Sections | Diagrams |
|------|-------|----------|----------|
| I | Simulation Core | 1.1–1.4 | 4 |
| II | Transport & Logistics | 2.1–2.5 | 5–7 |
| III | Production | 3.1–3.5 | 5–6 |
| IV | Energy | 4.1–4.3 | 4–5 |
| V | Pollution, Evolution & Combat | 5.1–5.4 | 4–5 |
| VI | Circuit Network | 6.1–6.3 | 3–4 |
| VII | Map Generation | 7.1–7.3 | 3 |
| VIII | 2.0 & Space Age | 8.1–8.16 | 12–16 |
| IX | Meta-Systems | 9.1–9.3 | 3 |
| X | System of Systems | — | 1–2 |
| | **Total** | **~50** | **~44–57** |

## Phase 1 — Hero Diagrams (planned)

Five flagship interactive diagrams to demonstrate the concept:

1. **Belt Mechanics** — animated discrete item slot simulator
2. **Recipe DAG** — interactive full production dependency graph
3. **Pollution Diffusion** — cellular automaton heatmap simulation
4. **Quality Grind** — Markov chain visualizer for SA quality system
5. **System of Systems** — master feedback loop diagram with navigation

## Legal

This project is **not affiliated with, endorsed by, or connected to Wube Software Ltd.**
Factorio® is a registered trademark of Wube Software Ltd.

Game data sourced from [wube/factorio-data](https://github.com/wube/factorio-data).
Game mechanics documented with reference to the [Factorio Wiki](https://wiki.factorio.com) (CC BY-NC-SA 3.0) and [Friday Facts](https://factorio.com/blog).

See [LICENSE-CODE.md](LICENSE-CODE.md), [LICENSE-CONTENT.md](LICENSE-CONTENT.md), and [NOTICE.md](NOTICE.md) for details.

## Contributing

Not yet open for contributions (planning phase). Once Phase 1 begins, contribution guidelines will be published.

## Links

- [Factorio](https://factorio.com/) — the game
- [wube/factorio-data](https://github.com/wube/factorio-data) — official prototype data
- [Gingold's SimCity Reverse Diagrams](https://chaimgingold.com/) — original inspiration
- [Bartosz Ciechanowski](https://ciechanow.ski/) — format reference
- [Red Blob Games](https://www.redblobgames.com/) — interactive tutorial reference
