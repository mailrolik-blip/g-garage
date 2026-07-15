const tabs = document.querySelectorAll(".search-tab");
const input = document.querySelector("#part-search");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("is-active"));
    tab.classList.add("is-active");
    input.placeholder = tab.dataset.placeholder;
  });
});

document.querySelector(".search-card").addEventListener("submit", (event) => {
  event.preventDefault();
  const value = input.value.trim();
  alert(value ? `Запрос принят: ${value}` : "Введите данные для подбора запчасти");
});

document.querySelectorAll(".product-card div a").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    button.textContent = "✓";
    window.setTimeout(() => {
      button.textContent = "▱";
    }, 900);
  });
});
