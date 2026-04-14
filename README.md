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

## Status: 44 Interactive Diagrams (v0.50)

All planned interactive diagrams are implemented across 11 thematic sections — from simulation core and belt mechanics to Space Age quality grind and cheat-sheet-style calculators.

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

#### Simulation Core
| Widget ID | Description |
|-----------|-------------|
| `game-tick` | Game loop phases timeline |
| `chunk-system` | Chunk grid with radar scan |
| `entity-lifecycle` | Entity state machine |

#### Transport & Logistics
| Widget ID | Description |
|-----------|-------------|
| `belt-simulator` | Belt slot animation with side-loading, splitter |
| `inserter-cycle` | Inserter swing arc with tick timing |
| `inserter-capacity` | Inserter stack size by research level |
| `balancers` | Belt balancer visual diagrams |
| `train-pathfinding` | Rail block and signal visualization |
| `train-interrupts` | Train 2.0 interrupt simulator |
| `cargo-wagon` | Cargo wagon loading throughput calculator |
| `fluid-wagon` | Fluid wagon throughput vs pipe comparison |
| `robot-logistics` | Roboport coverage visualizer |

#### Production
| Widget ID | Description |
|-----------|-------------|
| `recipe-dag` | Full recipe dependency graph |
| `beacon-layout` | Beacon/module placement calculator |
| `new-machines` | Machine comparison (incl. Space Age) |
| `common-ratios` | Common production ratio calculator |
| `material-processing` | Smelting time and throughput calculator |
| `prod-module-payoff` | Productivity module ROI calculator |

#### Energy
| Widget ID | Description |
|-----------|-------------|
| `power-calculator` | Solar/nuclear ratio calculator |
| `power-steam` | Steam power boiler/engine ratio calculator |
| `solar-curve` | Day/night solar output simulation |
| `electric-network` | Power pole topology |
| `power-failure` | Brownout cascade simulator |

#### Oil Refining
| Widget ID | Description |
|-----------|-------------|
| `oil-refining` | Oil processing flow diagram with fluid balance |

#### Combat & Pollution
| Widget ID | Description |
|-----------|-------------|
| `pollution-heatmap` | Pollution diffusion heatmap |
| `evolution-curve` | Evolution factor visualization |
| `biter-ai` | Biter attack wave simulator |
| `defense-calculator` | Turret DPS and range calculator |

#### Circuit Network
| Widget ID | Description |
|-----------|-------------|
| `combinator-sandbox` | Interactive circuit network simulator |
| `circuit-2` | Circuit 2.0 (selector, display panel) |

#### Map Generation
| Widget ID | Description |
|-----------|-------------|
| `noise-visualizer` | Perlin noise terrain generator |

#### Space Age
| Widget ID | Description |
|-----------|-------------|
| `quality-markov` | Quality grind Markov chain |
| `spoilage-timeline` | Spoilage survival calculator |
| `space-platform` | Interplanetary route calculator |
| `multi-surface` | Surface hierarchy viewer |
| `planet-chains` | Per-planet resource chains |
| `tech-tree` | Technology tree explorer |

#### Vehicles & Trains
| Widget ID | Description |
|-----------|-------------|
| `vehicle-fuel` | Vehicle speed/acceleration fuel bonus |
| `train-colors` | Train color palette with Factorio format |

#### Meta & Analysis
| Widget ID | Description |
|-----------|-------------|
| `system-overview` | System of systems causal loops |
| `blueprint-analyzer` | Blueprint JSON analyzer |
| `ups-optimizer` | UPS budget calculator |
| `fluid-system` | Pipe pressure/flow simulator |
| `mining-productivity` | Infinite research scaling curve |

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
├── CONTRIBUTING.md                    ← Contribution guide
├── LICENSE-CODE.md                    ← BSD 3-Clause (code)
├── LICENSE-CONTENT.md                 ← CC BY-NC-SA 4.0 (text, diagrams, PDFs)
├── NOTICE.md                          ← Third-party attributions & disclaimers
│
├── docs/                              ← Content plan (the "what")
│   ├── en/content-plan.md             ← Full 10-part diagram content specification
│   └── uk/                            ← Ukrainian translation
│
├── planning/                          ← Project planning (the "how")
│   ├── en/                            ← project-plan, output-format, prior-art, legal-plan
│   └── uk/                            ← Ukrainian translations
│
├── src/                               ← Interactive widget source code
│   ├── components/                    ← Shared components (Layout, ErrorBoundary, WidgetShell)
│   ├── i18n/                          ← Translations (en.json, uk.json)
│   ├── pages/                         ← Home, DiagramPage, EmbedPage
│   ├── styles/                        ← Global CSS
│   └── widgets/                       ← 44 widget directories (one per diagram)
│
└── assets/
    └── reference/
        └── SimCity_Reverse_Diagrams_Gingold_2016.pdf
```

## Content Plan Overview

| Part | Title | Diagrams |
|------|-------|----------|
| I | Simulation Core | 3 |
| II | Transport & Logistics | 9 |
| III | Production | 6 |
| IV | Energy | 5 |
| V | Oil Refining | 1 |
| VI | Combat & Pollution | 4 |
| VII | Circuit Network | 2 |
| VIII | Map Generation | 1 |
| IX | Space Age | 6 |
| X | Vehicles & Trains | 2 |
| XI | Meta & Analysis | 5 |
| | **Total** | **44** |

## Legal

This project is **not affiliated with, endorsed by, or connected to Wube Software Ltd.**
Factorio® is a registered trademark of Wube Software Ltd.

Game data sourced from [wube/factorio-data](https://github.com/wube/factorio-data).
Game mechanics documented with reference to the [Factorio Wiki](https://wiki.factorio.com) (CC BY-NC-SA 3.0) and [Friday Facts](https://factorio.com/blog).

See [LICENSE-CODE.md](LICENSE-CODE.md), [LICENSE-CONTENT.md](LICENSE-CONTENT.md), and [NOTICE.md](NOTICE.md) for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, project structure, widget creation guide, translation guidelines, and code style conventions.

## Links

- [Factorio](https://factorio.com/) — the game
- [wube/factorio-data](https://github.com/wube/factorio-data) — official prototype data
- [Gingold's SimCity Reverse Diagrams](https://chaimgingold.com/) — original inspiration
- [Bartosz Ciechanowski](https://ciechanow.ski/) — format reference
- [Red Blob Games](https://www.redblobgames.com/) — interactive tutorial reference
