window.StorefrontData = (() => {
  const img = (path) => `/storefront/assets/${path}`;
  const categories = [
    { id: "engine", name: "Двигатель", image: img("categories/engine.png"), count: 1840 },
    { id: "brakes", name: "Тормозная система", image: img("categories/brakes.png"), count: 1260 },
    { id: "suspension", name: "Подвеска", image: img("categories/suspension.png"), count: 980 },
    { id: "oils", name: "Масла и жидкости", image: img("categories/oils.png"), count: 430 },
    { id: "filters", name: "Фильтры", image: img("categories/filters.png"), count: 720 },
    { id: "electrics", name: "Электрика", image: img("categories/electrics.png"), count: 650 },
    { id: "body", name: "Кузов и свет", image: img("ui/part.svg"), count: 540 },
    { id: "service", name: "Расходники ТО", image: img("ui/part.svg"), count: 890 }
  ];
  const brands = ["BOSCH", "MANN", "BREMBO", "NGK", "SACHS", "DENSO", "TRW", "SHELL"].map((name, i) => ({ id: name.toLowerCase(), name, country: i % 2 ? "Германия" : "Япония", rating: (4.5 + (i % 4) / 10).toFixed(1) }));
  const productImages = ["products/oil-shell-helix.png", "products/brake-discs-brembo.png", "products/spark-plugs-ngk.png", "products/air-filter-mann.png", "products/shock-absorber-sachs.png"];
  const names = [
    ["SHELL", "Моторное масло Helix Ultra 5W-30 4 л", "oils"], ["BREMBO", "Диск тормозной передний вентилируемый", "brakes"], ["NGK", "Свеча зажигания иридиевая", "engine"], ["MANN", "Фильтр воздушный двигателя", "filters"], ["SACHS", "Амортизатор передний газовый", "suspension"], ["BOSCH", "Датчик кислорода универсальный", "electrics"], ["TRW", "Колодки тормозные передние", "brakes"], ["DENSO", "Катушка зажигания", "electrics"]
  ];
  const compat = ["confirmed", "unknown", "confirmed", "bad", "no-car", "confirmed"];
  const qualities = ["Оригинал", "Надежный аналог", "Бюджетный вариант"];
  const products = Array.from({ length: 24 }, (_, i) => {
    const seed = names[i % names.length];
    const price = 780 + i * 360 + (i % 3) * 170;
    return {
      id: `product-${String(i + 1).padStart(3, "0")}`,
      brand: seed[0],
      name: seed[1],
      article: `${seed[0]}-${2200 + i * 17}`,
      category: seed[2],
      image: img(productImages[i % productImages.length]),
      price,
      oldPrice: i % 4 === 0 ? price + 620 : 0,
      stock: i % 11 === 0 ? 0 : 3 + (i % 9) * 2,
      deliveryDate: i % 3 === 0 ? "сегодня после 18:00" : i % 3 === 1 ? "завтра" : "2-3 дня",
      quality: qualities[i % qualities.length],
      compatibility: compat[i % compat.length],
      analogs: [`product-${String(((i + 3) % 24) + 1).padStart(3, "0")}`, `product-${String(((i + 8) % 24) + 1).padStart(3, "0")}`],
      specs: { "Сторона": i % 2 ? "левая/правая" : "комплект", "Материал": i % 3 ? "OEM standard" : "усиленный", "Поставщик": i % 2 ? "Склад G-Garage" : "Партнерский склад", "Гарантия": "по условиям производителя" },
      description: "Позиция из тестового каталога G-Garage. Данные помогают проверить подбор, совместимость, корзину и оформление без подключения backend.",
      flags: { priceChanged: i === 1, deliveryChanged: i === 2, out: i === 11, analogSuggested: i === 6 }
    };
  });
  const vehicles = [
    { id: "veh-001", brand: "Toyota", model: "Camry", years: ["2018", "2019", "2020"], engines: ["2.0 бензин", "2.5 бензин", "3.5 бензин"] },
    { id: "veh-002", brand: "Kia", model: "Rio", years: ["2020", "2021", "2022"], engines: ["1.4 бензин", "1.6 бензин"] },
    { id: "veh-003", brand: "Volkswagen", model: "Tiguan", years: ["2017", "2018", "2019"], engines: ["1.4 TSI", "2.0 TSI", "2.0 TDI"] }
  ];
  const vinRequests = [
    { id: "VIN-24071", status: "В работе", car: "Toyota Camry 2019", need: "Передние тормозные диски", sla: "ответ до 18:00" },
    { id: "VIN-24072", status: "Нужны данные", car: "Kia Rio 2021", need: "Фильтры ТО", sla: "ожидается фото СТС" },
    { id: "VIN-24073", status: "Подбор готов", car: "Volkswagen Tiguan 2018", need: "Амортизаторы", sla: "3 варианта" }
  ];
  const orders = [
    { id: "GG-10240", date: "2026-07-12", status: "Готов к выдаче", total: 7340, items: ["product-002", "product-007"] },
    { id: "GG-10241", date: "2026-07-14", status: "У поставщика", total: 5120, items: ["product-004", "product-008"] },
    { id: "GG-10242", date: "2026-07-16", status: "Доставляется", total: 9860, items: ["product-001", "product-005"] },
    { id: "GG-10243", date: "2026-07-18", status: "Завершен", total: 2920, items: ["product-003"] }
  ];
  const promos = [
    { id: "promo-001", title: "Тормоза к сезону", text: "Скидка на комплекты дисков и колодок из тестового каталога.", discount: "-12%" },
    { id: "promo-002", title: "Комплект ТО", text: "Фильтры и масло в одном заказе с проверкой по автомобилю.", discount: "-8%" },
    { id: "promo-003", title: "VIN-подбор", text: "Менеджер подберет оригинал, надежный аналог и бюджетный вариант.", discount: "0 ₽" }
  ];
  const pickupPoints = [
    { id: "pvz-001", title: "ПВЗ Варшавское шоссе", address: "Москва, Варшавское шоссе, 12", schedule: "10:00-20:00" },
    { id: "pvz-002", title: "ПВЗ Ленинградский проспект", address: "Москва, Ленинградский проспект, 36", schedule: "09:00-21:00" },
    { id: "pvz-003", title: "Склад G-Garage", address: "Москва, Автомоторная, 7", schedule: "10:00-18:00" },
    { id: "pvz-004", title: "Партнерский пункт Север", address: "Химки, Молодежная, 4", schedule: "10:00-19:00" },
    { id: "pvz-005", title: "Партнерский пункт Восток", address: "Балашиха, Советская, 18", schedule: "10:00-20:00" }
  ];
  const user = { name: "Тестовый клиент", phone: "+7 900 000-00-00", email: "client@example.test" };
  return { categories, brands, products, vehicles, vinRequests, orders, promos, pickupPoints, user };
})();
