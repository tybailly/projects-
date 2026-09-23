# NYC Beat Cop — Vertical Slice Plan

Working title. A fictional department name is recommended (e.g. "Metro PD" /
"12th Precinct") rather than the real NYPD shield/logo, to sidestep
trademark issues while keeping the NYC flavor in signage, architecture, cabs,
and street layout.

## Concept

Third-person patrol game. Player is a beat cop working a few blocks of a
dense, NYC-style street. Loop: walk the block → resolve a minor pedestrian
incident → get in the patrol car → drive a few blocks → respond to an armed
subject call that escalates into a reactive shootout → end of slice. One
continuous scene, no loading screens. The arc is deliberately calm-to-chaos:
a mundane dialogue-only incident first, then a dramatic, mechanically
distinct climax.

## Incidents

### Incident 1 — Parking dispute (foot, M3)

Opens the slice. A delivery truck is double-parked across a bus stop; a
shop owner flags the player down, annoyed. Pure dialogue + interact, no
combat — this is the calm beat that teaches the systems.

- Branching resolution: ticket the driver / give a warning / have the
  driver move along. Each is a simple state change (no mechanical
  difference beyond dialogue/flavor and an outcome line) — the framework in
  M3 (`UIncidentDefinition`, data-table dialogue) covers this fully.
- No new systems required beyond what M1/M3 already scope.

### Incident 2 — Armed subject call (post-drive, M6)

The slice's climax. Dispatch sends the player to a "10-32, man with a gun"
call a few blocks away — the reason the drive exists narratively, not just
mechanically.

Sequence:
1. Radio call fires after incident 1 resolves; player drives to the
   location (M5).
2. Arrive, exit vehicle, approach a subject standing near an alley/parked
   car. Branching dialogue (same system as incident 1) — player can ask the
   subject to show their hands, ask what's going on, try to de-escalate.
   For scope, these choices color the dialogue/tension but do **not**
   prevent the reveal below — this is a scripted "sudden threat" beat, not
   a preventable one, since it's the demo's one combat set piece.
3. Scripted reveal: subject reaches to their waistband and draws a handgun,
   with a telegraphed wind-up (~0.5-1s raise) so the player gets a fair
   reaction window rather than an instant/unfair death.
4. Control shifts from dialogue/interact mode into a reactive draw-and-fire
   beat: player draws their holstered sidearm and fires. 2-3 shot exchange
   at most.
5. Subject goes down after taking a hit (simple hit-reaction, no ragdoll
   physics needed for scope — a canned death animation is fine). If the
   player is hit, a screen-flash/vignette is sufficient feedback; getting
   hit enough times (recommend: 3) resets to just before the reveal (a
   checkpoint retry) rather than a hard game-over/level-reload, to keep
   demo pacing tight.
6. Aftermath line ("shots fired, suspect down, requesting a bus") →
   transition to end card.

This is a **single scripted antagonist, single dramatic beat** — not a
multi-enemy firefight. That scope is what keeps this achievable inside the
vertical-slice timeline; see the new M4 milestone below for the systems it
requires.

## Engine decision: Unreal Engine 5

Chosen over Unity because the three hardest parts of this concept —
dense walkable city geometry, a convincing player/NPC human, and vehicle
driving — are all things UE5 ships strong first-party or free tooling for:

- **Nanite + Lumen** for dense city geometry and lighting without heavy
  manual optimization.
- **MetaHuman** for the player character and named NPCs.
- **Chaos Vehicles** plugin for the patrol car.

~~Epic's free City Sample project~~ was evaluated as a scope-cutting base
(dense city block-out, Mass AI crowds/traffic, a pre-built vehicle) but
**ruled out after hands-on testing**: its recommended spec is ~64GB RAM, and
on the 32GB dev machine World Partition regions wouldn't reliably stream in
even after the usual fixes (Data Layer visibility, forcing region loads,
repositioning the camera). Not worth fighting further — see the milestones
below for the from-scratch replacements this brings back into scope.

- **Base project**: start from the plain **ThirdPerson template** instead
  (M0). Far lighter, opens instantly, no World Partition/streaming to fight.
- **Driving reference**: rather than City Sample's vehicle, start from UE's
  own built-in **Vehicle template** (New Project → Games → Vehicle). It
  ships a working Chaos Vehicle pawn with a rigged car mesh already wired
  up — much lighter than City Sample, and the pawn/animation setup can be
  copied into the main project for M5.
- **Environment geometry**: with no City Sample buildings to reskin, M2
  needs a modular urban/city environment kit sourced from Fab (free or
  paid) to dress the street — pick one on the lighter/stylized end rather
  than a hyper-detailed Nanite-heavy pack, both for iteration speed and to
  stay comfortable on 32GB RAM.

## Milestones

### M0 — Project setup (2-4 days)
- Install UE 5.4+, set up Git LFS (binary assets — do **not** commit large
  uasset/uexp files without LFS).
- Stand up project from the **ThirdPerson template** (City Sample ruled out
  — see Engine decision above).
- Confirm project runs and packages a trivial build end-to-end before any
  content work — catches toolchain problems early.

### M1 — Core locomotion & interaction (1-2 weeks)
- Player character: MetaHuman + generic patrol uniform (avoid real NYPD
  trademarks).
- Enhanced Input setup, third-person camera tuning. Default camera is a
  standard third-person follow cam; no first-person mode planned — the
  shootout in M4 tightens to an over-the-shoulder aim camera instead of
  switching perspective (cheaper than a separate first-person arm/weapon
  rig, and keeps one camera paradigm throughout).
- Interaction system: interface-based `Interactable` (line trace from
  camera, context prompt UI) — this is the hook every incident later plugs
  into, so build it generically now.
- Minimal HUD: objective text, interact prompt.

### M2 — Street block-out & NYC dressing (2-3 weeks)
- Source a modular urban/city environment kit from Fab (see Engine decision
  above) and block out a few blocks to a specific street identity (signage,
  yellow cabs as set dressing, hot dog cart, subway stair entrance,
  hydrants).
- Lighting pass (time of day, Lumen).
- Ambient audio bed (traffic hum, distant sirens, crowd murmur).

### M3 — NPC pedestrians & incident system (2-3 weeks)
- Pedestrian crowd: simple Behavior Tree + EQS wander/cross-street setup
  (built from scratch — no Mass AI to reuse now that City Sample is out).
- Incident framework, built **data-driven** so incident #2 is cheap once
  incident #1 works:
  - `UIncidentDefinition` data asset: trigger volume/actor, dialogue lines,
    resolution outcomes.
  - Simple branching dialogue widget (UMG) driven by a data table — no need
    for a full dialogue plugin at this scope.
- Ship incident #1 (parking dispute, see Incidents above) end-to-end.

### M4 — Combat system (2-3 weeks)
New milestone, added once incident #2 was scoped as a reactive shootout
rather than another dialogue-only incident. Kept deliberately minimal: one
scripted antagonist, one encounter, no reload/ammo economy, no cover system.

- Player: holstered sidearm, draw/holster animation, OTS aim-camera
  transition (tightened FOV, no perspective switch — see M1), hitscan fire
  trace, basic recoil/camera kick.
- Antagonist: state machine (Idle/Dialogue → Threat-Reveal → Attack →
  Down), telegraphed draw animation (~0.5-1s wind-up so the player has a
  fair reaction window), hitscan or simple projectile attack, 2-3 hit
  health with a canned death animation (no ragdoll needed).
- Player damage feedback: screen-flash/vignette on hit; no HUD health bar
  needed at this scope.
- Checkpoint/retry: on player "death" (recommend: 3 hits), reset to just
  before the reveal beat rather than a full level reload or hard game-over
  screen — keeps demo pacing tight.
- This milestone is reusable groundwork, but is authored and tuned against
  incident #2's specific encounter (M6), not built as a generic system in
  isolation.

### M5 — Driving (1-2 weeks)
- Chaos Vehicle patrol car, built from UE's built-in Vehicle template (see
  Engine decision above) rather than City Sample's.
- Enter/exit vehicle state machine, camera swap.
- Radio call barks patrol car → incident #2 location as the transition beat.
- Traffic AI: cut to empty/static parked cars for the demo rather than
  hand-building traffic AI (no Mass AI to reuse now that City Sample is
  out — this scope cut is effectively locked in, not just a fallback).

### M6 — Flow wiring & incident #2 (1-2 weeks)
- Game mode / state machine: intro → incident 1 → drive → incident 2 → end
  card. This is the backbone that turns separate systems into one slice.
- Author incident #2 (armed subject call, see Incidents above) on top of
  the M3 dialogue framework and the M4 combat system.
- End card / credits.

### M7 — Polish & packaging (1-2 weeks)
- Bug pass, profiling (target: stable 60fps at demo settings on a mid-range
  GPU).
- Packaged Windows build.
- Capture a gameplay trailer.

**Rough total: 12-17 weeks solo/part-time.** These milestone estimates
already assumed the from-scratch fallback as the baseline (City Sample was
only ever an optional accelerant, now dropped), so the total is unchanged
by ruling it out — it just means M2/M3/M5 land at the fuller end of their
ranges rather than the shortened one.

## Code split

- **C++**: player character base, vehicle base, `Interactable` interface,
  weapon/combatant base classes, incident manager / game mode state
  machine, save/objective state — anything that's structural or
  perf-sensitive.
- **Blueprint**: per-level scripting, UMG widgets, individual incident
  instances built on the C++ incident base, the incident #2 antagonist
  instance built on the C++ combatant base, animation blueprints, cosmetic
  VFX.

## Scope cuts if time-constrained

In priority order, cut from the bottom first. Incident #2 itself is no
longer a cut candidate now that it's the demo's climax — if M4/M6 run long,
cut the checkpoint/retry loop instead (make the shootout a single
unmissable scripted beat that always resolves in the player's favor) before
cutting the shootout altogether.

1. Traffic AI (parked/static cars are fine)
2. Full crowd AI (a handful of scripted/canned pedestrians instead of a
   living crowd system)
3. MetaHuman player (use a marketplace stand-in character instead)
4. Combat retry/checkpoint loop (single unmissable scripted beat instead)

## Open decisions

- ~~City Sample as base vs. blank template~~ — resolved (reversed from the
  earlier call). Despite clearing Epic's recommended spec on paper, hands-on
  testing showed World Partition streaming was unreliable on 32GB RAM.
  Dropped City Sample; base project is the ThirdPerson template (M0), with
  UE's built-in Vehicle template as the M5 driving reference and a sourced
  modular environment kit for M2 (all detailed in Engine decision above).
- Which modular urban environment kit to use for M2 (needs sourcing from
  Fab — pick something on the lighter/stylized end, not another
  Nanite-heavy pack, given the RAM lesson just learned).
- Target platform beyond PC (this plan assumes PC only).
