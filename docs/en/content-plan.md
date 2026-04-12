# Factorio Reverse Diagrams

**Comprehensive Plan for Reverse-Engineering the Simulation**

*Inspired by Chaim Gingold's SimCity Reverse Diagrams (2016)*

---

> These reverse diagrams map and translate the rules of a complex simulation program into a form that is more easily digested, embedded, disseminated, and discussed.
>
> — Chaim Gingold, citing Latour (1986)

Factorio is orders of magnitude more complex than SimCity (1989). Where SimCity's simulation fit into a 16-step cycle operating on a 120×100 tile map with ~956 tile characters, Factorio runs a deterministic 60 UPS lockstep simulation across an effectively infinite world, with dozens of interlocking subsystems — from belt slot mechanics to fluid pressure equations to multi-planet logistics. This document is a blueprint for reverse-diagramming the entire machine.

---

## Preamble: Why Factorio Needs This

SimCity's source code was eventually opened (as Micropolis), which made Gingold's work possible. Factorio's C++ engine remains closed, but an unusually rich set of sources exists:

- **Friday Facts (FFF):** 400+ developer blog posts describing internals in detail
- **Lua API documentation:** the modding surface reveals entity properties, events, and data structures
- **Factorio Wiki:** community-maintained, with precise formulas for most mechanics
- **Prototype definitions:** the `data.raw` Lua tables expose every recipe, entity stat, and configuration value
- **Community tools:** calculators, blueprint analyzers, and Petri net models that formalize parts of the simulation

The goal is not to decompile Factorio, but to synthesize these sources into a single coherent diagram set — a "systems anatomy" of the game.

---

## Part I — Simulation Core

### 1.1 — Game Loop & Tick Architecture

The atomic unit of Factorio time is the **tick** — 1/60th of a second at normal game speed. Every tick, the engine performs a fixed sequence of operations. Understanding this sequence is the foundation for everything else.

**Diagram content:**

- The tick as a timeline: input processing → entity update → electric network → fluid update → transport lines → logistics → pollution → chunk management → script (mod) events → render prepare
- Parallel threads: the render thread runs concurrently with the update thread; synchronization happens at the "prepare" step where draw orders are collected
- The relationship between UPS (updates per second) and FPS (frames per second): they are decoupled — UPS can drop below 60 while FPS remains higher, and vice versa
- What `game.speed` does: it changes how many ticks execute per real-time second, but each tick's internal logic remains identical
- Edge cases: what happens when a tick takes longer than 16.67ms — the simulation slows down, maintaining determinism at the cost of real-time pacing
- Comparative inset: SimCity's 16-step revolution cycle vs. Factorio's uniform tick

**Key data points:**

- 60 ticks = 1 game second
- 3,600 ticks = 1 game minute
- 25,200 ticks = 1 Nauvis day
- 216,000 ticks = 1 game hour
- 4 revolutions = 1 month in SimCity; Factorio has no built-in calendar beyond ticks

**Source references:** FFF-70 (game loop basics), FFF-150 (game loop rewrite), FFF-388 (64-bit tick counter)

---

### 1.2 — Chunk System & World Structure

Factorio's world is divided into **chunks** — 32×32 tile squares. Chunks are the fundamental unit of spatial organization, affecting everything from entity updates to pollution propagation.

**Diagram content:**

- World as an infinite grid of chunks, with only generated chunks existing in memory
- Chunk lifecycle: ungenerated → generated (by player proximity, radar, or artillery) → active → inactive
- Chunk generation pipeline: seed → noise function evaluation → tile selection → resource placement → decorative placement → entity spawning (cliffs, trees, rocks, enemies)
- Active chunk criteria: player presence, radar coverage, roboport coverage, active entities
- Bucket-based update scheduling: chunks are distributed across update buckets; one bucket is processed per tick, so not all chunks update every tick
- Pollution boundary: pollution values are stored per-chunk, and diffusion occurs at chunk boundaries
- Force-charting mechanics: how radars and roboports keep chunks charted

**Key data points:**

- Chunk size: 32×32 tiles
- Radar: charts chunks in a 7×7 chunk area every ~33 seconds (cycling through sectors)
- Pollution: stored as a single floating-point value per chunk

**Source references:** FFF-161 (chunk update planner), FFF-421 (chunk bucket optimization)

---

### 1.3 — Entity Lifecycle & Registry

Every placed object in Factorio is an **entity** — a discrete simulation object with state, belonging to a chunk, registered in the engine's update lists.

**Diagram content:**

- Entity lifecycle state diagram: blueprint ghost → pending construction → alive (active) → damaged → pending deconstruction → destroyed → ghost (if in blueprint)
- Entity registration: when placed, an entity registers itself with its chunk and relevant update lists (electric network, fluid network, logistics network, transport line, etc.)
- Update categorization: entities that update every tick (inserters in motion, active assemblers), entities that update periodically (idle machines checking for ingredients), entities that sleep (fully idle, removed from update lists)
- The "sleep/wake" mechanism: how the engine avoids updating entities that have nothing to do — an inserter with no items to grab sleeps until an item appears on the belt
- Entity prototype vs. entity instance: the prototype defines behavior and stats; the instance holds runtime state (progress, inventory contents, health, etc.)
- Damage and destruction: HP, resistances, damage types (physical, fire, acid, electric, explosion, laser, poison)

**Source references:** FFF-421 (entity sleep optimization), Factorio Lua API — LuaEntity

---

### 1.4 — Determinism & Multiplayer Model

Factorio's simulation is **perfectly deterministic**: given the same initial state and the same sequence of inputs, every client produces identical results. This is not incidental — it is a core architectural constraint that shapes every system.

**Diagram content:**

- Lockstep model: all clients simulate the same ticks with the same inputs; only player actions are transmitted, not game state
- Input action serialization: every player action (place entity, click GUI, give command) is encoded as an InputAction with a target tick number
- Latency hiding: the local client simulates ahead while waiting for server confirmation; if the server disagrees, the client re-simulates
- Why `math.random()` in Lua mods causes desyncs: the Lua random state is part of the game state; any non-deterministic access corrupts it
- Hash table iteration order: Factorio modified Lua internals to ensure deterministic hash table iteration — a subtle but critical change
- Desync detection: periodic CRC checks of game state between clients
- Replay system: a save file + input log can perfectly reproduce any game session

**Source references:** FFF-302 (multiplayer internals), modding tutorial (desync causes), FFF-388 (tick counter and Lua number precision)

---

## Part II — Transport & Logistics

### 2.1 — Belt Mechanics

Belts are Factorio's most iconic and most optimized system. Internally, they are **transport lines** — arrays of item slots that advance every tick.

**Diagram content:**

- A belt tile contains two **lanes** (left and right), each lane is an array of slots
- Slot spacing determines throughput: yellow belt moves items at 15/s, red at 30/s, blue at 45/s
- Item movement: each tick, every item in every lane advances by the belt's speed value; if the next slot is occupied, the item stops (compression)
- Transport line merging: when belt tiles connect, their lanes merge into a shared transport line for optimized batch processing — this is why long straight belts are cheap on UPS
- Side-loading: when a belt meets another belt perpendicularly, items are loaded onto one lane; this is the basis of lane balancing
- Underground belts: internally, the two ends share a transport line — items "teleport" between them, but the line still has the correct number of slots for the distance
- Splitter logic: input priority, output priority, filter mode — the decision tree per tick
- Compression analysis: when a belt is "fully compressed" (every slot filled) vs. "gapped" — and how gaps propagate

**Key data points:**

| Belt Tier | Items/second | Tiles/tick | Slots per tile |
|-----------|-------------|------------|----------------|
| Yellow    | 15          | 0.03125    | 4.571          |
| Red       | 30          | 0.0625     | 4.571          |
| Blue      | 45          | 0.09375    | 4.571          |

**Source references:** FFF-148 (transport belt optimization), FFF-176 (belt optimization continued)

---

### 2.2 — Inserter Cycle

Inserters are the primary means of moving items between entities. Their behavior is a multi-phase state machine with precise tick-level timing.

**Diagram content:**

- Full cycle state diagram: idle → extend to pickup → grab item(s) → rotate to drop position → insert item(s) → return to idle
- Timing breakdown for each inserter type (in ticks per full cycle, varying by rotation angle and stack size)
- Stack size: base stack size × stack bonus research — more items per grab means fewer cycles
- Pickup logic: what the inserter looks for on the source (belt lane, chest slot, ground, assembler output)
- Drop logic: where items go (belt lane selection, chest slot selection, assembler input matching)
- Circuit control modes: set filter, read hand contents, enable/disable based on signal condition
- Long-handed inserter: extended reach geometry (pickup from 2 tiles away)
- Bulk inserter (Space Age): higher capacity, different swing profile
- Throughput bottleneck analysis: in many factory designs, inserters — not belts or machines — are the limiting factor

**Key data points:**

| Inserter Type   | Extension (ticks) | Rotation (ticks) | Base Stack |
|-----------------|-------------------|-------------------|------------|
| Burner          | 34                | 34                | 1          |
| Regular         | 26                | 26                | 1          |
| Long-handed     | 34                | 34                | 1          |
| Fast            | 17                | 17                | 1          |
| Stack           | 17                | 17                | 12 (researched) |

*(Note: exact tick counts depend on pickup/drop angle and have been community-measured; values are approximate.)*

**Source references:** FFF-224 (inserter optimization), community throughput measurements

---

### 2.3 — Train System

Trains are Factorio's macro-logistics layer — they move bulk materials between distant parts of the factory. The train system is a complex state machine with its own pathfinding, signaling, and scheduling.

**Diagram content:**

- **Train state machine:** MANUAL_CONTROL → WAIT_STATION → ON_THE_PATH → ARRIVE_SIGNAL → WAIT_SIGNAL → ARRIVE_STATION → PATH_LOST → NO_SCHEDULE → DESTINATION_FULL
- **Rail graph:** rail segments form a directed graph; switches are the branch points
- **Signal system:** the rail graph is divided into **blocks** by signals
  - Regular signal: stops the train if the next block is occupied
  - Chain signal: looks ahead through all chain signals until a regular signal; shows the worst state of all exit paths
  - Block states: green (free), yellow (reserved), red (occupied)
- **Pathfinding:** penalty-based A* on the rail graph — each signal, station, and occupancy adds a penalty; the train chooses the lowest-cost path
- **Train stop mechanics:** unique names, train limit (how many trains can path to this stop simultaneously), circuit control
- **Schedule system:** ordered list of stops with wait conditions (time, item count, circuit condition, inactivity)
- **Physics:** acceleration, braking distance, max speed — all affected by locomotive count and cargo weight
- **Deadlock conditions:** when trains block each other in a cycle — diagrammed as a resource dependency graph

**Key data points:**

- Max speed: 298.08 km/h (1.2 tiles/tick)
- Braking distance at max speed: ~85 tiles
- Fuel types affect acceleration bonus: wood (0%) → coal (0%) → solid fuel (+20%) → rocket fuel (+80%) → nuclear fuel (+150%)

**Source references:** FFF-194 (train pathfinding), Factorio Wiki — Railway, community signal tutorials

---

### 2.4 — Robot Logistics

Robots are the late-game alternative to belts — they move items through the air, governed by roboport networks.

**Diagram content:**

- **Roboport anatomy:** supply area (green zone), construction area (orange zone), charging slots, internal robot storage
- **Two robot types, two systems:**
  - Logistics robots: move items between logistic chests
  - Construction robots: place ghosts, repair entities, deconstruct marked items
- **Job assignment:** when a job is created (item requested, ghost placed), the nearest available robot in the network is dispatched
- **Charging cycle:** robots return to roboport when energy is low → wait in queue → charge → resume — the charging queue is often the bottleneck
- **Logistic chest hierarchy and priority:**
  1. Active provider (pushes items into network)
  2. Storage (default dump / pickup location)
  3. Passive provider (items available on request)
  4. Buffer (intermediate storage with request capability)
  5. Requester (pulls items from network)
- **"Fake movement" optimization:** robots don't update position every tick; instead, they calculate their position on-demand based on start time, speed, and destination — dramatically reducing per-tick cost for thousands of robots
- **Network merging:** overlapping roboport zones form a single network; robots can travel across the entire merged network

**Key data points:**

- Logistics robot speed: 0.05 tiles/tick (3 tiles/second base)
- Construction robot speed: 0.06 tiles/tick (3.6 tiles/second base)
- Roboport supply area: 50×50 tiles
- Roboport construction area: 110×110 tiles
- Charging slots per roboport: 4 (plus queue)

**Source references:** FFF-421 (robot update optimization), Factorio Wiki — Logistic network

---

### 2.5 — Fluid System

Fluids (water, oil, sulfuric acid, lubricant, steam) flow through pipes using a pressure-based simulation that is one of Factorio's most computationally expensive systems.

**Diagram content:**

- **Fluid box model:** every entity that handles fluids has one or more "fluid boxes" — internal tanks with a capacity and a current level
- **Pipe segments:** connected fluid boxes form a pipe segment; the engine merges them for batch processing
- **Flow equation:** fluid flows from higher-pressure boxes to lower-pressure boxes; flow rate is proportional to the pressure difference, capped by a per-connection throughput limit
- **Why long pipes are slow:** each pipe adds a fluid box to the segment; more boxes means more steps for pressure to equalize, reducing effective throughput over distance
- **Pipe-to-ground:** reduces the number of fluid boxes in the chain (the underground section counts as a single connection), dramatically improving long-distance throughput
- **Storage tank:** large fluid box (25,000 units) — useful as a buffer and for circuit-based fluid management
- **Oil processing:** crude oil → refinery → heavy oil + light oil + petroleum gas; the classic "backing up" problem when one output is full
- **Cracking chain:** heavy oil → light oil → petroleum gas; the feedback loop that balances oil products — often circuit-controlled
- **Temperature:** steam and heat have temperature values that affect energy content; nuclear steam (500°C) carries more energy than boiler steam (165°C)

**Key data points:**

- Pipe throughput (theoretical max): ~1,200/s for short pipes, dropping significantly over distance
- Storage tank capacity: 25,000 units
- Offshore pump output: 1,200 water/second
- Fluid box base capacity: 100 units (varies by entity)

**Source references:** FFF-274 (fluid system rework), Factorio Wiki — Fluid system

---

## Part III — Production

### 3.1 — Recipe Execution Model

Every crafting machine (assembler, chemical plant, oil refinery, centrifuge, rocket silo) executes recipes using the same underlying model.

**Diagram content:**

- Recipe selection: each machine is assigned a recipe (or auto-detects for furnaces)
- Ingredient check: before starting, the machine verifies all required ingredients are in its input slots
- Crafting progress: each tick, progress increases by `crafting_speed / recipe_energy`; when progress reaches 1.0, the craft completes
- Output handling: if the output slot is full or blocked, the machine stalls at 100% progress — it does not consume ingredients until it can deliver the result
- Power interaction: if power satisfaction drops below 1.0, crafting speed is reduced proportionally — a brownout at 50% satisfaction means 50% crafting speed
- Productivity bonus: when using productivity modules, each completed craft has a chance to produce bonus items — internally tracked as a fractional "productivity accumulator" that grants an extra item when it reaches 1.0
- Quality chance (Space Age): each craft has a probability (from quality modules) to produce a higher-quality output

**Key formulas:**

```
actual_crafting_speed = base_machine_speed × (1 + Σ speed_bonuses) × power_satisfaction
ticks_per_craft = recipe_energy / actual_crafting_speed × 60
```

**Source references:** Factorio Wiki — Crafting, prototype documentation — RecipePrototype

---

### 3.2 — Module & Beacon System

Modules modify the behavior of machines. Beacons share module effects across multiple machines. Together, they are the primary tool for late-game optimization.

**Diagram content:**

- **Module types and effects:**
  - Speed: +crafting speed, +energy consumption
  - Efficiency: −energy consumption (capped at −80%)
  - Productivity: +productivity bonus, +energy consumption, +pollution, −speed
  - Quality (Space Age): +quality chance, −speed
- **Stacking:** multiple modules in one machine — effects are additive
- **Beacon mechanics:** a beacon has module slots but does not craft; it broadcasts its module effects to all machines within its radius, multiplied by a distribution factor (0.5 in vanilla)
- **Beacon geometry:** a typical setup has each assembler within range of multiple beacons — diagrammed as a spatial layout showing overlap zones
- **Productivity restrictions:** productivity modules can only be placed in machines crafting intermediate products (not in miners, not in machines crafting final products like turrets)
- **The "beacon meta":** why the optimal late-game layout is rows of beacons surrounding rows of machines — a spatial optimization problem
- **Diminishing returns visualization:** graphing effective production rate vs. number of beacons, showing where additional beacons stop being worthwhile

**Source references:** Factorio Wiki — Module, Beacon; community ratio calculators

---

### 3.3 — Mining & Resource Extraction

Mining is the entry point of all production chains — the interface between the procedurally generated world and the player's factory.

**Diagram content:**

- **Electric mining drill:** mines a 5×5 area (centered on the 3×3 drill), outputs one item per `mining_time / mining_speed` seconds
- **Mining speed formula:** `base_mining_speed × (1 + Σ speed_bonuses) × power_satisfaction`
- **Resource depletion:** each tile has a finite resource amount; when a tile is depleted, the drill moves to the next tile in its area
- **Infinite resources (oil, etc.):** yield starts high and decreases exponentially toward a minimum (20% in vanilla); the formula: `yield = max(min_yield, initial_yield × 0.9998^amount_mined)`
- **Mining productivity research:** a unique infinite research that effectively makes each ore tile worth more — critically important for megabases
- **Ore patch anatomy:** how map generation creates patches (noise function threshold → shape, richness gradient → per-tile amounts)
- **Pumpjack:** specific to oil extraction; placed on oil wells, outputs crude oil at the well's current yield rate

**Source references:** Factorio Wiki — Mining, Resource, Pumpjack

---

### 3.4 — Full Recipe DAG (Directed Acyclic Graph)

The complete production dependency graph from raw resources to rocket launch.

**Diagram content:**

- **Raw inputs (sources):** iron ore, copper ore, coal, stone, crude oil, water, uranium ore
- **Processing stages:** smelting → basic intermediates → advanced intermediates → products → science packs → rocket parts
- **Graph structure:** each node is an item; each edge is a recipe with input/output quantities
- **Critical path:** the longest chain of dependencies from ore to rocket (passing through processing unit, which requires green circuit → red circuit → blue circuit)
- **High-fan-out nodes:** items used by many recipes — green circuits (used in ~80+ recipes), iron plates, copper plates, steel
- **High-fan-in nodes:** items requiring many ingredients — processing units, low density structures, rocket control units
- **Bottleneck analysis:** which items require the most raw resources per unit, which items have the most complex supply chains
- **Space Age expansion:** additional subgraphs for each planet's unique resources and recipes, showing how inter-planetary logistics creates dependencies between planets

**Visual approach:** a Sankey-style flow diagram showing resource flow from left (raw) to right (finished), with line thickness proportional to item throughput for a reference build (e.g., 1 rocket/minute).

**Source references:** Factorio Wiki — Recipe listing, factoriolab.github.io, kirkmcdonald.github.io

---

### 3.5 — Science & Research

Research is the metagame progression system — the reason the factory needs to grow.

**Diagram content:**

- **Science packs** (7 types in vanilla + space science + planet-specific in Space Age) as the "sinks" of the production graph
- **Lab mechanics:** a lab consumes one set of required packs per research unit; crafting time determines research speed
- **Technology tree:** a separate DAG from the recipe tree — each technology unlocks recipes, entities, or bonuses
- **Technology cost scaling:** many late-game technologies are infinite (mining productivity, artillery range, etc.) with costs that increase per level
- **Research queue:** the player queues technologies; labs work on the current one automatically
- **Space science:** launching a rocket with a satellite produces 1,000 space science packs — the rocket silo as the ultimate "recipe"
- **Lab speed and productivity:** labs accept modules; with productivity modules, each science pack is worth more research

**Source references:** Factorio Wiki — Technologies, Research

---

## Part IV — Energy

### 4.1 — Electric Network Topology

Every powered entity in Factorio belongs to an **electric network** — a connected graph of power poles that aggregates all generation and consumption.

**Diagram content:**

- **Power poles as graph nodes:** small pole (wire reach 7.5), medium (9), big (4 connections, reach 30), substation (wire reach 18, supply area 18×18)
- **Network formation:** poles within wire reach auto-connect; connected poles + all entities in their supply areas form one network
- **Network-level calculation:** each tick, the engine sums total production capacity and total consumption demand for the network, then computes `satisfaction = min(1.0, production / demand)`
- **Priority tiers:**
  - Primary producers: steam engines, solar panels, generators — produce up to their capacity
  - Primary consumers: all machines, inserters, lamps, turrets — consume at rate × satisfaction
  - Secondary: accumulators — charge from excess production, discharge during deficit
- **Satisfaction cascade:** when satisfaction < 1.0, every consumer on the network runs proportionally slower — there is no prioritization between consumers
- **Network splitting:** if a pole is removed and the graph disconnects, two independent networks form instantly

**Source references:** FFF-209 (electric network optimization), Factorio Wiki — Electric system

---

### 4.2 — Power Generation Technologies

Each power source has its own production chain, constraints, and optimal ratios.

**Diagram content — one sub-diagram per technology:**

**Boiler-Steam Engine Chain:**
- Water (offshore pump: 1,200/s) → boiler (consumes fuel, heats water to 165°C steam) → steam engine (converts steam to electricity)
- Perfect ratio: 1 offshore pump : 20 boilers : 40 steam engines = 36 MW
- Fuel types and burn times

**Solar Power:**
- Output curve over one day cycle: full output during day, zero at night, linear ramps at dawn/dusk
- Average output: ~42 kW per panel (70 kW peak × 0.6 effective day fraction)
- Accumulator sizing: 0.84 accumulators per solar panel for continuous power
- Spatial footprint: very large — a solar field for 1 GW covers enormous area

**Nuclear Power:**
- Fuel cell lifecycle: uranium fuel cell → 200 seconds in reactor → depleted fuel cell (reprocessable)
- Heat system: reactor produces heat → heat pipes transfer heat → heat exchangers convert heat to 500°C steam → steam turbines generate electricity
- Neighbour bonus: adjacent reactors give +100% heat output per shared edge — a 2×2 reactor setup produces 480 MW (not 4×40=160 MW)
- Kovarex enrichment: the positive feedback loop for uranium-235 production
- Ratios: 1 reactor (40 MW base) → 4 heat exchangers → 7 steam turbines (with neighbour bonus, these scale)

**Space Age generators:**
- Vulcanus: volcanic vents as heat source
- Fulgora: lightning rods harvesting atmospheric electricity — stochastic input
- Aquilo: fusion reactor — high-tech, high-output

**Source references:** Factorio Wiki — Power production, Nuclear power, Solar energy

---

### 4.3 — Power Failure Dynamics

What happens when the electric network cannot meet demand.

**Diagram content:**

- **Satisfaction < 1.0:** every consumer receives reduced power proportionally
- **Cascade diagram:** step-by-step failure scenario:
  1. Power demand exceeds supply (e.g., sunset for solar-dependent base)
  2. Satisfaction drops → machines slow down → production decreases
  3. Laser turrets draw large spikes during attacks → satisfaction drops further
  4. Inserters feeding turrets slow down → ammo delivery slows → defenses weaken
  5. Boilers may lose fuel supply if mining/smelting is on the same network → further power loss
  6. Potential total collapse: the "death spiral"
- **Prevention strategies:** shown as feedback-breaking interventions (accumulators, separate defense grid, fuel stockpiles)
- **Brownout vs. blackout:** with satisfaction at 0.5, everything runs at half speed; at 0.0, nothing runs

**Source references:** Community guides, Factorio Wiki — Electric system

---

## Part V — Pollution, Evolution & Combat

### 5.1 — Pollution Diffusion Model

Pollution is a 2D field stored per-chunk that spreads outward from the factory.

**Diagram content:**

- **Generation:** every entity that consumes energy produces pollution proportional to its energy usage × pollution_modifier; specific values for each entity type
- **Per-chunk accumulation:** all pollution generated within a chunk is added to that chunk's pollution value
- **Diffusion:** each tick, a percentage of each chunk's pollution spreads to its 4 cardinal neighbours (the exact percentage depends on tile absorption)
- **Absorption:** each tile type absorbs some pollution — trees are the primary absorbers; water tiles absorb a moderate amount; desert and concrete absorb very little
- **Steady state:** when absorption + diffusion outward = generation, the pollution cloud stabilizes
- **Visualization:** the pollution cloud as a heat map radiating from the factory center, with "fingers" extending along transport corridors (which have no trees to absorb)

**Key data points:**

| Entity               | Pollution/min |
|----------------------|---------------|
| Boiler               | 30            |
| Steam engine         | ~9            |
| Assembler 1          | 4             |
| Assembler 2          | 3             |
| Assembler 3          | 2             |
| Electric mining drill| 10            |
| Stone furnace        | 2             |
| Steel furnace        | 4             |
| Electric furnace     | 1             |

**Source references:** Factorio Wiki — Pollution

---

### 5.2 — Evolution Mechanics

Evolution is a global scalar (0.0 to 1.0) that determines how dangerous enemies are. It never decreases.

**Diagram content:**

- **Three contributing factors:**
  - Time: small increase every tick (`time_factor × (1 - evolution)`)
  - Pollution: proportional to total pollution generated (`pollution_factor × pollution_increase × (1 - evolution)`)
  - Destruction: discrete increase when a spawner or worm is killed (`destroy_factor × (1 - evolution)`)
- **The `(1 - evolution)` multiplier:** growth slows as evolution approaches 1.0 — asymptotic approach
- **Evolution → unit composition:** at evolution 0.0, only small biters; at 0.5, medium biters and spitters appear; at 1.0, behemoth-class enemies dominate
- **Spawner unit table:** a probability distribution indexed by evolution — diagrammed as stacked area chart showing unit mix over evolution range
- **Game difficulty effect:** default evolution factors vs. marathon/deathworld presets

**Key default factors:**

```
time_factor:     0.000004  per tick
pollution_factor: 0.000015 per unit of pollution
destroy_factor:   0.002    per spawner killed
```

**Source references:** Factorio Wiki — Enemies, Evolution

---

### 5.3 — Biter AI & Attack Behavior

Biters are not random — they respond to pollution through a defined behavioral system.

**Diagram content:**

- **Pollution absorption by spawners:** when the pollution cloud reaches a biter nest, the spawner "absorbs" pollution; when enough is absorbed, it spawns a unit and adds it to an attack group
- **Unit group formation:** spawned units accumulate into a group; when the group reaches sufficient size, it begins pathfinding toward the pollution source
- **Pathfinding:** biters use a simplified pathfinder toward the chunk with the highest pollution — not the nearest factory entity, but the dirtiest area
- **Attack behavior:** the group moves as a unit; upon reaching the target, individual biters attack the nearest enemy entity (walls, turrets, structures)
- **Expansion behavior:** separately from attacks, biter groups periodically move to colonize new territory — they create new nests at expansion destinations
- **Worm placement:** worms spawn near nests, with type determined by evolution; they are stationary defensive units

**Source references:** Factorio Wiki — Enemies, FFF-183 (biter AI)

---

### 5.4 — Defence Systems

Player defences form a system that consumes resources to counter the threats generated by pollution.

**Diagram content:**

- **Turret types and properties:**
  - Gun turret: consumes ammo, cheap, reliable, no power needed
  - Laser turret: uses electric power (large spike per shot), no ammo, expensive
  - Flamethrower turret: uses fluid fuel, area damage, most cost-effective for large groups, friendly fire risk
  - Artillery turret: extreme range, auto-targets nests, expensive ammo
- **Targeting AI:** each turret tracks the nearest enemy within range; priority shifts to enemies already being attacked (focus fire)
- **Damage calculation:** `damage = base_damage × (1 + Σ research_bonuses) - target_resistance`
- **Wall and gate mechanics:** walls have HP pools, gates open for players/vehicles/trains
- **Defence as feedback loop:** more defence → more power needed → more pollution → more attacks → more defence needed

**Source references:** Factorio Wiki — Turret, Damage, Military

---

## Part VI — Circuit Network

### 6.1 — Wire Types & Signal Model

The circuit network is Factorio's in-game programming system — a way to control entities based on dynamic conditions.

**Diagram content:**

- **Two wire types:** red and green — each carries an independent set of signals; when both connect to an entity, the entity sees the sum of both networks
- **Signal definition:** a signal is a (type, count) pair — the type is any item, fluid, or virtual signal; the count is a 32-bit signed integer
- **Signal propagation:** signals are instantaneous within a network — all entities on the same wire see the same values in the same tick
- **Entity interactions:** which entities can read/write signals (inserters, belts, chests, lamps, train stops, speakers, pumps, power switches, etc.)
- **Read vs. write:** some entities read signals (inserter: enable/disable based on condition), some write (chest: broadcast current contents), some do both

**Source references:** Factorio Wiki — Circuit network

---

### 6.2 — Combinators

Combinators are the computational elements of the circuit network.

**Diagram content:**

- **Arithmetic combinator:** takes an input signal, applies an operation (+, −, ×, ÷, %, ^, <<, >>, AND, OR, XOR), outputs a result signal — one tick latency
- **Decider combinator:** evaluates a condition (signal comparison); if true, outputs specified signals — one tick latency
- **Constant combinator:** always broadcasts a fixed set of signals — zero latency
- **Selector combinator (2.0):** selects signals based on index, random, or stack size — one tick latency
- **Critical detail: 1-tick delay** — every combinator introduces exactly one tick of delay between input and output; this is the foundation of all circuit timing
- **Feedback loops:** connecting a combinator's output back to its input creates a register (memory) that updates once per tick
- **Turing completeness:** with arithmetic and decider combinators, the circuit network is theoretically Turing complete (though practically limited by space and UPS)

**Source references:** Factorio Wiki — Combinators

---

### 6.3 — Common Circuit Patterns

Practical circuit designs that emerge from the primitive components.

**Diagram content — one mini-schematic per pattern:**

- **SR Latch:** set/reset memory using cross-connected decider combinators — used for "turn on pump when tank below 20%, turn off when above 80%"
- **Clock:** arithmetic combinator adding 1 to itself each tick, with a decider resetting at a threshold — produces a periodic pulse
- **Counter:** accumulates a value over time — useful for tracking items produced
- **Memory cell:** stores a snapshot of a signal value — using the enable/disable trick with a constant combinator
- **Smart inserter control:** "insert only when chest has fewer than N items" — prevents overloading
- **Belt reader → load balancer:** reading belt contents to distribute items evenly across parallel production lines
- **Oil cracking controller:** measures fluid levels, enables/disables cracking to maintain balanced outputs
- **Train dispatcher:** circuit-controlled train stops that dynamically enable/disable based on supply and demand

**Source references:** Factorio Wiki — Tutorial:Circuit network cookbook, community circuit designs

---

## Part VII — Map Generation

### 7.1 — Noise Functions & Terrain

The world is procedurally generated using layered noise functions seeded by the map seed.

**Diagram content:**

- **Noise layers:** multiple Perlin/simplex noise functions at different frequencies and amplitudes are combined
- **Named noise expressions:** elevation, moisture, aux (auxiliary), temperature — each a function of position
- **Biome selection:** the combination of elevation, moisture, and temperature at a given position determines which tile set appears (grass, desert, sand, snow, volcanic, etc.)
- **Tile properties:** each tile type has gameplay-relevant attributes — walking speed modifier, vehicle friction, pollution absorption rate, decorative style
- **Autoplace controls:** map generation settings that scale the noise expressions — resource frequency, size, richness; water coverage; cliff frequency; enemy base frequency
- **Starting area:** a guaranteed safe zone with minimum resources and no/few enemies within a configured radius

**Source references:** Factorio Wiki — Map generator, noise expressions; FFF-258 (map generation)

---

### 7.2 — Resource Placement

Ore patches, oil fields, and other resources are placed by thresholding and shaping noise functions.

**Diagram content:**

- **Ore noise:** each resource type has its own noise expression; where the value exceeds a threshold, ore is placed
- **Patch shape:** the noise contour above threshold defines the patch boundary — typically blob-shaped
- **Richness gradient:** within a patch, the per-tile resource amount follows a separate noise function — center tiles tend to be richer
- **Starting area guarantee:** the generator ensures minimum quantities of iron, copper, coal, stone, and a water source near spawn
- **Distance scaling:** patches further from spawn tend to be larger and richer — controlled by a distance multiplier in the noise expression
- **Oil specifics:** oil wells are placed as point entities (not per-tile), with initial yield values that decrease with extraction
- **Uranium:** rarer, appears at greater distances from spawn

**Source references:** Factorio Wiki — Map generator, Resource

---

### 7.3 — Cliffs & Water

Terrain features that constrain player building and movement.

**Diagram content:**

- **Cliffs:** generated at specific elevation contour lines — they form barriers that block building and movement until destroyed with cliff explosives
- **Cliff frequency/continuity settings:** how dense and unbroken the cliff lines are
- **Water bodies:** generated where elevation drops below a threshold — creates lakes, rivers, and oceans that block movement but provide water access for offshore pumps
- **Landfill:** the player's tool for converting water tiles to buildable land — an expensive but powerful terraforming option
- **Trees and rocks:** decorative entities placed during generation that provide pollution absorption (trees) and raw materials when harvested (rocks)

**Source references:** Factorio Wiki — Map generator, Cliff

---

## Part VIII — Factorio 2.0 & Space Age: The Rebuilt Machine

Space Age is not an add-on bolted onto Factorio 1.1 — it is a co-release with Factorio 2.0, which reworked core engine systems, rewrote the fluid simulation, removed features (expensive recipes, rocket control units), added new entity types, and restructured the tech tree. Treating "Space Age" as a separate chapter underestimates the scope: roughly half of the simulation described in Parts I–VII was modified or extended by 2.0/SA. This Part documents what changed and what was added.

---

### 8.1 — Engine & Core Systems Changes (2.0)

The 2.0 update changed foundational systems that affect every factory, regardless of whether Space Age is enabled.

**Diagram content:**

**Fluid system overhaul:**
- The 1.1 fluid simulation used an iterative pressure-equalization model that was order-dependent, hard to predict, and expensive to compute
- 2.0 replaced it with a simplified, more deterministic model: pipe segments are merged more aggressively, flow is calculated per-segment rather than per-pipe-entity
- Junction behavior is now predictable: T-junctions and crosses distribute fluids consistently
- Old "tricks" (e.g., specific pipe placement order affecting throughput) no longer apply
- The simulated fluid system option from 1.1 was removed entirely

**Removed mechanics:**
- **Expensive recipes** (marathon mode): removed from the game — previously a core difficulty modifier that doubled ingredient costs
- **Rocket control units:** removed as an item; the recipe chain is simplified
- **Space science from satellite:** in 1.1, launching a rocket with a satellite produced 1,000 space science; in 2.0 (without SA), space science works differently — the rocket silo itself generates science while launching
- **Lab chaining:** removed as a mechanic

**Electric network changes:**
- Combinators (arithmetic, decider, selector) are now primary energy consumers with buffer — they fail gracefully during brownouts instead of stopping instantly
- Constant combinators and display panels do not require power — ensuring monitoring works during blackouts

**Rail system overhaul:**
- New rail graphics and tile alignment
- Existing 1.1 rail blueprints are incompatible with 2.0 rail grid
- Rail supports for elevated rails (SA-specific, but the engine support is in 2.0)

**Source references:** FFF-416 (fluid rework), Version 2.0.7 changelog, community migration reports

---

### 8.2 — Train System 2.0: Interrupts, Groups & Priority

The 2.0 train system is fundamentally different from 1.1. These changes affect the train state machine described in Part II.3.

**Diagram content:**

**Schedule interrupts:**
- Interrupts are a new layer in the train schedule: a list of conditions + temporary stops that override the normal schedule
- Whenever a train leaves a station, it evaluates all interrupts top-to-bottom; the first matching interrupt activates, injecting its stops as temporary schedule entries
- Conditions include: cargo contents, fuel level, circuit conditions, time since last stop, destination full
- This enables **generic trains**: a single train with interrupts for each cargo type replaces dozens of dedicated trains — "if carrying iron ore, go to iron smelting; if carrying copper ore, go to copper smelting"
- The interrupt-based approach fundamentally changes train network design: instead of N dedicated routes, one shared pool of trains handles all routes dynamically

**Train groups:**
- Trains can be named and grouped; all trains in a group share the same schedule
- Editing one train's schedule updates the entire group
- Temporary stops (from interrupts or manual commands) remain per-individual-train

**Train stop changes:**
- Disabled stops now act as "train limit = 0" instead of causing skip-and-repath — fixing a major source of unpredictable behavior in 1.1
- Stops that don't exist in the network put the train into "No path" state instead of silently skipping
- Train stop priority: adjustable 0–255 value (default 50) that influences pathfinding — higher priority stops are preferred when multiple valid destinations exist
- Priority can be controlled via circuit network, enabling dynamic routing

**Visualization improvements:**
- "No path" and "Destination full" states are shown as icons on locomotives instead of flying text
- Train status is visible in GUI and tooltip

**Impact on Part II.3:** the train state machine gains new states (INTERRUPT_ACTIVE, GROUP_SCHEDULE_UPDATE) and the pathfinding algorithm incorporates priority as an additional penalty term.

**Source references:** FFF-389 (interrupts), FFF-395 (generic interrupts, priority), Version 2.0.7 changelog

---

### 8.3 — Circuit Network 2.0: New Components & Capabilities

The circuit network (Part VI) gained significant new components in 2.0.

**Diagram content:**

**Selector combinator:**
- New combinator type that selects signals by index, count, random, quality, or stack size
- Modes: select Nth largest/smallest signal, count total unique signals, random selection with configurable update interval
- 1-tick latency like other combinators
- Enables complex sorting and filtering that previously required chains of decider combinators
- Energy consumption: 1kW (reduced from initial 5kW)

**Enhanced decider combinator:**
- Now supports multiple conditions (AND/OR) and multiple outputs per single combinator
- Dramatically reduces combinator count for complex logic

**Enhanced arithmetic combinator:**
- Can now select red/green network independently for input signals
- Supports Each-Each operations: apply an operation to every signal pair

**Display panel:**
- 1×1 entity that shows icons, text, or signal values on the map
- Circuit-controllable: can change display based on network conditions
- Does not require power — always visible, even during blackouts
- Replaces many "lamp array" solutions for status displays

**Belt segment reading:**
- Transport belts connected to circuit network can now read the contents of the entire belt segment, not just the single tile
- Eliminates the need to wire every belt tile for content monitoring

**Roboport circuit integration:**
- Roboports can output logistic network contents and pending requests to circuit network
- Enables circuit-based logistics management without per-chest wiring

**Splitter circuit connection (added in 2.0.67):**
- Splitters can now be connected to circuit network
- Enables dynamic filtering and routing based on signal conditions

**Impact on Part VI:** the combinator catalog expands from 3 to 4 types; the display panel adds a new output modality; belt/roboport reading changes data flow patterns significantly.

**Source references:** FFF-405 (belt reading), FFF-419 (display panel), FFF-428 (roboport circuit), Version 2.0.7/2.0.67 changelogs

---

### 8.4 — Multi-Surface Architecture

Space Age transforms Factorio from a single-surface game into a multi-surface simulation. This is the deepest architectural change.

**Diagram content:**

**Surface model:**
- In 1.1, there was effectively one surface (Nauvis) with one chunk grid, one pollution map, one set of logistics networks
- In 2.0/SA, each planet and each space platform is a separate **surface** — an independent instance of the entire world simulation
- Each surface has its own: chunk grid, pollution map, electric networks, logistics networks, fluid networks, enemy bases, day/night cycle, map generation parameters, surface properties

**Surface properties:**
- Each surface defines environmental parameters: solar power multiplier, gravity, magnetic field, pressure, day/night cycle length
- These properties affect gameplay: solar panels produce different amounts on different planets; some entities freeze on cold planets; pollution behaves differently

**Simultaneous simulation:**
- All active surfaces are updated every tick — Nauvis, Vulcanus, Fulgora, Gleba, Aquilo, and every space platform
- This multiplies the simulation cost: a late-game save with 5 planet bases and 10 space platforms is simulating 15+ independent surfaces
- Electric network threading (FFF-209/421) becomes critical: each surface's networks can be parallelized

**Surface transitions:**
- Players transition between surfaces via rocket launch → space platform → orbit → landing
- Items transition via rocket silo → cargo rocket → cargo landing pad
- The transition involves serializing the player's state (inventory, equipment, position) on one surface and deserializing on another

**Inter-surface logistics:**
- Rocket silo: the sender — launches cargo rockets carrying items to a specific destination
- Cargo landing pad: the receiver — accepts incoming rockets, stores items in output inventory
- Circuit control: rocket silos and landing pads connect to circuit networks for automated logistics
- There is no real-time connection between surfaces — all transport has rocket flight latency

**Diagram approach:** show the surface hierarchy as a tree: root engine → surfaces (planets + platforms) → per-surface subsystems (chunks, networks, etc.). Arrows show inter-surface connections (rockets, player travel).

**Source references:** FFF-373 (Space Age announcement), FFF-398 (space platforms), Factorio Wiki — Surface

---

### 8.5 — Space Platforms

Space platforms are mobile player-built surfaces that serve as factories in space, transport vessels, and asteroid mining stations.

**Diagram content:**

**Platform as surface:**
- A space platform is its own surface with a limited buildable area
- It has the full entity system: belts, inserters, assemblers, chests, turrets, circuit network all work on platforms
- No terrain — just platform tiles placed by the player, surrounded by void

**Platform states:**
- Orbiting: stationary above a planet — can exchange cargo with the planet's rocket silos and cargo landing pads
- Traveling: moving between planets — asteroid fields appear, speed depends on thruster configuration
- Waiting: at a destination orbit with no further orders

**Thruster mechanics:**
- Speed is determined by thruster count relative to platform width (not weight/mass, contrary to intuition)
- Narrower platforms with more thrusters travel faster
- Thrusters consume thruster fuel (oxidizer + fuel) continuously during travel
- The speed formula creates a design tension: wider platforms can hold more factories but travel slower

**Asteroid system:**
- During travel, asteroid fields appear on the platform's surface edges
- Three asteroid types: metallic (iron, copper), carbonic (carbon, coal), oxide (stone-like)
- Asteroids must be destroyed by turrets or they damage/destroy platform tiles
- Destroyed asteroids drop chunks that can be collected and processed into resources
- Asteroid density and composition varies by route (which planets you're traveling between)
- This creates a "tower defense in space" minigame: the platform must produce enough ammo/power to survive the transit while also processing asteroid resources

**Platform hub:**
- Central entity — if destroyed, the entire platform is lost
- Provides initial logistics capabilities
- Cannot be moved once placed

**Key design constraint:** platforms have no natural resources — everything must come from asteroid mining during transit or from cargo launched from planets. This forces compact, efficient factory designs within severe space limitations.

**Source references:** FFF-398 (space platforms), FFF-399 (asteroid system), Factorio Wiki — Space platform

---

### 8.6 — Quality System

Quality adds a multiplicative complexity layer to every item, entity, and recipe in the game. It is architecturally significant because it transforms every item from a single type to five variants.

**Diagram content:**

**Quality tiers:**
- Normal → Uncommon → Rare → Epic → Legendary
- Each tier improves the base stats of the item/entity: HP, speed, capacity, range, damage, etc.
- The multipliers are consistent within categories but vary by stat: e.g., a Legendary assembler is significantly faster than Normal

**Quality generation:**
- Quality modules are the sole source of quality chance during crafting
- When crafting with quality modules, each completed craft rolls for quality: the result is either the same quality as inputs or higher
- Quality probability is per-module-tier: Quality Module 1/2/3 grant increasing chances
- Quality chance stacks with multiple modules and beacons
- Productivity and quality interact: productivity bonus items also roll for quality independently

**Quality module restrictions:**
- Quality modules occupy the same slots as other modules — there is a direct tradeoff: speed/productivity vs. quality chance
- Quality modules cannot be used in mining drills (quality ore doesn't exist)
- Quality can only be generated at the crafting stage

**Recycler:**
- New entity type exclusive to SA — reverses recipes, returning 25% of ingredients
- Recycling time = 1/16 of the original recipe time (effectively fast)
- Key strategy: craft item → check quality → if not desired quality → recycle → recraft → repeat
- The recycler loop is the primary method for obtaining high-quality items: a probabilistic grind
- Items without valid recipes return 25% of themselves (75% destroyed)
- Exception: biological items (nutrients) return spoilage instead

**Quality cascade through the recipe DAG:**
- To build a Legendary entity, you need Legendary intermediate products
- Legendary intermediates require Legendary sub-intermediates
- This propagates quality requirements up the entire production chain
- In practice, players build dedicated "quality grinding" facilities: massively parallel craft→recycle loops for key items
- The expected number of cycles to reach Legendary from Normal is very high — creating enormous resource sinks

**Quality and entity stats — per-tier multiplier table:**

| Quality     | Health | Speed | Mining prod. | Other bonuses     |
|-------------|--------|-------|--------------|-------------------|
| Normal      | ×1.0   | ×1.0  | ×1.0         | —                 |
| Uncommon    | ×1.3   | ×1.3  | ×1.3         | Varies by entity  |
| Rare        | ×1.6   | ×1.6  | ×1.6         | Varies by entity  |
| Epic        | ×1.9   | ×1.9  | ×1.9         | Varies by entity  |
| Legendary   | ×2.5   | ×2.5  | ×2.5         | Varies by entity  |

*(Note: exact multipliers vary by entity type and stat; table shows representative values.)*

**Markov chain model:** the quality grind can be modeled as an absorbing Markov chain where each state is a quality tier, transition probabilities come from quality module configuration, and the absorbing state is the desired quality tier. Expected iterations to absorption can be computed analytically.

**Impact on Parts III and X:** quality transforms every production ratio calculation (Part III) and adds a new feedback loop to the system-of-systems diagram (Part X): production → quality grind → resource consumption → need for more production.

**Source references:** FFF-375 (quality), Factorio Wiki — Quality, Recycler

---

### 8.7 — New Crafting Machine Types

Space Age introduces four new crafting machines, each with unique properties that extend the recipe execution model (Part III.1).

**Diagram content:**

**Foundry (Vulcanus):**
- Combines smelting and assembling in one machine
- Crafting speed: 4.0 (very fast — faster than Assembler 3's 1.25)
- Module slots: 4
- Base productivity: +50% (built-in, stacks with productivity modules)
- Exclusive recipes: molten metal casting (iron, copper from lava), carbonless steel
- Game-changer: replaces entire furnace arrays with compact foundry setups; the +50% base productivity means fewer resources needed
- Unlocked on Vulcanus, but can be exported and used on any planet

**Electromagnetic Plant (Fulgora):**
- Specialized assembler for electronic and electromagnetic recipes
- Crafting speed: 2.0
- Module slots: 5
- Base productivity: +50%
- Exclusive recipe categories: circuits, modules, solar panels, power infrastructure
- Game-changer: with 5 module slots and +50% productivity, it massively improves circuit production — the most common bottleneck in vanilla
- Unlocked on Fulgora, exportable

**Biochamber (Gleba):**
- Processes organic materials (fruits, nutrients, bioflux)
- Crafting speed: 2.0
- Module slots: 4
- Base productivity: +50%
- Unique mechanic: **requires nutrients as fuel** — consumes nutrients continuously while operating, similar to how burner machines consume coal
- Nutrients spoil, creating a supply chain management challenge
- Can also perform some chemistry recipes (oil cracking) — using biological catalysts
- Unlocked on Gleba; usable elsewhere if nutrients are imported

**Cryogenic Plant (Aquilo):**
- Handles recipes requiring extreme cold
- Specialized in superconductor-tier and fusion-related crafting
- Unique recipes: cryogenic science packs, fusion-related components
- Unlocked on Aquilo — the final-tier crafting machine

**Impact on Part III.1:** the recipe execution model gains a new parameter — base productivity per machine type. The crafting speed formula becomes:
```
effective_output = items_per_craft × (1 + base_productivity + Σ module_productivity) × crafting_speed
```

The four new machines don't just add recipes — they retroactively change optimal production layouts on Nauvis: a foundry-based smelting setup on Nauvis is strictly superior to a furnace array.

**Source references:** Factorio Wiki — Foundry, Electromagnetic plant, Biochamber, Cryogenic plant

---

### 8.8 — Spoilage System

Spoilage is a fundamentally new simulation mechanic with no equivalent in vanilla Factorio or SimCity. It adds a **time dimension** to items.

**Diagram content:**

**Spoilable items:**
- Certain items (primarily from Gleba) have a **spoilage timer** — a countdown in ticks from creation
- When the timer reaches zero, the item transforms into a different item (typically "spoilage" — a low-value waste product)
- The timer is per-item-instance, not per-stack — every individual item has its own remaining lifetime

**Spoilage chain:**
- Yumako fruit → (spoils to) → spoilage
- Jellynut fruit → (spoils to) → spoilage
- Nutrients → (spoils to) → spoilage
- Bioflux → (spoils to) → spoilage (longer timer)
- Some processed items spoil into other useful items rather than waste

**Timer mechanics:**
- Timers tick down continuously, regardless of where the item is (belt, chest, machine, rocket cargo)
- Items on faster belts reach their destination sooner, reducing spoilage losses — belt speed becomes a survival tool, not just a throughput tool
- Stacks in chests spoil individually — a stack of 50 nutrients doesn't spoil all at once; each nutrient has its own timer based on when it was crafted
- Quality affects spoilage time: higher quality items spoil more slowly

**Design implications:**
- Traditional "buffer everything" factory design fails on Gleba — large chests of buffered ingredients will rot
- Production must be **just-in-time**: produce only what is needed, when it is needed
- Long belts become problematic: transit time on a belt counts against the spoilage timer
- The factory must "flow" continuously — any backup or blockage risks cascade spoilage
- This creates a fundamentally different optimization target: instead of maximizing throughput, the player must minimize **dwell time** — how long items spend in the system

**Spoilage as fuel:**
- Spoilage items can be burned as low-grade fuel or used in some recipes
- This creates a waste-management subproblem: dispose of spoilage or find a use for it
- Recyclers can process spoiled items, adding another option

**Impact on Part II (Transport):** belt speed is no longer just about throughput — it's about item survival. Underground belts "teleport" items, effectively pausing their spoilage during transit (items still spoil, but the shorter belt path means less time). Train transport becomes preferable for long-distance organic logistics because trains are faster than belts.

**Impact on Part X (Feedback Loops):** spoilage adds a new balancing loop — overproduction → items spoil → wasted resources → need to produce more. Unlike pollution (which is a positive feedback loop), spoilage is a **negative feedback loop** that punishes excess.

**Source references:** Factorio Wiki — Spoilage, Gleba; FFF-403 (agricultural mechanics)

---

### 8.9 — Interplanetary Logistics

Moving items between planets is a new logistics layer that sits above all existing transport systems.

**Diagram content:**

**Rocket silo (sender):**
- The rocket silo in 2.0/SA is redesigned: it launches cargo rockets, not victory rockets
- Rockets are cheaper than in 1.1 (to support frequent launches)
- The silo has an inventory for cargo; items placed in the cargo are launched with the rocket
- Circuit network integration: the silo can be automated to launch when cargo inventory meets conditions
- Each rocket launch delivers its cargo to a specified destination (planet orbit or space platform)
- Launch frequency is limited by rocket build time and fuel supply

**Cargo landing pad (receiver):**
- Ground-side entity that receives incoming cargo rockets
- Has output inventory that can be accessed by inserters
- Only one landing pad per surface can receive from each source (exact mechanics may vary)
- Circuit readable: signals what cargo is available

**Logistics flow diagram:**
```
Planet A                         Space/Orbit                      Planet B
─────────                        ──────────                       ─────────
Factory → Inserter → Rocket Silo → Cargo Rocket → (flight time) → Cargo Landing Pad → Inserter → Factory
                                       ↕
                                Space Platform
                                (can intercept, process, reroute)
```

**Latency:**
- Rocket flight is not instant — there is a transit time between launch and delivery
- This latency means interplanetary logistics cannot be "just-in-time" for critical items
- Buffer stocks at landing pads are necessary — creating tension with spoilage mechanics for Gleba exports

**Multi-planet supply chain design:**
- Each planet specializes in certain products (foundry goods from Vulcanus, electronics from Fulgora, bioflux from Gleba)
- Finished or semi-finished products are shipped rather than raw materials (to minimize rocket cargo)
- The player must design "export manifests" — which items to ship, in what quantities, on what schedule
- Circuit-controlled rocket silos can automate this based on remote demand signals (via constant combinators set to represent requests)

**Impact on Part III.4 (Recipe DAG):** the recipe graph gains inter-surface edges — some recipes can only be performed on specific planets, creating a distributed manufacturing problem. The DAG becomes a hypergraph where nodes are tagged with planet constraints.

**Source references:** Factorio Wiki — Rocket silo (2.0), Cargo landing pad, Space Age logistics

---

### 8.10 — Vulcanus: Lava, Foundries & Waterless Industry

Vulcanus is a volcanic planet where conventional resource extraction doesn't work.

**Diagram content:**

**Environment:**
- Terrain: volcanic rock, lava lakes, sulfuric acid pools, calcite deposits
- No water — offshore pumps cannot be placed; steam power requires alternative approaches
- Lava is pumpable as a fluid — the primary "liquid resource"
- Volcanic vents provide heat for power generation

**Resource chain:**
- Lava → pump → foundry → molten iron / molten copper → casting → plates
- This replaces the entire ore → furnace → plate chain from Nauvis
- Calcite: used in recipes and as a catalyst
- Tungsten ore → tungsten carbide (extremely hard material for advanced recipes)
- Coal is available for carbon-based chemistry

**Foundry mechanics (detailed):**
- The foundry accepts liquid metal and casts it directly into plates or even finished products
- Casting recipes skip the smelting step — lava → plates in one machine
- With +50% base productivity: effectively 1.5 plates per 1 plate worth of lava input
- This means Vulcanus foundries, when exported to Nauvis, outperform any furnace setup

**Unique challenges:**
- No water means no steam engines from boilers — must use volcanic heat or solar
- Cliff explosives are unlocked here (locked behind Vulcanus tech in SA) — essential for base expansion
- Artillery is also unlocked on Vulcanus — key defensive technology
- Demolishers: massive worm-like enemies unique to Vulcanus that patrol paths and destroy anything in their way

**Technologies unlocked:**
- Foundry, cliff explosives, artillery, big mining drill, advanced metallurgy
- These technologies benefit all planets when exported

**Source references:** Factorio Wiki — Vulcanus, Foundry; FFF-planet-reveal posts

---

### 8.11 — Fulgora: Scrap, Lightning & Reversed Resource Flow

Fulgora inverts the normal resource flow: instead of refining raw materials up, you decompose complex items down.

**Diagram content:**

**Environment:**
- Desert landscape with rocky islands surrounded by heavy oil oceans
- Ruins of an ancient civilization scattered across the surface — source of scrap
- Periodic lightning storms: massive electrical discharges that can be captured
- No conventional ore deposits — scrap is the only minable resource

**Scrap processing — the reversed recipe DAG:**
- Mining scrap yields a probabilistic mix of items: iron gear wheels, copper cables, circuits (green, red, blue), steel, low density structures, and more
- This is the **inverse** of normal Factorio: you start with advanced products and must decompose them into basic materials
- Recyclers are essential: unwanted items are recycled back into their components
- The challenge is flow management: scrap produces random outputs that must be sorted, filtered, and balanced
- Belt filters and splitter priorities become critical tools
- Excess of one product can back up the entire system — "clogging" is the primary failure mode

**Lightning power:**
- Lightning rods capture atmospheric electricity during storms
- Power output is stochastic: high bursts during storms, zero between storms
- Accumulators are essential for buffering
- Lightning rod placement affects capture efficiency
- This creates a unique power curve: spiky, unpredictable, requiring large buffer capacity

**Electromagnetic plant:**
- Unlocked on Fulgora — specialized for electronic recipes
- 5 module slots + 50% base productivity = massive circuit production efficiency
- When exported to other planets, revolutionizes electronic manufacturing

**Holmium:**
- Unique resource — advanced conductive material
- Used in electromagnetic science packs and high-tier recipes
- Only available on Fulgora

**Technologies unlocked:**
- Electromagnetic plant, recycler, Tesla turret, lightning rod, holmium processing
- Electromagnetic science pack enables quality module 3, epic quality research

**Source references:** Factorio Wiki — Fulgora, Scrap, Recycler, Lightning rod

---

### 8.12 — Gleba: Agriculture, Spoilage & Biological Engineering

Gleba is the most mechanically novel planet — it introduces time-limited resources that fundamentally challenge conventional factory design.

**Diagram content:**

**Environment:**
- Lush, swampy, overgrown landscape with wetlands and fertile soil
- Two harvestable plant species: Yumako and Jellynut, growing in patches
- Pentapods: large insect-like enemies unique to Gleba — stompers can walk over walls, making conventional defenses inadequate
- No conventional ores except stone

**Agricultural tower:**
- New entity type: automatically harvests plants within its radius and replants them
- Cycle: plant grows → matures → tower harvests → replant → growth timer restarts
- Output: raw fruits (Yumako fruit, Jellynut seed)
- The tower replaces mining drills as the primary resource extraction entity on Gleba

**Biological processing chain:**
```
Yumako fruit → Yumako mash → Bioflux ← Jellynut mash ← Jellynut seed
                                  ↓
                              Nutrients → (fuel for biochambers)
                                  ↓
                         Agricultural science pack
```
- Every step has spoilage: raw fruits spoil fastest, bioflux spoils slowest
- The entire chain must run continuously — any interruption causes cascade spoilage
- Nutrients serve dual purpose: science pack ingredient AND fuel for biochambers

**Spoilage mechanics on Gleba (specific):**
- Yumako fruit: short spoilage timer (~minutes)
- Jellynut seed: short spoilage timer
- Nutrients: medium spoilage timer
- Bioflux: longer spoilage timer — the "stable" form of Gleba's output, suitable for export
- Spoilage (waste item): can be used as low-grade fuel or recycled
- Spoilage timers are affected by quality: higher quality = slower spoilage

**Design paradigm shift:**
- On Nauvis, the optimal strategy is to overproduce and buffer everything
- On Gleba, the optimal strategy is **just-in-time production** with minimal buffers
- Factory layouts must be compact: shorter belts = less transit time = less spoilage
- Direct insertion (machine-to-machine) is strongly favored over belt-based designs
- The player must think about **throughput timing**, not just throughput volume

**Pentapod combat:**
- Stompers: large enemies that walk over walls — standard wall+turret defenses fail
- Strafers: ranged enemies
- Landmines + Tesla turrets are the primary defensive solution
- No evolution mechanic on Gleba — pentapod spawning follows different rules

**Technologies unlocked:**
- Biochamber, agricultural tower, spidertron (moved from vanilla to Gleba in SA), agricultural science pack
- Agricultural science enables epic quality research

**Source references:** Factorio Wiki — Gleba, Spoilage, Agricultural tower, Pentapod; FFF-403

---

### 8.13 — Aquilo: Extreme Cold, Fusion & Endgame

Aquilo is the final planet — a frozen world that requires the most advanced logistics and introduces fusion power.

**Diagram content:**

**Environment:**
- Extreme cold: ambient temperature is far below freezing
- Terrain: ice, frozen ammonia lakes, lithium deposits
- Very limited buildable area — mostly ice platforms that must be constructed
- Minimal sunlight: solar power is nearly useless
- Oil and ammonia are available as fluids

**Freezing mechanic:**
- Entities without heating will freeze and stop functioning
- Heat pipes must be routed to machines to keep them operational
- This creates a spatial constraint: all machines must be within heat pipe range
- Heat sources: boilers, nuclear reactors, heat pipes from reactors
- The heating requirement turns base layout into a constraint-satisfaction problem: place machines within heat range while maintaining production chains

**Ice platform construction:**
- Buildable area is extremely limited at landing
- The player constructs ice platforms to expand the buildable surface
- Platforms are built from ice tiles created from water/ammonia
- This makes Aquilo's expansion slow and resource-intensive

**Fusion power:**
- The most powerful energy source in the game
- Fusion reactor: consumes fusion fuel cells (made from deuterium, processed from ammonia)
- Extremely high power output per unit
- Complex fuel chain: ammonia → heavy water → deuterium → fusion fuel cell → fusion reactor → depleted fuel cell
- Neighbour bonus applies (like nuclear)

**Cryogenic plant:**
- Handles extreme-cold recipes
- Used to produce cryogenic science packs (the final science tier)
- Specialized recipes for superconductors and fusion components

**Lithium:**
- Unique resource — used in advanced batteries and fusion-related recipes
- Only available on Aquilo

**Import dependency:**
- Aquilo has almost no conventional resources — iron, copper, steel, circuits must all be imported
- This makes Aquilo the ultimate test of the player's interplanetary logistics system
- The import bottleneck is usually the limiting factor, not local production capacity

**Technologies unlocked:**
- Fusion reactor, cryogenic plant, cryogenic science pack
- Cryogenic science enables legendary quality and the final endgame research
- Reaching Aquilo and producing cryogenic science represents the "true endgame" of Space Age

**Source references:** Factorio Wiki — Aquilo, Fusion reactor, Cryogenic plant

---

### 8.14 — Restructured Tech Tree

Space Age completely restructures the technology tree, tying progression to planetary exploration.

**Diagram content:**

**Science pack progression:**
1. Automation (red) — Nauvis early game
2. Logistic (green) — Nauvis early game
3. Military (gray) — Nauvis mid game
4. Chemical (blue) — Nauvis mid game
5. Production (purple) — Nauvis late game
6. Utility (yellow) — Nauvis late game
7. Space (white) — Space platform (generated during travel/orbit)
8. Metallurgic (Vulcanus) — requires Vulcanus base
9. Electromagnetic (Fulgora) — requires Fulgora base
10. Agricultural (Gleba) — requires Gleba base
11. Cryogenic (Aquilo) — requires Aquilo base
12. Promethium (endgame) — requires all planets

**Technology gating:**
- Key vanilla technologies are moved behind planetary science packs:
  - Cliff explosives → Vulcanus (metallurgic science)
  - Spidertron → Gleba (agricultural science)
  - Power armor MK2 equipment → Fulgora (electromagnetic science)
  - Tier 3 modules → various planetary science packs
  - Quality tiers: uncommon/rare (base), epic (agricultural), legendary (cryogenic)
- This creates a mandatory progression: the player must visit each planet to access technologies that were freely available in vanilla

**Rocket cost reduction:**
- Rockets are significantly cheaper in SA than in 1.1 — they are now a routine logistics tool, not a victory condition
- The "win condition" shifts from "launch one rocket" to "establish all four planetary bases and produce cryogenic science"

**Impact on Part III.5 (Science & Research):** the science pack tree expands from 7 to 12 types, and the technology DAG gains planet-constraint tags. The research progression becomes interleaved with exploration progression.

**Source references:** Factorio Wiki — Technologies (Space Age), Space Age tech tree

---

### 8.15 — Elevated Rails

Elevated rails add a vertical dimension to the rail system, available as a bundled mod with the SA DLC.

**Diagram content:**

- Rail supports: new entities that elevate rails above ground level
- Elevated rails can cross over ground-level infrastructure (belts, pipes, other rails) without collision
- This dramatically simplifies intersection design: no more complex weaving of ground-level rail through factory blocks
- Rail supports have their own placement rules and spacing requirements
- Elevated stations, signals, and switches all function identically to ground-level equivalents
- The engine treats elevation as a separate collision layer — ground entities ignore elevated rails and vice versa

**Impact on Part II.3 (Trains):** the rail graph gains a z-dimension, but pathfinding treats it as the same planar graph (just with fewer conflicts). The main impact is on factory layout, not on train behavior.

**Source references:** FFF-elevated-rails, Factorio Wiki — Elevated rail

---

### 8.16 — 2.0 Quality of Life & Minor Systems

A collection of smaller changes in 2.0 that individually are minor but collectively reshape how the game feels and plays.

**Diagram content:**

**Factoriopedia:**
- In-game encyclopedia: every item, entity, recipe, technology, and planet has a browsable entry
- Replaces external wiki lookups for basic information
- Internally, it reads directly from prototype definitions — so modded content is automatically included

**Blueprint parametrization:**
- Blueprints can contain parameters (variables) that are resolved when placed
- e.g., a blueprint for "any ore smelting" where the ore type is a parameter
- Enables reusable, generic blueprint designs

**Logistic groups:**
- Requester chests, roboports, characters, and spidertrons can be grouped
- Editing one group member's requests updates all members
- Parallels train groups — a unified approach to "configure once, apply everywhere"

**Ghost upgrade planning:**
- Ghosts can now be placed as upgrade plans — replacing existing entities when constructed
- Enables planned base upgrades without manual deconstruction

**Turbo belt (new tier):**
- 4th belt tier: 60 items/second (double blue belt speed)
- Unlocked via Space Age research
- Internally: more slots per tile, faster advancement per tick

**Bulk inserter:**
- Replacement for the 1.1 stack inserter concept
- Different swing profile optimized for high-throughput scenarios

**Remote view improvements:**
- Players can view and interact with other surfaces (planets, platforms) remotely
- Place blueprints, configure machines, manage logistics — all without physically traveling
- This is architecturally significant: it means player input actions can target any surface, not just the one the player entity occupies

**Source references:** FFF-382 (logistic groups), FFF-392 (blueprint parametrization), Version 2.0.7 changelog

---

## Part IX — Meta-Systems

### 9.1 — Save File & Replay

Factorio's save system is intimately tied to its deterministic simulation.

**Diagram content:**

- **Save file contents:** complete game state — every entity's position and internal state, every chunk's terrain and pollution, every network's state, research progress, statistics, player data
- **Compression:** save files use zlib compression; a large base can still produce multi-hundred-megabyte saves
- **Replay system:** Factorio can record all player inputs alongside the save; replaying the input log from the initial state perfectly reproduces the entire game session
- **Autosave:** periodic automatic saves (configurable interval); the save process briefly pauses the simulation
- **Desync detection:** in multiplayer, periodic CRC hashes of game state are compared; a mismatch triggers a desync report with diagnostic data

**Source references:** FFF-302 (multiplayer/desync), modding documentation

---

### 9.2 — Performance Anatomy

Understanding what makes Factorio slow at scale — and what the developers have done about it.

**Diagram content:**

- **UPS profile breakdown:** at different base sizes, which subsystems consume the most tick time
  - Small base (< 100 SPM): entity update dominates; UPS is not a concern
  - Medium base (100–1000 SPM): belt and inserter updates become significant; fluid system may appear
  - Megabase (1000+ SPM): memory bandwidth becomes the bottleneck — the engine spends more time fetching entity data from RAM than computing
- **Key optimizations over Factorio's history:**
  - Transport line merging (FFF-148): batching belt updates
  - Inserter sleep/wake (FFF-224): skipping idle inserters
  - Electric network threading (FFF-209): parallel network calculations
  - Robot fake movement (FFF-421): interpolating position instead of per-tick updates
  - Chunk bucket scheduling: not updating inactive chunks
- **UPS-friendly design principles:** why bots-based designs are often more UPS-efficient than belt-based; why direct insertion (machine-to-machine via inserter) beats belts; why fewer, faster assemblers (with modules) beat many slow ones
- **The memory bandwidth wall:** modern CPUs can compute far faster than they can fetch data; Factorio's bottleneck is L3 cache misses when iterating over entities

**Source references:** FFF-176, FFF-209, FFF-224, FFF-421, community megabase performance analyses

---

### 9.3 — Mod API Architecture

The Lua modding API is a window into Factorio's internal architecture — what it exposes reveals how the engine is structured.

**Diagram content:**

- **Three mod loading stages:**
  - Settings stage: mod settings (user-configurable options)
  - Data stage: prototype definitions — recipes, entities, items, technologies
  - Control stage: runtime scripts — event handlers, custom logic
- **Prototype system:** `data.raw` is a Lua table containing every prototype definition; mods can add, modify, or remove entries
- **Event system:** the engine fires events (on_tick, on_entity_built, on_player_mined, etc.) that mods can subscribe to
- **API surface:** `LuaEntity`, `LuaSurface`, `LuaForce`, `LuaPlayer`, `LuaInventory`, etc. — objects that expose the engine's internal data to Lua
- **Determinism constraints:** mods must not use non-deterministic Lua features; the engine enforces this through a sandboxed Lua environment
- **Performance implications:** poorly written mods (especially heavy on_tick handlers) can tank UPS — the `script` update time in the debug overlay shows mod cost

**Source references:** Factorio Lua API documentation, modding tutorials, FFF posts on mod system

---

## Part X — System of Systems: Feedback Loops & Emergent Dynamics

The final and most important diagram: a single large-scale view showing how all subsystems connect through causal loops.

**Diagram content:**

### Primary Reinforcing Loop (The Growth Spiral)

```
Mine ore → Smelt → Craft → Research → Unlock new recipes → Need more materials → Mine more
```

This is the engine that drives the entire game forward.

### Pollution-Combat Loop

```
Factory operates → Generates pollution → Pollution reaches biters → Biters attack →
Player builds defences → Defences consume resources and power → Factory must grow →
More pollution generated
```

A reinforcing loop: the bigger the factory, the more pollution, the more attacks, the more defence needed, requiring a bigger factory.

### Power-Production Coupling

```
Factory needs power → Power generation causes pollution → Pollution triggers attacks →
Attacks may damage power infrastructure → Power loss slows factory → Less production
```

A potential death spiral if the player doesn't break the loop (with solar, nuclear, or military technology).

### Research-Complexity Escalation

```
Research unlocks new recipes → New recipes require more diverse inputs →
More diverse inputs require more factory infrastructure → More entities →
Lower UPS → Player must optimize → Optimization requires understanding systems deeper
```

The meta-loop that connects game design to player skill development.

### Space Age Inter-Planetary Loop

```
Nauvis produces rockets → Rockets reach space platform → Platform travels to new planet →
New planet provides unique resources → Resources shipped back → Enable advanced recipes →
Advanced recipes require resources from multiple planets → More rockets needed
```

The late-game expansion loop that multiplies all other loops across planets.

### Visualization Approach

- Each subsystem is a labeled node (colored by Part number)
- Arrows show causal relationships (positive = reinforcing, negative = balancing)
- Loop structures are explicitly marked with rotation arrows
- Delay indicators show which connections are fast (immediate: power loss) vs. slow (pollution diffusion: minutes)
- Breaking points are highlighted: where player decisions interrupt loops (walls break the combat loop, solar breaks the pollution-power loop, etc.)

---

## Appendix A — Comparison with SimCity

| Aspect | SimCity (1989) | Factorio (2020+) |
|--------|----------------|-------------------|
| Simulation cycle | 16 discrete steps per revolution | 60 uniform ticks per second |
| Map size | 120×100, single resolution | Infinite, chunk-based |
| Spatial data | Multiple overlay maps (1:1, 1:2, 1:4, 1:8) | Per-chunk values + per-entity state |
| Traffic model | Random walk pathfinding, 30 steps max | Belt slot arrays + train A* + robot dispatch |
| Power model | Binary (powered/unpowered per zone) | Continuous satisfaction ratio per network |
| Zone growth | Probabilistic based on land value, traffic, crime | Deterministic recipe execution |
| Tile complexity | 956 characters, 6 status bits | Thousands of entity types, each with complex internal state |
| Source code | Open (Micropolis) | Closed (C++), Lua API exposed |
| Determinism | Not required (single player) | Strict requirement (multiplayer lockstep) |
| Mod support | None (original) | Extensive Lua API |

---

## Appendix B — Source Index

### Friday Facts (FFF) References

| FFF # | Topic | Relevant Part |
|-------|-------|---------------|
| 70 | Game loop basics | I.1 |
| 148 | Belt optimization | II.1 |
| 150 | Game loop rewrite | I.1 |
| 161 | Chunk update planner | I.2 |
| 176 | Belt optimization continued | II.1 |
| 183 | Biter AI | V.3 |
| 194 | Train pathfinding | II.3 |
| 209 | Electric network optimization | IV.1, IX.2 |
| 224 | Inserter optimization | II.2, IX.2 |
| 258 | Map generation | VII.1 |
| 274 | Fluid system rework (1.1) | II.5 |
| 302 | Multiplayer internals | I.4 |
| 373 | Space Age announcement | VIII.4 |
| 375 | Quality system | VIII.6 |
| 382 | Logistic groups | VIII.16 |
| 388 | 64-bit tick counter, Lua precision | I.1, I.4 |
| 389 | Train interrupts | VIII.2 |
| 392 | Blueprint parametrization | VIII.16 |
| 395 | Generic interrupts, train priority | VIII.2 |
| 398 | Space platforms | VIII.5 |
| 399 | Asteroid system | VIII.5 |
| 403 | Agricultural mechanics, spoilage | VIII.8, VIII.12 |
| 405 | Belt segment reading | VIII.3 |
| 416 | Fluid system rework (2.0) | VIII.1 |
| 419 | Display panel | VIII.3 |
| 421 | Robot optimization, chunk buckets | II.4, IX.2 |
| 428 | Roboport circuit network | VIII.3 |

### Other References

- Factorio Wiki: wiki.factorio.com
- Factorio Lua API: lua-api.factorio.com
- FactorioLab calculator: factoriolab.github.io
- Kirk McDonald calculator: kirkmcdonald.github.io
- Foreman2 flowchart tool: github.com/DanielKote/Foreman2
- Factorio Cheat Sheet: factoriocheatsheet.com
- Gingold, Chaim (2016). "SimCity Reverse Diagrams"
- Latour, Bruno (1986). "Visualization and cognition"
- Librande, Stone (2010). "One-Page Designs"
- Victor, Bret (2013). "Media for Thinking the Unthinkable"

---

## Appendix C — Visual Language Key

When implementing these diagrams visually, the following conventions apply:

**Node types:**
- Rectangle: entity or system
- Rounded rectangle: process or computation
- Diamond: decision point
- Circle: signal or value
- Hexagon: external input (player action, map generation)

**Arrow types:**
- Solid black: data/item flow
- Dashed blue: electric power flow
- Dotted green: signal/circuit flow
- Wavy red: pollution flow
- Thick gray: causal relationship (feedback loop)

**Annotations:**
- Clock icon: tick-level timing
- Lightning bolt: power dependency
- Skull: damage/combat
- Gear: crafting/processing
- Leaf: pollution absorption

**Scale indicators:**
- Numbers in brackets indicate per-tick values: [0.05 kJ/tick]
- Numbers with /s indicate per-second rates: 15 items/s
- Ratios shown as A:B:C for build ratios: 1:20:40

---

*This document is a plan. Each Part should ultimately be realized as a visual diagram (or set of diagrams) in the spirit of Gingold's SimCity reverse diagrams — translating code-level simulation rules into human-readable, shareable, discussable form.*

*The complete diagram set would constitute approximately 40–50 individual diagrams across the 10 Parts, plus the system-of-systems overview — far exceeding Gingold's original 2 posters, proportional to Factorio's far greater complexity. Part VIII alone, covering the 2.0/Space Age changes, requires 16 diagrams — more than all of Gingold's SimCity work — reflecting the scale of what Wube rebuilt.*
