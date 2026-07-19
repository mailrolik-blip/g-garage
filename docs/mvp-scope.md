# MVP scope

Рекомендуемый размер MVP: 50 уникальных экранов и состояний. Узкие состояния вроде отдельных toast, confirmation bottom sheet и маленьких modal не нужно реализовывать как самостоятельные страницы.

## MVP

1. `#/home` - старт, поиск, выбранный автомобиль, вход в VIN и каталог.
2. `#/search` - единый поиск по названию, VIN и артикулу.
3. `#/garage` - список сохранённых автомобилей и вход в подбор по авто.
4. `#/vehicle-brand` - выбор марки.
5. `#/vehicle-model` - выбор модели.
6. `#/vehicle-year` - выбор года.
7. `#/vehicle-engine` - выбор двигателя или передача задачи в VIN.
8. `#/vin` - форма VIN-запроса.
9. `#/vin-upload` - загрузка СТС как часть VIN-сценария.
10. `#/vin-preview` - проверка загруженного документа перед отправкой.
11. `#/vin-sent` - подтверждение заявки, номер, SLA и канал связи.
12. `#/vin-status` - постоянный экран статуса заявки.
13. `#/vin-need-data` - запрос дополнительных данных без потери контекста.
14. `#/vin-selection` - персональная подборка менеджера.
15. `#/vin-compare` - сравнение оригинала и аналогов.
16. `#/categories` - вход в основные категории.
17. `#/catalog` - список товаров с совместимостью, сроком и ценой.
18. `#/filters` - фильтры каталога.
19. `#/sort` - сортировка каталога.
20. `#/compatibility` - выбор режима совместимости.
21. `#/article-search` - точный поиск по артикулу как режим поиска.
22. `#/empty-results` - пустая выдача с переходом в VIN.
23. `#/product` - основная карточка товара.
24. `#/product-fit-ok` - подтверждённая совместимость.
25. `#/product-fit-bad` - товар не подходит и предлагает аналог.
26. `#/availability` - наличие, срок и поставщик.
27. `#/compare-analogs` - сравнение вариантов покупки.
28. `#/cart` - корзина.
29. `#/cart-price-changed` - явное изменение цены.
30. `#/cart-delivery-changed` - явное изменение срока.
31. `#/checkout-contact` - контактные данные без регистрации.
32. `#/checkout-delivery` - выбор способа доставки.
33. `#/courier-address` - адрес курьера.
34. `#/delivery-time` - дата и время.
35. `#/payment` - способ оплаты.
36. `#/checkout-review` - финальная проверка заказа.
37. `#/payment-success` - успешная оплата.
38. `#/payment-error` - ошибка оплаты и смена способа.
39. `#/order-success` - заказ создан.
40. `#/order-status` - статус заказа.
41. `#/order-detail` - состав и детали заказа.
42. `#/login` - вход по телефону.
43. `#/code` - ввод кода.
44. `#/account` - минимальный кабинет.
45. `#/account-orders` - история заказов.
46. `#/account-cars` - автомобили клиента.
47. `#/manager` - вход сотрудника.
48. `#/manager-dashboard` - рабочий старт менеджера.
49. `#/manager-vin-queue` - очередь VIN-заявок.
50. `#/manager-vin-detail` - обработка конкретной VIN-заявки.

## VERSION 1.1

- `#/search-suggestions`, `#/search-history` - усилить поиск после первых запросов.
- `#/vehicle-confirm`, `#/vehicle-profile`, `#/vehicle-categories` - углубить гараж и совместимый каталог.
- `#/vin-answer`, `#/vin-ready`, `#/vin-pick-product` - объединить в один живой detail заявки.
- `#/search-results`, `#/analogs`, `#/catalog-error` - довести recovery-сценарии каталога.
- `#/product-fit-unknown`, `#/product-no-car`, `#/product-question` - расширить работу с неопределённой совместимостью.
- `#/cart-empty`, `#/cart-analog`, `#/promo-code` - усилить корзину и повторное вовлечение.
- `#/pickup`, `#/payment-processing`, `#/payment-change` - уточнить checkout-состояния.
- `#/tracking`, `#/order-confirm-required`, `#/order-contact` - расширить order tracking.
- `#/account-order`, `#/account-vin`, `#/favorites`, `#/profile` - сделать кабинет полезнее для повторных покупок.
- `#/manager-product-search`, `#/manager-add-product`, `#/manager-preview`, `#/manager-send`, `#/manager-orders`, `#/manager-order-detail`, `#/manager-order-status`, `#/manager-contact` - довести операционный процесс менеджера.

## LATER

- Брендовые страницы, акции, расширенные документы, уведомления, адресная книга, профиль, настройки, политика и соглашения.
- Продвинутые менеджерские фильтры, промо-управление, полный catalog ops и настройки.
- Расширенные сервисные страницы и контентные разделы после первых данных по поведению пользователей.

## NOT NEEDED

- `#/added-cart` - оставить как toast или bottom sheet.
- `#/added-favorite` - оставить как toast.
- `#/cart-qty` - состояние внутри корзины.
- `#/account-car` - объединить с карточкой автомобиля.
- `#/account-repeat` - действие внутри заказа.
- `#/documents` - действие в деталях заказа.
- `#/manager-settings` - не нужен для MVP.
- `#/maintenance` - системная заглушка, не отдельный продуктовый экран.
