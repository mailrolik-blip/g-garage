window.GGData = (() => {
  const icon = {
    menu: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    back: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    search: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    cart: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.1 2h3l2.2 12.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L20.7 7H6.1"/></svg>',
    heart: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 0 1 12 6a5 5 0 0 1 7.5 6.6Z"/></svg>',
    user: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M19 21a7 7 0 0 0-14 0"/><circle cx="12" cy="7" r="4"/></svg>',
    car: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M7 17v2M17 17v2M6 13l2-5h8l2 5M5 13h14v4H5z"/></svg>',
    vin: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>',
    home: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></svg>',
    map: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></svg>',
    plus: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    warning: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5M12 18h.01"/></svg>',
    ok: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>'
  };

  const categories = [
    ["cat-1", "Двигатель", "../assets/categories/engine.png"],
    ["cat-2", "Тормоза", "../assets/categories/brakes.png"],
    ["cat-3", "Подвеска", "../assets/categories/suspension.png"],
    ["cat-4", "Масла", "../assets/categories/oils.png"],
    ["cat-5", "Фильтры", "../assets/categories/filters.png"],
    ["cat-6", "Электрика", "../assets/categories/electrics.png"],
    ["cat-7", "Кузов", "assets/placeholders/part.svg"],
    ["cat-8", "Аксессуары", "assets/placeholders/part.svg"]
  ].map(([id, name, image]) => ({ id, name, image }));

  const brands = ["BOSCH", "MANN", "ZF", "TRW", "DENSO", "NGK", "SACHS", "Valeo"].map((name, index) => ({
    id: `b-${index + 1}`,
    name,
    country: index % 2 ? "Германия" : "Япония",
    rating: 4.5 + (index % 4) / 10
  }));

  const baseImages = [
    "../assets/products/oil-shell-helix.png",
    "../assets/products/brake-discs-brembo.png",
    "../assets/products/spark-plugs-ngk.png",
    "../assets/products/air-filter-mann.png",
    "../assets/products/shock-absorber-sachs.png"
  ];

  const products = Array.from({ length: 25 }, (_, index) => {
    const brand = brands[index % brands.length];
    const category = categories[index % categories.length];
    const price = 740 + index * 390;
    return {
      id: `p-${index + 1}`,
      brand: brand.name,
      categoryId: category.id,
      image: baseImages[index % baseImages.length],
      title: [
        "Моторное масло 5W-30 4L",
        "Тормозные диски передние",
        "Свеча зажигания",
        "Воздушный фильтр",
        "Амортизатор передний"
      ][index % 5],
      article: `${brand.name}-${1570 + index}`,
      price,
      oldPrice: index % 4 === 0 ? price + 520 : null,
      stock: index % 7 === 0 ? "Нет в наличии" : "В наличии",
      delivery: index % 3 === 0 ? "Сегодня после 18:00" : "1-2 дня",
      compatibility: index % 5 === 0 ? "Не проверено" : index % 6 === 0 ? "Не подходит" : "Подходит",
      quality: ["Оригинал", "Надёжный аналог", "Бюджетный аналог"][index % 3],
      rating: 4.2 + (index % 7) / 10,
      supplier: ["Склад G-Garage", "Поставщик Север", "Поставщик Восток"][index % 3]
    };
  });

  const cars = [
    { id: "car-1", brand: "Toyota", model: "Camry", year: "2019", engine: "2.5 бензин", vin: "JTNB11HK0K3000000" },
    { id: "car-2", brand: "Kia", model: "Rio", year: "2021", engine: "1.6 бензин", vin: "Z94C241BBMR000000" },
    { id: "car-3", brand: "Volkswagen", model: "Tiguan", year: "2018", engine: "2.0 TSI", vin: "XW8ZZZ5NZJG000000" }
  ];

  const orders = Array.from({ length: 5 }, (_, index) => ({
    id: `GG-${24070 + index}`,
    status: ["создан", "подтверждён", "у поставщика", "готов к получению", "завершён"][index],
    total: 3950 + index * 1850,
    date: `2026-07-${10 + index}`,
    items: products.slice(index, index + 2)
  }));

  const vinRequests = [
    { id: "VIN-1024", status: "Новая", car: "Toyota Camry", need: "Тормозные колодки", sla: "Ответ до 18:00" },
    { id: "VIN-1025", status: "Нужны данные", car: "Kia Rio", need: "Фильтры ТО", sla: "Ожидает клиента" },
    { id: "VIN-1026", status: "Подборка готова", car: "VW Tiguan", need: "Амортизаторы", sla: "3 варианта" },
    { id: "VIN-1027", status: "Закрыта", car: "Toyota Camry", need: "Масло", sla: "Заказ создан" }
  ];

  const selections = [
    { id: "sel-1", vinId: "VIN-1026", title: "Лучший баланс", products: products.slice(1, 4) },
    { id: "sel-2", vinId: "VIN-1026", title: "Оригинал", products: products.slice(5, 8) },
    { id: "sel-3", vinId: "VIN-1025", title: "Бюджетно", products: products.slice(9, 12) }
  ];

  const promos = [
    { id: "promo-1", title: "Тормоза к сезону", discount: "-12%" },
    { id: "promo-2", title: "Комплект ТО", discount: "-8%" },
    { id: "promo-3", title: "Бесплатный VIN-подбор", discount: "0 ₽" },
    { id: "promo-4", title: "Доставка сегодня", discount: "от 1 дня" }
  ];

  const addresses = [
    "ПВЗ Москва, Варшавское шоссе, 12",
    "ПВЗ Химки, Ленинградская, 8",
    "Курьер: Москва, Тверская, 10",
    "ТК СДЭК, терминал Север",
    "Самовывоз со склада G-Garage"
  ].map((title, index) => ({ id: `addr-${index + 1}`, title }));

  const screens = [
    ["home", 1, "Главная", "client", "Навигация", "done"],
    ["menu", 2, "Полноэкранное мобильное меню", "client", "Навигация", "done"],
    ["search", 3, "Поиск", "client", "Поиск", "done"],
    ["search-suggestions", 4, "Подсказки поиска", "client", "Поиск", "done"],
    ["search-history", 5, "История поиска", "client", "Поиск", "done"],
    ["city", 6, "Выбор города", "client", "Навигация", "done"],
    ["contacts-quick", 7, "Быстрые способы связи", "client", "Сервис", "done"],
    ["garage", 8, "Список сохранённых автомобилей", "client", "Автомобиль", "done"],
    ["vehicle-brand", 9, "Выбор марки", "client", "Автомобиль", "done"],
    ["vehicle-model", 10, "Выбор модели", "client", "Автомобиль", "done"],
    ["vehicle-year", 11, "Выбор года", "client", "Автомобиль", "done"],
    ["vehicle-engine", 12, "Выбор двигателя и модификации", "client", "Автомобиль", "done"],
    ["vehicle-confirm", 13, "Подтверждение сохранения автомобиля", "client", "Автомобиль", "done"],
    ["vehicle-profile", 14, "Профиль автомобиля", "client", "Автомобиль", "done"],
    ["vehicle-categories", 15, "Совместимые категории", "client", "Автомобиль", "done"],
    ["vehicle-edit", 16, "Редактирование автомобиля", "client", "Автомобиль", "done"],
    ["vehicle-delete", 17, "Удаление автомобиля", "client", "Автомобиль", "done"],
    ["vin", 18, "Форма VIN-запроса", "client", "VIN", "done"],
    ["vin-upload", 19, "Загрузка СТС", "client", "VIN", "done"],
    ["vin-preview", 20, "Предпросмотр документа", "client", "VIN", "done"],
    ["vin-photo-error", 21, "Ошибка распознавания", "error", "VIN", "done"],
    ["vin-sent", 22, "VIN-заявка отправлена", "client", "VIN", "done"],
    ["vin-status", 23, "Статус VIN-заявки", "client", "VIN", "done"],
    ["vin-need-data", 24, "Нужны дополнительные данные", "state", "VIN", "done"],
    ["vin-answer", 25, "Ответ клиентом", "form", "VIN", "done"],
    ["vin-ready", 26, "Подборка готова", "state", "VIN", "done"],
    ["vin-selection", 27, "Персональная подборка", "client", "VIN", "done"],
    ["vin-compare", 28, "Сравнение вариантов", "client", "VIN", "done"],
    ["vin-pick-product", 29, "Выбор товара из подборки", "client", "VIN", "done"],
    ["vin-closed", 30, "VIN-заявка закрыта", "state", "VIN", "done"],
    ["categories", 31, "Все категории", "client", "Каталог", "done"],
    ["subcategory", 32, "Подкатегория", "client", "Каталог", "done"],
    ["catalog", 33, "Каталог товаров", "client", "Каталог", "done"],
    ["filters", 34, "Фильтры", "form", "Каталог", "done"],
    ["sort", 35, "Сортировка", "form", "Каталог", "done"],
    ["compatibility", 36, "Выбор совместимости", "form", "Каталог", "done"],
    ["brands", 37, "Список брендов", "client", "Каталог", "done"],
    ["brand", 38, "Страница бренда", "client", "Каталог", "done"],
    ["article-search", 39, "Точный поиск по артикулу", "client", "Каталог", "done"],
    ["search-results", 40, "Результаты поиска", "client", "Каталог", "done"],
    ["analogs", 41, "Аналоги артикула", "client", "Каталог", "done"],
    ["recent", 42, "Недавно просмотренные", "client", "Каталог", "done"],
    ["empty-results", 43, "Пустая выдача", "state", "Каталог", "done"],
    ["out-of-stock", 44, "Нет товара в наличии", "state", "Каталог", "done"],
    ["catalog-error", 45, "Ошибка загрузки каталога", "error", "Каталог", "done"],
    ["promos", 46, "Акции", "client", "Каталог", "done"],
    ["promo", 47, "Страница акции", "client", "Каталог", "done"],
    ["product", 48, "Карточка товара", "client", "Товар", "done"],
    ["product-fit-ok", 49, "Совместимость подтверждена", "state", "Товар", "done"],
    ["product-fit-unknown", 50, "Совместимость не проверена", "state", "Товар", "done"],
    ["product-fit-bad", 51, "Товар не подходит", "state", "Товар", "done"],
    ["product-no-car", 52, "Товар без выбранного авто", "state", "Товар", "done"],
    ["gallery", 53, "Галерея товара", "client", "Товар", "done"],
    ["specs", 54, "Характеристики", "client", "Товар", "done"],
    ["plain-description", 55, "Описание простыми словами", "client", "Товар", "done"],
    ["availability", 56, "Наличие и сроки", "client", "Товар", "done"],
    ["supplier", 57, "Информация о поставщике", "client", "Товар", "done"],
    ["warranty", 58, "Гарантия и возврат", "client", "Товар", "done"],
    ["compare-analogs", 59, "Сравнение аналогов", "client", "Товар", "done"],
    ["related", 60, "Сопутствующие товары", "client", "Товар", "done"],
    ["product-question", 61, "Вопрос по товару", "form", "Товар", "done"],
    ["added-cart", 62, "Добавлено в корзину", "state", "Товар", "done"],
    ["added-favorite", 63, "Добавлено в избранное", "state", "Товар", "done"],
    ["cart", 64, "Корзина", "client", "Корзина", "done"],
    ["cart-empty", 65, "Пустая корзина", "state", "Корзина", "done"],
    ["cart-qty", 66, "Изменение количества", "client", "Корзина", "done"],
    ["cart-delete", 67, "Удаление товара", "state", "Корзина", "done"],
    ["cart-out", 68, "Товар закончился", "state", "Корзина", "done"],
    ["cart-price-changed", 69, "Цена изменилась", "state", "Корзина", "done"],
    ["cart-delivery-changed", 70, "Срок доставки изменился", "state", "Корзина", "done"],
    ["cart-analog", 71, "Предложение аналога", "state", "Корзина", "done"],
    ["promo-code", 72, "Ввод промокода", "form", "Корзина", "done"],
    ["promo-applied", 73, "Промокод применён", "state", "Корзина", "done"],
    ["promo-error", 74, "Ошибка промокода", "error", "Корзина", "done"],
    ["checkout-contact", 75, "Контактные данные", "form", "Оформление", "done"],
    ["checkout-delivery", 76, "Выбор доставки", "form", "Оформление", "done"],
    ["pickup", 77, "Выбор ПВЗ", "form", "Оформление", "done"],
    ["pickup-map", 78, "Карта / список ПВЗ", "client", "Оформление", "done"],
    ["courier-address", 79, "Курьерский адрес", "form", "Оформление", "done"],
    ["transport-company", 80, "Транспортная компания", "form", "Оформление", "done"],
    ["delivery-time", 81, "Дата и время", "form", "Оформление", "done"],
    ["payment", 82, "Способ оплаты", "form", "Оформление", "done"],
    ["order-comment", 83, "Комментарий", "form", "Оформление", "done"],
    ["checkout-review", 84, "Проверка заказа", "client", "Оформление", "done"],
    ["terms", 85, "Согласие с условиями", "form", "Оформление", "done"],
    ["payment-processing", 86, "Обработка оплаты", "state", "Оформление", "done"],
    ["payment-success", 87, "Оплата успешна", "state", "Оформление", "done"],
    ["payment-error", 88, "Ошибка оплаты", "error", "Оформление", "done"],
    ["payment-change", 89, "Другой способ оплаты", "form", "Оформление", "done"],
    ["order-success", 90, "Заказ создан", "state", "Оформление", "done"],
    ["order-status", 91, "Статус заказа", "client", "Заказ", "done"],
    ["order-detail", 92, "Детали заказа", "client", "Заказ", "done"],
    ["tracking", 93, "Трекинг доставки", "client", "Заказ", "done"],
    ["order-confirm-required", 94, "Требует подтверждения", "state", "Заказ", "done"],
    ["order-cancelled", 95, "Заказ отменён", "state", "Заказ", "done"],
    ["cancel-request", 96, "Запрос отмены", "form", "Заказ", "done"],
    ["repeat-order", 97, "Повторить заказ", "client", "Заказ", "done"],
    ["order-contact", 98, "Связаться по заказу", "client", "Заказ", "done"],
    ["documents", 99, "Скачать чек / документы", "client", "Заказ", "done"],
    ["login", 100, "Вход по телефону", "form", "Кабинет", "done"],
    ["code", 101, "Ввод кода", "form", "Кабинет", "done"],
    ["code-error", 102, "Ошибка кода", "error", "Кабинет", "done"],
    ["account", 103, "Главная кабинета", "client", "Кабинет", "done"],
    ["account-orders", 104, "Мои заказы", "client", "Кабинет", "done"],
    ["account-order", 105, "Заказ подробно", "client", "Кабинет", "done"],
    ["account-repeat", 106, "Повторить заказ", "client", "Кабинет", "done"],
    ["account-cars", 107, "Мои автомобили", "client", "Кабинет", "done"],
    ["account-car", 108, "Автомобиль подробно", "client", "Кабинет", "done"],
    ["account-vin", 109, "VIN-заявки", "client", "Кабинет", "done"],
    ["account-vin-detail", 110, "VIN-заявка подробно", "client", "Кабинет", "done"],
    ["favorites", 111, "Избранное", "client", "Кабинет", "done"],
    ["addresses", 112, "Адреса", "client", "Кабинет", "done"],
    ["address-add", 113, "Добавление адреса", "form", "Кабинет", "done"],
    ["notifications", 114, "Уведомления", "client", "Кабинет", "done"],
    ["notification-settings", 115, "Настройки уведомлений", "form", "Кабинет", "done"],
    ["profile", 116, "Профиль", "client", "Кабинет", "done"],
    ["profile-edit", 117, "Редактирование профиля", "form", "Кабинет", "done"],
    ["logout", 118, "Выход", "state", "Кабинет", "done"],
    ["delete-account", 119, "Удаление аккаунта", "state", "Кабинет", "done"],
    ["delivery-info", 120, "Оплата и доставка", "client", "Сервис", "done"],
    ["returns", 121, "Возврат и гарантия", "client", "Сервис", "done"],
    ["about", 122, "О компании", "client", "Сервис", "done"],
    ["contacts", 123, "Контакты", "client", "Сервис", "done"],
    ["faq", 124, "FAQ", "client", "Сервис", "done"],
    ["support", 125, "Поддержка", "client", "Сервис", "done"],
    ["support-chat", 126, "Чат поддержки", "client", "Сервис", "done"],
    ["callback", 127, "Обратный звонок", "form", "Сервис", "done"],
    ["privacy", 128, "Политика конфиденциальности", "client", "Сервис", "done"],
    ["terms-page", 129, "Пользовательское соглашение", "client", "Сервис", "done"],
    ["personal-data", 130, "Согласие на обработку данных", "client", "Сервис", "done"],
    ["404", 131, "404", "error", "Состояния", "done"],
    ["offline", 132, "Нет интернета", "error", "Состояния", "done"],
    ["server-error", 133, "Ошибка сервера", "error", "Состояния", "done"],
    ["maintenance", 134, "Технические работы", "state", "Состояния", "done"],
    ["manager", 135, "Вход сотрудника", "manager", "Менеджер", "done"],
    ["manager-dashboard", 136, "Дашборд менеджера", "manager", "Менеджер", "done"],
    ["manager-vin-queue", 137, "Очередь VIN-заявок", "manager", "Менеджер", "done"],
    ["manager-vin-filters", 138, "Фильтры VIN-заявок", "manager", "Менеджер", "done"],
    ["manager-vin-detail", 139, "VIN-заявка подробно", "manager", "Менеджер", "done"],
    ["manager-request-data", 140, "Запрос доп. данных", "manager", "Менеджер", "done"],
    ["manager-product-search", 141, "Поиск товаров", "manager", "Менеджер", "done"],
    ["manager-add-product", 142, "Добавление в подборку", "manager", "Менеджер", "done"],
    ["manager-compare", 143, "Сравнение вариантов", "manager", "Менеджер", "done"],
    ["manager-comment", 144, "Комментарий менеджера", "manager", "Менеджер", "done"],
    ["manager-preview", 145, "Предпросмотр подборки", "manager", "Менеджер", "done"],
    ["manager-send", 146, "Отправка подборки", "manager", "Менеджер", "done"],
    ["manager-orders", 147, "Заказы", "manager", "Менеджер", "done"],
    ["manager-order-detail", 148, "Заказ подробно", "manager", "Менеджер", "done"],
    ["manager-order-status", 149, "Изменение статуса", "manager", "Менеджер", "done"],
    ["manager-contact", 150, "Связь с клиентом", "manager", "Менеджер", "done"],
    ["manager-catalog", 151, "Каталог товаров", "manager", "Менеджер", "done"],
    ["manager-promos", 152, "Управление акциями", "manager", "Менеджер", "done"],
    ["manager-settings", 153, "Базовые настройки", "manager", "Менеджер", "done"],
    ["map", 154, "Прототип-навигатор", "state", "Навигация", "done"]
  ].map(([route, number, title, type, module, status]) => ({ route, number, title, type, module, status }));

  return { icon, categories, brands, products, cars, orders, vinRequests, selections, promos, addresses, screens };
})();
