# BLACK CROWN — Phase 15 Telegram + Premium Account Bridge

Date: 2026-08-16
Supabase project: `GAME` (`wqriwhciqvrbhkkiuhxb`)

## Objective

Create one authoritative identity bridge between the BlackCrown website and `@GGBF6_WARZON_BOT` without trusting browser-controlled IDs, usernames, local ownership state, or mock purchases.

## Deployed trust flow

1. The Telegram backend generates a cryptographically secure 192-bit URL-safe token.
2. Only its SHA-256 hash is stored in `blackcrown_telegram_link_challenges`.
3. The token expires after at most 15 minutes; creating a newer token invalidates the previous unused token for that Telegram user.
4. The raw token is carried in the URL fragment, so it is not sent in the initial HTTP request or ordinary referrer data.
5. The website creates or resumes a signed `bc_session` and verifies it before invoking its Pages Function bridge.
6. The Pages Function forwards the signed session token and the server-verified site user ID only to the fixed HTTPS bot origin `ggbf6-warzon-bot.onrender.com`.
7. The bot independently sends that `bc_session` to `https://blackcrown.work/api/me` and requires the returned profile ID to match the forwarded site user ID.
8. Only after this independent verification does the bot call the service-role-only Supabase completion RPC.
9. The RPC locks and consumes the one-time token and creates a one-to-one site ↔ Telegram mapping atomically.
10. Linking never inserts into `blackcrown_entitlements`.
11. Telegram Premium is active only when a current server-owned entitlement with key `bco_premium` exists for the linked site account.

## Database objects

Server-only tables:

- `blackcrown_telegram_link_challenges`
- `blackcrown_account_links`
- `blackcrown_entitlements`
- `blackcrown_account_link_events`

All four tables have RLS enabled, explicit deny-all browser policies, and no `anon` or `authenticated` table grants.

Service-role-only RPCs:

- `blackcrown_create_telegram_link_challenge`
- `blackcrown_complete_telegram_link`
- `blackcrown_get_site_telegram_status`
- `blackcrown_get_telegram_entitlement_status`
- `blackcrown_unlink_telegram`

No account-link or entitlement RPC is callable directly by browser roles. No service-role or `sb_secret_*` credential is present in browser code.

## Site endpoints

- `POST /api/integrations/telegram/link`
- `GET /api/integrations/telegram/status`

Both require a valid signed `bc_session`, return `Cache-Control: no-store`, ignore browser-supplied user IDs, and expose only sanitized link/Premium status fields.

## Bot endpoints

- `POST /integrations/site/telegram/link`
- `GET /integrations/site/telegram/status`

These endpoints accept requests only through the narrow site bridge contract, validate bounded inputs, independently verify the site session, and never expose Telegram or site account identifiers in their responses.

## Product rule

Account linking is identity plumbing, not payment processing. Existing KV store ownership, localStorage state, mock checkout, profile fields, Telegram usernames, and button presses cannot activate `bco_premium`.

Existing bot capabilities remain in observe/status mode in this release; the bridge does not suddenly remove previously available AI, memory, VOD, voice, Mini App, or menu functionality.

## Validation

- Site TypeScript, unit tests, Chromium/WebKit smoke tests, bundle gates, and production build passed.
- Supabase migrations reset and lint passed from a clean local database.
- Supabase Security Advisor returned no findings.
- All link/status/unlink RPCs were verified as `service_role`-only.
- Bot compile, 108 automated tests, import smoke, Render deployment, Supabase startup probe, and production readiness passed on release `13.0.0`.

## Rollback

The website and bot runtimes can be rolled back independently. Entitlement rows remain server-owned and are not removed by unlinking an account. No Premium entitlement is minted by this migration or by account linking.
