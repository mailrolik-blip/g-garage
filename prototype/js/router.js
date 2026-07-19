window.GGRouter = (() => {
  const listeners = new Set();

  function normalize(hash) {
    const value = (hash || location.hash || "#/home").replace(/^#/, "");
    return value.startsWith("/") ? value : `/${value}`;
  }

  function go(route) {
    location.hash = route.startsWith("#") ? route : `#${route}`;
  }

  function current() {
    return normalize(location.hash);
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  window.addEventListener("hashchange", () => {
    listeners.forEach((fn) => fn(current()));
  });

  return { current, go, onChange };
})();
