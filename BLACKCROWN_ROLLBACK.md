# BLACKCROWN.WORK rollback

This integration is delivered only through the existing GitHub repository and GitHub Actions pipeline. Do not use direct Wrangler deploy, Cloudflare Dashboard upload, FTP, SCP, DNS changes, force push, history rewriting, workflow deletion, or secret changes for rollback.

## Before push

The feature branch has no production effect. To leave it locally without deleting work:

```bash
git switch main
```

## After feature-branch push but before merge

Do not merge the pull request. Production remains on `main`. The remote feature branch may stay for inspection; do not delete it unless explicitly requested.

## After merge and deployment

Create a non-destructive revert branch from the current production branch. Replace `<DEPLOYED_MERGE_SHA>` with the merge or squash commit shown by the successful GitHub Actions deployment:

```bash
git fetch origin
git switch -c revert/crown-front-alpha origin/main
git revert <DEPLOYED_MERGE_SHA>
git push -u origin revert/crown-front-alpha
```

Open a pull request from `revert/crown-front-alpha` to `main`. Merge it only after explicit approval. The existing GitHub Actions workflow will build and redeploy the reverted `main` state.

If the integration was merged as several commits, revert them newest-to-oldest on the revert branch; never reset or force push `main`.

## Rollback verification

After the revert workflow succeeds:

1. Confirm `https://blackcrown.work/` returns 200 and no longer links to the removed alpha route.
2. Confirm `https://blackcrown.work/game/` returns 200 and EvoFish launches.
3. Confirm `https://blackcrown.work/lobby/` returns 200 and the fish lobby is unchanged.
4. Confirm `/games/crown-front/` no longer exposes a stale player shell.
5. Check the GitHub Actions run and record the revert commit/run in `BLACKCROWN_DEPLOY_REPORT.md`.

## Source backup

Pre-integration copies of every modified existing source file are stored at:

`Backups/PreCrownFrontLobbyIntegration/`

The backup excludes dependencies, caches, and generated build artifacts. Git revert remains the preferred rollback because it is auditable and preserves repository history.
