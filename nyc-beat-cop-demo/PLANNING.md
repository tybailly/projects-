# NYC Beat Cop — Vertical Slice Plan

Working title. A fictional department name is recommended (e.g. "Metro PD" /
"12th Precinct") rather than the real NYPD shield/logo, to sidestep
trademark issues while keeping the NYC flavor in signage, architecture, cabs,
and street layout.

## Concept

Third-person patrol game. Player is a beat cop working a few blocks of a
dense, NYC-style street. Loop: walk the block → resolve a minor pedestrian
incident → get in the patrol car → drive a few blocks → resolve a second
incident → end of slice. One continuous scene, no loading screens.

## Engine decision: Unreal Engine 5

Chosen over Unity because the three hardest parts of this concept —
dense walkable city geometry, a convincing player/NPC human, and vehicle
driving — are all things UE5 ships strong first-party or free tooling for:

- **Nanite + Lumen** for dense city geometry and lighting without heavy
  manual optimization.
- **MetaHuman** for the player character and named NPCs.
- **Chaos Vehicles** plugin for the patrol car.
- **Epic's free City Sample project** (built for the Matrix Awakens demo) —
  this is the single biggest scope-cutter available. It ships with:
  - A dense, walkable city block-out with modular buildings, ready to reskin.
  - **Mass AI** crowd and traffic simulation already wired up (pedestrians
    walking sidewalks, cars driving streets).
  - A playable vehicle already integrated with Chaos Vehicles.

  Recommendation: **start from City Sample instead of a blank/ThirdPerson
  template**, and reskin/trim it rather than building crowd AI and traffic
  from scratch. This alone could cut 3-4 weeks off the plan below. Downside:
  it's a heavy project (large download, needs a decent GPU) and its code is
  denser to learn than a template — factor in a few extra days up front to
  get oriented in it.

## Milestones

### M0 — Project setup (2-4 days)
- Install UE 5.4+, set up Git LFS (binary assets — do **not** commit large
  uasset/uexp files without LFS).
- Stand up project from City Sample (or ThirdPerson template if City Sample
  proves too heavy to work with).
- Confirm project runs and packages a trivial build end-to-end before any
  content work — catches toolchain problems early.

### M1 — Core locomotion & interaction (1-2 weeks)
- Player character: MetaHuman + generic patrol uniform (avoid real NYPD
  trademarks).
- Enhanced Input setup, third-person camera tuning.
- Interaction system: interface-based `Interactable` (line trace from
  camera, context prompt UI) — this is the hook every incident later plugs
  into, so build it generically now.
- Minimal HUD: objective text, interact prompt.

### M2 — Street block-out & NYC dressing (2-3 weeks, less if built on City Sample)
- Trim/reskin a few blocks to a specific street identity (signage, yellow
  cabs as set dressing, hot dog cart, subway stair entrance, hydrants).
- Lighting pass (time of day, Lumen).
- Ambient audio bed (traffic hum, distant sirens, crowd murmur).

### M3 — NPC pedestrians & incident system (2-3 weeks)
- Pedestrian crowd: reuse Mass AI from City Sample if adopted, else a
  simple Behavior Tree + EQS wander/cross-street setup.
- Incident framework, built **data-driven** so incident #2 is cheap once
  incident #1 works:
  - `UIncidentDefinition` data asset: trigger volume/actor, dialogue lines,
    resolution outcomes.
  - Simple branching dialogue widget (UMG) driven by a data table — no need
    for a full dialogue plugin at this scope.
- Ship incident #1 (e.g. jaywalker or noise complaint) end-to-end.

### M4 — Driving (1-2 weeks)
- Chaos Vehicle patrol car (reuse City Sample's if adopted).
- Enter/exit vehicle state machine, camera swap.
- Radio call barks patrol car → incident #2 location as the transition beat.
- Traffic AI: reuse Mass AI if available; otherwise cut to empty/static
  parked cars for the demo rather than hand-building traffic AI.

### M5 — Flow wiring & incident #2 (1-2 weeks)
- Game mode / state machine: intro → incident 1 → drive → incident 2 → end
  card. This is the backbone that turns separate systems into one slice.
- Second incident authored on top of the M3 framework (should be
  significantly faster than the first).
- End card / credits.

### M6 — Polish & packaging (1-2 weeks)
- Bug pass, profiling (target: stable 60fps at demo settings on a mid-range
  GPU).
- Packaged Windows build.
- Capture a gameplay trailer.

**Rough total: 10-14 weeks solo/part-time**, materially shorter if City
Sample's crowd/traffic/vehicle systems are adopted rather than rebuilt.

## Code split

- **C++**: player character base, vehicle base, `Interactable` interface,
  incident manager / game mode state machine, save/objective state —
  anything that's structural or perf-sensitive.
- **Blueprint**: per-level scripting, UMG widgets, individual incident
  instances built on the C++ incident base, animation blueprints, cosmetic
  VFX.

## Scope cuts if time-constrained

In priority order, cut from the bottom first:
1. Traffic AI (parked/static cars are fine)
2. Second incident (ship a one-incident slice)
3. Full crowd AI (a handful of scripted/canned pedestrians instead of a
   living crowd system)
4. MetaHuman player (use a marketplace/City Sample stand-in character)

## Open decisions

- City Sample as base vs. blank template — recommend a 1-2 day spike
  loading City Sample and confirming it runs acceptably on your hardware
  before committing.
- Incident tone/content (what the two incidents actually are).
- Target platform beyond PC (this plan assumes PC only).
