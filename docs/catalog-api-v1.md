# Catalog API v1

Backend is a local read-only catalog API. It does not implement auth, cart, orders, payment, VIN requests, or storefront integration in this stage.

Base URL for local development:

```text
http://127.0.0.1:3201
```

## Health

### GET /health

Response:

```json
{
  "status": "ok",
  "service": "ggarage-catalog-api"
}
```

## Categories

### GET /api/v1/categories

Returns active categories ordered by `sortOrder`, then `name`.

### GET /api/v1/categories/:slug

Returns one category by slug.

Errors:

```json
{
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category not found",
    "details": null
  }
}
```

## Brands

### GET /api/v1/brands

Returns active brands ordered by `name`.

### GET /api/v1/brands/:slug

Returns one brand by slug.

Errors use `BRAND_NOT_FOUND` with HTTP 404.

## Products

### GET /api/v1/products

Query parameters:

| Parameter | Type | Notes |
| --- | --- | --- |
| `page` | integer | Minimum 1, default 1 |
| `limit` | integer | 1..100, default 24 |
| `search` | string | Name, article, brand + article/name |
| `article` | string | Exact or normalized article search |
| `brand` | string | Brand slug or normalized brand name |
| `category` | string | Category slug |
| `minPrice` | decimal | Must be >= 0 |
| `maxPrice` | decimal | Must be >= 0 |
| `inStock` | boolean | `true` limits to offers with stock > 0 |
| `qualityLevel` | enum | `original`, `reliable`, `budget`, `standard` |
| `sort` | enum | `relevance`, `price_asc`, `price_desc`, `name_asc`, `newest`, `delivery_fast` |

Response shape:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 0,
    "pages": 0
  },
  "filters": {}
}
```

Search priority:

1. Exact brand + article.
2. Exact normalized article.
3. Article prefix.
4. Product name match.
5. Brand match.

Current implementation uses Prisma/PostgreSQL with case-insensitive matching and indexes; no external search service is used.

### GET /api/v1/products/:id

Returns product detail by id.

### GET /api/v1/products/by-slug/:slug

Returns product detail by slug.

Product detail includes:

- product fields;
- brand;
- category;
- images;
- active supplier offers;
- `minPrice`;
- `maxPrice`;
- `totalStock`;
- `bestDeliveryDays`.

Example product fragment:

```json
{
  "id": "...",
  "sku": "DEV-001",
  "article": "P-1001",
  "normalizedArticle": "P1001",
  "name": "Колодки тормозные передние",
  "brand": {
    "name": "Brembo",
    "slug": "brembo"
  },
  "offers": [
    {
      "supplierArticle": "P-1001",
      "retailPrice": "5290",
      "currency": "RUB",
      "stockQuantity": 7,
      "deliveryDaysMin": 1,
      "deliveryDaysMax": 2
    }
  ],
  "minPrice": "5290",
  "maxPrice": "5290",
  "totalStock": 7,
  "bestDeliveryDays": 1
}
```

## Validation Errors

Unknown sort or quality level returns HTTP 400. Unknown product/category/brand returns HTTP 404. Stack traces are not returned to clients.

Unified error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": null
  }
}
```

## Local Verification Commands

```powershell
curl.exe http://127.0.0.1:3201/health
curl.exe http://127.0.0.1:3201/api/v1/categories
curl.exe http://127.0.0.1:3201/api/v1/brands
curl.exe "http://127.0.0.1:3201/api/v1/products?page=1&limit=24"
curl.exe "http://127.0.0.1:3201/api/v1/products?search=brembo"
curl.exe "http://127.0.0.1:3201/api/v1/products?inStock=true&sort=price_asc"
```