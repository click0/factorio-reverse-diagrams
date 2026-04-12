# Factorio Reverse Diagrams — Output Format Deep Dive

---

## 1. The Core Question: What Is This Thing?

There are several fundamentally different things this project could be. They are not interchangeable — each implies different architecture, workflow, and user experience. Let's lay them all out before choosing.

---

### Option A — Poster Set (Gingold's Original Format)

**What it is:** 4–6 large-format static images (A1 / 24×36 inches), each dense with information, designed to be printed and hung on a wall or viewed as a high-resolution image.

**Precedent:** Gingold's SimCity diagrams are exactly this — two poster-sized images containing dozens of mini-diagrams, annotations, code references, and visual explanations. Stone Librande's "one-page designs" are the same idea.

**User experience:** You look at it. You scan, zoom, read, follow arrows. There is no interaction. The density IS the experience — everything is visible at once, and the relationships between systems are expressed through spatial proximity and visual connections.

**Strengths:**
- Self-contained — works forever, no dependencies, no servers, no browsers
- Printable — can literally be hung on a wall
- Citable — fixed version, stable reference
- Beautiful — the visual design IS the product
- Shareable — one PNG/PDF file, post anywhere

**Weaknesses:**
- Cannot compute — no live calculations, no parameter adjustment
- Scale problem — Factorio has 5–10× the complexity of SimCity 1989; fitting 50 diagrams on posters requires either enormous posters or tiny text
- Update problem — every Factorio patch invalidates numbers; reprinting posters is impractical
- No progressive disclosure — everything is equally visible, which can overwhelm

**Production tool:** Adobe Illustrator, Figma, or Affinity Designer. Manual layout. Each poster is a design project requiring 40–80 hours of visual work.

**Verdict:** Essential as an archival/art artifact but insufficient as the sole format for a project of this scope.

---

### Option B — Explorable Explanation (Long-Form Article with Embedded Interactives)

**What it is:** A single long-form web page (or a series of 10 chapter pages) written as prose, with interactive diagrams embedded inline. The reader scrolls through explanatory text, and between paragraphs, encounters a live widget they can manipulate.

**Precedent:**
- Bartosz Ciechanowski (ciechanow.ski) — e.g., "Internal Combustion Engine," "GPS," "Mechanical Watch" — technically dense topics explained through embedded 3D/2D interactive simulations
- Nicky Case (ncase.me) — "Parable of the Polygons," "The Evolution of Trust" — game-like explorable explanations
- Red Blob Games (redblobgames.com) — Amit Patel's interactive tutorials on pathfinding, hexagonal grids, noise functions
- Bret Victor — "Up and Down the Ladder of Abstraction," Nile visualization

**User experience:** Linear reading with optional interaction. You read a paragraph about how belts work, then below it there's a live belt simulator where you can place items and watch them move. You read about evolution, then there's a chart with sliders. The prose provides context and narrative; the widgets provide intuition.

**Strengths:**
- Narrative structure guides understanding — the reader learns in order
- Progressive disclosure — complexity is introduced gradually
- Each interactive widget is small and focused — not a general-purpose tool, but a demonstration of ONE concept
- Works on mobile (scroll is natural; widgets can be finger-friendly)
- The prose carries the explanation — the interactive is supplementary, not required
- Graceful degradation — if JavaScript breaks, the text still conveys meaning

**Weaknesses:**
- Monolithic — hard to link to one specific diagram without scrolling
- Each widget is a separate implementation — no unified "diagram engine"
- Longer to produce than either pure static or pure app
- Cross-referencing between Parts requires page navigation

**Production tool:** React/Svelte + custom inline components. Each chapter is a markdown-like file with embedded component tags.

**Page structure example:**

```
┌─────────────────────────────────────────────┐
│  FACTORIO REVERSE DIAGRAMS                  │
│  Part II — Transport & Logistics            │
├─────────────────────────────────────────────┤
│                                             │
│  § 2.1 Belt Mechanics                       │
│                                             │
│  A belt tile contains two lanes, each a     │
│  sequence of discrete item slots. Items     │
│  advance by one slot position per tick...   │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  ╔═══════════════════════════════╗  │    │
│  │  ║  [INTERACTIVE BELT SIMULATOR] ║  │    │
│  │  ║                               ║  │    │
│  │  ║  ← items moving on belt →     ║  │    │
│  │  ║                               ║  │    │
│  │  ║  Speed: [Yellow ▼]            ║  │    │
│  │  ║  Compression: [Full ▼]        ║  │    │
│  │  ║  Show slots: [✓]             ║  │    │
│  │  ╚═══════════════════════════════╝  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Notice how at full compression, every      │
│  slot is occupied. When we introduce a      │
│  gap (try clicking on an item to remove     │
│  it), the gap propagates backward...        │
│                                             │
│  Side-loading occurs when a belt meets      │
│  another perpendicularly. Items are         │
│  deposited onto one lane only:              │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  ╔═══════════════════════════════╗  │    │
│  │  ║  [SIDE-LOADING DEMO]          ║  │    │
│  │  ║                               ║  │    │
│  │  ║   ↓ belt A                    ║  │    │
│  │  ║   ┼──→ belt B                 ║  │    │
│  │  ║                               ║  │    │
│  │  ║  Toggle belt B direction: [→] ║  │    │
│  │  ╚═══════════════════════════════╝  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  § 2.2 Inserter Cycle                       │
│  ...                                        │
└─────────────────────────────────────────────┘
```

**Verdict:** This is the strongest format for education and community engagement. It's what Gingold himself suggests as the future direction when he references Bret Victor.

---

### Option C — Interactive Dashboard / Tool

**What it is:** A single-page web application with a sidebar navigation, where each Part is a "page" containing one or more interactive diagram panels. No prose — the diagrams speak for themselves, with tooltips and legends providing context.

**Precedent:**
- factoriolab.github.io — production calculator
- Factorio Cheat Sheet — reference panels
- Satisfactory interactive map tools

**User experience:** You open the app, navigate to "Belt Mechanics" in the sidebar, and see a full-screen interactive belt simulator. You switch to "Recipe DAG" and see the full production graph. Each diagram is a standalone tool.

**Strengths:**
- Each diagram gets maximum screen space
- Power users can jump directly to any diagram
- Feels like a "tool" — practical, reusable
- Good for experienced players who already know the context

**Weaknesses:**
- No narrative — newcomers don't know what they're looking at or why it matters
- No guided learning path
- "Just a tool" — loses the academic/artistic quality of Gingold's work
- Harder to distinguish from existing calculators and cheat sheets

**Verdict:** Too utilitarian. Loses the "reverse diagram" identity. The narrative IS the point — without it, this is just another Factorio calculator.

---

### Option D — Hybrid: Explorable Book + Extractable Poster + Reusable Widgets

**What it is:** Combines A and B. The primary deliverable is an explorable explanation website (Option B). From the same source, we generate static poster PDFs (Option A). Individual interactive widgets can also be embedded standalone (for Reddit posts, forum embeds, wiki integration).

**Concrete structure:**

```
factorio-reverse-diagrams.github.io/
│
├── /                          Landing page with Part X overview diagram
│
├── /part/simulation-core      Part I as explorable chapter
├── /part/transport             Part II
├── /part/production            Part III
├── ...                        (10 chapter pages)
│
├── /diagram/belt-simulator    Standalone widget (embeddable)
├── /diagram/recipe-dag        Standalone widget
├── /diagram/quality-grind     Standalone widget
├── ...                        (~20 extractable widgets)
│
├── /poster/the-tick           PDF download — Poster 1
├── /poster/factory-floor      PDF download — Poster 2
├── ...                        (6 poster PDFs)
│
├── /data                      Raw JSON data files (recipes, entities, formulas)
│
└── /ua/                       Ukrainian mirror of all chapter pages
    ├── /ua/part/simulation-core
    ├── /ua/part/transport
    └── ...
```

**How the pieces relate:**

```
Source of truth
     │
     ▼
┌──────────────────┐
│  Content files    │  Markdown + component tags + data references
│  (per chapter)    │  Written once, in English
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ EN web │ │ UA web │   Rendered by same React app with i18n
└────────┘ └────────┘
    │
    ▼
┌──────────────────┐
│ Widget exports    │  Each interactive component also works standalone
│ (iframe-embeddable) │  For Reddit, forums, wiki
└──────────────────┘
    │
    ▼
┌──────────────────┐
│ PDF posters       │  Hand-composed in Figma from SVG exports of key diagrams
│ (6 × A1 format)  │  + prose annotations + visual design polish
└──────────────────┘
    │
    ▼
┌──────────────────┐
│ Data files        │  JSON extracted from factorio-data
│ (public API)      │  Anyone can build their own tools on this data
└──────────────────┘
```

**Verdict:** This is the recommended approach. Maximum reach, multiple consumption modes, single source of truth.

---

## 2. The Chapter Page — Detailed Layout Specification

Each chapter page (e.g., `/part/transport`) follows a consistent layout:

### 2.1 Desktop (1200px+ viewport)

```
┌──────────────────────────────────────────────────────────────┐
│ ┌──────┐  FACTORIO REVERSE DIAGRAMS    [EN|UA] [☀/🌙] [PDF]│
│ │ Logo │  Part II — Transport & Logistics                    │
│ └──────┘                                                     │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│  NAVIGATION  │  CONTENT AREA                                 │
│              │                                               │
│  I Core      │  ┌─────────────────────────────────────────┐  │
│  ▸ II Trans  │  │ Chapter introduction prose.              │  │
│    2.1 Belt  │  │ Context, why this matters, what we'll    │  │
│    2.2 Ins.  │  │ explore in this chapter.                 │  │
│    2.3 Train │  │                                          │  │
│    2.4 Robot │  └─────────────────────────────────────────┘  │
│    2.5 Fluid │                                               │
│  III Prod.   │  § 2.1 Belt Mechanics                         │
│  IV Energy   │                                               │
│  V Combat    │  Explanatory prose paragraph...               │
│  VI Circuit  │                                               │
│  VII MapGen  │  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│  VIII SA     │  │                                         │  │
│  IX Meta     │  │    INTERACTIVE WIDGET                    │  │
│  X System    │  │    (500–700px height)                    │  │
│              │  │                                         │  │
│  ──────────  │  │    Controls below or to the side        │  │
│  RELATED     │  │                                         │  │
│  ▸ Cheat Sh. │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│  ▸ Wiki      │                                               │
│  ▸ FFF-148   │  Prose continues, referencing what the        │
│              │  reader just saw in the widget...             │
│              │                                               │
│              │  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│              │  │  DATA TABLE or FORMULA BOX              │  │
│              │  │  (collapsible — click to expand)         │  │
│              │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│              │                                               │
│              │  More prose...                                │
│              │                                               │
│              │  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│              │  │  NEXT INTERACTIVE WIDGET                 │  │
│              │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│              │                                               │
│              │  § 2.2 Inserter Cycle                         │
│              │  ...                                          │
│              │                                               │
│              │  ───────────────────────────────────────────   │
│              │  ← Part I: Core    Part III: Production →     │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

### 2.2 Mobile (< 768px viewport)

```
┌────────────────────────┐
│ ☰  FACTORIO REVERSE    │
│     Part II Transport   │
├────────────────────────┤
│                        │
│ Chapter intro prose... │
│                        │
│ § 2.1 Belt Mechanics   │
│                        │
│ Prose paragraph...     │
│                        │
│ ╔════════════════════╗ │
│ ║ INTERACTIVE WIDGET ║ │
│ ║ (full width)       ║ │
│ ║                    ║ │
│ ║ Controls stacked   ║ │
│ ║ below diagram      ║ │
│ ╚════════════════════╝ │
│                        │
│ More prose...          │
│                        │
│ [Expand: Data Table ▾] │
│                        │
│ § 2.2 Inserter Cycle   │
│ ...                    │
│                        │
│ ← I: Core  III: Prod → │
└────────────────────────┘
```

Navigation is in a hamburger menu. Widgets are full-width. Controls are below the visualization (not beside it). Touch-friendly: drag, pinch-zoom where applicable.

### 2.3 Widget Sizing Rules

| Widget Type | Desktop Height | Mobile Height | Aspect Ratio |
|------------|---------------|---------------|--------------|
| Simulation (belt, pollution) | 500–600px | 300–400px | 16:9 or 4:3 |
| Node-link diagram (DAG, state machine) | 600–800px | 400–500px | flexible |
| Calculator (recipe, ratio) | 300–400px | auto (stacked) | form layout |
| Chart (evolution curve, solar) | 350–450px | 250–300px | 16:9 |
| Timeline (tick, inserter cycle) | 200–300px | 150–200px | wide/narrow |

### 2.4 Widget Interaction Patterns

| Pattern | Used For | Controls |
|---------|----------|----------|
| **Animate + pause** | Belt simulator, inserter cycle, pollution diffusion | Play/pause button, step-forward, speed slider |
| **Adjust parameter** | Evolution curve, solar output, recipe calculator | Sliders, dropdowns, number inputs |
| **Place + observe** | Beacon layout, pipe network, power pole network | Click-to-place on grid, observe computed result |
| **Explore graph** | Recipe DAG, tech tree, system-of-systems | Pan, zoom, click node to expand/focus, search |
| **Step through** | Combinator tick evaluation, train interrupt logic | "Next tick" button, tick counter, state display |
| **Compare** | Foundry vs. furnace, 1.1 vs. 2.0 fluid | Side-by-side panels, toggle switch |

---

## 3. The Interactive Widget — Anatomy of One

Taking the belt simulator (§ 2.1) as the most detailed example:

### 3.1 Visual Area

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   Tick: 847    Items on belt: 23/32    Throughput: 15/s  │
│                                                          │
│  ╔═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╤═══╗    │
│  ║ ● │ ● │ ● │   │ ● │ ● │ ● │ ● │   │ ● │ ● │ → ║ L  │
│  ╟───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───╢    │
│  ║ ● │ ● │   │ ● │ ● │ ● │   │ ● │ ● │ ● │ ● │ → ║ R  │
│  ╚═══╧═══╧═══╧═══╧═══╧═══╧═══╧═══╧═══╧═══╧═══╧═══╝    │
│     1   2   3   4   5   6   7   8   9  10  11  12       │
│                     slot index                           │
│                                                          │
│  ● = iron plate   ○ = copper plate   ◆ = gear           │
│                                                          │
│  Click item to remove. Click empty slot to add.          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Belt tier:    [Yellow ▾]  [Red ▾]  [Blue ▾]  [Turbo ▾] │
│  Animation:    [▶ Play]  [⏸ Pause]  [→ Step]            │
│  Speed:        [1× ▾]  2×  4×  8×                       │
│  Show:         [✓] Slot grid  [✓] Lane labels  [ ] Tick │
│                                                          │
│  Scenario:     [Straight ▾] [Side-load ▾] [Splitter ▾]  │
│                [Underground ▾] [Custom ▾]                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Data Layer

The widget reads from a shared data file:

```
data/transport.json
{
  "belts": {
    "transport-belt":     { "speed": 0.03125, "items_per_second": 15,  "tier": "yellow" },
    "fast-transport-belt": { "speed": 0.0625,  "items_per_second": 30,  "tier": "red"    },
    "express-transport-belt": { "speed": 0.09375, "items_per_second": 45, "tier": "blue" },
    "turbo-transport-belt":   { "speed": 0.125,   "items_per_second": 60, "tier": "turbo" }
  }
}
```

This JSON is auto-generated from `wube/factorio-data` Lua prototypes.

### 3.3 Embed Mode

The same widget can be rendered standalone at `/diagram/belt-simulator` for embedding:

```html
<iframe src="https://factorio-reverse-diagrams.github.io/diagram/belt-simulator"
        width="800" height="500" frameborder="0">
</iframe>
```

This is useful for Reddit posts, forum discussions, wiki pages.

---

## 4. The PDF Poster — Anatomy of One

Taking Poster 2 ("The Factory Floor" — Parts II + III) as example:

### 4.1 Physical Format

- Size: A1 (594 × 841 mm) or 24 × 36 inches
- Orientation: landscape
- Resolution: 300 DPI (for print) + vector elements where possible
- Color: dark background (matching Factorio's UI aesthetic) with light text and colored diagram elements
- Grid: underlying 12-column grid for layout consistency

### 4.2 Layout Sketch

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  FACTORIO REVERSE DIAGRAMS — THE FACTORY FLOOR                                 │
│  Transport & Production Systems                                                 │
│                                                                                 │
├────────────────────────┬────────────────────────┬───────────────────────────────┤
│                        │                        │                               │
│  BELT MECHANICS        │  INSERTER CYCLE        │  RECIPE EXECUTION MODEL       │
│                        │                        │                               │
│  ┌──────────────────┐  │  ┌──────────────────┐  │  ┌─────────────────────────┐  │
│  │ Lane diagram     │  │  │ Swing arc with   │  │  │ Crafting progress bar   │  │
│  │ with slot grid   │  │  │ tick annotations  │  │  │ showing tick-by-tick    │  │
│  │ showing items    │  │  │                  │  │  │ advancement             │  │
│  │ moving           │  │  │ Timing table     │  │  │                         │  │
│  └──────────────────┘  │  │ per inserter     │  │  │ Formula box             │  │
│                        │  │ type             │  │  └─────────────────────────┘  │
│  Side-loading detail   │  └──────────────────┘  │                               │
│  Splitter logic tree   │                        │  Module effect vectors        │
│  Underground diagram   │  Stack size impact     │  Beacon geometry layout       │
│                        │  graph                 │                               │
├────────────────────────┼────────────────────────┼───────────────────────────────┤
│                        │                        │                               │
│  TRAIN SYSTEM          │  FLUID NETWORK         │  RECIPE DAG (CENTERPIECE)     │
│                        │                        │                               │
│  ┌──────────────────┐  │  ┌──────────────────┐  │  ┌─────────────────────────┐  │
│  │ State machine    │  │  │ Pipe segment     │  │  │                         │  │
│  │ diagram          │  │  │ with pressure    │  │  │  Full Sankey diagram    │  │
│  │                  │  │  │ annotations      │  │  │  from ore to rocket     │  │
│  │ Signal block     │  │  │                  │  │  │                         │  │
│  │ example          │  │  │ Throughput vs.   │  │  │  (largest element on    │  │
│  └──────────────────┘  │  │ distance graph   │  │  │   the poster)          │  │
│                        │  └──────────────────┘  │  │                         │  │
│  Interrupt eval flow   │                        │  └─────────────────────────┘  │
│                        │  Oil refinery flow     │                               │
│  Pathfinding penalty   │  diagram with cracking │  Key ratios table            │
│  table                 │  loop                  │                               │
│                        │                        │  QR → interactive version     │
├────────────────────────┴────────────────────────┴───────────────────────────────┤
│  Source: FFF-148, FFF-176, FFF-194, FFF-224, FFF-274 · v1.0 · factorio 2.0.67 │
│  factorio-reverse-diagrams.github.io                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Production Process

```
Interactive widgets (React/D3/Canvas)
         │
         ▼
    SVG export (per widget, static snapshot at default parameters)
         │
         ▼
    Figma / Illustrator (manual composition)
         │
         │  ← Add: typography, annotations, arrows between diagrams,
         │     visual polish, color harmony, Factorio-style aesthetic
         │
         ▼
    PDF export (300 DPI, CMYK for print, RGB for screen)
         │
         ├──→ Print-ready PDF (for poster printing services)
         └──→ Screen PDF (lighter, RGB, embedded in website)
```

The poster is NOT auto-generated. It is a designed artifact. The data comes from the same source, but the layout, typography, visual hierarchy, and aesthetic are human decisions.

### 4.4 Poster vs. Web: What Goes Where

| Content Element | Web Chapter | PDF Poster |
|----------------|-------------|------------|
| Explanatory prose | Full paragraphs | Brief annotations, callouts |
| Interactive simulation | Live, adjustable | Static snapshot at default state |
| Data tables | Expandable, full | Abbreviated, key values only |
| Formulas | Inline with explanation | Boxed, prominent |
| Cross-references | Hyperlinks to other chapters | Arrows to other diagram areas on same poster |
| Source references | Links to FFF, wiki | Footnote line at bottom |
| Controls (sliders, dropdowns) | Functional | Not present — replaced by "See interactive: [URL]" |
| Version/patch info | Auto-updated from data pipeline | Fixed at print time, shown in footer |

---

## 5. Data Pipeline — How Content Stays Current

```
wube/factorio-data (GitHub)
        │
        │  On Factorio release: automated CI job
        ▼
┌─────────────────────────┐
│  Lua → JSON parser      │  Extracts recipes, entities, technologies
│  (build script)         │  into structured JSON files
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  data/*.json             │  Versioned in project repo
│  recipes.json            │  Tagged with Factorio version number
│  entities.json           │
│  technologies.json       │
│  modules.json            │
└───────────┬─────────────┘
            │
    ┌───────┼───────┐
    │       │       │
    ▼       ▼       ▼
  Web     PDF     Notebooks
 widgets  posters  (Observable)
```

### What auto-updates and what doesn't

| Content Type | Auto-updatable? | Notes |
|-------------|-----------------|-------|
| Recipe data (ingredients, times) | YES | Parsed from data.raw |
| Entity stats (speed, power, HP) | YES | Parsed from data.raw |
| Technology tree | YES | Parsed from data.raw |
| Module effects | YES | Parsed from data.raw |
| Internal architecture (tick phases, pathfinding) | NO | Known from FFF; changes rarely and requires manual update |
| Formulas (evolution, pollution diffusion) | NO | Documented in wiki/FFF; rarely changes |
| Prose explanations | NO | Written by humans |
| Visual design | NO | Poster layouts are manual |

---

## 6. Bilingual Strategy

### 6.1 URL Structure

```
factorio-reverse-diagrams.github.io/part/transport          ← English (default)
factorio-reverse-diagrams.github.io/ua/part/transport       ← Ukrainian
```

### 6.2 What Gets Translated

| Element | Translated? | Method |
|---------|-------------|--------|
| Chapter prose | YES | i18n JSON files with translation keys |
| Widget labels (axis names, legends) | YES | i18n strings passed as props to widgets |
| Widget control labels (buttons, dropdowns) | YES | i18n |
| Data values (numbers, formulas) | NO | Universal |
| Item/entity names | PARTIAL | Use Factorio's own UA localization files (available in game data) |
| Navigation menu | YES | i18n |
| PDF posters | SEPARATE EDITION | Different Figma file with UA text overlaid |
| Source references (FFF, wiki links) | NO | English sources only |

### 6.3 Language Switcher

A toggle in the header: `[EN | UA]`. Switching preserves scroll position and any widget state. The URL updates to include or remove the `/ua/` prefix.

---

## 7. Delivery Formats — Complete Matrix

| Format | Primary Audience | Persistence | Interactivity | Offline? | Updateable? |
|--------|-----------------|-------------|---------------|----------|-------------|
| **Web chapters** (EN) | Players, designers, students | As long as GitHub Pages exists | Full | No (unless PWA) | Yes (CI deploy) |
| **Web chapters** (UA) | Ukrainian community | Same | Same | No | Yes |
| **Standalone widgets** (embeddable) | Reddit, forums, wiki editors | Via iframe/embed | Full | No | Yes |
| **PDF posters** (6 × A1) | Academics, print enthusiasts, wall art | Permanent (file-based) | None | Yes | No (versioned releases) |
| **JSON data files** | Developers, modders, tool builders | File-based | N/A | Yes | Yes (per Factorio release) |
| **Source code** (GitHub repo) | Contributors, forks | Git history | N/A | Yes | Yes |
| **Observable notebooks** (optional) | Researchers, data scientists | Observable platform | Computational | No | Yes |

---

## 8. What Gingold Did vs. What We're Doing — Side by Side

| Dimension | Gingold (SimCity, 2016) | This Project (Factorio, 2025–26) |
|-----------|------------------------|----------------------------------|
| Source material | Open source C (Micropolis) | Closed C++ + public Lua data + FFF blog |
| Output format | 2 static poster images | 10 web chapters + 6 PDF posters + embeddable widgets + data API |
| Interactivity | None (static image) | Per-section interactive simulations |
| Languages | English only | English + Ukrainian |
| Updateability | Fixed (one version) | Continuous (tied to Factorio releases) |
| Scope | ~20 mini-diagrams on 2 posters | ~50 diagram sections across 10 Parts |
| Narrative | Minimal (annotations) | Full prose explanation per section |
| Community | Academic paper | Open source + community contributions |
| Inspiration acknowledged | Librande one-page designs | Gingold + Bret Victor + explorable explanations tradition |

---

## 9. Decision Summary

| Question | Decision | Rationale |
|----------|----------|-----------|
| Primary format? | **Explorable explanation website** (Option B/D hybrid) | Strongest for education; Gingold's own recommended direction |
| Secondary format? | **Hand-designed PDF posters** | Archival; printable; academic citation; art object |
| Tertiary format? | **Embeddable standalone widgets** | Community reach (Reddit, forums, wiki) |
| Navigation model? | **Chapter-based with sidebar** | Linear learning + random access |
| Widget relationship to prose? | **Inline, within narrative flow** | Context gives meaning to interaction |
| PDF generation? | **Manual composition from SVG exports** | Quality over automation |
| Bilingual approach? | **i18n with /ua/ URL prefix** | Single codebase, translated strings |
| Data source? | **Auto-parsed from wube/factorio-data** | Stays current with patches |
| Hosting? | **GitHub Pages** (free, versioned, forkable) | Zero cost; community-friendly |
| Visual aesthetic? | **Dark theme matching Factorio UI** | Feels native to the subject |
