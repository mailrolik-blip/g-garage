# ORION enrichment sources

Дата: 2026-07-21

## Полезные домены

- niparts.com: профессиональный каталог, дал точное совпадение 81.50110.0144 как MAN Brake Drum. Использовано только как evidence, из-за конфликта не auto-accepted. Источник: https://www.niparts.com/OEM/1CE937/MAN/81501100144.html
- chinaheavytruckparts.com: специализированный продавец запчастей грузовиков, дал точное совпадение 612630020222 с SHACMAN/WP12. Источник: https://chinaheavytruckparts.com/portfolio-item/612630020222
- pnm-parts.ru: специализированный магазин, дал подтверждение 612630020222 как SHACMAN/Shaanxi OE и DZ9L149585101 как SHACMAN BCM. Источники: https://pnm-parts.ru/catalog/shacman/shacman/612630020222, https://pnm-parts.ru/catalog/shacman/shacman/dz9l149585101
- autoopt.ru: крупный каталог, дал подтверждение DZ9L149585101. Источник: https://www.autoopt.ru/catalog/194002-blok_upravlenija_shacman_shaanxi_x6000_sistemoj_komforta_bcm_oe
- cnsinotruk.com: parts catalog, дал подтверждение DZ9L149585101 как X6000 Body Control Module. Источник: https://www.cnsinotruk.com/shacman-x5000-x6000-truck-parts/page-2/
- deruna.com: специализированные страницы Shacman, дал подтверждения по DZ95259450100 и evidence по 81.50110.0144/DZ14251770030. Источники: https://deruna.com/portfolio-item/shacman-dz95259450100, https://deruna.com/portfolio-item/shacman-81-50110-0144, https://deruna.com/portfolio-item/shacman-dz14251770030
- st-spares.ru: специализированный магазин, подтвердил DZ95259450100 как SHACMAN расширительный бачок. Источник: https://st-spares.ru/shacman/shacman-sistema-ohlaghdeniya-i-otopleniya/shaanxi-shacman-dz95259450100
- opex.ru: крупный продавец, дал одно точное совпадение DZ16251444076, но одного источника недостаточно для ACCEPT. Источник: https://www.opex.ru/catalog/offers/594457528/
- xgvictorious.com: parts-list страница Foton/Lovol, дала одно совпадение 9F550-45A030001A0; недостаточно для ACCEPT. Источник: https://xgvictorious.com/product/9f560-24a010504a0-gearbox-shaft-foton-lovol
- scribd.com: документ/parts-list по LOVOL, дал одно совпадение B102-3162815; недостаточно для ACCEPT. Источник: https://es.scribd.com/document/648253745/FR220D-ISUZU-Manual-de-Operacion-y-Mantenimiento-LOVOL

## Ошибки и ненадёжные зоны

- По многим LOVOL и DZ-кодам поисковая выдача содержит витрины с копируемыми названиями, без структуры Product/schema.org и без явного производителя.
- Маркетплейсы давали дополнительные совпадения, но не использовались как единственный источник факта.
- Для 81.50110.0144 есть конфликт MAN/SHACMAN/Shaanxi; позиция отправлена в NEEDS_REVIEW.
- Для DZ14251770030 есть конфликт SHACMAN/WEICHAI; позиция отправлена в NEEDS_REVIEW.
- Структурированные Product-данные встречались не системно; массовый парсинг без supplier-provided manufacturer fields будет шумным.

## Рекомендации по дальнейшему использованию источников

- Использовать профессиональные каталоги и специализированные магазины только как evidence, а не как единственный источник для массового создания Product.
- Для auto-accept требовать минимум два независимых надёжных источника или официальный каталог производителя.
- Для конфликтов по бренду, единице продажи или типу детали всегда оставлять NEEDS_REVIEW.
