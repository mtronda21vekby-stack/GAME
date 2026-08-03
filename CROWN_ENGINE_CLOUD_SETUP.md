# CROWN//FRONT cloud development setup

## What has been added

A new Unity source root now lives inside the existing website repository:

`unity/crown-front/`

This keeps the source and website in the user's existing GitHub repository while leaving the current production WebGL alpha untouched.

## Security boundary

GitHub Actions secrets are the only approved location for Unity credentials. Required names depend on the license type:

- `UNITY_LICENSE`
- `UNITY_EMAIL`
- `UNITY_PASSWORD`
- `UNITY_SERIAL` only when the license requires a serial

Do not paste these values into issues, pull requests, commits, logs or chat.

## First cloud build

1. Open repository Settings.
2. Open Secrets and variables → Actions.
3. Add the Unity licensing secrets.
4. Open Actions.
5. Run `CROWN FRONT — Unity WebGL cloud build`.
6. Download the artifact named `crown-engine-webgl-<commit>`.
7. Test it through an HTTP server; do not open Unity WebGL with `file://`.

## Publication policy

The first generated artifact is a review build. It must not replace:

`apps/site/public/games/crown-front/`

until it passes manual browser/mobile review.

After approval, the release process will:

1. back up the current route;
2. copy the approved artifact into the existing route;
3. preserve the mobile-safe BlackCrown player shell;
4. run `npm run build:prod`;
5. smoke-test EvoFish and CROWN//FRONT;
6. open a PR;
7. merge through the existing GitHub → Cloudflare production pipeline.
