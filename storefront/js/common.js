window.GG = (() => {
  const data = window.StorefrontData;
  const money = (n) => `${Number(n || 0).toLocaleString("ru-RU")} ₽`;
  const byId = (id) => data.products.find((p) => p.id === id);
  const compatText = { confirmed: "Подходит", unknown: "Не проверено", bad: "Не подходит", "no-car": "Авто не выбран" };
  const compatClass = { confirmed: "ok", unknown: "warn", bad: "bad", "no-car": "" };
  const icon = {
    search: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    cart: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.1 2h3l2.2 12.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L20.7 7H6.1"/></svg>',
    heart: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 0 1 12 6a5 5 0 0 1 7.5 6.6Z"/></svg>',
    car: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M7 17v2M17 17v2M6 13l2-5h8l2 5M5 13h14v4H5z"/></svg>',
    user: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M19 21a7 7 0 0 0-14 0"/><circle cx="12" cy="7" r="4"/></svg>',
    vin: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>'
  };
  function cartTotals() {
    const items = GGState.getCart().map((i) => ({ ...i, product: byId(i.id) })).filter((i) => i.product);
    const count = items.reduce((s, i) => s + i.qty, 0);
    const sum = items.reduce((s, i) => s + i.product.price * i.qty, 0);
    const discount = GGState.getPromo() === "GARAGE8" ? Math.round(sum * .08) : 0;
    return { items, count, sum, discount, delivery: count ? 390 : 0, total: Math.max(0, sum - discount + (count ? 390 : 0)) };
  }
  function updateHeader() {
    const v = GGState.getVehicle(); const t = cartTotals();
    document.querySelectorAll("[data-cart-count]").forEach((el) => el.textContent = t.count);
    document.querySelectorAll("[data-cart-sum]").forEach((el) => el.textContent = money(t.sum));
    document.querySelectorAll("[data-vehicle-label]").forEach((el) => el.textContent = v ? `${v.brand} ${v.model}` : "Выбрать авто");
  }
  function renderHeader(active = "") {
    const root = document.getElementById("site-header"); if (!root) return;
    const nav = [["catalog","Каталог","/storefront/catalog/"],["vehicle","Подбор по авто","/storefront/vehicle/"],["vin","VIN-запрос","/storefront/vin/"],["brands","Бренды","/storefront/catalog/?brands=1"],["promo","Акции","/storefront/#promo"],["delivery","Доставка","/storefront/delivery/"],["returns","Возврат","/storefront/returns/"],["contacts","Контакты","/storefront/contacts/"]];
    root.innerHTML = `<header class="site-header"><div class="container utility-bar"><span>Москва</span><div class="utility-links"><span>Пн-Сб 9:00-20:00</span><a href="/storefront/delivery/">Доставка</a><a href="/storefront/checkout/">Оплата</a><a href="/storefront/contacts/">Контакты</a></div></div><div class="container mainbar"><a class="logo" href="/storefront/"><img src="/storefront/assets/logo/g-garage-logo.png" alt="G-Garage"><span><strong>G-Garage</strong><span>автозапчасти</span></span></a><a class="btn catalog-btn" href="/storefront/catalog/">Каталог</a><form class="header-search" data-search-form><input class="input" name="q" placeholder="Артикул, бренд или название детали"><button class="btn" aria-label="Найти">${icon.search}</button></form><a class="header-car" href="/storefront/vehicle/">${icon.car}<span data-vehicle-label>Выбрать авто</span></a><a class="header-action hide-mid" href="/storefront/vin/">${icon.vin}<span>VIN</span></a><button class="header-action favorite hide-mid" data-fav-link type="button">${icon.heart}<span>${GGState.getFavorites().length}</span></button><a class="header-action hide-mobile" href="/storefront/account/">${icon.user}<span>Кабинет</span></a><a class="header-cart" href="/storefront/cart/">${icon.cart}<span data-cart-count>0</span><span data-cart-sum>0 ₽</span></a></div><nav class="container navbar">${nav.map(([id,label,href]) => `<a class="${active === id ? "active" : ""}" href="${href}">${label}</a>`).join("")}</nav></header>`;
    bindSearch(root); updateHeader();
  }
  function renderFooter() {
    const root = document.getElementById("site-footer"); if (!root) return;
    root.innerHTML = `<footer class="footer"><div class="container footer-grid"><div><img src="/storefront/assets/logo/g-garage-logo.png" alt="G-Garage"><h3>G-Garage</h3><p>Тестовый desktop storefront магазина автозапчастей. Работает на локальных mock-данных без backend.</p></div><div><h3>Каталог</h3><a href="/storefront/catalog/">Все товары</a><a href="/storefront/vehicle/">Подбор по авто</a><a href="/storefront/vin/">VIN-подбор</a></div><div><h3>Покупателю</h3><a href="/storefront/delivery/">Доставка</a><a href="/storefront/returns/">Возврат</a><a href="/storefront/contacts/">Контакты</a></div><div><h3>Кабинет</h3><a href="/storefront/account/">Обзор</a><a href="/storefront/account/orders.html">Заказы</a><a href="/storefront/account/vehicles.html">Автомобили</a></div><div><h3>Связь</h3><p>+7 900 000-00-00</p><p>parts@example.test</p><p>Москва, тестовый пункт выдачи</p></div></div><div class="container footer-bottom"><span>© 2026 G-Garage storefront prototype</span><span>Backend, платежи и внешние API не используются</span></div></footer>`;
  }
  function bindSearch(scope = document) {
    scope.querySelectorAll("[data-search-form]").forEach((form) => form.addEventListener("submit", (e) => { e.preventDefault(); const q = new FormData(form).get("q")?.toString().trim(); if (q) { GGState.addSearch(q); location.href = `/storefront/catalog/?q=${encodeURIComponent(q)}`; } }));
  }
  function productCard(p) {
    const fav = GGState.getFavorites().includes(p.id);
    return `<article class="card product-card" data-product-card="${p.id}"><a href="/storefront/product/?id=${p.id}"><img src="${p.image}" alt="${p.name}"></a><div class="product-meta"><b>${p.brand}</b><span>${p.article}</span></div><h3><a href="/storefront/product/?id=${p.id}">${p.name}</a></h3><div><span class="status ${compatClass[p.compatibility]}">${compatText[p.compatibility]}</span><p class="small muted">${p.stock ? `В наличии ${p.stock} шт. · ${p.deliveryDate}` : "Нет в наличии"}</p><div class="price-row"><strong class="price">${money(p.price)}</strong>${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}</div></div><div class="card-actions"><button class="btn secondary favorite ${fav ? "is-active" : ""}" data-favorite="${p.id}" aria-label="В избранное">${icon.heart}</button><button class="btn" data-add-cart="${p.id}">${p.stock ? "В корзину" : "Подобрать аналог"}</button></div></article>`;
  }
  function bindStoreActions(scope = document) {
    scope.addEventListener("click", (e) => {
      const favBtn = e.target.closest("[data-favorite]");
      if (favBtn) { const id = favBtn.dataset.favorite; const list = GGState.getFavorites(); GGState.setFavorites(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]); favBtn.classList.toggle("is-active"); updateHeader(); }
      const add = e.target.closest("[data-add-cart]");
      if (add) { const id = add.dataset.addCart; const cart = GGState.getCart(); const item = cart.find((x) => x.id === id); item ? item.qty++ : cart.push({ id, qty: 1 }); GGState.setCart(cart); updateHeader(); add.textContent = "Добавлено"; setTimeout(() => add.textContent = "В корзину", 900); }
    });
  }
  function summaryHtml() { const t = cartTotals(); return `<div class="summary-line"><span>Товары (${t.count})</span><b>${money(t.sum)}</b></div><div class="summary-line"><span>Скидка</span><b>${money(t.discount)}</b></div><div class="summary-line"><span>Доставка</span><b>${money(t.delivery)}</b></div><div class="summary-line total"><span>Итого</span><b>${money(t.total)}</b></div>`; }
  function init(active) { renderHeader(active); renderFooter(); bindStoreActions(document); window.addEventListener("gg:state", updateHeader); }
  return { data, money, byId, compatText, compatClass, icon, cartTotals, productCard, bindStoreActions, bindSearch, summaryHtml, init, updateHeader };
})();
