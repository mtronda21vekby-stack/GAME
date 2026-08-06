# BlackCrown Supabase + GitHub

## Isolation boundary

BlackCrown uses only the dedicated Supabase project below:

- Project name: `blackcrown`
- Project ref: `nmgotvxisujvpfoxivoq`
- Region: `us-east-2`
- Public API URL: `https://nmgotvxisujvpfoxivoq.supabase.co`
- GitHub repository: `mtronda21vekby-stack/GAME`
- Production Git branch: `main`

The `planetlocksmiths-admin` project belongs exclusively to Planet Locksmiths and must never be linked, queried, migrated, or deployed from BlackCrown workflows.

## Connection status

The native Supabase GitHub integration is connected to:

```text
mtronda21vekby-stack/GAME → main
```

Supabase reports the default `main` branch as connected and healthy. The repository root is the working directory because `supabase/` lives directly at the root of `GAME`.

## One deployment owner

Production schema deployment is owned exclusively by the native Supabase GitHub integration.

The repository workflow:

```text
.github/workflows/blackcrown-supabase.yml
```

is validation-only. It must not link to production or run `supabase db push`. This prevents the same migration from being deployed twice by two independent systems.

No GitHub secrets are required for the validation workflow. In particular, do not add database passwords, service-role keys, or Supabase access tokens unless the deployment architecture is intentionally changed in a separate reviewed pull request.

## Source of truth

Database schema changes are stored in:

```text
supabase/migrations/
```

The current production schema starts with the migration version already recorded by the dedicated BlackCrown project:

```text
supabase/migrations/20260806205714_create_blackcrown_world_status.sql
```

The local filename intentionally matches `supabase_migrations.schema_migrations` in the remote project, preventing the initial schema from being replayed as a second migration.

Do not edit production tables manually unless the same change is also represented by a versioned migration.

## GitHub Actions validation

On pull requests and pushes that change `supabase/**`, GitHub Actions:

1. Starts a clean local Supabase stack.
2. Applies every migration from scratch.
3. Runs database linting.
4. Stops the local stack even when a previous step fails.

This workflow validates migration reproducibility; it does not deploy to production.

## Native Supabase integration settings

Inside the `blackcrown` project, the integration should remain scoped to:

```text
Repository: mtronda21vekby-stack/GAME
Production branch: main
Working directory: .
```

Do not connect `planetlocksmiths-admin` to this repository.

For automatic production schema deployment, enable deployment only in the native Supabase integration. Do not recreate a parallel GitHub Actions deploy job.

## Site runtime variables

Public browser variables are documented in:

```text
apps/site/.env.example
```

They are publishable client credentials protected by Row Level Security. Database passwords, service-role keys, and Supabase access tokens must never be committed or exposed to Vite.

## Local commands

```bash
supabase start
supabase db reset --local
supabase db lint --local --level warning
supabase stop --no-backup
```

## Review gate

Before merging a schema change:

1. `BlackCrown Supabase Validation` must pass.
2. Site typecheck and production build must pass.
3. The migration must contain only BlackCrown schema changes.
4. The native Supabase integration must point to `GAME → main`.
5. Planet Locksmiths infrastructure must remain untouched.
