const projectorToggleButtons = document.querySelectorAll(".projector-toggle");
const projectorModeStorageKey = "demo-projector-mode";
const projectorModeEnabled = localStorage.getItem(projectorModeStorageKey) === "true";

document.body.classList.toggle("projector-mode", projectorModeEnabled);

projectorToggleButtons.forEach((button) => {
  button.setAttribute("aria-pressed", String(projectorModeEnabled));
  button.setAttribute(
    "aria-label",
    projectorModeEnabled ? "Desactivar modo proyector" : "Activar modo proyector",
  );
  button.textContent = projectorModeEnabled ? "Modo normal" : "Modo proyector";
  button.addEventListener("click", () => {
    const shouldEnable = button.getAttribute("aria-pressed") !== "true";
    document.body.classList.toggle("projector-mode", shouldEnable);
    localStorage.setItem(projectorModeStorageKey, String(shouldEnable));
    projectorToggleButtons.forEach((toggle) => {
      toggle.setAttribute("aria-pressed", String(shouldEnable));
      toggle.setAttribute(
        "aria-label",
        shouldEnable ? "Desactivar modo proyector" : "Activar modo proyector",
      );
      toggle.textContent = shouldEnable ? "Modo normal" : "Modo proyector";
    });
  });
});
