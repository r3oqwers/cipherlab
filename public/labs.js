/* Перемикання між лабораторними. Нова лаба = нова кнопка .lab-btn + новий блок .lab */
(() => {
  const buttons = document.querySelectorAll(".lab-btn");
  const labs = document.querySelectorAll(".lab");

  function show(name) {
    if (![...labs].some(l => l.id === name)) name = "lab1";
    labs.forEach(l => { l.hidden = l.id !== name; });
    buttons.forEach(b => b.classList.toggle("active", b.dataset.lab === name));
    history.replaceState(null, "", "#" + name);
  }

  buttons.forEach(b => { b.onclick = () => show(b.dataset.lab); });
  show(location.hash.slice(1) || "lab1");
})();