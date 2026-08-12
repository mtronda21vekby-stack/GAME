# BlackCrown Nexus iPhone Safari QA

This checklist is for physical devices. Simulator, desktop WebKit and Playwright
results are useful preflight evidence but do not count as a physical iPhone PASS.

## Setup

Run the site on a LAN-reachable local HTTPS origin in lab mode with production assets
disabled unless an approved GLB is under review:

```bash
VITE_BC_EXPERIENCE_MODE=lab \
VITE_BC_EXPERIENCE_DEBUG=1 \
VITE_BC_EXPERIENCE_QUALITY=auto \
VITE_BC_CROWN_ASSET_MODE=auto \
corepack pnpm --filter @blackcrown/site dev --host 0.0.0.0 --port 5194
```

Open `/nexus-lab?bcdeviceqa=1`. Do not expose this server to the public internet.
Export a device report after each test group. The report remains on-device until the
tester explicitly copies or downloads it.

## Device priority

1. Current Pro iPhone.
2. Current standard iPhone.
3. Oldest weaker iPhone in the supported matrix.

Record model, iOS and Safari versions. Never infer these values from user-agent data
inside the application.

## Result fields

Use this row for every test:

| Test | PASS / FAIL | Device | iOS | Safari | Quality | Backend | LOD | p95 ms | Worst ms | Context lost | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | --- |
| Example |  |  |  |  |  |  |  |  |  |  |  |

Attach the exported JSON and a screen recording only to the private QA record. Remove
any unrelated notifications or personal screen content before sharing.

## Manual matrix

1. Cold-load `/nexus-lab`; Crown or controlled static fallback is visible, no black screen or reload.
2. Reload after cache warm-up; no duplicate canvas and no second boot runtime.
3. Scroll all chapters in portrait; headings, Crown core and CTA remain unobstructed.
4. Rotate to landscape and back; camera reframes without horizontal overflow.
5. Collapse and expand Safari toolbars; scene follows VisualViewport without a jump or blank frame.
6. Fast-flick to Enter; root and canvas remain present.
7. Fast-flick back to Awakening; transforms reverse without drift.
8. Scrub Core Reveal and CROWN//FRONT repeatedly in both directions.
9. Exit to About and re-enter Nexus five times; canvas count is always one on entry and zero on exit.
10. Send Safari to background for 30 seconds and return; progress is preserved.
11. Lock and unlock the device; no full-page reload or stale touch layer.
12. Switch tabs and return; RAF resumes once and frame sample resets.
13. Enable Low Power Mode; AUTO remains stable or downgrades once.
14. Enable Reduce Motion; content remains available and fly-through motion is absent.
15. Keep sound off, then toggle on/off; no audio starts without user action.
16. Compare AUTO, LOW and MEDIUM; DPR caps are 1.0 / 1.25 and no white flash occurs.
17. Watch QA warnings for draw, triangle, frame-time and context thresholds.
18. Confirm there is no black screen, spontaneous page reload or broken DOM fallback.
19. Tap every primary CTA near screen edges; hit target is at least 44 x 44 px.
20. Confirm site dock/music overlays are absent and do not cover Nexus controls.
21. Confirm `canvasCount=1` and `rafOwnerCount=1` while active.
22. Trigger memory pressure by backgrounding other heavy tabs, then repeat fast scroll; record any context loss.
23. Copy and download the device report; JSON opens locally and contains no PII fields.

## Failure capture

On FAIL, export the device report before reloading. Record chapter/progress, orientation,
quality/backend/LOD, p95/worst frame, context-lost count and exact reproduction steps.
Do not label the device matrix complete until each priority device has a signed result row.
