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

  document.querySelectorAll("[data-atlas-diagram]").forEach((diagram) => {
    const controls = [...diagram.querySelectorAll("[data-atlas-control]")];
    const steps = [...diagram.querySelectorAll(".atlas-card[data-step]")];
    if (!controls.length || !steps.length) return;

    const activate = (step) => {
      const value = String(step);
      steps.forEach((card) => card.classList.toggle("is-active", card.dataset.step === value));
      controls.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.atlasControl === value)));
    };

    controls.forEach((button, index) => {
      button.addEventListener("focus", () => activate(button.dataset.atlasControl));
      button.addEventListener("click", () => {
        activate(button.dataset.atlasControl);
        const card = steps.find((item) => item.dataset.step === button.dataset.atlasControl);
        if (card) card.focus({ preventScroll: true });
      });
      button.addEventListener("keydown", (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
        controls[(index + direction + controls.length) % controls.length].focus();
      });
    });

    steps.forEach((card) => {
      card.addEventListener("focus", () => activate(card.dataset.step));
      card.addEventListener("mouseenter", () => activate(card.dataset.step));
    });

    diagram.addEventListener("mouseleave", () => {
      if (!diagram.contains(document.activeElement)) activate("");
    });
  });

  document.querySelectorAll("[data-pipeline-activity]").forEach((activity) => {
    const panel = activity.querySelector("[data-pipeline-game]");
    const slotsContainer = activity.querySelector("[data-pipeline-slots]");
    const slots = [...activity.querySelectorAll("[data-pipeline-slot]")];
    const bank = activity.querySelector("[data-pipeline-label-bank]");
    const chips = [...activity.querySelectorAll("[data-pipeline-chip]")];
    const feedback = activity.querySelector("[data-pipeline-feedback]");
    const progress = activity.querySelector("[data-pipeline-progress]");
    const reset = activity.querySelector("[data-pipeline-reset]");
    const answer = activity.querySelector("[data-pipeline-answer]");
    const answerTitle = activity.querySelector("[data-pipeline-answer-title]");
    if (!panel || !slotsContainer || !slots.length || !bank || !chips.length || !feedback || !progress || !reset || !answer || !answerTitle) return;

    let selectedChip = null;
    let draggedKey = "";
    let placed = 0;
    const total = slots.length;

    const announce = (message, state = "neutral") => {
      feedback.textContent = message;
      feedback.dataset.state = state;
    };

    const updateProgress = () => {
      progress.textContent = `${placed} / ${total}`;
      progress.setAttribute("aria-label", `Progreso: ${placed} de ${total}`);
    };

    const clearSelection = () => {
      chips.forEach((chip) => {
        chip.classList.remove("is-selected");
        chip.setAttribute("aria-pressed", "false");
      });
      selectedChip = null;
    };

    const selectChip = (chip) => {
      if (chip.hidden) return;
      if (selectedChip === chip) {
        clearSelection();
        announce("Etiqueta deseleccionada. Elegí otra para continuar.");
        return;
      }
      clearSelection();
      selectedChip = chip;
      chip.classList.add("is-selected");
      chip.setAttribute("aria-pressed", "true");
      announce(`Etiqueta “${chip.textContent.trim()}” seleccionada. Ahora elegí un casillero.`);
    };

    const placeChip = (chip, slot) => {
      if (!chip || chip.hidden || slot.disabled) return;
      const label = chip.textContent.trim();
      const position = slot.dataset.pipelinePosition;
      if (chip.dataset.pipelineChip === slot.dataset.pipelineSlot) {
        slot.querySelector("[data-pipeline-slot-label]").textContent = label;
        slot.classList.remove("is-target", "is-error");
        slot.classList.add("is-correct");
        slot.disabled = true;
        slot.removeAttribute("aria-invalid");
        slot.setAttribute("aria-label", `Etapa ${position}: ${label}, ubicación correcta`);
        chip.hidden = true;
        placed += 1;
        clearSelection();
        updateProgress();

        if (placed === total) {
          activity.classList.add("is-complete");
          answer.hidden = false;
          announce("¡Recorrido completo! Las siete etapas están en el orden correcto. Debajo aparece la explicación de cada una.", "success");
          answer.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
          answerTitle.focus({ preventScroll: true });
        } else {
          announce(`Correcto: “${label}” corresponde a la etapa ${position}. Completaste ${placed} de ${total}.`, "success");
          const nextChip = chips.find((item) => !item.hidden);
          if (nextChip) nextChip.focus({ preventScroll: true });
        }
        return;
      }

      slot.classList.remove("is-target");
      slot.classList.add("is-error");
      slot.setAttribute("aria-invalid", "true");
      clearSelection();
      bank.appendChild(chip);
      chip.focus({ preventScroll: true });
      announce(`Esa ubicación no corresponde a “${label}”. La etiqueta volvió al banco para que puedas intentarlo otra vez.`, "error");
      window.setTimeout(() => {
        slot.classList.remove("is-error");
        slot.removeAttribute("aria-invalid");
      }, 650);
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => selectChip(chip));
      chip.addEventListener("dragstart", (event) => {
        draggedKey = chip.dataset.pipelineChip || "";
        chip.classList.add("is-dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", draggedKey);
        }
      });
      chip.addEventListener("dragend", () => {
        draggedKey = "";
        chip.classList.remove("is-dragging");
        slots.forEach((slot) => slot.classList.remove("is-target"));
      });
    });

    slots.forEach((slot) => {
      slot.addEventListener("click", () => {
        if (selectedChip) placeChip(selectedChip, slot);
        else if (!slot.disabled) announce("Seleccioná una etiqueta del banco antes de elegir el casillero.");
      });
      slot.addEventListener("dragover", (event) => {
        if (slot.disabled) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        slot.classList.add("is-target");
      });
      slot.addEventListener("dragleave", () => slot.classList.remove("is-target"));
      slot.addEventListener("drop", (event) => {
        if (slot.disabled) return;
        event.preventDefault();
        const key = (event.dataTransfer && event.dataTransfer.getData("text/plain")) || draggedKey;
        const chip = chips.find((item) => item.dataset.pipelineChip === key);
        placeChip(chip, slot);
      });
    });

    const shuffleChips = () => {
      const shuffled = [...chips];
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
      }
      const accidentallyOrdered = shuffled.every((chip, index) => chip.dataset.pipelineChip === slots[index].dataset.pipelineSlot);
      if (accidentallyOrdered) shuffled.push(shuffled.shift());
      shuffled.forEach((chip) => bank.appendChild(chip));
    };

    const resetGame = () => {
      placed = 0;
      draggedKey = "";
      activity.classList.remove("is-complete");
      clearSelection();
      slots.forEach((slot) => {
        slot.disabled = false;
        slot.classList.remove("is-correct", "is-error", "is-target");
        slot.removeAttribute("aria-invalid");
        slot.querySelector("[data-pipeline-slot-label]").textContent = "";
        slot.setAttribute("aria-label", `Etapa ${slot.dataset.pipelinePosition}: casillero vacío`);
      });
      chips.forEach((chip) => {
        chip.hidden = false;
        chip.classList.remove("is-dragging");
      });
      shuffleChips();
      updateProgress();
      answer.hidden = true;
      announce("Comenzá por la etapa que reconoce los sistemas y archivos de origen.");
    };

    slotsContainer.hidden = false;
    panel.hidden = false;
    reset.addEventListener("click", () => {
      resetGame();
      const firstChip = bank.querySelector("[data-pipeline-chip]");
      if (firstChip) firstChip.focus({ preventScroll: true });
    });
    resetGame();
  });
})();
