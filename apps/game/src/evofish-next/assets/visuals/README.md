# EvoFish Visual Assets

Центральная папка для всего визуала EvoFish.

## Структура ассетов

Файлы картинок кладём в публичную папку:

```text
apps/game/public/assets/evofish/
  skins/
    fish/
    shark/
    megalodon/
    npc/
  resources/
    pearls.png
    crystal.png
    xp-plankton.png
    heal-bubble.png
    current-spark.png
    perk-speed.png
    perk-damage.png
    perk-shield.png
    artifact-shell.png
  ui/
    button-primary.png
    panel-frame.png
    xp-bar.png
  water/
    reef-blue.png
    kelp-green.png
    deep-violet.png
    abyss-gold.png
    dark-cave.png
  portals/
    dark-cave-portal.png
  maps/
    dark-cave-bg.png
```

## Кодовый каталог

Все пути, цвета, темы воды, ресурсы, порталы и UI-ассеты регистрируются здесь:

```text
apps/game/src/evofish-next/assets/visuals/visualCatalog.ts
```

## Правило

Новый визуал не раскидываем по компонентам и системам. Сначала добавляем asset в `visualCatalog.ts`, потом подключаем в renderer/shop/spawn.

## Dark Cave

Портал тёмной пещеры открывается после 3 найденных артефактов (`artifact_shell`). Сейчас это визуальный gateway. Следующий шаг — отдельный map-state и полноценный вход в Dark Cave.
