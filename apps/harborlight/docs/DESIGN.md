# Design contract

**Fantasy:** lighthouse keeper turned harbour dispatcher. Every ship is legible,
and every route is a choice, not a crop timer. The emotional arc is calm morning,
busy golden-hour traffic, then a short storm and relief.

**First 30 seconds:** one cargo ship, one matching port. Wrong-colour commands are
rejected with useful text. Tap-to-port assists with terrain routing, not traffic.
Manual drawing supports deliberate detours and rescue interceptions. Entry points
never spawn directly into another vessel. Ships wait near entry rather than
blindly hitting the island. Deadlines remain visible.

**Mastery:** chain deliveries less than 22 seconds apart, anticipate crossings,
use a stop to give way, use six seconds of quarter-speed focus to redraw courses,
trade a diversion for a rescue bonus, choose one upgrade between watches.

**Fairness:** three mistakes, finite session, restart, optional next-map unlock.
No offline punishment, energy restrictions, pay-to-win or grind gating first play.
No unlimited map expansion substituting for new decisions.

**Art direction:** late-summer North Atlantic miniature; textured-by-geometry
terracotta fishing houses, ivory/red lighthouse, sandy limestone, muted pine,
teal water, warm sun, coloured ship liveries and fine maritime graphic UI.
Do not replace detailed vessels with emoji. Keep the working sea visible.

**Implementation guides used:** public Game Studio, Web Game Foundations,
Three WebGL Game, Game UI Frontend, Game Playtest; official Three.js color
management, shadows and WebGLRenderer compileAsync documentation. Guidance is
reference material, not a claim of additional model training or certification.

**Acceptance:** actual rendered first frame; real pointer input; time passing to
port arrival; native storage reload; wrong-port rejection; hold, focus, upgrade,
three maps, result/replay, corrupt-save preservation. A simulated mobile browser
is not a physical iPhone GPU/performance test. Screenshots must be actual renders.
