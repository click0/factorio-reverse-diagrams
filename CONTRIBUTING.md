# Contributing to Factorio Reverse Diagrams

Thank you for your interest in contributing!

## Getting Started

```bash
git clone https://github.com/click0/factorio-reverse-diagrams.git
cd factorio-reverse-diagrams
npm install
npm run dev
```

Open `http://localhost:5173/factorio-reverse-diagrams/` in your browser.

## Project Structure

```
src/
├── components/       ← Shared UI (Layout, Timeline, ErrorBoundary)
├── i18n/             ← Translations (en.json, uk.json)
├── pages/            ← Home, DiagramPage, EmbedPage
├── styles/           ← Global CSS (dark theme)
└── widgets/          ← One folder per interactive diagram
    ├── belt-simulator/
    ├── recipe-dag/
    └── ...
```

## Adding a New Widget

1. Create `src/widgets/your-widget/YourWidget.tsx` (default export)
2. Add i18n keys to `src/i18n/en.json` and `src/i18n/uk.json`
3. Register in `src/pages/DiagramPage.tsx` — add to `widgets` map
4. Register in `src/pages/EmbedPage.tsx` — add to `widgetLoaders`
5. Add to `src/components/Layout/Sidebar.tsx` — add to `diagrams` array
6. Add card to `src/pages/Home.tsx` — add to `diagrams` array

Widgets are lazy-loaded (`React.lazy`), so each widget is a separate chunk.

## Translations

- English: `src/i18n/en.json`
- Ukrainian: `src/i18n/uk.json`
- Use `useTranslation()` hook and `t('key')` in components
- Game item names use the `item.<id>` namespace
- All UI labels must have both EN and UK translations

## Code Style

- TypeScript strict mode
- Functional components with hooks
- Canvas for simulations (belts, pollution, fluid, beacon)
- SVG for diagrams (recipe DAG, quality, system, tech tree)
- No external CSS frameworks — use CSS custom properties from `global.css`

## Build & Test

```bash
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build locally
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature or widget
- `fix:` — bug fix
- `chore:` — maintenance (version bump, config)
- `docs:` — documentation only

## Data Sources

- Game data: [wube/factorio-data](https://github.com/wube/factorio-data)
- Mechanics: [Factorio Wiki](https://wiki.factorio.com)
- Internal details: [Friday Facts](https://factorio.com/blog)

## License

- Code: BSD 3-Clause (see `LICENSE-CODE.md`)
- Content: CC BY-NC-SA 4.0 (see `LICENSE-CONTENT.md`)
