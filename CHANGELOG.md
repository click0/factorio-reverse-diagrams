# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
