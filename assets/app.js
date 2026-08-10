(() => {
  const header = document.querySelector("[data-header]");
  const progress = document.querySelector("[data-scroll-progress]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");

  const updateScrollUI = () => {
    const top = window.scrollY || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle("is-scrolled", top > 18);
    if (progress) progress.style.width = `${height > 0 ? Math.min(100, (top / height) * 100) : 0}%`;
  };

  updateScrollUI();
  window.addEventListener("scroll", updateScrollUI, { passive: true });

  if (navToggle && nav) {
    const closeNav = () => {
      navToggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    };

    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNav));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });
  }

  const builder = document.querySelector("[data-decision-builder]");
  const output = document.querySelector("[data-decision-output]");
  if (builder && output) {
    const empty = output.querySelector(".output-empty");
    const result = output.querySelector(".output-result");
    const tensions = {
      margen: "El margen se deteriora aunque las ventas crecen.",
      entregas: "Las entregas demoradas ponen en riesgo el nivel de servicio.",
      inventario: "Los faltantes y el sobrestock conviven en el mismo sistema."
    };

    builder.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(builder);
      const audience = String(data.get("audience") || "").trim();
      const decision = String(data.get("decision") || "").trim();
      const kpi = String(data.get("kpi") || "").trim();
      const tension = String(data.get("tension") || "margen");

      if (!audience || !decision || !kpi) {
        const firstEmpty = [...builder.querySelectorAll("input, textarea")].find((field) => !field.value.trim());
        if (firstEmpty) {
          firstEmpty.focus();
          firstEmpty.setAttribute("aria-invalid", "true");
          firstEmpty.addEventListener("input", () => firstEmpty.removeAttribute("aria-invalid"), { once: true });
        }
        return;
      }

      output.querySelector("[data-output-tension]").textContent = tensions[tension];
      output.querySelector("[data-output-audience]").textContent = audience;
      output.querySelector("[data-output-decision]").textContent = decision;
      output.querySelector("[data-output-kpi]").textContent = kpi;
      empty.hidden = true;
      result.hidden = false;
      output.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
    });

    builder.addEventListener("reset", () => {
      window.setTimeout(() => {
        empty.hidden = false;
        result.hidden = true;
        builder.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
      }, 0);
    });
  }
})();
