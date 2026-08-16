# BLACK CROWN — Phase 13 Commerce / Entitlement Trust Boundary

## Security findings

The pre-Phase-13 commerce path was not a real payment boundary:

- browser checkout sent `paymentMethod: "mock"`;
- the Pages Function accepted it in production;
- the server immediately marked the order `paid` and wrote server entitlements to Cloudflare KV;
- commerce/profile authorization trusted a raw `bc_uid` cookie without a signature.

Together, those behaviors allowed client-controlled state to become server ownership.

## Phase 13 rules

### Signed user session

Security-sensitive endpoints use the server-issued `bc_session` cookie.

The token is HMAC-SHA256 signed and contains:

- user id;
- issued-at timestamp;
- expiry timestamp.

The raw legacy `bc_uid` cookie no longer authorizes:

- checkout;
- entitlement reads;
- order reads;
- `/api/me` profile reads/writes.

Preferred signing secret: `BC_USER_SESSION_SECRET`.

Compatibility fallback order:

1. `BC_USER_SESSION_SECRET`
2. `BC_SESSION_SECRET`
3. `USER_SESSION_SECRET`
4. existing `BC_ADMIN_SECRET` / `ADMIN_SECRET`, with explicit `blackcrown:user-session:` HMAC domain separation.

If no server secret exists, the user session boundary fails closed.

### Guest bootstrap

`/api/auth/guest` issues a signed session after new-user creation or device recovery. Recovery `clientId` must be at least 20 characters; it remains a device bootstrap credential, not a commerce authorization credential.

### Mock checkout kill switch

Mock checkout is disabled by default.

It is accepted only when the Cloudflare server environment explicitly sets:

`BC_COMMERCE_MOCK_ENABLED=1`

When disabled, a browser request with `paymentMethod: "mock"` receives `payment_provider_unavailable` and no order/entitlement is written.

A real payment provider must later become authoritative through a verified server callback/webhook before production purchasing is re-enabled.

### Shared Supabase GAME

The public browser sample configuration now points to the shared BLACK CROWN Supabase `GAME` project. Only the public publishable key is present in frontend configuration; no secret/service-role credential is allowed.

The existing `blackcrown_world_status` migration is already present under `supabase/migrations/`, but it is **not applied by this phase**. Production world-status remains on the previous source until the migration is explicitly authorized and verified on the shared `GAME` project.

## CI gate

`scripts/check-commerce-trust.mjs` prevents regression of the critical invariants and is executed by both:

- Site PR Check;
- production Cloudflare Pages build before deployment.

The gate rejects raw-cookie commerce auth, missing signed-session usage, missing mock kill switch, stale shared-Supabase sample configuration, and privileged Supabase credentials in browser env samples.
