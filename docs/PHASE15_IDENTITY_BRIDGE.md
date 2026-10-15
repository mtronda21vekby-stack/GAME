# BLACK CROWN — Phase 15 Identity & Premium Bridge

Date: 2026-08-16

## Objective

Create one server-owned identity boundary between the BLACK CROWN website and BLACK CROWN OPS Telegram bot using the shared Supabase project `GAME`.

This phase does **not** enable fake checkout and does not grant Premium from browser input.

## Identity flow

1. The website establishes its existing HMAC-signed `bc_session`.
2. `/api/account/telegram/link-code` creates a cryptographically random, ten-minute, single-use code.
3. Only the SHA-256 digest of that code is stored in Supabase.
4. The user confirms the code in a private Telegram conversation.
5. The bot consumes the digest atomically and binds the Telegram user to the site account.
6. Site and bot read the same server-owned entitlement records.

## Supabase objects

- `blackcrown_accounts`
- `blackcrown_telegram_links`
- `blackcrown_telegram_link_codes`
- `blackcrown_entitlements`
- `blackcrown_account_events`

All tables use RLS and deny direct access to `anon` and `authenticated`. The RPC boundary is restricted to `service_role`.

Canonical Premium entitlement:

```text
blackcrown.premium
```

Only a trusted payment webhook, admin operation, migration, or server process may grant or revoke it.

## Website endpoints

- `POST /api/account/telegram/link-code`
- `GET /api/account/telegram/status`
- `DELETE /api/account/telegram/link`

All three require a valid signed user session. The portal is available at:

```text
/link-telegram/
```

## Required Cloudflare secret

The Pages Functions backend requires one encrypted server secret from Supabase `GAME`:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Modern `sb_secret_...` is preferred. A legacy JWT is accepted only when its decoded role is exactly `service_role`. Publishable/anon keys fail closed.

The secret must be configured in Cloudflare Pages and must never be added to GitHub or browser code.

## Telegram bot integration

The bot consumes the same RPC using the server key already configured in Render. It handles:

- `/link CODE`
- `/start link_CODE`
- `/unlink`

Link commands are accepted only in private Telegram chats and do not reveal the site user ID.

## Security properties

- one-time code, ten-minute expiry;
- 60 bits of cryptographic randomness;
- domain-separated SHA-256 storage;
- 15-second issuance rate limit;
- atomic consume with row locking;
- conflict prevention for already-linked accounts;
- server-only entitlements;
- no Telegram token, Supabase secret, or user password in the browser;
- audit events for link and entitlement changes.
