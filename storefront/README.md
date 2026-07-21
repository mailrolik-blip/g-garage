# G-Garage Desktop Storefront

Отдельный статический storefront для `/storefront/`, не заменяет корневую главную и не удаляет `/prototype/`.

## Состав

- Реальные HTML-страницы: главная, каталог, карточка товара, выбор автомобиля, VIN-подбор, корзина, checkout, успешный заказ, кабинет, доставка, возврат, контакты.
- Vanilla JavaScript, CSS и локальные mock-данные.
- Пользовательское состояние хранится в `localStorage`.
- Backend, PostgreSQL, авторизация, платежи и внешние API не создавались.

## Тестовое состояние

Для очистки тестового состояния откройте любую страницу с параметром:

`?reset=1`

Например: `/storefront/?reset=1`.

## Локальная проверка

```bash
python -m http.server 8087
```

Основные URL:

- `http://localhost:8087/storefront/`
- `http://localhost:8087/storefront/catalog/`
- `http://localhost:8087/storefront/product/?id=product-001`
- `http://localhost:8087/storefront/vehicle/`
- `http://localhost:8087/storefront/vin/`
- `http://localhost:8087/storefront/cart/`
- `http://localhost:8087/storefront/checkout/`
- `http://localhost:8087/storefront/account/`
