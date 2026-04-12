# Factorio Reverse Diagrams — Legal Protection Plan

*Disclaimer: this document is an analytical overview, not legal advice. For binding guidance, consult an IP attorney in your jurisdiction.*

---

## 1. What We Create, What We Use

Our project produces original work (prose, code, diagrams, data transformations) that references and analyzes a copyrighted commercial product (Factorio by Wube Software Ltd.). We must clearly separate what is ours, what is theirs, and what is third-party.

### 1.1 Our Original Work

| Asset | Copyright Status | License We Choose |
|-------|-----------------|-------------------|
| Prose text (explanations, annotations) | Our copyright, automatically | CC BY-NC-SA 4.0 |
| Interactive widget code (JS/React) | Our copyright | BSD 3-Clause |
| Diagram layouts and visual composition | Our copyright | CC BY-NC-SA 4.0 |
| Data transformation scripts (Lua→JSON) | Our copyright | BSD 3-Clause |
| PDF poster design/layout | Our copyright | CC BY-NC-SA 4.0 |
| Translations (Ukrainian text) | Our copyright (derivative of our EN text) | CC BY-NC-SA 4.0 |

### 1.2 Wube Software's IP That We Reference

| Asset | Wube's Rights | Our Usage |
|-------|--------------|-----------|
| Game name "Factorio" | Trademark | Nominative fair use (referring to the game by name) |
| Game screenshots | Wube's copyright | NOT used — we create our own diagrams |
| Art assets (sprites, icons, textures) | Wube's copyright | NOT directly used — see Section 5 for alternatives |
| Source code (C++) | Trade secret / copyright | NOT accessed — we use only public information |
| Lua prototype data (`wube/factorio-data`) | Wube's copyright | Factual data extraction (see Section 3) |
| Friday Facts blog posts | Wube's copyright | Cited with attribution, not reproduced |
| Factorio Wiki text | CC BY-NC-SA 3.0 (community), Wube images excepted | Compatible license; attributed |
| Game formulas and mechanics | Not copyrightable (facts/ideas) | Freely usable — facts cannot be copyrighted |

### 1.3 Third-Party Content

| Asset | Owner | Our Usage |
|-------|-------|-----------|
| Gingold's SimCity diagrams PDF | Chaim Gingold | Referenced and cited; not reproduced |
| Community tool screenshots | Various authors | NOT embedded — linked with attribution |
| FFF blog illustrations | Wube Software | NOT reproduced — described and cited |
| Mod code (Factsim, etc.) | Mod authors (various licenses) | Referenced; code adapted only if license permits |

---

## 2. Legal Basis: Why This Project Is Permissible

### 2.1 Ideas vs. Expression (Copyright's Idea-Expression Dichotomy)

Copyright protects the **expression** of ideas (code, art, text), not the **ideas themselves** (game mechanics, formulas, rules). This is codified in 17 U.S.C. § 102(b) and equivalent provisions worldwide.

Factorio's game mechanics — how belts work, how pollution diffuses, how evolution is calculated — are **uncopyrightable facts and ideas**. Documenting them is no different from a physics textbook documenting gravity.

What IS copyrighted: Wube's specific code implementing these mechanics, their art assets, their specific textual descriptions. We do not reproduce any of these.

### 2.2 Fair Use (U.S.) / Fair Dealing (UK, where Wube is registered)

If any element of our project approached the boundary of copyright use, it would likely qualify as fair use under the four-factor test:

1. **Purpose and character**: educational, non-commercial, transformative (analysis and explanation, not reproduction)
2. **Nature of the copyrighted work**: the game is a published commercial product; factual elements (mechanics) are less protected
3. **Amount used**: we use no game art, no code, no substantial text — only factual data about mechanics
4. **Market effect**: our project does not substitute for purchasing Factorio; if anything, it promotes the game

### 2.3 Wube's Stated Policies

From Wube's Terms of Service:

- **Video Policy**: Wube explicitly permits creating videos (tutorials, reviews, walkthroughs) and monetizing them. Our project is analogous to a detailed interactive tutorial.
- **Mod Policy**: Wube encourages derivative works within the modding ecosystem and provides public Lua data specifically for this purpose.
- **Community posture**: Wube has historically been supportive of community analysis, tools, and educational content. The `wube/factorio-data` GitHub repository exists explicitly to help the community.

### 2.4 Precedent: Existing Community Projects

Numerous community projects perform similar analysis without legal challenge:

- Factorio Wiki (wiki.factorio.com) — documents all game mechanics
- FactorioLab — reimplements recipe calculations
- Factorio Cheat Sheet — republishes game data
- Factorio-SAT — formally models belt mechanics
- Multiple YouTube channels explaining game internals

None have faced legal action from Wube. This establishes a de facto permissive environment.

---

## 3. Data Extraction: `wube/factorio-data` and `--dump-data`

### 3.1 The `factorio-data` Repository

Wube publishes `wube/factorio-data` on GitHub with the explicit purpose: "to help mod authors" and "to allow the public to track changes to the Factorio Lua prototype definitions."

This public repository contains every recipe, entity stat, technology definition, and configuration value. Our project parses this data into JSON for use in diagrams.

**Legal assessment:**
- Wube published this data publicly and intentionally
- The repository's README explicitly states its purpose is for the community
- Extracting factual data (recipe: 1 iron plate requires 1 iron ore, takes 3.2 seconds) is not copyright infringement — these are facts about the game's behavior
- Our JSON transformation is an original work (different structure, format, annotations)

### 3.2 The `--dump-data` Command

Running `factorio --dump-data` produces a complete JSON dump of all prototypes. This is an official, documented feature of the Factorio executable.

**Legal assessment:**
- This is a feature Wube intentionally provides to users
- Using documented features of software you own a license to is normal use
- The output is factual data about the game's configuration

### 3.3 What We Do NOT Extract

- We do NOT extract art assets (sprites, textures, icons, sounds, music)
- We do NOT decompile, disassemble, or reverse-engineer the C++ binary
- We do NOT reproduce Wube's code in any form
- We do NOT extract content that requires bypassing DRM or access controls

---

## 4. Trademark: Using the Name "Factorio"

"Factorio" is a registered trademark of Wube Software Ltd.

### 4.1 Nominative Fair Use

We use the name "Factorio" to identify the subject of our analysis. This is textbook nominative fair use:

1. The product is not readily identifiable without the mark
2. We use only as much of the mark as necessary (the name, not the logo)
3. We do not suggest sponsorship or endorsement

### 4.2 Best Practices

- **DO:** "Factorio Reverse Diagrams — An analysis of the Factorio simulation"
- **DO:** Include a disclaimer: "This project is not affiliated with, endorsed by, or connected to Wube Software Ltd. Factorio is a trademark of Wube Software Ltd."
- **DO NOT:** Use the Factorio logo without permission
- **DO NOT:** Imply official endorsement
- **DO NOT:** Use "Factorio" as the primary brand of our project (use it as a descriptor)

### 4.3 Project Name Options

| Name | Risk Level | Notes |
|------|-----------|-------|
| "Factorio Reverse Diagrams" | LOW | Descriptive use of trademark |
| "Inside Factorio" | LOW | Descriptive |
| "Factorio Systems Atlas" | LOW | Descriptive |
| "FactorioDiagrams" (as domain/brand) | MEDIUM | Could be seen as trademark use in commerce |
| Just "Factorio" | HIGH | Infringement |

Recommended: keep "Factorio" as a descriptor, not the brand. E.g., "Systems Atlas — Reverse Diagrams of Factorio's Simulation."

---

## 5. Visual Assets: The Image Problem

This is the most delicate area. Our diagrams need to show Factorio entities (belts, inserters, assemblers), but Factorio's art assets are copyrighted.

### 5.1 Options for Entity Visuals

| Approach | Legal Risk | Quality | Effort |
|----------|-----------|---------|--------|
| **A. Use Factorio sprites directly** | HIGH — copyright infringement of art assets | Perfect fidelity | Zero effort |
| **B. Create original pixel art / vector icons** | ZERO — our own copyright | Lower fidelity, but distinctive | High effort |
| **C. Use abstract symbols (circles, squares, arrows)** | ZERO — not copyrightable | Low fidelity, but clear | Low effort |
| **D. Generate via AI and edit substantially** | MEDIUM-LOW — see Section 6 | Variable | Medium effort |
| **E. Request permission from Wube** | ZERO if granted | Perfect fidelity | Depends on Wube's response time |
| **F. Use Factorio's official "factoriopedia" style** | UNCLEAR — these are Wube assets | High fidelity | Low effort |

### 5.2 Recommended Approach: B + C + E

1. **Primary:** Create original abstract/schematic icons for all entities. Belts as parallel lines with arrows. Inserters as rotating arms. Assemblers as gear-marked boxes. This establishes our own visual language and avoids any copyright concern.

2. **Enhancement:** For maximum clarity, request permission from Wube to use entity icons in an educational, non-commercial context. Given their community posture, approval is plausible.

3. **Fallback:** If Wube declines, abstract symbols work fine for technical diagrams — Gingold's SimCity diagrams used simple tile representations, not the game's actual art.

### 5.3 What About Screenshots?

Our project doesn't need screenshots. Every diagram is created from scratch, showing only structural relationships and data flows. If a screenshot were ever needed for context, it would fall under fair use (criticism/commentary) when used briefly with attribution.

---

## 6. AI-Generated Images: Legal Assessment

### 6.1 The Question

Can we use AI image generation (Midjourney, DALL-E, Stable Diffusion, etc.) to create Factorio-style entity icons, avoiding direct use of Wube's art assets?

### 6.2 Two Separate Legal Issues

**Issue A: Copyright of the AI OUTPUT (can we protect our AI-generated images?)**

Per the U.S. Copyright Office (January 2025 report):
- Purely AI-generated images (prompt → output, no editing) receive NO copyright protection
- Images substantially edited/arranged by humans after AI generation CAN receive copyright protection
- The human contribution must extend beyond basic prompts or trivial modifications

For our project: if we generate icons via AI and then substantially modify them (redraw, recolor, adjust proportions, compose into diagrams), the resulting work is likely copyrightable as our work. The AI output serves as a starting point, not the final product.

**Issue B: Infringement of Wube's art BY the AI output (does the AI output copy Factorio's art?)**

This is the more serious concern:
- If we prompt an AI with "Factorio transport belt icon" or "belt sprite in Factorio style," the output may be **substantially similar** to Wube's copyrighted art
- If the AI model was trained on Factorio screenshots (highly likely for large models), the output might reproduce protected expression
- Substantial similarity + access (via training data) = potential infringement, even though the output is "generated" rather than "copied"

### 6.3 Risk Matrix for AI-Generated Factorio-Style Images

| Approach | Infringement Risk | Our Copyright | Overall Risk |
|----------|-------------------|---------------|-------------|
| Prompt: "Factorio belt sprite" → use as-is | HIGH (substantially similar to Wube art) | NONE (no human authorship) | **VERY HIGH** |
| Prompt: "Factorio belt sprite" → edit substantially | MEDIUM (may still be substantially similar) | PARTIAL (human editing adds authorship) | **HIGH** |
| Prompt: "abstract factory conveyor icon, flat vector, blue" → edit substantially | LOW (generic prompt, no reference to Factorio) | YES (human editing + generic base) | **LOW** |
| Prompt: "isometric game icon, transport machine" → redraw from scratch using as reference | VERY LOW (heavily transformed) | YES (primarily human-created) | **VERY LOW** |
| No AI — hand-drawn abstract icons | ZERO | YES (full human authorship) | **ZERO** |

### 6.4 Recommendation on AI Images

**Do NOT use AI to generate Factorio-specific imagery.** The risk of producing substantially similar output to Wube's art is too high, and the copyright protection of the output is uncertain.

**DO consider using AI for:**
- Generic diagram elements (arrows, boxes, backgrounds, decorative elements)
- Initial concept sketches that are then redrawn by hand
- Non-Factorio visuals (e.g., generic noise function visualizations, abstract math diagrams)

**Best practice:** Create original schematic/vector icons. They're legally clean, visually consistent, lightweight (SVG), and establish a distinctive identity for our project.

---

## 7. Licensing Our Project

### 7.1 Recommended License Structure

```
factorio-reverse-diagrams/
├── LICENSE-CODE.md          → BSD 3-Clause License (all JavaScript/TypeScript/Python code)
├── LICENSE-CONTENT.md       → CC BY-NC-SA 4.0 (all prose, diagrams, PDFs, translations)
├── data/                    → BSD 3-Clause License (JSON data files — factual data, not copyrightable, but BSD 3-Clause for clarity)
└── NOTICE.md                → Third-party attributions and disclaimers
```

### 7.2 Why CC BY-NC-SA 4.0 for Content

- **BY** (Attribution): requires credit — ensures our work is attributed
- **NC** (NonCommercial): prevents commercial exploitation of our educational work — aligns with our non-commercial intent and avoids complications with Wube's "commercial use requires consent" policy
- **SA** (ShareAlike): derivative works must use the same license — ensures the community benefits

This is the same license family used by the Factorio Wiki (CC BY-NC-SA 3.0), ensuring compatibility.

### 7.3 Why BSD 3-Clause for Code

- Wide adoption — a well-understood permissive license compatible with virtually every framework and library
- The third clause ("no endorsement") explicitly prevents others from using our project name to imply Wube's endorsement — an extra safeguard aligned with our trademark strategy
- Encourages community contributions and forks
- Compatible with CC BY-NC-SA 4.0 content license (different scopes: code vs. prose)

### 7.4 Why NC (NonCommercial)?

Critical decision. Reasons for NC:
- Our project uses Factorio's name and analyzes their product — commercial use would bring us closer to commercial use of their IP
- Wube's ToS requires "express consent" for commercial use of Factorio-related content
- NC reduces legal surface area dramatically
- Our goal is educational, not commercial

If we ever want to monetize (Patreon, poster sales), we would need to either:
- Obtain explicit permission from Wube for commercial use
- Ensure all monetized content uses only our original assets (no Factorio sprites, potentially not even the name in commerce)

---

## 8. Attribution Requirements

### 8.1 Mandatory Attributions

Every page / PDF / embed must include:

```
Factorio® is a registered trademark of Wube Software Ltd.
This project is not affiliated with, endorsed by, or connected to Wube Software Ltd.
Game data sourced from wube/factorio-data (github.com/wube/factorio-data).
Game mechanics documented with reference to the Factorio Wiki (wiki.factorio.com, CC BY-NC-SA 3.0)
and Friday Facts blog posts (factorio.com/blog).
```

### 8.2 Per-Source Citations

In the text, when referencing specific information:

- "According to FFF-421, ..." (link to blog post)
- "As documented on the Factorio Wiki, ..." (link to specific page)
- "Data from factorio-data v2.0.67, ..." (link to specific commit)

### 8.3 Third-Party Code Attributions

If we use code or concepts from community tools:

| Source | License | Attribution Required |
|--------|---------|---------------------|
| FactorioLab | MIT | Yes — credit in NOTICE.md |
| Factsim | (check license) | Yes — credit; ask permission if adapting code |
| Factorio-SAT | (check license) | Yes — credit if referencing approach |
| Red Blob Games | (various) | Yes — Amit Patel credited for approach inspiration |
| Ciechanowski | (proprietary) | Yes — credited as format inspiration; NO code reuse |
| Setosa.io | MIT | Yes — credit if adapting Markov visualizer |

### 8.4 Image Credits

If any external images are used (e.g., in the Prior Art document):

```
Image: [Description]
Source: [URL]
Author: [Name]
License: [License type]
Used under: [fair use for commentary / license terms]
```

For our own diagrams: no external image credits needed — everything is original.

---

## 9. Risk Summary

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Wube sends C&D for trademark use | VERY LOW | HIGH | Nominative fair use + disclaimer + community precedent |
| Wube objects to data extraction | VERY LOW | MEDIUM | Data is publicly published by Wube for community use |
| Wube objects to mechanics documentation | NEGLIGIBLE | LOW | Ideas/facts are not copyrightable |
| Third-party mod author objects to code adaptation | LOW | LOW | Check licenses; attribute; ask permission |
| AI-generated image is substantially similar to Wube art | MEDIUM (if used) | MEDIUM | DON'T use AI for Factorio-specific imagery |
| Someone forks our project and monetizes it | MEDIUM | LOW | CC BY-NC-SA prevents commercial use |
| Patent claim on game mechanics | NEGLIGIBLE | THEORETICAL | Game mechanics are rarely patented; documentation ≠ implementation |
| DMCA takedown on GitHub Pages | VERY LOW | MEDIUM | No copyrighted content hosted; counter-notice available |

---

## 10. Recommended Actions Before Launch

1. **Add disclaimers** to every page, every PDF, every embed
2. **Create NOTICE.md** with all third-party attributions
3. **Verify licenses** of every community tool whose code or data we reference or adapt
4. **Create original visual assets** — do not use Factorio sprites under any circumstances
5. **Consider contacting Wube** — a brief email to support@factorio.com explaining the educational project and asking for their blessing would eliminate most risks. Given their community-friendly culture, a positive response is likely.
6. **Document our data pipeline** — show that our JSON comes from public sources, not reverse engineering
7. **Keep the project non-commercial** until/unless Wube grants permission otherwise
8. **Register copyright** for the PDF posters if we intend to sell prints (U.S. Copyright Office, ~$65 per work)

---

## 11. If Wube Responds Positively

If Wube grants permission (even informally via email), this unlocks:

- Use of official entity icons in diagrams
- "With permission from Wube Software" badge on the site
- Potential featuring on Factorio's community page
- Commercial options (poster sales, Patreon) become viable
- Reduced legal uncertainty across the board

This is the single highest-value action for the project's legal safety. Draft the email before anything else.
