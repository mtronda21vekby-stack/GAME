# CROWN//FRONT — THE CROWN ENGINE

Cloud-native Unity source for the next visual direction of CROWN//FRONT.

## Scope of this first source milestone

This folder does not overwrite the currently published alpha. It contains an isolated, code-generated Unity prototype with:

- portrait-first WebGL presentation;
- a battlefield on the torso of a living mechanical king;
- three readable lanes;
- Blue and Red reactor Cores;
- integrated defense towers;
- Assault, Tank and Raider units;
- energy-driven deployment;
- a three-minute AI match;
- a mobile battle HUD;
- deterministic scene generation and WebGL build automation.

The current public game remains under:

`apps/site/public/games/crown-front/`

The cloud build is produced as a GitHub Actions artifact first. It must not replace the public alpha until manual visual and mobile review passes.

## Unity version

`6000.5.3f1`

## Project entry points

- Runtime prototype: `Assets/_Project/Runtime/CrownEngineGame.cs`
- Scene/build generator: `Assets/Editor/CrownEngineCloudBuild.cs`
- Generated scene: `Assets/_Project/Generated/CrownEngine_Prototype.unity`
- Cloud workflow: `../../.github/workflows/crown-engine-unity.yml`

## Build locally

Open this folder as a Unity project, then run:

`CROWN FRONT → Cloud → Build WebGL`

Output:

`Builds/CloudWebGL/`

## Build in GitHub

Run the workflow:

`CROWN FRONT — Unity WebGL cloud build`

Unity licensing secrets must be configured in GitHub Actions. Never commit licenses, passwords, serials, tokens or local machine files.

## Review gate

The prototype is not approved by compilation alone. Before publication it requires:

- artifact download and browser launch;
- real iPhone Safari check;
- real Android Chrome check;
- touch and safe-area review;
- frame pacing and memory review;
- screenshots of the first clash, mass battle, Core attack and result screen;
- owner approval that the result is visually worth playing.

## Repository boundaries

Do not commit:

- `Library/`
- `Temp/`
- `Logs/`
- `Obj/`
- local `Builds/`
- Unity license files
- personal credentials
