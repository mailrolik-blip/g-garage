# G-Garage Catalog Backend

Independent local backend for the G-Garage catalog core. It is not deployed to production and the static storefront is not connected to it in this stage.

## Local services

- API: `127.0.0.1:3201`
- PostgreSQL: `localhost:5544`

## Start

```powershell
copy .env.example .env
docker compose up -d
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Checks

```powershell
npm run lint
npm run typecheck
npm run build
npm run test
npm run test:integration
```

## Price list tools

```powershell
npm run price:inspect -- --file "imports\raw\Прайс ОРИОН.xls"
npm run import:orion -- --file "imports\raw\Прайс ОРИОН.xls" --dry-run
npm run import:orion -- --file "imports\raw\Прайс ОРИОН.xls"
```

The source XLS must stay in `imports/raw/`; this folder is ignored except `.gitkeep`.

## Documentation

- `docs/orion-price-analysis.md`
- `docs/orion-import-result.md`
- `docs/catalog-api-v1.md`