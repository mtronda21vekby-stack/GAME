# CROWN//FRONT Closed Alpha 0.1.0-alpha.1

## Local launch

The WebGL build must be served over HTTP; opening `index.html` directly is unsupported.

```bash
cd /path/to/blackcrown-monorepo
npm run build:prod
apps/ws-lobby/node_modules/.bin/wrangler pages dev dist --port 8788
```

Open `http://127.0.0.1:8788/games/crown-front/` in a current desktop or mobile browser. Stop the server with `Ctrl+C`.

## Publishing requirements

- Publish the complete folder without renaming files inside `Build/`.
- Serve over HTTPS for public testing.
- The `.unityweb` files contain Unity's Brotli fallback wrapper. Serve them with the configured MIME types and without `Content-Encoding: br`; the loader performs fallback decompression.
- Do not enable cross-origin isolation without testing the chosen host.
- Keep IndexedDB/site storage enabled so tutorial, privacy acceptance, saves, telemetry, replays, and local feedback persist.
- The game does not require fullscreen. A fullscreen request is only allowed after a user action.
- Verify portrait touch UI on real iOS Safari and Android Chrome before public distribution.

## Integrity

`SHA256SUMS.txt` contains the SHA-256 hash of every shipping file except the manifest itself.

```bash
cd Builds/WebGL/CROWN-FRONT-0.1.0-alpha.1
shasum -a 256 -c SHA256SUMS.txt
```

Production publication is allowed only through the existing BlackCrown GitHub repository and its existing GitHub Actions pipeline. Do not run direct Wrangler, Dashboard, Pages upload, Workers, FTP, SCP, or manual file deployment commands.
