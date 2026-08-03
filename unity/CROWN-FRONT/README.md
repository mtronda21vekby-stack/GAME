# CROWN//FRONT — THE CROWN ENGINE cloud prototype

This folder is a clean Unity 6 source project that can be built from GitHub Actions without relying on the compiled alpha already published under `apps/site/public/games/crown-front/`.

## Current purpose

The project is a separate, non-shipping prototype for the new art/gameplay direction:

- portrait-first 2.5D tactical battle;
- combat on the body of a living mechanical king;
- three readable lanes across the titan's armor;
- hero Core reactor;
- integrated defense towers;
- Assault, Tank and Raider units;
- touch-first deployment UI;
- WebGL-compatible procedural presentation.

The existing public alpha must remain unchanged until this prototype is built, reviewed on a real phone and explicitly approved.

## Unity version

`6000.5.3f1`

## Cloud build

Workflow: `.github/workflows/crown-engine-webgl.yml`

Required GitHub Actions secrets:

- `UNITY_LICENSE`
- `UNITY_EMAIL` (when required by the license type)
- `UNITY_PASSWORD` (when required by the license type)

The workflow calls `CrownFront.Editor.CrownEngineCloudBuild.Build`, creates a generated scene and produces a WebGL artifact. It does not deploy to production automatically.

## Source policy

This folder contains source only. Do not commit:

- `Library/`
- `Temp/`
- `Logs/`
- `Obj/`
- local builds or IDE caches

## Review gate

A successful compilation or CI build is not visual approval. Replacement of `/games/crown-front/` requires:

1. screenshots from the running build;
2. iPhone Safari test;
3. Android Chrome test;
4. touch UX and frame-pacing review;
5. explicit owner approval.
