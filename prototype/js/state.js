window.GGState = (() => {
  const initial = {
    city: "Москва",
    selectedCarId: "car-1",
    searchHistory: ["масло 5w30", "колодки brembo", "фильтр mann"],
    favorites: new Set(["p-2"]),
    cart: [{ productId: "p-1", qty: 1 }, { productId: "p-4", qty: 2 }],
    vinDraft: {},
    checkout: { delivery: "pickup", payment: "card", step: 0 },
    filters: { brand: "Все", stock: true, compatibility: true },
    managerLogged: true,
    lastToast: ""
  };

  const state = { ...initial };

  function reset() {
    state.city = initial.city;
    state.selectedCarId = initial.selectedCarId;
    state.searchHistory = [...initial.searchHistory];
    state.favorites = new Set(["p-2"]);
    state.cart = initial.cart.map((item) => ({ ...item }));
    state.vinDraft = {};
    state.checkout = { ...initial.checkout };
    state.filters = { ...initial.filters };
    state.managerLogged = true;
  }

  function cartCount() {
    return state.cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function cartTotal() {
    return state.cart.reduce((sum, item) => {
      const product = window.GGData.products.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.qty : 0);
    }, 0);
  }

  function addToCart(productId) {
    const existing = state.cart.find((item) => item.productId === productId);
    if (existing) existing.qty += 1;
    else state.cart.push({ productId, qty: 1 });
    toast("Товар добавлен в корзину");
  }

  function updateQty(productId, delta) {
    const item = state.cart.find((entry) => entry.productId === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) state.cart = state.cart.filter((entry) => entry.productId !== productId);
  }

  function toggleFavorite(productId) {
    if (state.favorites.has(productId)) {
      state.favorites.delete(productId);
      toast("Удалено из избранного");
    } else {
      state.favorites.add(productId);
      toast("Добавлено в избранное");
    }
  }

  function toast(message) {
    state.lastToast = message;
    const root = document.querySelector("#toast-root");
    if (!root) return;
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    root.appendChild(node);
    window.setTimeout(() => node.remove(), 2200);
  }

  return { state, reset, cartCount, cartTotal, addToCart, updateQty, toggleFavorite, toast };
})();
