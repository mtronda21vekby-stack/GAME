# BLACK CROWN — Supabase GAME World Status Migration

Date: 2026-08-16

## Scope

The public website world-status registry is consolidated into the shared Supabase project `GAME`.

- Supabase project ref: `wqriwhciqvrbhkkiuhxb`
- Table: `public.blackcrown_world_status`
- Migration: `create_blackcrown_world_status`
- Runtime consumer: `apps/site/src/lib/blackcrownWorldStatus.ts`

No client project and no Planet Locksmiths data is part of this migration.

## Database state

The migration creates a read-only public registry with:

- primary key and value constraints;
- Row Level Security enabled;
- one `SELECT` policy for `anon` and `authenticated` when `is_visible = true`;
- browser roles granted `SELECT` only;
- automatic `updated_at` maintenance;
- seeded records for EvoFish, CROWN//FRONT, and BlackCrown Network.

Supabase Security Advisor returned zero security findings after the migration.

## Runtime switch

The website runtime now defaults to the `GAME` project URL and its browser-safe publishable key. Environment overrides remain supported for controlled local and preview builds.

The session-storage cache key was changed to `bc.world-status.game.v1` so a browser cannot reuse status data cached from the previous Supabase project.

## Security boundaries

- No service-role or secret key is present in browser code.
- Only a publishable browser key is embedded.
- RLS remains authoritative.
- On request failure, the existing cache/fallback behavior remains available.

## Validation

The repository trust gate verifies that:

- runtime and `.env.example` target Supabase `GAME`;
- the old Supabase project ref is absent from the world-status runtime;
- no privileged Supabase credential appears in browser-facing files.
