# BLACKCROWN — локальная переделка платформы, 16 октября 2026

Ветка: `codex/blackcrown-platform-redesign-20261016`.
База: `02de74c2568694659208d678778b80d8a0224e0d` (локальный `origin/main`).
Рабочая копия: `/Users/maksim/Documents/Codex/2026-10-16/task/blackcrown-site`.

## Что изменено

- Новая главная: сразу доступный текст, кнопка выбора игры, самостоятельная декоративная GLB-корона, крупный блок Ballcrown, карточки EvoFish Next и Quiet Valley.
- Общие данные главной и `/games/` в `src/lib/platformGames.ts`. Каталог содержит четыре существующих проекта, поиск, фильтры и пустое состояние. CROWN//FRONT явно обозначен закрытой альфой.
- `/games/index.html` теперь собирается Vite из `games/index.html` с тем же React-приложением; существующий `scripts/assemble.mjs` продолжает использовать этот путь. `/games/*` игровых приложений остаются обычными внешними переходами.
- Общая навигация: Игры / Магазин / О проекте / Профиль. Помощь и правовая информация внизу. Обновлена страница о проекте; существующие магазин и профиль сохраняют свои функции. Убраны мобильный дубль dock и автомузыка.
- Иммерсивная сцена сохранена отдельно на `/nexus-lab`; второй ENTER-gate убран, возврат на главную работает.
- Корона: LOD2 существующего candidate-b, студийное освещение, ограниченный DPR, пауза вне экрана/скрытой вкладки, статичный reduced motion, SVG fallback и освобождение ресурсов.
- Мобильные кнопки около 48–54 CSS px, одноколоночные карточки. По фактическому рендеру исправлены обрезание главного заголовка, отступ старого плавающего header и длинный заголовок профиля.

## Источники изображений

`public/art/platform/` содержит только материалы сайта, игровые оригиналы не заменялись:

- `ballcrown-menu.webp`: реальный захват `task-3/ballcrown-native-browser-qa/desktop-native-menu.png`.
- `evofish-next.webp`: существующий `apps/lobby/public/assets/lobby/lobby-bg-station-16x9.png`.
- `crown-front.webp`: существующий `VisualReview/CROWN_FRONT_0.3.0-alpha.3_match-start.png`.
- `quiet-valley.jpg`: реальный кадр публичной `https://blackcrown.work/games/quiet-valley/` в Safari пользователя на Mac, 16 октября. Виден runtime `0.8.0-estate.1`; версия на сайте не рекламируется. Обрезан только браузерный chrome и край игрового UI. Исходный `apps/lobby/public/worlds/quiet-valley/preview.webp` обрезан: 7514 байт при заявленном RIFF размере 15012, поэтому не использован.

Маршруты по исходникам: Ballcrown `/games/ballcrown/`; EvoFish Next `/game/?mode=next` (лобби `/lobby/`); Quiet Valley `/games/quiet-valley/`; CROWN//FRONT `/games/crown-front/`.

## Выполненные проверки

- `node apps/site/node_modules/typescript/bin/tsc -p apps/site/tsconfig.json --noEmit` — успешно.
- `corepack pnpm --filter @blackcrown/site build` — успешно, включая `dist/games/index.html`.
- `VITE_BC_CROWN_ASSET_OVERRIDE= corepack pnpm --filter @blackcrown/site test` — 70 тестов / 12 файлов прошли.
- `corepack pnpm --filter @blackcrown/site check:bundle` — успешно: начальный JS 181.73 KiB, CSS 41.92 KiB. Проверка обновлена на реальные отдельные чанки CrownVisual/NexusLabPage; имена в карте отложенной загрузки Vite не считаются eager import.
- `git diff --check` — успешно.
- Визуально в **браузере пользователя Safari на Mac**: desktop (~1250 CSS px), узкая компоновка (~383 CSS px через размер окна и zoom 150%), обычный вертикальный скролл, выбор игры, прямое открытие каталога, фильтр экшна (2 результата), поиск без результатов и сброс, переходы магазин / профиль / о проекте, сцена без ENTER и возврат из неё.
- Скриншоты лежат вне Git-репозитория в соседней папке `/Users/maksim/Documents/Codex/2026-10-16/task/site-review/`.

## Ограничения и передача

Публикация и push не выполнялись. Проверялся локальный Vite dev preview; production-сборка проверена отдельно. Preview можно запустить: `corepack pnpm --filter @blackcrown/site dev --host 127.0.0.1 --port 5178`.

Физический iPhone, полный runtime Ballcrown/EvoFish/CROWN//FRONT, серверные авторизация/ownership/оплата и полная `build:prod`/сборка игровых приложений в этой задаче не проверялись. Новая игровая сборка Ballcrown остаётся в ведении отдельного исполнителя.

`/api/content`: в исходной активной главной Nexus потребителя нет; единственный потребитель — старый LiveFeedV3 в HomeV3 с fallback. Новый интерфейс этот API не вызывает. Handler без защиты обращается к `env.DB`, корневой Wrangler объявляет LEADERBOARD_DB, также есть незащищённый JSON.parse. Это возможные серверные причины 500, production-причина не установлена. Секреты, bindings и backend не менялись.

Checkout публикации `/Users/maksim/Documents/Codex/2026-10-12/task-3/release` сохранён чистым. Изменений Unity, `apps/site/public/games/ballcrown`, игровых сборок, сохранений или CURRENT в diff нет.

## Исправление после публикации

Проверка HTTP production обнаружила конфликт `/media/platform/*` с существующей Pages Function `functions/media/[[path]].ts` (R2 MEDIA). Только четыре статических изображения сайта перенесены в `/art/platform/`, ссылки каталога обновлены. Backend, bindings, секреты и игровые файлы не менялись. Исходный редизайн df3b98f перенесён через GitHub API как 9a6096e с идентичным деревом; pipeline 38950329427 завершился success.
