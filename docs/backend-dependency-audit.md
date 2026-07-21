# Backend dependency audit

Дата: 2026-07-21
Команда: npm audit --json

## Итог

- Всего уязвимостей: 6.
- Moderate: 3.
- High: 2.
- Critical: 1.

## Найдено

- vitest: direct dev dependency, critical advisory GHSA-5xrq-8626-4rwp. Используется только для локального запуска тестов, не runtime API. Безопасное обновление доступно через major upgrade до vitest 4.1.10, требуется отдельная задача из-за major change.
- vite, vite-node, @vitest/mocker, esbuild: transitive dev dependencies через vitest. Используются тестовым раннером, не runtime API. Исправление также требует major upgrade vitest.
- xlsx: direct runtime dependency в package.json, high advisories GHSA-4r6h-8v6p-xvw6 и GHSA-5pgg-2g8v-p4x9. В проекте используется только локальными CLI-скриптами импорта/анализа XLS, не подключён в web request path и не должен деплоиться на production как importer. npm audit не предлагает fixAvailable.

## Решение этапа

- npm audit fix не выполнялся.
- Автоматический deploy backend запрещён и не выполнялся.
- XLS-парсер остаётся изолированным локальным инструментом.
- Требуется отдельная задача: заменить xlsx на поддерживаемый парсер или изолировать importer в отдельный local-only package; отдельно обновить Vitest/Vite major с прогоном тестов.
