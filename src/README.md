# Source Code

Interactive widget implementations (not yet started).

Planned structure:

```
src/
├── components/          ← Shared React components
│   ├── Grid/            ← Reusable tile grid renderer
│   ├── NodeGraph/       ← Reusable node-link diagram
│   ├── Calculator/      ← Reusable parameter calculator
│   ├── Timeline/        ← Reusable tick timeline
│   └── Chart/           ← Reusable chart wrapper (Recharts)
│
├── widgets/             ← Per-diagram interactive widgets
│   ├── belt-simulator/
│   ├── inserter-cycle/
│   ├── recipe-dag/
│   ├── pollution-heatmap/
│   ├── quality-markov/
│   ├── combinator-sandbox/
│   ├── noise-visualizer/
│   └── system-overview/
│
├── chapters/            ← Chapter page layouts (prose + widgets)
│   ├── simulation-core/
│   ├── transport/
│   └── ...
│
├── i18n/                ← Translation files
│   ├── en.json
│   └── uk.json
│
└── data/                ← Data loading utilities
    └── loader.ts
```

Tech stack (planned): React + D3 + Canvas + Recharts. See `planning/en/output-format.md` and `planning/en/project-plan.md` for details.
