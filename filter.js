const buttons = [...document.querySelectorAll(".category-filter")];
const sections = [...document.querySelectorAll(".category-section")];

function selectCategory(category) {
  for (const button of buttons) {
    const selected = button.dataset.category === category;
    button.setAttribute("aria-pressed", String(selected));
  }

  for (const section of sections) {
    section.hidden = category !== "all" && section.dataset.category !== category;
  }
}

for (const button of buttons) {
  button.addEventListener("click", () => selectCategory(button.dataset.category));
}
