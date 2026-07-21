window.GGState = (() => {
  const key = (name) => `gg.storefront.${name}`;
  const defaults = {
    cart: [{ id: "product-002", qty: 1 }, { id: "product-004", qty: 2 }, { id: "product-012", qty: 1 }],
    favorites: ["product-002"],
    vehicle: { brand: "Toyota", model: "Camry", year: "2019", engine: "2.5 бензин" },
    searchHistory: ["BREMBO-2217", "масло 5W-30", "фильтр Camry"],
    checkoutDraft: {},
    vinDraft: null,
    promo: null
  };
  function read(name) { try { return JSON.parse(localStorage.getItem(key(name))) ?? defaults[name]; } catch (_) { return defaults[name]; } }
  function write(name, value) { localStorage.setItem(key(name), JSON.stringify(value)); window.dispatchEvent(new CustomEvent("gg:state", { detail: { name, value } })); return value; }
  function reset() { Object.keys(defaults).forEach((name) => localStorage.removeItem(key(name))); }
  if (new URLSearchParams(location.search).get("reset") === "1") reset();
  const api = {
    getCart: () => read("cart"), setCart: (v) => write("cart", v),
    getFavorites: () => read("favorites"), setFavorites: (v) => write("favorites", v),
    getVehicle: () => read("vehicle"), setVehicle: (v) => write("vehicle", v),
    getSearchHistory: () => read("searchHistory"), addSearch: (q) => { const value = [q, ...read("searchHistory").filter((x) => x !== q)].slice(0, 8); return write("searchHistory", value); },
    getCheckoutDraft: () => read("checkoutDraft"), setCheckoutDraft: (v) => write("checkoutDraft", v),
    getVinDraft: () => read("vinDraft"), setVinDraft: (v) => write("vinDraft", v),
    getPromo: () => read("promo"), setPromo: (v) => write("promo", v), reset
  };
  return api;
})();
