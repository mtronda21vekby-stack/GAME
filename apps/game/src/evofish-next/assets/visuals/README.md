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
    quest/
      artifacts/
        artifact-shell.png
      portals/
        dark-cave-portal.png
        ocean-return-portal.png
  resources/
    pearls.png
    crystal.png
    xp-plankton.png
    heal-bubble.png
    current-spark.png
    perk-speed.png
    perk-damage.png
    perk-shield.png
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

Портал тёмной пещеры открывается только при двух условиях:

- игрок достиг 45 уровня;
- найдены ровно 3 спрятанных артефакта (`artifact_shell`).

Артефакты не должны спавниться случайно и не должны появляться повторно после сбора.
