# CROWN//FRONT Menu Flow Map

## Controlled state graph

```text
Bootstrap scene
  -> MainMenu
       -> DeckBuilder -> save four unique IDs -> MainMenu
       -> Collection  -> MainMenu
       -> Settings    -> save/apply locally -> MainMenu
       -> Loading
            -> validate deck + Core
            -> start existing CrownEngineGame session
            -> Battle
                 -> match winner event
                 -> deterministic one-time reward
                 -> Results
                      -> Play Again -> Loading -> Battle
                      -> Main Menu -> cleanup -> MainMenu
```

`CrownAppFlowController` is the only owner of screen transitions. Screen components do not independently activate arbitrary panels. Exactly one `CrownEngineGame`, one `Canvas` and one `EventSystem` are kept through repeated sessions.

## Runtime screen hierarchy

```text
CROWN FRONT APPLICATION
├── CrownAppFlowController
├── CrownAppUI
├── CrownApplicationCanvas
│   └── SafeAreaRoot
│       ├── MainMenuCanvas
│       ├── DeckBuilderCanvas
│       ├── CollectionCanvas
│       ├── SettingsCanvas
│       ├── BattleCanvas
│       └── ResultsCanvas
└── CrownEngineGame
    ├── Main Camera
    ├── Crown Key Light
    ├── THE CROWN ENGINE // PRESENTATION ROOT
    │   ├── six baked SpriteRenderer layers
    │   ├── two dynamic Core roots
    │   └── six dynamic tower roots
    └── pooled projectiles and impacts
```

## Deck data flow

1. `CrownUnitCatalog` loads real `CrownUnitDefinition` assets from `Resources/CrownUnits`.
2. Deck Builder rejects incomplete, unknown, locked and duplicate IDs.
3. Four validated stable IDs are stored in `CrownPlayerProfile.selectedDeck`.
4. Start Battle converts those IDs to four `CrownUnitKind` values.
5. The same deck supplies the four Battle HUD cards and limits selectable player spawns.

## Results safety

Each local match receives a monotonically increasing profile sequence. Results calculate fixed victory/defeat XP and coin rewards, record the result ID in the last 32 claimed IDs and refuse a second grant for the same result. Returning to the menu resets transient units and active pooled effects, restores building state and leaves the single gameplay root intact.

## Background recovery

When a browser tab loses focus during Battle, only the gameplay session is paused. Returning focus removes the resume shield and continues the existing session; the WebGL page is not reloaded and no additional services or roots are created.
