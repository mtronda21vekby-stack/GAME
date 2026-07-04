# Automatic Cloudflare Pages Deploy

The repository now includes:

```text
.github/workflows/auto-deploy-cloudflare-pages.yml
```

## What it does

On every push to `main`, the workflow:

1. installs dependencies with pnpm;
2. builds production output with `pnpm build:prod`;
3. uploads `dist` as a short-lived artifact;
4. deploys `dist` to Cloudflare Pages.

## Required GitHub secrets

Add these repository secrets once:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Path:

```text
GitHub repo → Settings → Secrets and variables → Actions → New repository secret
```

## Cloudflare Pages project

The workflow deploys to:

```text
blackcrown-game
```

If the Cloudflare Pages project has a different name, change `CLOUDFLARE_PROJECT_NAME` inside:

```text
.github/workflows/auto-deploy-cloudflare-pages.yml
```

## Safe behavior

If the GitHub secrets are missing, the workflow still builds the project but skips Cloudflare deploy safely.

## Leaderboard database

The D1 binding still must exist in Cloudflare Pages:

```text
LEADERBOARD_DB
```

The leaderboard tables are created automatically by the API on first request.
