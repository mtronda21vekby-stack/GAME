# BLACK CROWN — Phase 15 Telegram + Premium Account Bridge

Date: 2026-08-16
Supabase project: `GAME` (`wqriwhciqvrbhkkiuhxb`)

## Objective

Create one authoritative identity bridge between the BlackCrown website and `@GGBF6_WARZON_BOT` without trusting browser-controlled IDs or local/mock purchases.

## Trust flow

1. The Telegram backend generates a cryptographically secure URL-safe token.
2. Only its SHA-256 hash is stored in `blackcrown_telegram_link_challenges`.
3. The token expires after at most 15 minutes and a newer token invalidates the previous one.
4. The site accepts the token only inside a server-verified signed `bc_session`.
5. The Pages Function supplies the signed site user ID to the Supabase RPC; a browser-supplied user ID is ignored.
6. The RPC consumes the token once and creates a one-to-one site ↔ Telegram mapping.
7. Linking never inserts into `blackcrown_entitlements`.
8. Telegram Premium is active only when a non-expired server row with entitlement key `bco_premium` exists.

## Database objects

Server-only tables:

- `blackcrown_telegram_link_challenges`
- `blackcrown_account_links`
- `blackcrown_entitlements`
- `blackcrown_account_link_events`

All four tables have RLS enabled, explicit deny-all browser policies, and no browser table grants.

Service-role-only RPCs:

- `blackcrown_create_telegram_link_challenge`
- `blackcrown_get_telegram_entitlement_status`
- `blackcrown_unlink_telegram`

Narrow public RPCs:

- `blackcrown_complete_telegram_link`
- `blackcrown_get_site_telegram_status`

The completion RPC is intentionally a public-key endpoint because its sole authority is the short-lived 192-bit one-time bearer token. It cannot mint entitlements. The status RPC returns no Telegram ID, username, profile, email, or payment data.

## Site endpoints

- `POST /api/integrations/telegram/link`
- `GET /api/integrations/telegram/status`

Both require a valid signed `bc_session`, return `Cache-Control: no-store`, and expose only sanitized status fields.

## Product rule

Account linking is identity plumbing, not payment processing. Existing KV store ownership, localStorage state, and mock checkout cannot activate `bco_premium` in the Telegram bot.

## Rollback

The website runtime can be rolled back independently. Database tables contain no production links until a real user consumes a valid token. Entitlement rows remain server-owned and are not removed by unlinking an account.
