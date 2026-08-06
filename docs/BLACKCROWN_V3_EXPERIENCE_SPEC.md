# BLACKCROWN V3 — FINAL EXPERIENCE

Status: implementation branch
Branch: `feature/blackcrown-v3-experience`
Production: unchanged until explicit approval and merge

## Product goal

Make `blackcrown.work` feel like a premium AAA game platform rather than a conventional React landing page. Preserve the BLACKCROWN // NEXUS brand-first direction, existing routes, account/store/lobby behavior, PWA recovery, Cloudflare deployment, and game payloads.

## Non-negotiable principles

- BLACKCROWN remains the first-screen product and focal point.
- Visual effects must support hierarchy, not compete with content.
- Mobile Safari is a first-class target.
- No clipped titles, accidental horizontal overflow, unsafe-area collisions, or unreadable dark artwork.
- Motion respects `prefers-reduced-motion` and touch devices.
- Heavy effects are progressively enhanced and lazy-loaded.
- Target smooth interaction on current iPhone/Android hardware; do not trade usability for spectacle.

## 1. Hero 2.0

- Reduce excessive mobile hero height by approximately 20–25%.
- Keep BLACKCROWN editorial wordmark visible without clipping.
- Digital Crown Core becomes the dominant visual focal point.
- Add controlled black-metal, glass, cyan reactor, restrained violet/orange accents.
- Improve cinematic lighting, depth, shadow, smoke/fog illusion and reflected highlights without heavy video assets.
- Ensure CTA and the beginning of the next section are visible sooner on mobile.
- Keep copy concise and improve first-screen comprehension within 2–3 seconds.

## 2. Matrix depth system

- Multi-depth Matrix layers: far, mid, near, foreground.
- Different speed, opacity, blur and density per layer.
- Rare foreground glyph passes and restrained flashes.
- Lower competing brightness behind text.
- Pause or simplify when tab is hidden, reduced motion is enabled, or device capability is low.

## 3. Digital Crown Core

- Reactor pulse, rotating portal rings, energy paths and black-glass crown material.
- Fine-pointer parallax on desktop.
- Subtle gyroscope/touch parallax only when safe and permission-free; otherwise static touch presentation.
- Safari-safe transforms and reduced-motion static state.
- No third-party 3D runtime dependency.

## 4. Cinematic world transitions

- Hero → worlds transition through controlled Matrix separation and ambient-light change.
- EvoFish: cyan ocean depth, bioluminescence, water distortion illusion and particles.
- CROWN//FRONT: black metal, reactor orange, cyan energy, smoke/fog illusion and alert accents.
- Store: premium black glass, restrained gold and luxury presentation.
- AI-Coach: neural nodes, holographic links and violet/cyan intelligence atmosphere.
- Avoid aggressive scroll hijacking.

## 5. Mobile typography

- All major headings use tested `clamp()` values.
- `CROWN//FRONT` must never be clipped or overflow the viewport.
- Improve line breaks, paragraph width, rhythm and spacing.
- Reduce oversized body copy and maintain readable contrast.
- Validate at 320, 375, 390, 393, 414 and 430 CSS-pixel widths.

## 6. Premium glass system

- Replace generic cards with a consistent glass + black-metal material system.
- Use inner reflections, edge highlights, subtle refraction illusion and controlled emissive borders.
- Preserve modal/drawer stacking and admin isolation.
- Avoid excessive blur on low-end/mobile devices.

## 7. Reactor-backed world stages

- Each major world card has a restrained energy source beneath or behind it.
- CROWN//FRONT uses cyan/orange reactor energy.
- EvoFish uses cyan/blue bioluminescence.
- Energy reacts gently to scroll visibility, not constant high-cost animation.
- Improve artwork readability, contrast and bloom without washing out text.

## 8. Dock 2.0

- Remove the current gold active-tab treatment.
- Create a thinner floating glass dock.
- Cyan/blue active state consistent with BLACKCROWN.
- Improve icon and label alignment, safe-area clearance and touch targets.
- Add restrained magnetic/spring response while preserving accessibility.
- Never obscure critical content or CTA buttons.

## 9. Color system

- Core: black metal, deep navy, white glow.
- Brand energy: cyan.
- CROWN//FRONT: reactor orange.
- Intelligence/AI: energy violet.
- Store/luxury: restrained warm gold only where semantically appropriate.
- Maintain WCAG-conscious contrast for text and controls.

## 10. Motion and micro-interactions

- Unified easing and spring tokens.
- Scroll reveal, magnetic hover, press response, focus states and light movement.
- No retained transforms that break fixed positioning or modal stacking.
- No motion that blocks navigation or content reading.
- Reduced-motion path removes parallax, loops and nonessential transitions.

## 11. Optional sound layer

- Off by default.
- Explicit user opt-in.
- Very quiet UI tones only; persistent preference and immediate mute.
- No autoplay audio.

## 12. Performance contract

- Prefer CSS transforms, opacity and lightweight canvas/SVG.
- Cap DPR and animation FPS where appropriate.
- Lazy-load optional FX and world artwork.
- Pause hidden/offscreen effects.
- Avoid large third-party animation libraries unless proven necessary.
- Keep initial route interactive quickly on mobile networks.

## Delivery phases

### Phase A — Mobile visual correction

- Hero height and first-screen balance.
- Mobile headline/paragraph tuning.
- CROWN//FRONT clipping fix.
- Dock 2.0.
- Artwork contrast and world-stage spacing.

### Phase B — Crown Core and depth

- Digital Crown Core material/lighting pass.
- Matrix depth upgrade.
- Ambient-light transitions.

### Phase C — World art direction

- EvoFish atmosphere.
- CROWN//FRONT reactor atmosphere.
- Store luxury pass.
- AI-Coach holographic pass.

### Phase D — Motion and polish

- Unified motion tokens and interactions.
- Scroll reveal and restrained parallax.
- Pixel-level spacing, typography, shadows and accessibility.

### Phase E — Device validation

- Physical iPhone Safari.
- Android Chrome.
- Desktop Safari/Chrome/Edge.
- Reduced motion.
- Landscape safe areas.
- Modal, Store, Account, Lobby and game navigation regression checks.

## Acceptance gate

Do not merge into `main` until:

- the user approves current physical-iPhone screenshots;
- no title clipping or horizontal overflow remains;
- dock, header and CTA do not collide with safe areas;
- main routes and modals remain functional;
- preview deployment succeeds;
- production game/WebGL payloads remain untouched.
