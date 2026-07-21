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
