# BlackCrown Nexus Visual Direction V1

Captured on 2026-08-09 from local checkpoint `198d5c9` before the visual
direction pass. The experience ran in `lab`, `debug`, `high` mode. Every frame
was positioned from the measured `ScrollStory` travel and captured only after
`targetProgress` and smoothed `progress` converged within 0.0035.

## Capture Evidence

- Directory: `/tmp/blackcrown-nexus-visual-pass-v1/`
- Desktop: `1440x900`, progress `0`, `0.06`, `0.18`, `0.34`, `0.52`, `0.68`,
  `0.84`, `0.96`, `1.0`, plus full-page and debug frames.
- Mobile: `390x844`, the same nine deterministic states, plus full-page and
  debug frames.
- Baseline HIGH at inspection: WebGL2, 64 draw calls, 14,320 triangles,
  observed 119.8 FPS and 9.5 ms frame time in the local browser at DPR 1.

## Global Findings

| Area | Grade | Evidence | Decision |
| --- | --- | --- | --- |
| Crown identity | BLOCKER | The dominant read is a blue reactor orb surrounded by rings and vertical bars. The crown arc, shell thickness, physical gaps and central spire do not form one silhouette. | Rebuild the existing procedural shell behind the same `CrownVisual` contract as a frontal tapered crown assembly with an unmistakable upper line. |
| First frame | BLOCKER | Only the core and background rings are visible. The named Crown is absent and the right half has no premium focal object. | Show a restrained, nearly assembled dark silhouette from progress zero; use rim/key light instead of hiding it. |
| Material hierarchy | BLOCKER | The shell is effectively black-on-black while the core is a flat saturated cyan mass. | Introduce a shared black-titanium/gunmetal system, carbon inner surfaces, narrow energy channels and layered core materials. |
| Lighting | BLOCKER | Emissive geometry supplies most of the readability; shell form is not described by light. | Add cool key, cyan rim, weak fill and progress-driven core/orange portal lights. |
| Portal depth | BLOCKER | Large rings surround a flat core; tactical orange behaves like a hue overlay rather than a destination. | Build nested aperture, tunnel rings, shutters, spokes and depth planes with separate cyan/orange energy roles. |
| Background architecture | WEAK | Broad arcs and loose lines compete with the object and read as decorative HUD geometry. | Reduce opacity and organize the architecture around the crown/portal axis by chapter. |
| Particles | WEAK | Uniform star points give depth but behave as constant dust. | Split seeded far, mid and sparse foreground fields with tier-specific counts and chapter intensity. |
| HUD | WEAK | Seven equal chapter numbers plus `NEXUS A L M H SOUND OFF` read as a development toolbar. | Promote brand/current chapter, reduce equal-weight navigation, keep controls compact and preserve real DOM/accessibility. |
| DOM typography | PASS | Headings are strong and readable on desktop; focusable actions are real DOM. | Preserve scale, shorten collisions and move copy away from the brightest core zones. |
| Mobile composition | BLOCKER | Inspection, ecosystem and final states crop the core under the HUD; dense rings and eight module links create visual noise. | Use mobile-specific camera/object scale, four primary module links and quieter geometry/portal tiers. |
| Determinism | PASS | Timeline states settle at requested progress and reverse through one ScrollDirector. | Keep absolute progress evaluation and avoid independent tweens or timers. |

## 01 Awakening

- **Focal point: WEAK.** The blue core is visible, but it is a generic sphere
  rather than a BlackCrown artifact.
- **Silhouette readability: BLOCKER.** No central or side spire is visible.
- **Crown scale/camera: BLOCKER.** Crown silhouette occupies effectively zero
  percent of the frame; the camera frames empty rings instead.
- **Depth/material/lighting: WEAK.** Rings provide depth, but black shell form
  has no material highlights or lighting hierarchy.
- **Color hierarchy: WEAK.** Cyan core dominates; violet is an arbitrary ring.
- **DOM/HUD: WEAK.** Copy is readable, but the toolbar attracts too much
  attention and the object does not balance the heading.
- **Mobile crop: PASS for text, BLOCKER for art.** The core fits, but the Crown
  itself is absent.
- **Transition quality: WEAK.** There is no visual setup for incoming segments.
- **Solution.** Start from a 46-55% assembled silhouette, low core intensity,
  restrained architecture and a right-biased hero framing with visible spires.

## 02 Assembly

- **Focal point: BLOCKER.** The core remains the only readable object.
- **Silhouette/crown scale: BLOCKER.** Shell segments are not readable as
  incoming crown parts.
- **Camera/depth: WEAK.** Camera movement exists, but no trajectory or stagger
  explains assembly in depth.
- **Material/lighting: BLOCKER.** Incoming black geometry disappears.
- **DOM/HUD: PASS/WEAK.** Heading is clear; equal HUD navigation remains noisy.
- **Mobile crop: WEAK.** Art remains small but visually undefined.
- **Transition quality: BLOCKER.** It reads closer to scale-from-nothing than
  controlled magnetic assembly.
- **Solution.** Give every shell panel a seeded depth/side origin, stagger its
  absolute progress, preserve thickness and damp rotation near the hero pose.

## 03 Inspection

- **Focal point: BLOCKER.** A large blue orb wins over the named Digital Crown.
- **Silhouette readability: BLOCKER.** Vertical bars and rings read as turbine,
  cage or reactor, not a crown arc.
- **Crown scale/camera: WEAK.** The occupied area is large, but the object is
  too close and fragmented. Mobile crops it behind the HUD.
- **Depth separation: WEAK.** Foreground bars exist without an intentional
  housing/midground relationship.
- **Material/lighting: BLOCKER.** Shell surfaces have almost no readable PBR
  response.
- **DOM readability: PASS on desktop, WEAK on mobile.** Actions remain usable,
  but artwork crosses the heading zone on mobile.
- **Transition quality: WEAK.** Assembly does not visibly settle into a hero
  lock.
- **Solution.** Establish the definitive three-quarter crown hero, 58-64% frame
  height desktop and 42-50% mobile, with a quieter core and lit titanium shell.

## 04 Core Reveal

- **Focal point: WEAK.** Core becomes central as intended, but it was already
  dominant in previous chapters.
- **Shell behavior: BLOCKER.** The shell does not read as physically parting.
- **Rings/channels: WEAK.** Rings enlarge, but their alignment does not expose
  layered containment.
- **Material/lighting: BLOCKER.** The core is a flat bright cyan volume and
  internal surfaces receive no convincing light.
- **DOM/mobile: WEAK.** Desktop copy is readable; mobile core approaches the HUD
  and headings.
- **Transition quality: BLOCKER.** No strong inspection-to-aperture causal move.
- **Solution.** Open shell panels laterally and backward, align energy rings,
  reveal containment/middle/nucleus layers and use a local core point light.

## 05 CROWN//FRONT

- **Focal point: BLOCKER.** A blue core still dominates the tactical chapter.
- **Portal depth: BLOCKER.** The portal reads as large flat rings around a blob.
- **Art direction: BLOCKER.** Orange is a thin hue change, not a separate
  black/orange mechanical operation.
- **Camera/occlusion: WEAK.** Camera approaches the axis, but no shutters or
  tunnel planes create passage.
- **DOM/HUD: PASS/WEAK.** CTA is explicit, but development copy adds visual
  competition.
- **Mobile crop: BLOCKER.** Portal/core are oversized above the copy.
- **Solution.** Add a segmented aperture, tunnel depth, foreground shutters,
  local orange portal light and desaturated cyan identity retained at the rim.

## 06 Ecosystem

- **Focal point: BLOCKER.** Crown is not legible; blue core and many rings remain
  central.
- **Node hierarchy: BLOCKER.** Identical diamonds/rings sit on a mostly flat
  orbit and resemble random indicators.
- **Depth separation: WEAK.** Some nodes vary in Z, but housing and importance
  are not communicated.
- **DOM readability: BLOCKER on mobile.** Eight equal buttons plus WebGL nodes
  form a dense grid over the scene.
- **Color/lighting: WEAK.** Orange rings persist without clear tactical cause.
- **Transition quality: WEAK.** Portal does not stabilize into a network hub.
- **Solution.** Build housed primary/secondary/tertiary nodes across three depth
  bands, pull the camera back, retain the Crown as anchor, and show four primary
  DOM modules on mobile with an accessible secondary menu.

## 07 Enter

- **Focal point: BLOCKER.** The final view remains the same reactor/ring cluster.
- **Narrative completion: WEAK.** CTA appears, but the scene has not visually
  prepared a charged destination.
- **Portal: BLOCKER.** It does not expand into a deep, stable final aperture.
- **Camera: WEAK.** Centering improves, but clutter occupies the CTA's negative
  space and mobile shows cropped rings/core above it.
- **DOM/CTA: PASS.** Actions are present and no automatic redirect occurs.
- **Transition quality: WEAK.** Nodes do not clearly recede and rings do not
  synchronize into a resolved gate.
- **Solution.** Remove secondary nodes, partially close the Crown around the
  portal, synchronize rings, expand tunnel depth, center the camera and reserve
  a clean lower-left/lower-center CTA field.

## Acceptance Direction

The pass will modify the existing procedural object and scene owners rather
than creating a parallel crown or replacing it with a generic model. The
`CrownVisual` adapter contract, chapter ranges, native scrolling, one renderer,
one RAF, lazy Three.js boundary, off-mode isolation and current commerce/site
foundation remain protected.
