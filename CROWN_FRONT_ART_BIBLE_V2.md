# CROWN//FRONT — ART BIBLE v2.0

**Project:** CROWN//FRONT  
**Visual direction:** THE CROWN ENGINE  
**Status:** Canonical art-direction specification  
**Target:** portrait mobile WebGL, iPhone Safari, Android Chrome  
**Unity:** 6000.5.3f1  
**Repository:** `mtronda21vekby-stack/GAME`  
**Production route:** `/games/crown-front/`

---

## 1. Why this document exists

The current production build is technically functional, but its presentation does not communicate a commercial-quality game. The screenshot review exposed a structural problem, not a polish problem:

- units read as assembled primitives rather than authored characters;
- Core and towers read as cylinders and blocks rather than strategic landmarks;
- the arena reads as three dark strips instead of the body of a colossal mechanical king;
- lighting has insufficient hierarchy and depth;
- the HUD competes with the battlefield instead of framing it;
- the overall image lacks a single unmistakable visual signature.

This document replaces incremental “make it prettier” work with a coherent production language. It is the binding reference for every future environment, unit, building, effect, icon, animation, screenshot and trailer frame.

The target is not generic high-quality science fiction. The target is a frame that can be recognized as **CROWN//FRONT without the logo**.

---

## 2. Product fantasy

### 2.1 One-sentence fantasy

Two mechanized factions wage a real-time tactical war across the living body of the last mechanical king while his Crown Engine carries them through a dying world.

### 2.2 What the player must understand in three seconds

1. The battlefield is not a normal map; it is the body of an enormous moving titan.
2. Blue and red forces are fighting to seize or destroy a living reactor-crown system.
3. Units are small relative to the machine, but every deployment has visible tactical consequence.
4. The experience is premium, aggressive and legible on a phone.

### 2.3 Emotional target

The desired emotional blend is:

- **majesty** — the arena is part of an ancient machine-god;
- **danger** — energy channels, heat and structural damage feel unstable;
- **control** — the UI remains precise and readable;
- **impact** — attacks have weight without filling the screen with noise;
- **curiosity** — the player wants to see how the titan, Core and factions evolve.

The game must not feel cute, toy-like, comedic, medieval, or like a reskin of an existing lane battler.

---

## 3. Non-negotiable visual pillars

### Pillar A — The arena is a body

Every large environmental decision must imply anatomy:

- head and crown at the enemy side;
- chest and heart-reactor at the friendly side;
- shoulders supporting outer towers;
- spine defining the central route;
- arms or articulated armor forming side routes;
- ribs, tendons, cables and cooling channels creating structural depth.

A player should be able to point at the screenshot and identify the titan’s anatomy even if all units and UI are removed.

### Pillar B — Silhouette before detail

A unit or building must be recognizable in black silhouette at gameplay scale. Fine texture cannot compensate for a weak shape.

Required silhouette differences:

- Assault: upright wedge, rifle-forward profile;
- Tank: broad rectangle/trapezoid, low center of mass, massive shoulders;
- Raider: narrow forward-leaning arrow, rear boosters or blades;
- Tower: anchored base plus directional weapon head;
- Core: circular/tri-radial crown-reactor silhouette unlike any tower.

### Pillar C — One design grammar

All authored forms derive from a small grammar:

- three-pronged crown motif;
- hexagonal and truncated-hex mechanical sections;
- slanted armor plates;
- triangular energy cuts;
- concentric magnetic rings;
- repeated “three” rhythm in fins, lights and supports;
- hard external armor over bright internal energy.

Random circles, capsules and cubes cannot remain visible as final presentation.

### Pillar D — Controlled contrast

The battlefield is mostly dark and matte. Bright color is reserved for information and energy.

- environment: graphite, black steel, cold grey;
- Blue faction: cyan core, electric-blue secondary glow, white-hot center;
- Hostile Crown: deep red core, orange secondary glow, white-hot center;
- rare neutral accent: aged brass or dark gold;
- no unmotivated green, purple, pink or rainbow effects.

### Pillar E — Premium restraint

More detail is not automatically better. The image must have quiet areas so important objects can dominate.

Use:

- a few large, intentional armor masses;
- limited high-frequency detail;
- short, shaped VFX;
- localized glow;
- clean empty combat space.

Avoid:

- visual confetti;
- hundreds of tiny props;
- excessive outline glow;
- full-screen flashes;
- permanent smoke over the playfield;
- decorative panels that mimic gameplay targets.

---

## 4. Camera and screen composition

### 4.1 Primary format

The canonical gameplay view is portrait 9:16. The composition must be authored for phone first, not cropped from desktop.

The screen is divided into three zones:

1. **Top command zone: 11–14%**  
   Core health, timer, minimal tower status, pause.
2. **Battlefield zone: 66–72%**  
   Titan anatomy, units, towers, battle, tactical focus.
3. **Bottom deployment zone: 16–21%**  
   Energy and unit cards.

No persistent panel may occupy the middle third of the battlefield.

### 4.2 Camera angle

Use a high oblique 2.5D camera, not a perfectly vertical orthographic board and not a dramatic low angle.

Desired effect:

- enough perspective to reveal height and deep machinery;
- enough top-down clarity to read three routes;
- character silhouettes visible from head, shoulders and weapon direction;
- Core rings readable as three-dimensional objects.

Starting target:

- pitch: approximately 52–62 degrees downward;
- yaw: near zero, with no distracting diagonal map rotation;
- narrow perspective or carefully tuned orthographic-like perspective;
- battlefield center placed slightly above geometric screen center to account for bottom HUD.

Final values must be selected from actual phone captures, not desktop Scene view preference.

### 4.3 Scale hierarchy

At gameplay scale:

- Core width: roughly 16–21% of arena width;
- tower width: 10–13%;
- Tank width: 6.5–8%;
- Assault width: 4.5–5.5%;
- Raider width: 3.8–4.8%;
- lane usable width: at least 18% of battlefield width each;
- minimum gap between adjacent lane silhouettes: enough to avoid unit overlap appearing as one mass.

### 4.4 Motion rules

Allowed camera movement:

- 0.25–0.6 second opening settle;
- extremely subtle titan breathing/parallax;
- local impact impulse for heavy shots;
- restrained Core-destruction zoom;
- victory/defeat settle.

Forbidden:

- constant sway large enough to move touch targets;
- excessive shake on common shots;
- automatic zoom during ordinary combat;
- motion blur;
- depth of field during gameplay.

---

## 5. The mechanical king

### 5.1 Readable anatomy

The enemy side reveals the titan’s upper anatomy:

- crown/head silhouette at the top;
- neck mechanism beneath the timer region;
- shoulder housings anchoring left and right enemy towers;
- central armored spine continuing through the arena.

The friendly side reveals the chest and Crown Engine interface:

- player Core seated within a breastplate or sternum socket;
- outer friendly towers attached to lower rib/shoulder support structures;
- energy channels visibly feeding the Core.

### 5.2 Surface layering

Every main surface uses four layers:

1. **Structural mass** — large armor block or limb shell.
2. **Secondary plate** — slanted panel that creates silhouette and depth.
3. **Mechanical inset** — vent, rail, rotor, cable or recessed machinery.
4. **Energy accent** — narrow emissive line, not a broad neon fill.

No large surface should be a single flat cube with one material.

### 5.3 Route identity

The three gameplay lanes keep existing logic but gain anatomical identities:

- **Left route — Shield Arm:** heavier armor, defensive ribs, broad cover rhythm.
- **Center route — Crown Spine:** strongest symmetry, direct energy conduit, central objective focus.
- **Right route — Blade Arm:** more articulated plates, sharper geometry, faster visual rhythm.

Do not label the routes with permanent text. Shape and lighting should distinguish them.

### 5.4 Background depth

Outside the titan body, show controlled environmental depth:

- cloud or dust layers far below;
- occasional distant lightning or energy storm;
- moving silhouettes of armor sections at the extreme edges;
- deep black cavities beneath bridge sections;
- slow parallax that implies enormous forward movement.

The background must not look like empty black space.

### 5.5 Damage language

Environmental damage is asymmetric and localized:

- cracked plate edges;
- exposed cable bundles;
- orange heat at broken vents;
- displaced armor segments;
- intermittent sparks;
- smoke only from damaged zones.

Do not cover the entire arena in identical scratches or random debris.

---

## 6. Factions

## 6.1 Vanguard

**Character:** disciplined, controlled, engineered, precise.

Shape language:

- cleaner symmetry;
- forward-facing triangular crown marks;
- compact mechanical joints;
- intact armor shells;
- controlled cyan energy channels;
- white ceramic or pale steel inserts used sparingly.

Material distribution:

- 60% graphite armor;
- 20% cold steel;
- 12% blue/cyan energy and painted ID;
- 6% pale structural insert;
- 2% neutral brass detail maximum.

Motion:

- stable stance;
- precise recoil recovery;
- synchronized mechanical articulation;
- clean deployment effect.

## 6.2 Hostile Crown

**Character:** corrupted, overheated, predatory, unstable but still technologically coherent.

Shape language:

- broken symmetry;
- split armor plates;
- crown prongs angled like hooked weapons;
- exposed energy veins;
- heavier heat vents;
- damaged ceramic/steel inserts;
- red primary energy with orange heat.

Material distribution:

- 58% dark graphite;
- 15% burned metal;
- 15% red/orange energy and faction ID;
- 8% exposed internal machinery;
- 4% pale damaged insert.

Motion:

- slightly irregular idle;
- aggressive forward snap;
- unstable recoil;
- heat pulse after attacks.

### 6.3 Fairness rule

Faction asymmetry must never reduce gameplay readability. Corresponding units share gameplay-scale footprint and attack telegraph timing. Art communicates character, not hidden balance changes.

---

## 7. The Crown Engine Core

### 7.1 Role

The Core is the primary landmark, damage objective and marketing icon. It must be the most authored object in the scene.

It cannot resemble:

- a glowing ball on a cylinder;
- a generic crystal;
- a tower with a larger scale;
- a flat UI emblem.

### 7.2 Silhouette

The canonical Core silhouette includes:

- wide armored socket embedded in titan anatomy;
- three external stabilizer pylons;
- two or three concentric magnetic rings;
- central energy heart;
- crown-trident structure above or around the heart;
- cable/energy feeds entering from the arena.

### 7.3 Visual states

#### Healthy

- smooth ring rotation at different speeds;
- slow breathing light pulse;
- stable white-hot center;
- clean energy feeds;
- minimal particles.

#### Damaged 75–40%

- one stabilizer intermittently misaligns;
- localized sparks;
- slight orange contamination in emission;
- plate separation visible;
- pulse becomes faster but not brighter everywhere.

#### Critical under 40%

- intermittent ring stutter;
- exposed heat;
- thin smoke plume placed away from units;
- stronger internal flicker;
- short warning arcs between stabilizers.

#### Destruction

Sequence target: 1.4–2.2 seconds.

1. energy contracts inward;
2. rings stop and reverse a fraction;
3. white internal flash;
4. stabilizers separate;
5. shaped shockwave expands;
6. fragments move along authored trajectories;
7. residual energy collapses;
8. defeated side lighting drops.

Avoid uncontrolled Rigidbody explosions and full-screen whiteout.

### 7.4 Technical budget

- shared materials;
- no per-instance material creation;
- procedural ring motion acceptable;
- pooled sparks and shockwave;
- one optional local light during rare destruction only;
- no continuous particle system with high overdraw.

---

## 8. Tower family

### 8.1 Common construction

All towers share:

- embedded armored foundation;
- rotating or articulating weapon head;
- clear muzzle direction;
- rear energy feed;
- faction emblem panel;
- three-step state change: idle, acquire, fire.

### 8.2 Idle

- weapon partially closed or lowered;
- energy dim;
- slow mechanical scan;
- silhouette compact.

### 8.3 Target acquisition

- armor shutters open;
- weapon pivots;
- energy channel fills toward muzzle;
- 0.12–0.3 second anticipation depending on tower role.

### 8.4 Fire

- short muzzle flash with white core;
- visible recoil or barrel articulation;
- projectile/tracer line clearly originates at muzzle;
- recoil recovery completes before next shot.

### 8.5 Damage and destruction

- damage affects one or two authored plates;
- no global red flashing of whole object;
- damaged tower leaks energy locally;
- destruction leaves readable wreckage rather than simply disappearing.

### 8.6 Anti-primitive rule

A tower fails review if a cylinder, capsule or cube is still recognizable as the dominant final shape. Primitive meshes may exist internally but must be layered, cut, scaled and combined into an authored silhouette.

---

## 9. Unit design system

### 9.1 Shared construction rules

Each unit uses separate roots:

- gameplay root — untouched movement, targeting and hit logic;
- visual root — authored model, animation, recoil, hit response and death.

Every unit requires:

- head/visor direction;
- torso mass;
- shoulder/arm or weapon mass;
- lower-body locomotion shape;
- faction energy ID;
- class-specific rear silhouette.

### 9.2 Assault

**Role impression:** reliable frontline rifle unit.

Silhouette:

- medium height;
- broad enough shoulders to read at distance;
- narrow waist;
- one long forward rifle shape;
- crown-fin or antenna shape behind head.

Vanguard version:

- compact angular helmet;
- blue visor slit;
- white/cold-steel shoulder insert;
- disciplined rifle carriage.

Hostile version:

- hooked helmet prongs;
- exposed orange energy under chest plate;
- asymmetrical rifle housing;
- aggressive forward stance.

Animation:

- stable two-step locomotion cycle;
- 0.08–0.14 second anticipation;
- visible shoulder and weapon recoil;
- short muzzle flash;
- hit reaction via upper-body offset, not whole-root teleport.

### 9.3 Tank

**Role impression:** moving armored wall.

Silhouette:

- at least 35% wider than Assault;
- broad trapezoid torso;
- thick legs or track-like powered boots;
- heavy front armor plane;
- weapon integrated into shoulder, arm or chest frame.

Do not make the Tank merely a uniformly scaled Assault.

Motion:

- slower step cadence;
- visible weight shift;
- small vertical compression on footfall;
- large recoil and slower recovery;
- impact effects larger but less frequent.

### 9.4 Raider

**Role impression:** fast strike predator.

Silhouette:

- narrow torso;
- deep forward lean;
- rear boosters, fins or blade wings;
- one long diagonal blade/weapon line;
- low stance.

Motion:

- sharp acceleration;
- short authored dash trail;
- small lateral weave only if it does not alter gameplay position;
- fast attack snap;
- quick dissolve or collapse on death.

### 9.5 Future class slots

Future units must occupy distinct silhouette categories:

- Sniper — tall, narrow, extremely long weapon;
- Engineer — backpack and tool arm;
- Medic — circular support apparatus;
- Shield Operator — broad frontal arc;
- Drone — floating triangular or ring frame;
- Heavy Walker — multi-leg or elevated heavy chassis.

No new class may be approved if its silhouette overlaps an existing class at gameplay scale.

---

## 10. Materials and surface response

### 10.1 Canonical material set

Keep the total shipping shared-material family compact:

1. Titan Graphite Matte
2. Titan Steel Edge
3. Titan Deep Mechanism
4. Vanguard Armor
5. Vanguard Energy
6. Hostile Armor
7. Hostile Energy
8. Ceramic/Pale Insert
9. Heat/Burned Metal
10. Neutral Brass Accent
11. VFX White-Hot Additive

Target: 8–14 shared materials for the entire vertical slice.

### 10.2 Surface hierarchy

- external armor: rough, dark, broad highlights;
- cut metal edges: brighter, smoother, narrow highlights;
- internal mechanisms: darker but slightly reflective;
- ceramic inserts: pale, matte, clean on Vanguard and damaged on Hostile;
- energy: emissive core with controlled bloom;
- heat: orange-red gradient used only where justified.

### 10.3 Shader rules

- WebGL-safe URP or purpose-built simple shader;
- GPU instancing enabled where supported;
- no runtime-generated unique materials per object;
- avoid large transparent surfaces;
- avoid complex screen-space effects;
- emission must not wash out class silhouette;
- fallback must preserve team readability.

---

## 11. Lighting

### 11.1 Lighting hierarchy

1. one main directional light establishes form;
2. ambient/sky gradient separates top planes and cavities;
3. baked or emissive faction lighting supplies color;
4. rare temporary local light supports Core destruction or major impact.

### 11.2 Desired image

- upper enemy region slightly warmer and more hostile;
- lower friendly region cooler and clearer;
- center objective area neutral enough for both factions to read;
- deep cavities near black but never erase units;
- armor edges reveal shape without appearing chrome.

### 11.3 Forbidden lighting patterns

- one flat ambient value across everything;
- fully saturated blue/red flood lights;
- many realtime point lights;
- uncontrolled bloom halos;
- black units on black lanes without rim separation;
- white surfaces blown out on iPhone displays.

---

## 12. Animation language

### 12.1 Titan

The titan is alive through slow mechanical cycles:

- chest expansion or armor settling;
- edge machinery moving at different phases;
- distant rotors;
- energy pulses traveling through conduits;
- occasional micro-vibration around heavy impacts.

Amplitude must be small enough that lanes and touch targeting remain stable.

### 12.2 Mechanical motion quality

Good motion has:

- anticipation;
- acceleration;
- mechanical limit or lock;
- impact;
- recovery.

Avoid constant sine-wave movement on every object. Sine motion is acceptable for subtle energy breathing, not as the main character animation system.

### 12.3 Spawn

Spawn target duration: 0.35–0.7 seconds.

- lane socket lights;
- compact energy geometry forms;
- unit appears from a controlled vertical/forward assembly;
- no long invulnerable-looking cinematic;
- no generic scale-from-zero pop.

### 12.4 Death

Unit death should preserve gameplay clarity:

- hit confirmation;
- short class-specific collapse, breakup or dissolve;
- body clears lane quickly;
- effect color does not look like a new active unit;
- pooled remains or decals have strict lifetime.

---

## 13. Combat VFX

### 13.1 Shape language

VFX also use crown/triangular/hex geometry.

- Blue projectile: cyan core, electric-blue edge, white tip;
- Hostile projectile: red core, orange edge, white tip;
- kinetic impact: directional sparks and short armor flash;
- energy impact: hex/tri ripple, not a generic sphere;
- Tank impact: brief plate-scale shock and debris;
- Raider strike: narrow slash arc and short directional trail.

### 13.2 Timing

Common effects should complete in 0.08–0.45 seconds. Major Core sequences can last longer.

### 13.3 Performance

- pool frequent projectiles, impacts, trails and decals;
- cap simultaneous effects;
- avoid transparent particles over the entire screen;
- do not instantiate/destroy per ordinary shot;
- expose debug counters for pool use and peak active effects.

### 13.4 Screen cleanliness

At peak battle, the player must still see:

- three lanes;
- which unit is which;
- tower targets;
- Core health state;
- available deployment zone.

If VFX obscure these, the effect fails regardless of beauty.

---

## 14. HUD system

### 14.1 Philosophy

The HUD is a tactical frame around the battlefield. It is not the main visual subject.

### 14.2 Top HUD

Required:

- Blue Core health;
- Red Core health;
- timer;
- compact pause;
- optional minimal tower status;
- version in shell, not repeated prominently inside the canvas.

Design:

- dark translucent plates;
- thin faction edge light;
- compact typography;
- no oversized empty boxes;
- safe-area compliance for Dynamic Island.

### 14.3 Bottom HUD

Required:

- energy amount and fill;
- Assault, Tank, Raider cards;
- selected state;
- cost;
- unavailable state;
- concise deployment hint during onboarding only.

Card hierarchy:

1. class silhouette/icon;
2. class name;
3. cost;
4. availability/selected state.

Cards must not use long subtitles such as STRIKE, HEAVY, RAPID if they reduce readability. Role can be communicated through icon and silhouette.

### 14.4 Interaction

- select card;
- tap lane to deploy;
- no persistent center overlay;
- no LEFT/CENTER/RIGHT buttons;
- no PUSH/HOLD/FLANK controls unless they return as a separately approved gameplay system;
- touch targets remain at least approximately 44 CSS pixels in the final site viewport.

### 14.5 Typography

Use a compact, high-legibility sci-fi typeface or system-safe equivalent. Avoid excessive letter spacing on small labels. Numerals must remain readable at phone scale.

---

## 15. Icons and symbols

### 15.1 Brand symbol

The three-pronged crown is the primary symbol. It should appear in:

- Core stabilizer arrangement;
- faction emblems;
- selected-card detail;
- central arena socket;
- loading indicator;
- marketing key art.

Do not stamp the exact logo everywhere. Use structural echoes.

### 15.2 Class icons

Icons are silhouette-first and geometric:

- Assault — angled rifle over crown base;
- Tank — broad shield/heavy chassis;
- Raider — split blade or forward V;
- Sniper — long sight line;
- Medic — ring plus energy node.

All icons require monochrome readability before color.

---

## 16. Audio direction

Although this is an art bible, visual impact depends on matching sound.

Audio character:

- titan: low mechanical rhythm, distant mass, restrained;
- Vanguard: clean electrical transients and controlled servo clicks;
- Hostile Crown: distorted heat, unstable power, metal strain;
- Core: layered pulse plus rotating magnetic tone;
- Tank: low-frequency mechanical impact;
- Raider: high-speed blade/booster transient.

No copyrighted commercial clips. Use licensed assets, authored sounds or procedural placeholders with documented provenance.

---

## 17. Asset strategy

### 17.1 Final visual assets

A production object may come from:

- an original low-poly model;
- a properly licensed model modified into the project language;
- a generated mesh authored by editor tooling;
- modular components assembled into an original silhouette.

### 17.2 Primitive policy

Unity primitives are permitted for:

- collision;
- hidden structural mass;
- early blockout;
- tiny mechanical details that no longer read as the original primitive.

Unity primitives are forbidden as the final dominant visible form of:

- character torso;
- character head;
- tower weapon;
- Core heart;
- major arena plate;
- faction emblem.

### 17.3 License record

Every third-party asset requires:

- source URL;
- creator/publisher;
- license text or product license;
- allowed commercial use confirmation;
- modification notes;
- whether it ships in production.

Maintain `ASSET_LICENSE_REGISTER.md`.

---

## 18. Mobile and WebGL constraints

### 18.1 Hard requirements

- portrait-first;
- iPhone Safari and Android Chrome;
- no HDRP;
- no ray tracing;
- no realtime reflection probes;
- no gameplay motion blur;
- minimal realtime lights;
- pooled frequent VFX;
- shared materials;
- bounded memory growth;
- no unsupported shader dependency.

### 18.2 Practical target budgets for the first commercial slice

These are working targets, not claims of measured device performance:

- active units: preserve current gameplay cap;
- shared materials: 8–14;
- realtime directional lights: 1;
- realtime point/spot lights during ordinary play: 0–2 maximum;
- simultaneous common projectiles: bounded by pool;
- simultaneous impact effects: bounded by pool;
- major transparent full-screen layers: 0;
- shipping WebGL payload: preferably under 15 MiB unless quality gain is documented;
- unique textures: atlas where practical;
- avoid textures above 2048 unless a specific screen-space need is demonstrated.

### 18.3 Performance truthfulness

Do not report “60 FPS” unless measured on a named device and browser. Reports should separate:

- compilation success;
- WebGL build success;
- desktop browser render;
- physical device median FPS;
- physical device 1% low;
- memory and thermal behavior.

---

## 19. Screenshot quality gate

Every major visual milestone must produce four real Unity captures:

1. match start;
2. first unit clash;
3. peak multi-lane battle;
4. Core critical/destruction.

A milestone fails visual approval if any capture shows:

- recognizable primitive characters;
- arena that reads as three disconnected strips;
- Core that reads as a cylinder or sphere on a base;
- unreadable class silhouettes;
- UI covering the main engagement;
- excessive black areas with no structural depth;
- uncontrolled glow;
- faction colors overwhelming material detail;
- visual quality depending on explanation rather than the image itself.

### 19.1 Thumbnail test

Reduce the screenshot to approximately 180 × 320 pixels. At that size the viewer must still distinguish:

- Blue side and Red side;
- three routes;
- both Core locations;
- Tank versus Raider;
- active battle focus.

### 19.2 Grayscale test

In grayscale, gameplay information must remain understandable through value and silhouette. Team color supports readability but cannot be the only signal.

### 19.3 Blur test

Apply strong blur. The composition should retain:

- bright Core anchors;
- dark battlefield mass;
- clear top and bottom UI bands;
- central route rhythm.

---

## 20. Anti-goals

CROWN//FRONT must not become:

- a generic Clash Royale clone with science-fiction paint;
- a neon cyberpunk board filled with random emissive strips;
- a collection of unrelated free assets;
- a dark scene where every object merges into black;
- a toy-like low-poly game with chunky primary colors;
- a cinematic image that sacrifices tactical legibility;
- a HUD-heavy simulation panel;
- a procedural-primitive demo presented as final art.

---

## 21. Approval checklist for every new visual object

Before a unit, tower, Core, prop or UI card is approved, answer:

1. Is its silhouette unique?
2. Does it follow the crown/hex/slanted-armor grammar?
3. Does it clearly belong to Vanguard or Hostile Crown?
4. Does it read at actual phone gameplay scale?
5. Does it preserve lane and target readability?
6. Does it use shared materials?
7. Is its animation authored rather than generic sine motion?
8. Are its VFX pooled or strictly bounded?
9. Is its license documented?
10. Does it look intentional in a real Unity screenshot?

Any “no” requires revision.

---

## 22. Implementation sequence

The reboot must be delivered as vertical slices, not a simultaneous full-game rewrite.

### Slice 1 — Hero frame

Build one production-quality still-playable scene containing:

- final camera framing;
- readable titan anatomy;
- player Core and enemy Core;
- one tower per side;
- one Vanguard Assault;
- one Hostile Assault;
- minimal HUD;
- final material and lighting baseline.

No new catalogue expansion until this frame passes screenshot approval.

### Slice 2 — Combat triangle

Add final visual treatments for:

- Assault;
- Tank;
- Raider;
- projectiles;
- impacts;
- spawn;
- death;
- tower combat.

### Slice 3 — Core spectacle

Complete:

- Core health states;
- critical state;
- destruction sequence;
- victory/defeat presentation;
- camera response;
- matching audio hooks.

### Slice 4 — Full board and optimization

Complete:

- all three route identities;
- edge anatomy and background depth;
- material consolidation;
- pool stress testing;
- phone QA;
- production publishing.

---

## 23. Definition of visual success

The reboot is successful only when all of the following are true:

- a screenshot clearly depicts battle on a mechanical king;
- the Core is a memorable icon rather than a generic reactor;
- Assault, Tank and Raider are distinguishable without labels;
- Vanguard and Hostile Crown have related but distinct construction languages;
- the center of the battlefield remains unobstructed;
- no dominant visible object reads as an untouched Unity primitive;
- lighting creates volume and hierarchy;
- effects strengthen impact without obscuring tactics;
- the UI is compact and touch-safe;
- the real phone capture looks materially better than version `0.3.0-alpha.3` without needing a written explanation.

---

## 24. Canonical directive to implementation agents

Implementation agents do not invent a new art direction while coding.

They must:

- follow this document;
- preserve gameplay unless a task explicitly authorizes gameplay changes;
- create real Unity assets and captures, not substitute mockups;
- present screenshot evidence before production publication;
- stop rather than ship a primitive-looking substitute;
- record any necessary deviation and obtain explicit approval.

The next implementation stage is **ART REBOOT SLICE 1 — HERO FRAME**. Its purpose is not to rebuild the whole catalogue. Its purpose is to prove, in one real playable Unity frame, that CROWN//FRONT can look like a distinctive commercial game.
