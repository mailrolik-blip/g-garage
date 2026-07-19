# G-Garage

G-Garage — отдельный демонстрационный интернет-магазин автозапчастей.

- GitHub: https://github.com/mailrolik-blip/g-garage
- Production: https://ggcar.ru
- WWW: https://www.ggcar.ru
- Server: 5.42.124.157

## Локальный запуск

```powershell
python -m http.server 8087
```

Открыть: http://localhost:8087

## Структура проекта

- `index.html` — главная страница.
- `css/style.css` — стили интерфейса и адаптива.
- `js/main.js` — переключение поиска и интерактивные состояния товаров.
- `assets/` — локальные изображения, логотипы и SVG-иконки.
- `assets/icons/` — локальные интерфейсные SVG.
- `screenshots/` — контрольные скриншоты проверки.

## Ветки

- `main` — готовая версия для публикации.
- `feature/g-garage-demo` — рабочая ветка демо и исправлений.

Изменения сначала проверяются в `feature/g-garage-demo`, затем fast-forward сливаются в `main`. Force push не используется.

## Проверка

```powershell
node --check js/main.js
python -m http.server 8087
```

Проверяемые viewport: `1440`, `1024`, `768`, `390` px.

## Деплой

Серверная директория:

```text
/var/www/ggcar.ru/
├─ releases/
└─ current
```

Новый релиз создаётся в `/var/www/ggcar.ru/releases/YYYYMMDD-HHMMSS/`.

Загружаются только:

- `index.html`
- `css/`
- `js/`
- `assets/`

Не загружаются `.git/`, `screenshots/`, `references/`, `README.md`, архивы и локальные служебные файлы.

После успешной загрузки `current` переключается на новый release:

```bash
ln -sfn /var/www/ggcar.ru/releases/<release> /var/www/ggcar.ru/current
```

Nginx-конфиг:

```text
/etc/nginx/sites-available/ggcar.ru
/etc/nginx/sites-enabled/ggcar.ru
```

Перед reload обязательно выполнить:

```bash
nginx -t
```

Основной сайт `avtomagistral77.ru` не редактировать.

## Откат

1. Найти предыдущий release в `/var/www/ggcar.ru/releases/`.
2. Переключить `current` на предыдущую директорию.
3. Проверить `nginx -t`.
4. Выполнить `systemctl reload nginx`.
5. Проверить `https://ggcar.ru` и ключевые ассеты.
