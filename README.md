# BlackCrown (site + EvoFish)

## Структура
- `/` → редирект на `/site/`
- `/site/` → премиум лендинг (Apple-like), PWA, статические страницы
- `/game/` → твоя игра EvoFish (одним файлом), **без изменения логики**

## Cloudflare Pages (самый простой деплой)
1) Заливаешь zip как GitHub repo
2) Cloudflare → Pages → Create project → Connect to Git
3) Framework preset: **None**
4) Build command: **(пусто)**
5) Output directory: **/**

## Домен
Pages → Custom Domains → добавь `blackcrown.work` (и опционально `www.blackcrown.work`)

## Ветка для игры
В zip веток быть не может, но ты легко сделаешь:

```bash
git checkout -b game
git rm -r site
git commit -m "game branch: only /game"
```

Дальше можно сделать второй Pages-проект на ветке `game` (например `play.blackcrown.work`).
