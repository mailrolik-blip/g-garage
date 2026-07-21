(() => {
  const app = document.getElementById("app");
  const page = document.body.dataset.page;
  const { data, productCard } = GG;
  function activeForPage() { return page === "catalog" ? "catalog" : ""; }
  GG.init(activeForPage());
  if (page === "home") renderHome();
  if (page === "catalog") renderCatalog();

  function renderHome() {
    const v = GGState.getVehicle();
    app.innerHTML = `
      <section class="hero">
        <div class="panel hero-main">
          <p class="muted"><b>G-Garage</b> · подбор автозапчастей по артикулу, автомобилю или VIN</p>
          <h1>Автозапчасти с проверкой <span>совместимости</span></h1>
          <p>Desktop storefront на тестовых данных: каталог, карточки, корзина, checkout и личный кабинет работают без backend.</p>
          <form class="hero-search" data-search-form><input class="input" name="q" placeholder="Введите артикул, бренд или название"><button class="btn">Найти</button></form>
          <div class="mode-grid">
            <a class="btn secondary" href="/storefront/catalog/?q=BREMBO-2217"><b>По артикулу</b><span>Быстрый поиск точной позиции и аналогов</span></a>
            <a class="btn secondary" href="/storefront/vehicle/"><b>По автомобилю</b><span>Сохраняем авто и показываем совместимость</span></a>
            <a class="btn secondary" href="/storefront/vin/"><b>По VIN</b><span>Заявка менеджеру, если данных недостаточно</span></a>
          </div>
        </div>
        <aside class="panel vehicle-card">
          <h2>Выбранный автомобиль</h2>
          <img src="/storefront/assets/hero/main-hero.png" alt="Автомобиль G-Garage">
          <p><b>${v ? `${v.brand} ${v.model}` : "Автомобиль не выбран"}</b></p>
          <p class="muted">${v ? `${v.year}, ${v.engine}` : "Выберите авто, чтобы каталог подсвечивал совместимость."}</p>
          <a class="btn full" href="/storefront/vehicle/">Изменить автомобиль</a>
        </aside>
      </section>
      <section class="section"><div class="feature-grid">
        ${["Проверка по авто", "Сроки получения", "Оригиналы и аналоги", "Локальная корзина"].map((t, i) => `<article class="panel"><span class="status ok">0${i+1}</span><h3>${t}</h3><p class="muted">Сценарий реализован на mock-данных и сохраняет состояние в браузере.</p></article>`).join("")}
      </div></section>
      <section class="section"><div class="section-head"><div><h2>Категории</h2><p>Основные группы деталей для desktop-каталога.</p></div><a class="btn secondary" href="/storefront/catalog/">Все товары</a></div><div class="category-grid">${data.categories.map((c) => `<a class="card category-card" href="/storefront/catalog/?category=${c.id}"><img src="${c.image}" alt="${c.name}"><b>${c.name}</b><span class="muted">${c.count} позиций</span></a>`).join("")}</div></section>
      <section class="section"><div class="section-head"><h2>Популярные бренды</h2><a class="btn secondary" href="/storefront/catalog/?brands=1">Смотреть</a></div><div class="brand-grid">${data.brands.map((b) => `<a class="card brand-tile" href="/storefront/catalog/?brand=${b.name}">${b.name}</a>`).join("")}</div></section>
      <section class="section"><div class="section-head"><div><h2>Популярные товары</h2><p>Карточки одинаковой высоты, с ценой, сроком и совместимостью.</p></div></div><div class="product-grid">${data.products.slice(0, 8).map(productCard).join("")}</div></section>
      <section class="section" id="promo"><article class="panel promo-band"><div><span class="status warn">Акция</span><h2>${data.promos[0].title}</h2><p class="muted">${data.promos[0].text}</p><a class="btn" href="/storefront/catalog/?category=brakes">Открыть подбор</a></div><img src="/storefront/assets/promo/brake-discount.png" alt="Акция на тормоза"></article></section>
      <section class="section"><div class="section-head"><h2>Как работает подбор</h2></div><div class="timeline">${["Находим деталь", "Проверяем авто", "Показываем сроки", "Оформляем заказ"].map((t,i) => `<article class="panel"><div class="step-num">${i+1}</div><h3>${t}</h3><p class="muted">Без обращения к внешним API в этой версии.</p></article>`).join("")}</div></section>
      <section class="section"><div class="feature-grid"><article class="panel"><h3>Гарантия подбора</h3><p class="muted">Для тестового storefront показана логика статусов совместимости и VIN fallback.</p></article><article class="panel"><h3>Доверие</h3><p class="muted">Заказы, VIN-заявки и история поиска сохраняются локально.</p></article><article class="panel"><h3>Получение</h3><p class="muted">Пять тестовых пунктов выдачи доступны в checkout.</p></article><article class="panel"><h3>Возврат</h3><p class="muted">Условия описаны без неподтвержденных юридических обещаний.</p></article></div></section>`;
    GG.bindSearch(app);
  }

  function renderCatalog() {
    const params = new URLSearchParams(location.search);
    const state = { q: params.get("q") || "", category: params.get("category") || "", brand: params.get("brand") || "", sort: "popular", quality: "", stock: false };
    app.innerHTML = `<div class="breadcrumbs"><a href="/storefront/">Главная</a><span>/</span><span>Каталог</span></div><div class="section-head"><div><h1>Каталог автозапчастей</h1><p>Выбранный автомобиль: <b data-vehicle-label></b>. Найдено <span data-count></span> товаров.</p></div><a class="btn secondary" href="/storefront/vin/">Не нашли? VIN-запрос</a></div><div class="sidebar-layout"><aside class="panel"><h3>Фильтры</h3><form id="filters"><div class="filter-group"><b>Категория</b>${data.categories.map((c) => `<label><input type="radio" name="category" value="${c.id}" ${state.category===c.id?'checked':''}>${c.name}</label>`).join("")}<label><input type="radio" name="category" value="" ${!state.category?'checked':''}>Все категории</label></div><div class="filter-group"><b>Совместимость</b><label><input type="checkbox" name="fit" value="confirmed">Подходит к авто</label><label><input type="checkbox" name="fit" value="unknown">Не проверено</label></div><div class="filter-group"><b>Бренд</b>${data.brands.map((b) => `<label><input type="checkbox" name="brand" value="${b.name}" ${state.brand===b.name?'checked':''}>${b.name}</label>`).join("")}</div><div class="filter-group"><b>Цена</b><div class="catalog-search"><input class="input" name="min" placeholder="от"><input class="input" name="max" placeholder="до"></div></div><div class="filter-group"><b>Наличие</b><label><input type="checkbox" name="stock">В наличии</label><label><input type="checkbox" name="date">Получение до 2 дней</label></div><div class="filter-group"><b>Оригинал / аналог</b><label><input type="radio" name="quality" value="">Все</label><label><input type="radio" name="quality" value="Оригинал">Оригинал</label><label><input type="radio" name="quality" value="Надежный аналог">Надежный аналог</label><label><input type="radio" name="quality" value="Бюджетный вариант">Бюджетный вариант</label></div></form></aside><section><div class="catalog-toolbar"><form class="catalog-search" data-catalog-search><input class="input" name="q" value="${state.q}" placeholder="Поиск в каталоге"><button class="btn">Найти</button></form><select class="select" data-sort><option value="popular">Сначала популярные</option><option value="price-asc">Цена по возрастанию</option><option value="price-desc">Цена по убыванию</option><option value="delivery">Быстрое получение</option></select></div><div class="chips" data-applied></div><div class="catalog-grid" data-grid></div><button class="btn secondary full" data-more>Показать еще</button><div class="notice section">Если совместимость не подтверждена, отправьте VIN-запрос. Менеджер подберет оригинал, надежный аналог и бюджетный вариант.</div></section></div>`;
    const filters = app.querySelector("#filters"), grid = app.querySelector("[data-grid]"), applied = app.querySelector("[data-applied]"); let limit = 12;
    function selectedBrands() { return [...filters.querySelectorAll('input[name="brand"]:checked')].map((x) => x.value); }
    function render() {
      const fd = new FormData(filters); let items = [...data.products]; const q = app.querySelector('[data-catalog-search] input').value.trim().toLowerCase();
      if (q) items = items.filter((p) => `${p.name} ${p.brand} ${p.article}`.toLowerCase().includes(q));
      if (fd.get("category")) items = items.filter((p) => p.category === fd.get("category"));
      const brands = selectedBrands(); if (brands.length) items = items.filter((p) => brands.includes(p.brand));
      if (fd.get("fit")) items = items.filter((p) => p.compatibility === "confirmed");
      if (fd.get("stock")) items = items.filter((p) => p.stock > 0);
      if (fd.get("date")) items = items.filter((p) => p.deliveryDate !== "2-3 дня");
      if (fd.get("quality")) items = items.filter((p) => p.quality === fd.get("quality"));
      const sort = app.querySelector("[data-sort]").value; if (sort === "price-asc") items.sort((a,b)=>a.price-b.price); if (sort === "price-desc") items.sort((a,b)=>b.price-a.price); if (sort === "delivery") items.sort((a,b)=>a.deliveryDate.localeCompare(b.deliveryDate));
      app.querySelector("[data-count]").textContent = items.length;
      applied.innerHTML = [q && `Поиск: ${q}`, fd.get("category") && `Категория: ${data.categories.find(c=>c.id===fd.get("category"))?.name}`, brands.length && `Бренды: ${brands.join(", ")}`, fd.get("quality")].filter(Boolean).map((x)=>`<span class="chip active">${x}</span>`).join("");
      grid.innerHTML = items.slice(0, limit).map(productCard).join("") || `<div class="panel">Ничего не найдено. <a href="/storefront/vin/">Создать VIN-запрос</a></div>`;
      app.querySelector("[data-more]").classList.toggle("hidden", items.length <= limit);
    }
    filters.addEventListener("change", render); app.querySelector("[data-sort]").addEventListener("change", render); app.querySelector("[data-catalog-search]").addEventListener("submit", (e)=>{ e.preventDefault(); const q=e.target.q.value.trim(); if(q) GGState.addSearch(q); render(); }); app.querySelector("[data-more]").addEventListener("click", ()=>{ limit += 8; render(); }); render(); GG.updateHeader();
  }
})();
