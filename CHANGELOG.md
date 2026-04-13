# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.42.0] - 2026-04-13

### Added
- **Code splitting** — all 25 widgets now lazy-loaded with `React.lazy()`, main bundle reduced from 564KB to 337KB, each widget is a separate chunk (2-10KB gzip)
- **Embed mode** — new route `/#/embed/:widgetId` renders widget without sidebar/header, suitable for iframe embedding
- **Error boundaries** — widgets wrapped in ErrorBoundary component, shows error message and retry button on crash
- **CONTRIBUTING.md** — guide for contributors: project structure, adding widgets, translations, code style, commit conventions

### Changed
- DiagramPage refactored: static imports replaced with lazy loading and Suspense with loading spinner

## [0.41.0] - 2026-04-12

### Added
- **Blueprint Analyzer widget** — paste blueprint JSON to analyze: entity counts table, category breakdown bar (transport/logistics/production/fluid/power/defense/circuit/rail), blueprint dimensions, demo blueprint included
- **UPS Optimizer widget** — entity count vs UPS impact calculator with 10 entity categories (belts/inserters/assemblers/furnaces/pipes/bots/trains/turrets/solar/beacons), stacked bar budget visualization, estimated UPS output, over-budget warning
- **Circuit 2.0 widget** — Factorio 2.0 new circuit features: Selector Combinator with 4 modes (by index/count/random/stack-size), Display Panel with 3 visualization modes (values/bars/icons), editable input signals
- Full Ukrainian translations for all 3 new widgets
- Navigation sidebar and landing page updated with 25 total diagrams

## [0.40.0] - 2026-04-12

### Added
- **Game Tick widget** — Factorio game loop phases visualized: animated SVG timeline showing 9 tick phases (Input, Transport, Entities, Electric, Fluids, Pollution, Combat, Robots, Render) with configurable UPS target, ms budget per phase, phase descriptions
- **Defense Calculator widget** — turret DPS and range calculator with Canvas defense layout: 5 turret types (Gun, Laser, Flamethrower, Artillery, Tesla), wall layers, dragon teeth slow effect, damage breakdown by type, range circle visualization
- **Robot Logistics widget** — roboport coverage zone visualizer with Canvas grid: place roboports and chests, see logistics and charge zone overlap, coverage percentage, charge port and robot capacity stats
- Full Ukrainian translations for all 3 new widgets
- Navigation sidebar and landing page updated with 22 total diagrams

## [0.39.0] - 2026-04-12

### Added
- **Combinator Sandbox widget** — interactive circuit network simulator: place Constant/Arithmetic/Decider combinators, wire them with red/green wires, edit configurations inline (signals, operations, thresholds), step through ticks with 1-tick delay propagation, signal table display per entity
- **Train Pathfinding widget** — rail block and signal visualization: Canvas-rendered track with 4 signal-controlled blocks, train movement with block reservation/occupation/freeing logic, chain signal that checks all blocks ahead, color-coded block states (green=free, orange=reserved, red=occupied), event log
- Full Ukrainian translations for both new widgets
- Navigation sidebar and landing page updated with 19 total diagrams

## [0.38.0] - 2026-04-12

### Added
- **Mining Productivity widget** — infinite research scaling curve with interactive SVG chart, hover for per-level details, configurable speed modules (0-3), exponential cost visualization
- **Noise Visualizer widget** — Perlin noise terrain generator with Canvas pixel rendering (128x128), adjustable seed/frequency/octaves/persistence, terrain color mapping (water/grass/forest/desert/rock), ore patch overlay toggle
- **Space Platform widget** (Space Age) — interplanetary route calculator with SVG solar system map, 6 routes (Nauvis→Vulcanus/Fulgora/Gleba/Aquilo), thruster/width configuration, travel time/fuel/asteroid estimation, drag vs thrust visualization
- Full Ukrainian translations for all 3 new widgets
- Navigation sidebar and landing page updated with 17 total diagrams

## [0.37.0] - 2026-04-12

### Added
- **Fluid System widget** — interactive pipe network simulator with Canvas grid placement (pipe, pump, source, drain), pressure equalization algorithm, real-time pressure visualization with color gradient, average pressure stats
- **Tech Tree Explorer widget** — SVG technology tree with 14 technologies across 6 tiers, click to highlight prerequisite chain, search/filter, science pack and cost display per technology
- **Solar Curve widget** — detailed day/night solar simulation with configurable load (MW), panel count, and accumulator count; SVG chart showing solar output curve, accumulator charge level, blackout zones; optimal panel/accumulator calculator
- Full Ukrainian translations for all 3 new widgets
- Navigation sidebar and landing page updated with 14 total diagrams

## [0.36.0] - 2026-04-12

### Added
- **Train Interrupts widget** — Train 2.0 schedule & interrupt simulator with SVG decision tree visualization, step-through simulation, event log with interrupt triggers
- **Spoilage Timeline widget** (Space Age) — spoilage calculator with transit time based on belt tier and distance, processing time, freshness gradient bar, survival prediction for 6 spoilable items (Nutrients, Bioflux, Biter Egg, Pentapod Egg, Yumako Fruit, Jelly)
- **Beacon Layout widget** — interactive Canvas grid placement tool for machines and beacons, 6 module types (Speed 1-3, Productivity 1-3), speed/productivity bonus calculation with beacon distribution factor (50%), effective throughput display
- Full Ukrainian translations for all 3 new widgets
- Navigation sidebar and landing page updated with 11 total diagrams

## [0.35.0] - 2026-04-12

### Added
- **Power Calculator widget** — solar panel/accumulator ratio calculator with day/night cycle SVG chart, nuclear reactor layout calculator (line/2x2/2xN) with neighbor bonus, heat exchanger and steam turbine counts
- **Inserter Cycle widget** — animated SVG inserter swing arc with 6 inserter types (Burner, Basic, Long, Fast, Stack, Bulk), tick-by-tick phase display (pickup/swing/drop), stack size control, throughput calculator
- **Evolution Curve widget** — evolution factor simulator with adjustable game hours, pollution rate, and spawner destruction; SVG evolution curve chart with threshold lines; unit composition bar (small/medium/big/behemoth biters and spitters)
- Full Ukrainian translations for all 3 new widgets
- Navigation sidebar and landing page updated with 8 total diagrams

## [0.34.0] - 2026-04-12

### Added
- Recipe DAG: production rate slider — edge thickness scales with target rate
- Recipe DAG: critical path highlighting (longest chain from raw to rocket-part)
- Recipe DAG: missing `speed-module` item and recipe
- Cross-navigation (prev/next) buttons between diagrams
- Full Ukrainian (UK) localization for all widgets:
  - Belt Mechanics: tier names, canvas info line
  - Recipe DAG: all 42 item names (Залізна руда, Мідна плитка, Електронна схема, etc.)
  - Pollution Diffusion: entity names (Бойлер, Електробур, etc.), canvas labels
  - Quality Grind: tier names (Звичайна → Легендарна), module names
  - System of Systems: node labels (Видобуток, Плавка, Крафт...), loop names, descriptions
- Belt Mechanics: 4th tier — Turbo belt (90 items/s, Space Age)

### Fixed
- Recipe DAG: `rocket-control-unit` recipe referenced non-existent `speed-module` item
- System of Systems: "Part" label was not translated
- Various hardcoded English strings in Canvas rendering (Tick, items/s, Max pollution)

## [0.33.0] - 2026-04-12

### Added
- Project version 0.33, author copyright (Vladyslav V. Prodan)
- `<meta>` author and copyright tags in index.html
- Version and copyright display in sidebar footer
- Author section in README.md
- CI workflow (ci.yml): TypeScript type check + build on all pushes
- Release workflow (release.yml): build + GitHub Release on `v*` tags
- GitHub Pages deploy workflow (deploy.yml)

### Changed
- package.json license from ISC to BSD-3-Clause
- LICENSE-CODE.md: added Vladyslav V. Prodan to copyright line
- README.md: status updated from "Planning Phase" to "Phase 1 — Interactive Diagrams"

## [0.32.0] - 2026-04-12

### Added
- **Belt Mechanics widget** — Canvas animation with 3 modes (straight, side-load, splitter), 3 belt tiers, play/pause/step controls, output priority config
- **Recipe DAG widget** — D3 + dagre dependency graph with 40+ items, click-to-trace upstream/downstream, search/filter, pan/zoom
- **Pollution Diffusion widget** — Canvas 2D heatmap with cellular automaton diffusion, entity placement tool, tile type painting (forest/water absorb pollution)
- **Quality Grind widget** — SVG Markov chain state diagram with transition probabilities, module configuration, expected iterations calculator, recycler toggle
- **System of Systems widget** — Causal loop diagram with 13 subsystem nodes, 19 causal edges, 5 toggleable feedback loops (Growth Spiral, Pollution-Combat, Power-Production, Research-Complexity, Space Age)
- Landing page with 5 diagram cards
- Dark Factorio-themed UI with responsive layout (sidebar desktop, hamburger mobile)
- react-i18next setup with English and Ukrainian translations
- Shared components: TimelineControls, WidgetShell
- Vite + React 19 + TypeScript 6 project infrastructure
