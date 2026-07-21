# G-Garage Desktop Storefront

Отдельный статический storefront для `/storefront/`, не заменяет корневую главную и не удаляет `/prototype/`.

## Состав страниц

- `/storefront/` - desktop-главная с hero, поиском, режимами подбора, преимуществами, категориями, брендами, популярными товарами, акцией и блоками доверия.
- `/storefront/catalog/` - каталог с фильтрами, поиском, сортировкой, товарами, избранным, корзиной и VIN fallback.
- `/storefront/product/?id=product-001` - карточка товара с галереей, совместимостью, sticky purchase box, аналогами и сопутствующими товарами.
- `/storefront/vehicle/` - выбор марки, модели, года и двигателя с сохранением в localStorage.
- `/storefront/vin/` - локальная VIN-заявка с состоянием успешной отправки.
- `/storefront/cart/` - корзина с количеством, удалением, избранным, аналогом, промокодом и итогами.
- `/storefront/checkout/` - оформление без регистрации, обязательные поля, draft формы и переход в success.
- `/storefront/order-success/` - тестовое подтверждение заказа.
- `/storefront/account/`, `/storefront/account/orders.html`, `/storefront/account/vehicles.html`, `/storefront/account/vin-requests.html` - desktop shell личного кабинета.
- `/storefront/delivery/`, `/storefront/returns/`, `/storefront/contacts/` - сервисные страницы с общим header/footer.

## Технологии

HTML, CSS, vanilla JavaScript, локальные JS mock-данные и localStorage. Backend, PostgreSQL, авторизация, реальные платежи и внешние API не создавались. Внешние CDN, внешние изображения и внешние иконочные библиотеки не используются.

## Mock-данные

`data/mock-data.js` содержит 8 категорий, 8 брендов, 24 товара, 3 автомобиля, 3 VIN-заявки, 4 заказа, 3 акции и 5 пунктов выдачи.

## Состояние

В localStorage сохраняются корзина, избранное, выбранный автомобиль, история поиска, checkout draft и тестовая VIN-заявка. Для очистки тестового состояния откройте любую страницу с параметром `?reset=1`, например `/storefront/?reset=1`.

## Локальная проверка

```bash
python -m http.server 8087
```

Проверенные URL:

- `http://localhost:8087/storefront/`
- `http://localhost:8087/storefront/catalog/`
- `http://localhost:8087/storefront/product/?id=product-001`
- `http://localhost:8087/storefront/vehicle/`
- `http://localhost:8087/storefront/vin/`
- `http://localhost:8087/storefront/cart/`
- `http://localhost:8087/storefront/checkout/`
- `http://localhost:8087/storefront/account/`

Playwright-проверка: 45 page/viewport проверок на 1280x800, 1440x900, 1600x900, 1920x1080 и 768x1024. Результат: 0 JS errors, 0 внешних ресурсов, 0 horizontal scroll. Отчёт: `screenshots/storefront/check-report.json`.

Скриншоты находятся в `screenshots/storefront/`.
