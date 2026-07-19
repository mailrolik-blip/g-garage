(() => {
  const { icon, screens, products, categories, brands, cars, orders, vinRequests, selections, promos, addresses } = window.GGData;
  const Store = window.GGState;
  const Router = window.GGRouter;
  const app = document.querySelector("#app");

  const routeMap = new Map(screens.map((screen) => [screen.route, screen]));

  function money(value) {
    return `${value.toLocaleString("ru-RU")} ₽`;
  }

  function selectedCar() {
    return cars.find((car) => car.id === Store.state.selectedCarId) || cars[0];
  }

  function statusClass(value) {
    if (/подходит|готов|успеш|налич|подтвержд|заверш/i.test(value)) return "ok";
    if (/не подходит|ошибка|отмен|нет/i.test(value)) return "bad";
    return "warn";
  }

  function layout(content, opts = {}) {
    const route = Router.current().replace(/^\//, "");
    const isManager = route.startsWith("manager");
    app.className = `app-shell ${isManager ? "manager-layout" : ""}`;
    app.innerHTML = `
      <div class="phone-frame">
        ${header(opts.title || "G-Garage", opts.back)}
        <main class="screen">${content}</main>
        ${bottomNav(route)}
      </div>
      <p class="desktop-hint">Desktop показывает мобильный прототип в ограниченной рамке. Основная проверка: 390 x 844 px.</p>
    `;
    bindActions();
  }

  function header(title, back = true) {
    return `
      <header class="app-header">
        ${back ? `<button class="icon-button" data-back aria-label="Назад">${icon.back}</button>` : `<button class="icon-button" data-go="/menu" aria-label="Меню">${icon.menu}</button>`}
        <a class="brand" href="#/home">
          <img src="../assets/logo/g-garage-logo.png" alt="G-Garage">
          <span><strong>${title}</strong><span>${selectedCar().brand} ${selectedCar().model}</span></span>
        </a>
        <button class="icon-button" data-go="/cart" aria-label="Корзина">${icon.cart}<span class="badge">${Store.cartCount()}</span></button>
      </header>
    `;
  }

  function bottomNav(route) {
    const items = [
      ["/home", "Главная", icon.home],
      ["/catalog", "Каталог", icon.search],
      ["/vin", "VIN", icon.vin],
      ["/account", "Кабинет", icon.user],
      ["/map", "Карта", icon.map]
    ];
    return `<nav class="bottom-nav" aria-label="Нижняя навигация">${items.map(([to, label, svg]) => `
      <button class="nav-item ${route === to.slice(1) ? "active" : ""}" data-go="${to}">${svg}<span>${label}</span></button>
    `).join("")}</nav>`;
  }

  function title(text, sub = "") {
    return `<div class="screen-title"><div><h1>${text}</h1>${sub ? `<p>${sub}</p>` : ""}</div></div>`;
  }

  function button(to, label, kind = "") {
    return `<button class="btn ${kind}" data-go="${to}">${label}</button>`;
  }

  function productCard(product, compact = false) {
    return `
      <article class="card product-card" data-go="/product/${product.id}">
        <img src="${product.image}" alt="">
        <div>
          <div class="row between">
            <span class="status ${statusClass(product.compatibility)}">${product.compatibility}</span>
            <button class="icon-button" data-fav="${product.id}" aria-label="Добавить в избранное">${icon.heart}</button>
          </div>
          <h3>${product.brand} ${product.title}</h3>
          <p class="small muted">${product.article} · ${product.delivery}</p>
          <div class="row between">
            <div><span class="price">${money(product.price)}</span>${product.oldPrice ? `<span class="old-price"> ${money(product.oldPrice)}</span>` : ""}</div>
            <button class="icon-button" data-add="${product.id}" aria-label="Добавить в корзину">${icon.cart}</button>
          </div>
          ${compact ? "" : `<button class="btn ghost" data-go="/vin">Быстрый запрос по VIN</button>`}
        </div>
      </article>
    `;
  }

  function home() {
    return `
      <section class="card hero-card">
        <span class="status ok">Совместимость включена</span>
        <h1>Точность подбора. <span>Скорость доставки.</span></h1>
        <div class="search-box" data-go="/search">${icon.search}<input readonly placeholder="Артикул, VIN или название"></div>
      </section>
      <div class="section-label">Способы подбора</div>
      <div class="grid">
        <button class="btn full" data-go="/article-search">По артикулу</button>
        <button class="btn secondary full" data-go="/vin">По VIN</button>
        <button class="btn secondary full" data-go="/garage">По автомобилю</button>
      </div>
      <div class="section-label">Основные категории</div>
      <div class="grid two">${categories.slice(0, 6).map(categoryTile).join("")}</div>
      <div class="section-label">Популярные бренды</div>
      <div class="chip-row">${brands.map((brand) => `<button class="chip" data-go="/brand">${brand.name}</button>`).join("")}</div>
      <div class="section-label">Популярные товары</div>
      <div class="grid">${products.slice(0, 4).map((p) => productCard(p, true)).join("")}</div>
      <div class="section-label">Акция</div>
      <div class="card pad"><b>${promos[0].title}</b><p class="muted">Скидка ${promos[0].discount} на подборку тормозной системы.</p>${button("/promo", "Открыть акцию")}</div>
      <div class="section-label">Как работает подбор</div>
      ${timeline(["Выберите автомобиль или отправьте VIN", "Мы проверим совместимость", "Покажем сроки и аналоги", "Вы оформляете заказ без регистрации"])}
      <div class="section-label">Доверие и контакты</div>
      <div class="grid two">
        <div class="card pad">${icon.ok}<b>Локальные SVG</b><p class="small muted">Без внешних библиотек.</p></div>
        <div class="card pad">${icon.cart}<b>Заказ без регистрации</b><p class="small muted">Кабинет можно создать позже.</p></div>
      </div>
    `;
  }

  function categoryTile(category) {
    return `<button class="card category-tile" data-go="/catalog"><img src="${category.image}" alt=""><b>${category.name}</b></button>`;
  }

  function timeline(items) {
    return `<div class="card pad timeline">${items.map((item, index) => `<div class="timeline-item"><span class="timeline-dot">${index + 1}</span><div><b>${item}</b><p class="small muted">Экран состояния показывает следующий шаг.</p></div></div>`).join("")}</div>`;
  }

  function mapScreen() {
    const modules = [...new Set(screens.map((screen) => screen.module))];
    return `
      ${title("Карта прототипа", `Все экраны доступны напрямую. Всего экранов: ${screens.length}.`)}
      <div class="search-box"><input id="screen-search" placeholder="Найти экран"></div>
      <div class="chip-row" id="screen-filters">
        ${["all", "client", "manager", "state", "error", "form"].map((type) => `<button class="chip ${type === "all" ? "active" : ""}" data-filter="${type}">${type === "all" ? "Все" : type}</button>`).join("")}
      </div>
      <div class="section-label">Модули</div>
      <div class="module-grid">${modules.map((module) => `<div class="card module-card"><b>${module}</b><div class="metric">${screens.filter((s) => s.module === module).length}</div></div>`).join("")}</div>
      <div class="section-label">Экраны</div>
      <div class="screen-list" id="screen-list">${screenRows(screens)}</div>
      <button class="btn secondary full" data-reset>Сбросить состояние прототипа</button>
    `;
  }

  function screenRows(list) {
    return list.map((screen) => `
      <article class="card screen-row">
        <b>${screen.number}</b>
        <div><strong>${screen.title}</strong><span>${screen.module} · ${screen.type} · ${screen.status}</span></div>
        <button class="btn secondary" data-go="/${screen.route}">Открыть</button>
      </article>
    `).join("");
  }

  function menuScreen() {
    return `${title("Меню", "Быстрый доступ ко всем основным разделам.")}
      <div class="grid">
        ${["/catalog:Каталог", "/garage:Мои автомобили", "/vin:VIN-подбор", "/promos:Акции", "/delivery-info:Оплата и доставка", "/contacts:Контакты", "/manager:Интерфейс менеджера"].map((item) => {
          const [to, label] = item.split(":");
          return `<button class="card pad row between" data-go="${to}"><b>${label}</b>${icon.back.replace("M15 18l-6-6 6-6", "M9 6l6 6-6 6")}</button>`;
        }).join("")}
      </div>`;
  }

  function searchScreen(kind = "Поиск") {
    return `${title(kind, "Подсказки, история и точный поиск доступны отдельными состояниями.")}
      <div class="search-box">${icon.search}<input id="search-input" placeholder="Например: ${products[0].article}"></div>
      <div class="chip-row">
        <button class="chip" data-go="/search-suggestions">Подсказки</button>
        <button class="chip" data-go="/search-history">История</button>
        <button class="chip" data-go="/empty-results">Пусто</button>
      </div>
      <div class="section-label">Результаты</div>
      <div class="grid">${products.slice(0, 5).map(productCard).join("")}</div>`;
  }

  function vehicleFlow(route) {
    const steps = {
      garage: ["Мои автомобили", cars.map(carCard).join("") + button("/vehicle-brand", "Добавить автомобиль", "full")],
      "vehicle-brand": ["Выбор марки", choice(["Toyota", "Kia", "Volkswagen", "Hyundai"], "/vehicle-model")],
      "vehicle-model": ["Выбор модели", choice(["Camry", "Rio", "Tiguan", "Solaris"], "/vehicle-year")],
      "vehicle-year": ["Выбор года", choice(["2024", "2023", "2022", "2021", "2019"], "/vehicle-engine")],
      "vehicle-engine": ["Двигатель", choice(["2.5 бензин", "1.6 бензин", "2.0 TSI", "Не знаю двигатель / модификацию"], "/vehicle-confirm", "/vin")],
      "vehicle-confirm": ["Автомобиль сохранён", `<div class="card pad">${icon.ok}<b>Toyota Camry добавлена</b><p class="muted">Каталог теперь показывает совместимость.</p>${button("/vehicle-categories", "Открыть совместимый каталог", "full")}</div>`],
      "vehicle-profile": ["Профиль автомобиля", carCard(selectedCar()) + button("/vehicle-categories", "Совместимые категории", "full")],
      "vehicle-categories": ["Совместимые категории", `<div class="grid two">${categories.map(categoryTile).join("")}</div>`],
      "vehicle-edit": ["Редактирование автомобиля", form(["Марка", "Модель", "Год", "VIN"]) + button("/vehicle-profile", "Сохранить", "full")],
      "vehicle-delete": ["Удаление автомобиля", `<div class="card pad error">${icon.warning}<h2>Удалить автомобиль?</h2><p>История заказов сохранится.</p>${button("/garage", "Оставить автомобиль", "full")}</div>`]
    };
    const [heading, body] = steps[route] || steps.garage;
    return title(heading) + body;
  }

  function carCard(car) {
    return `<article class="card pad"><div class="row">${icon.car}<div><b>${car.brand} ${car.model}</b><p class="small muted">${car.year} · ${car.engine}</p></div></div><div class="row"><button class="btn secondary" data-go="/vehicle-profile">Открыть</button><button class="btn ghost" data-go="/vehicle-edit">Изменить</button></div></article>`;
  }

  function choice(items, next, alt) {
    return `<div class="grid">${items.map((item) => `<button class="card pad row between" data-go="${alt && item.startsWith("Не знаю") ? alt : next}"><b>${item}</b><span class="status">выбрать</span></button>`).join("")}</div>`;
  }

  function vinFlow(route) {
    const generic = {
      vin: `${form(["VIN", "Телефон", "Имя", "Что требуется"], true)}<div class="tabs"><button class="active">Оригинал</button><button>Надёжный</button><button>Бюджет</button></div>${button("/vin-upload", "Продолжить", "full")}`,
      "vin-upload": `<div class="card pad">${icon.vin}<b>Загрузка или фото СТС</b><p class="muted">В прототипе файл не отправляется, но состояние сохраняет путь пользователя.</p>${button("/vin-preview", "Показать предпросмотр", "full")}</div>`,
      "vin-preview": `<div class="card pad"><div class="skeleton" style="height:180px"></div><p>Фото читается, VIN найден частично.</p>${button("/vin-sent", "Отправить заявку", "full")} ${button("/vin-photo-error", "Показать ошибку", "secondary full")}</div>`,
      "vin-photo-error": stateBlock("Фото не распознано", "Ошибка не удаляет введённые данные. Можно загрузить другое фото или ввести VIN вручную.", "/vin-upload"),
      "vin-sent": stateBlock("Заявка VIN-1028 отправлена", "Ответ менеджера ожидается сегодня до 18:00. Канал связи: телефон и чат.", "/vin-status"),
      "vin-status": vinCard(vinRequests[0]) + timeline(["Заявка создана", "Менеджер проверяет VIN", "Подборка будет отправлена", "Клиент выбирает вариант"]),
      "vin-need-data": stateBlock("Менеджер запросил данные", "Нужно фото оборотной стороны СТС или уточнение двигателя.", "/vin-answer"),
      "vin-answer": form(["Комментарий", "Телефон для связи"]) + button("/vin-status", "Отправить ответ", "full"),
      "vin-ready": stateBlock("Подборка готова", "Менеджер подготовил 3 варианта: оригинал, надёжный аналог и бюджетный.", "/vin-selection"),
      "vin-selection": `<div class="grid">${selections[0].products.map(productCard).join("")}</div>${button("/vin-compare", "Сравнить варианты", "full")}`,
      "vin-compare": compareTable() + button("/vin-pick-product", "Выбрать надёжный аналог", "full"),
      "vin-pick-product": productCard(products[1]) + button("/cart", "Добавить и перейти в корзину", "full"),
      "vin-closed": stateBlock("VIN-заявка закрыта", "По заявке создан заказ. История доступна в личном кабинете.", "/account-vin-detail")
    };
    return title(routeMap.get(route)?.title || "VIN-подбор") + (generic[route] || generic.vin);
  }

  function vinCard(req) {
    return `<article class="card pad"><div class="row between"><b>${req.id}</b><span class="status ${statusClass(req.status)}">${req.status}</span></div><p>${req.car}: ${req.need}</p><p class="small muted">${req.sla}</p>${button("/vin-ready", "Открыть подборку")}</article>`;
  }

  function catalogFlow(route) {
    if (route === "categories") return title("Все категории") + `<div class="grid two">${categories.map(categoryTile).join("")}</div>`;
    if (route === "brands") return title("Бренды") + `<div class="grid two">${brands.map((b) => `<button class="card brand-tile" data-go="/brand">${b.name}</button>`).join("")}</div>`;
    if (route === "filters") return title("Фильтры") + filterForm();
    if (route === "sort") return title("Сортировка") + choice(["Сначала дешевле", "Сначала быстрее", "По рейтингу", "Сначала совместимые"], "/catalog");
    if (route === "empty-results") return empty("Ничего не найдено", "Можно отправить VIN-запрос менеджеру.", "/vin");
    if (route === "catalog-error") return error("Каталог временно недоступен", "Повторите загрузку или передайте подбор менеджеру.", "/catalog");
    if (route === "out-of-stock") return stateBlock("Товара нет в наличии", "Показываем аналоги и сроки поставки, цену не меняем молча.", "/analogs");
    if (route === "promos") return title("Акции") + `<div class="grid">${promos.map((p) => `<article class="card pad"><b>${p.title}</b><p class="muted">${p.discount}</p>${button("/promo", "Открыть")}</article>`).join("")}</div>`;
    if (route === "brand") return title("BOSCH", "Страница бренда: рейтинг, сроки, категории.") + `<div class="grid">${products.filter((p) => p.brand === "BOSCH").map(productCard).join("")}</div>`;
    if (route === "analogs" || route === "recent" || route === "search-results" || route === "article-search" || route === "subcategory" || route === "promo" || route === "compatibility") return searchScreen(routeMap.get(route).title);
    return title("Каталог товаров") + `<div class="chip-row"><button class="chip" data-go="/filters">Фильтры</button><button class="chip" data-go="/sort">Сортировка</button><button class="chip active">Совместимые</button></div><div class="grid">${products.slice(0, 10).map(productCard).join("")}</div>`;
  }

  function productFlow(route, id) {
    const product = products.find((p) => p.id === id) || products[0];
    const states = {
      "product-fit-ok": ["Совместимость подтверждена", "Подходит для Toyota Camry 2019."],
      "product-fit-unknown": ["Совместимость не проверена", "Выберите автомобиль или отправьте VIN менеджеру."],
      "product-fit-bad": ["Товар не подходит", "Показываем безопасные аналоги."],
      "product-no-car": ["Автомобиль не выбран", "Без автомобиля совместимость не скрывается."]
    };
    if (states[route]) return stateBlock(states[route][0], states[route][1], "/vin");
    if (["gallery", "specs", "plain-description", "availability", "supplier", "warranty", "related"].includes(route)) {
      return title(routeMap.get(route).title) + `<div class="card pad"><img src="${product.image}" alt="" style="width:100%;height:180px;object-fit:contain"><p>${product.brand} ${product.title}. Поставщик: ${product.supplier}. Гарантия: 12 месяцев.</p></div>${button("/product", "Вернуться к товару", "full")}`;
    }
    if (route === "compare-analogs") return title("Сравнение аналогов") + compareTable();
    if (route === "product-question") return title("Вопрос по товару") + form(["Телефон", "Вопрос"]) + button("/product", "Отправить менеджеру", "full");
    if (route === "added-cart") return stateBlock("Добавлено в корзину", "Количество и цена видны перед оформлением.", "/cart");
    if (route === "added-favorite") return stateBlock("Добавлено в избранное", "Избранное доступно в кабинете.", "/favorites");
    return `
      ${title(product.brand)}
      <div class="card pad">
        <img src="${product.image}" alt="" style="width:100%;height:190px;object-fit:contain">
        <span class="status ${statusClass(product.compatibility)}">${product.compatibility}</span>
        <h2>${product.title}</h2>
        <p class="muted">${product.article} · для ${selectedCar().brand} ${selectedCar().model}</p>
        <div class="row between"><span class="price">${money(product.price)}</span><span class="status ok">${product.stock}</span></div>
        <p><b>Срок:</b> ${product.delivery}</p>
        <button class="btn full" data-add="${product.id}">Добавить в корзину</button>
      </div>
      <div class="grid two" style="margin-top:10px">${["/gallery:Галерея", "/specs:Характеристики", "/availability:Наличие", "/compare-analogs:Аналоги"].map((item) => { const [to,label]=item.split(":"); return `<button class="card pad" data-go="${to}">${label}</button>`; }).join("")}</div>
    `;
  }

  function cartFlow(route) {
    if (route === "cart-empty") return empty("Корзина пуста", "Добавьте товар из каталога или VIN-подборки.", "/catalog");
    if (["cart-delete", "cart-out", "cart-price-changed", "cart-delivery-changed", "cart-analog", "promo-applied", "promo-error"].includes(route)) return stateBlock(routeMap.get(route).title, "Старое и новое значение показаны явно, требуется подтверждение клиента.", "/cart");
    if (route === "promo-code") return title("Промокод") + form(["Промокод"]) + button("/promo-applied", "Применить", "full") + button("/promo-error", "Показать ошибку", "secondary full");
    const rows = Store.state.cart.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return `<article class="card product-card"><img src="${product.image}" alt=""><div><h3>${product.title}</h3><p class="price">${money(product.price)}</p><div class="row"><button class="icon-button" data-qty="${product.id}:-1">-</button><b>${item.qty}</b><button class="icon-button" data-qty="${product.id}:1">+</button><button class="btn ghost" data-go="/cart-delete">Удалить</button></div></div></article>`;
    }).join("");
    return title("Корзина", "Итого: " + money(Store.cartTotal())) + (rows || empty("Корзина пуста", "", "/catalog")) + `<div class="grid"><button class="btn secondary full" data-go="/promo-code">Ввести промокод</button><button class="btn full" data-go="/checkout-contact">Оформить без регистрации</button></div>`;
  }

  function checkoutFlow(route) {
    const steps = ["checkout-contact", "checkout-delivery", "pickup", "pickup-map", "courier-address", "transport-company", "delivery-time", "payment", "order-comment", "checkout-review", "terms"];
    if (route === "payment-processing") return stateBlock("Обработка оплаты", "Показываем загрузку и не создаём дубль заказа.", "/payment-success", true);
    if (route === "payment-success") return stateBlock("Оплата успешна", "Заказ создан. Можно сохранить автомобиль и создать кабинет.", "/order-success");
    if (route === "payment-error") return error("Оплата не прошла", "Корзина сохранена, выберите другой способ.", "/payment-change");
    if (route === "order-success") return stateBlock("Заказ GG-24075 создан", "Отслеживание доступно по ссылке и в личном кабинете.", "/order-status");
    const current = routeMap.get(route);
    const next = steps[steps.indexOf(route) + 1] || "payment-processing";
    return title(current?.title || "Оформление", "Шаг без обязательной регистрации.") + form(["Имя", "Телефон", "Комментарий"]) + `<div class="grid">${addresses.slice(0, 3).map((a) => `<button class="card pad" data-go="/${next}">${a.title}</button>`).join("")}</div>${button("/" + next, "Продолжить", "full")}`;
  }

  function orderFlow(route) {
    if (["order-confirm-required", "order-cancelled"].includes(route)) return stateBlock(routeMap.get(route).title, "Клиент видит причину и основное действие.", "/order-detail");
    if (route === "cancel-request") return title("Запрос отмены") + form(["Причина отмены"]) + button("/order-cancelled", "Отправить запрос", "full");
    return title(routeMap.get(route)?.title || "Статус заказа") + `<div class="grid">${orders.map(orderCard).join("")}</div>${timeline(["Создан", "Подтверждён", "У поставщика", "Передан в доставку", "Готов к получению"])}`;
  }

  function orderCard(order) {
    return `<article class="card pad"><div class="row between"><b>${order.id}</b><span class="status ${statusClass(order.status)}">${order.status}</span></div><p class="price">${money(order.total)}</p><p class="small muted">${order.date}</p>${button("/order-detail", "Открыть")}</article>`;
  }

  function accountFlow(route) {
    if (["login", "code", "profile-edit", "address-add", "notification-settings"].includes(route)) return title(routeMap.get(route).title) + form(["Телефон", "Код", "Имя"]) + button("/account", "Продолжить", "full");
    if (route === "code-error") return error("Код неверный", "Телефон и введённый код остаются в форме.", "/code");
    if (["logout", "delete-account"].includes(route)) return stateBlock(routeMap.get(route).title, "Подтверждение действия без потери заказов в прототипе.", "/account");
    const links = ["/account-orders:Мои заказы", "/account-cars:Мои автомобили", "/account-vin:VIN-заявки", "/favorites:Избранное", "/addresses:Адреса", "/profile:Профиль"];
    if (route === "favorites") return title("Избранное") + `<div class="grid">${products.filter((p) => Store.state.favorites.has(p.id)).map(productCard).join("") || empty("Избранного нет", "", "/catalog")}</div>`;
    return title(routeMap.get(route)?.title || "Личный кабинет", "Автомобили, заказы, VIN-подборы и повторные покупки.") + `<div class="grid">${links.map((item) => { const [to,label]=item.split(":"); return `<button class="card pad row between" data-go="${to}"><b>${label}</b><span class="status">открыть</span></button>`; }).join("")}</div>`;
  }

  function serviceFlow(route) {
    if (["404", "offline", "server-error"].includes(route)) return error(routeMap.get(route).title, "Есть понятное действие и путь назад.", "/home");
    if (route === "maintenance") return stateBlock("Технические работы", "Показываем ожидаемый срок восстановления и контакты.", "/contacts");
    if (["callback", "support-chat"].includes(route)) return title(routeMap.get(route).title) + form(["Имя", "Телефон", "Сообщение"]) + button("/support", "Отправить", "full");
    return title(routeMap.get(route)?.title || "Сервис") + `<div class="card pad"><p>Информационная страница прототипа. Здесь фиксируются правила, ожидания клиента и путь к поддержке.</p><p><b>Телефон G-Garage:</b> 8 906 903-32-31</p>${button("/contacts-quick", "Связаться", "full")}</div>`;
  }

  function managerFlow(route) {
    if (route === "manager") return title("Вход сотрудника") + form(["Логин", "Код доступа"]) + button("/manager-dashboard", "Войти", "full");
    const cards = [
      ["/manager-vin-queue", "VIN-заявки", vinRequests.length],
      ["/manager-orders", "Заказы", orders.length],
      ["/manager-product-search", "Поиск товаров", products.length],
      ["/manager-promos", "Акции", promos.length]
    ];
    if (route === "manager-dashboard") return title("Дашборд менеджера") + `<div class="module-grid">${cards.map(([to,label,count]) => `<button class="card module-card" data-go="${to}"><b>${label}</b><div class="metric">${count}</div></button>`).join("")}</div>`;
    if (route.includes("vin")) return title(routeMap.get(route).title) + `<div class="grid">${vinRequests.map(vinCard).join("")}</div><div class="grid two"><button class="btn secondary" data-go="/manager-request-data">Запросить данные</button><button class="btn" data-go="/manager-preview">Собрать подборку</button></div>`;
    if (route.includes("order")) return title(routeMap.get(route).title) + `<div class="grid">${orders.map(orderCard).join("")}</div>${button("/manager-order-status", "Изменить статус", "full")}`;
    if (route.includes("product") || route === "manager-catalog") return title(routeMap.get(route).title) + `<div class="grid">${products.slice(0, 6).map(productCard).join("")}</div>${button("/manager-add-product", "Добавить в подборку", "full")}`;
    return title(routeMap.get(route)?.title || "Менеджер") + `<div class="card pad"><p>Операционный экран: менеджер видит контекст клиента, статусы, подборку и следующий шаг.</p>${button("/manager-dashboard", "К дашборду", "full")}</div>`;
  }

  function form(fields, vin = false) {
    return `<form class="card pad" data-form>${fields.map((field) => `<label class="field"><span>${field}</span>${field === "Комментарий" || field === "Что требуется" || field === "Сообщение" ? `<textarea placeholder="${field}"></textarea>` : `<input placeholder="${field}">`}</label>`).join("")}${vin ? `<label class="field"><span>Срочность</span><select><option>Сегодня</option><option>1-2 дня</option><option>Не срочно</option></select></label>` : ""}</form>`;
  }

  function filterForm() {
    return `<div class="card pad">${["Совместимость", "Бренд", "Цена", "Наличие", "Срок доставки", "Оригинал / аналог", "Качество", "Рейтинг", "Поставщик"].map((name) => `<label class="field"><span>${name}</span><select><option>Любое</option><option>Только выбранное</option></select></label>`).join("")}${button("/catalog", "Показать товары", "full")}</div>`;
  }

  function compareTable() {
    return `<div class="grid">${["Оригинал", "Надёжный аналог", "Бюджетный аналог"].map((label, index) => `<article class="card pad"><div class="row between"><b>${label}</b><span class="price">${money(products[index].price)}</span></div><p>Срок: ${products[index].delivery}. Ресурс: ${["100%", "85%", "65%"][index]}. Гарантия: ${12 - index * 3} мес.</p><span class="status ${index === 1 ? "ok" : "warn"}">${index === 1 ? "Рекомендация менеджера" : "Вариант"}</span></article>`).join("")}</div>`;
  }

  function empty(heading, text, to) {
    return `<div class="card empty">${icon.search}<h2>${heading}</h2><p>${text}</p>${button(to, "Перейти дальше", "full")}</div>`;
  }

  function error(heading, text, to) {
    return `<div class="card error">${icon.warning}<h2>${heading}</h2><p>${text}</p>${button(to, "Исправить", "full")}</div>`;
  }

  function stateBlock(heading, text, to, loading = false) {
    return `<div class="card pad">${loading ? `<div class="skeleton" style="height:90px"></div>` : icon.ok}<h2>${heading}</h2><p>${text}</p>${button(to, "Продолжить", "full")}</div>`;
  }

  function render() {
    const route = Router.current().replace(/^\//, "");
    const [base, param] = route.split("/");
    let content;
    if (base === "map") content = mapScreen();
    else if (base === "home" || !base) content = home();
    else if (base === "menu") content = menuScreen();
    else if (base.startsWith("search")) content = searchScreen(routeMap.get(base)?.title);
    else if (["city", "contacts-quick"].includes(base)) content = serviceFlow(base);
    else if (base.startsWith("vehicle") || base === "garage") content = vehicleFlow(base);
    else if (base.startsWith("vin")) content = vinFlow(base);
    else if (["categories", "subcategory", "catalog", "filters", "sort", "compatibility", "brands", "brand", "article-search", "search-results", "analogs", "recent", "empty-results", "out-of-stock", "catalog-error", "promos", "promo"].includes(base)) content = catalogFlow(base);
    else if (base.startsWith("product") || ["gallery", "specs", "plain-description", "availability", "supplier", "warranty", "compare-analogs", "related", "product-question", "added-cart", "added-favorite"].includes(base)) content = productFlow(base, param);
    else if (base.startsWith("cart") || base.startsWith("promo-")) content = cartFlow(base);
    else if (base.startsWith("checkout") || ["pickup", "pickup-map", "courier-address", "transport-company", "delivery-time", "payment", "order-comment", "terms", "payment-processing", "payment-success", "payment-error", "payment-change", "order-success"].includes(base)) content = checkoutFlow(base);
    else if (base.startsWith("order") || ["tracking", "cancel-request", "repeat-order", "documents"].includes(base)) content = orderFlow(base);
    else if (["login", "code", "code-error", "account", "account-orders", "account-order", "account-repeat", "account-cars", "account-car", "account-vin", "account-vin-detail", "favorites", "addresses", "address-add", "notifications", "notification-settings", "profile", "profile-edit", "logout", "delete-account"].includes(base)) content = accountFlow(base);
    else if (base.startsWith("manager")) content = managerFlow(base);
    else content = serviceFlow(base);
    layout(content, { title: routeMap.get(base)?.module || "G-Garage", back: base !== "home" });
    bindMapControls();
  }

  function bindActions() {
    document.querySelectorAll("[data-go]").forEach((node) => node.addEventListener("click", (event) => {
      event.stopPropagation();
      Router.go(node.dataset.go);
    }));
    document.querySelectorAll("[data-back]").forEach((node) => node.addEventListener("click", () => history.length > 1 ? history.back() : Router.go("/home")));
    document.querySelectorAll("[data-add]").forEach((node) => node.addEventListener("click", (event) => {
      event.stopPropagation();
      Store.addToCart(node.dataset.add);
      render();
    }));
    document.querySelectorAll("[data-fav]").forEach((node) => node.addEventListener("click", (event) => {
      event.stopPropagation();
      Store.toggleFavorite(node.dataset.fav);
      render();
    }));
    document.querySelectorAll("[data-qty]").forEach((node) => node.addEventListener("click", () => {
      const [id, delta] = node.dataset.qty.split(":");
      Store.updateQty(id, Number(delta));
      render();
    }));
    document.querySelectorAll("[data-reset]").forEach((node) => node.addEventListener("click", () => {
      Store.reset();
      Store.toast("Состояние прототипа сброшено");
      render();
    }));
  }

  function bindMapControls() {
    const input = document.querySelector("#screen-search");
    const list = document.querySelector("#screen-list");
    const filters = document.querySelector("#screen-filters");
    if (!input || !list || !filters) return;
    let active = "all";
    function apply() {
      const q = input.value.trim().toLowerCase();
      const filtered = screens.filter((screen) => (active === "all" || screen.type === active) && (`${screen.number} ${screen.title} ${screen.module}`.toLowerCase().includes(q)));
      list.innerHTML = screenRows(filtered);
      bindActions();
    }
    input.addEventListener("input", apply);
    filters.querySelectorAll("[data-filter]").forEach((node) => node.addEventListener("click", () => {
      active = node.dataset.filter;
      filters.querySelectorAll(".chip").forEach((chip) => chip.classList.toggle("active", chip === node));
      apply();
    }));
  }

  Router.onChange(render);
  if (!location.hash) Router.go("/home");
  render();
})();
