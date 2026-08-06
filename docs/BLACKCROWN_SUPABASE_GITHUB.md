# BlackCrown Supabase + GitHub

## Isolation boundary

BlackCrown uses only the dedicated Supabase project below:

- Project name: `blackcrown`
- Project ref: `nmgotvxisujvpfoxivoq`
- Region: `us-east-2`
- Public API URL: `https://nmgotvxisujvpfoxivoq.supabase.co`

The `planetlocksmiths-admin` project belongs exclusively to Planet Locksmiths and must never be linked, queried, migrated, or deployed from BlackCrown workflows.

## Source of truth

Database schema changes are stored in:

```text
supabase/migrations/
```

The current production schema starts with:

```text
supabase/migrations/20260806190500_create_blackcrown_world_status.sql
```

Do not edit production tables manually unless the same change is also represented by a versioned migration.

## GitHub Actions workflow

Workflow:

```text
.github/workflows/blackcrown-supabase.yml
```

It performs two separate jobs:

1. Every pull request that changes `supabase/**` starts a clean local Supabase stack, applies all migrations, and runs database linting.
2. Production migration deployment is guarded. It runs only when manually requested or when the repository variable `BLACKCROWN_SUPABASE_AUTODEPLOY` equals `true` on a push to `main`.

## One-time GitHub configuration

Open the repository settings:

```text
Settings → Secrets and variables → Actions
```

Create these repository secrets:

```text
SUPABASE_ACCESS_TOKEN
BLACKCROWN_SUPABASE_DB_PASSWORD
```

- `SUPABASE_ACCESS_TOKEN` is a personal access token created in the Supabase account settings.
- `BLACKCROWN_SUPABASE_DB_PASSWORD` is the database password for the dedicated `blackcrown` project only.
- Never use credentials from `planetlocksmiths-admin`.

Create this repository variable only after the first manual workflow deployment succeeds:

```text
BLACKCROWN_SUPABASE_AUTODEPLOY=true
```

Recommended GitHub environment:

```text
blackcrown-supabase-production
```

The deploy job already targets this environment, so optional approval rules can be added in GitHub before migrations reach production.

## First deployment

1. Merge a pull request only after `Validate migrations locally` is green.
2. Open `Actions → BlackCrown Supabase → Run workflow`.
3. Set `deploy` to `true`.
4. Confirm that `Deploy migrations to BlackCrown` and `Show remote migration state` pass.
5. Then set `BLACKCROWN_SUPABASE_AUTODEPLOY=true` if automatic migration deployment from `main` is desired.

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

To inspect the linked production migration state after GitHub secrets are configured:

```bash
supabase link --project-ref nmgotvxisujvpfoxivoq
supabase migration list --linked
```
