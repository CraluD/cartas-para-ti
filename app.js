(() => {
  const content = window.SITE_CONTENT;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const page = document.querySelector("#page");
  const list = document.querySelector("#letter-list");
  const dialog = document.querySelector("#letter-dialog");
  const closeButton = document.querySelector("#close-dialog");
  const openingStage = document.querySelector("#opening-stage");
  const letterView = document.querySelector("#letter-view");
  const galleryView = document.querySelector("#gallery-view");
  const galleryStage = document.querySelector("#gallery-stage");
  const galleryImage = document.querySelector("#gallery-image");
  const galleryCaption = document.querySelector("#gallery-caption");
  const galleryCounter = document.querySelector("#gallery-counter");
  const galleryDots = document.querySelector("#gallery-dots");
  const showGalleryButton = document.querySelector("#show-gallery");
  const backButton = document.querySelector("#back-to-letter");
  const previousButton = document.querySelector("#previous-memory");
  const nextButton = document.querySelector("#next-memory");

  let activeLetter = null;
  let activeIndex = 0;
  let triggerButton = null;
  let touchStartX = null;

  document.querySelector("#site-title").textContent = content.title;
  document.querySelector("#site-subtitle").textContent = content.subtitle;
  document.querySelector("#site-instruction").textContent = content.instruction;

  const createEnvelope = (letter, index) => {
    const article = document.createElement("article");
    article.className = "envelope-card";
    article.style.setProperty("--delay", `${index * 90}ms`);
    article.innerHTML = `
      <button class="envelope-button" type="button" aria-label="Abrir carta ${letter.number}: ${letter.title}">
        <span class="card-meta">
          <span class="card-number">Carta ${letter.number}</span>
          <span class="card-open-hint">Abrir <span aria-hidden="true">↗</span></span>
        </span>
        <span class="envelope" aria-hidden="true">
          <span class="envelope-back"></span>
          <span class="envelope-letter-peek"></span>
          <span class="envelope-front-left"></span>
          <span class="envelope-front-right"></span>
          <span class="envelope-flap"></span>
          <span class="envelope-seal">${letter.number}</span>
        </span>
        <span class="card-copy">
          <strong>${letter.title}</strong>
          <span>${letter.detail}</span>
        </span>
      </button>`;

    const button = article.querySelector("button");
    button.addEventListener("click", () => openLetter(letter, button, article));
    return article;
  };

  content.letters.forEach((letter, index) => list.append(createEnvelope(letter, index)));

  const fillLetter = (letter) => {
    document.querySelector("#dialog-kicker").textContent = `Carta ${letter.number}`;
    document.querySelector("#dialog-date").textContent = letter.date;
    document.querySelector("#dialog-title").textContent = letter.title;
    document.querySelector("#dialog-greeting").textContent = letter.greeting;
    document.querySelector("#dialog-body").replaceChildren(
      ...letter.paragraphs.map((paragraph) => {
        const element = document.createElement("p");
        element.textContent = paragraph;
        return element;
      })
    );
    document.querySelector("#dialog-signature").textContent = letter.signature;
  };

  const openLetter = (letter, button, card) => {
    activeLetter = letter;
    activeIndex = 0;
    triggerButton = button;
    fillLetter(letter);
    setGalleryMode(false);
    card.classList.add("is-opening");
    dialog.dataset.letter = letter.number;
    dialog.showModal();
    page.inert = true;
    document.body.classList.add("modal-open");
    openingStage.hidden = false;
    letterView.classList.remove("is-visible");

    window.setTimeout(() => {
      openingStage.hidden = true;
      letterView.classList.add("is-visible");
      letterView.focus({ preventScroll: true });
      card.classList.remove("is-opening");
    }, prefersReducedMotion ? 0 : 780);
  };

  const closeDialog = () => dialog.close();

  dialog.addEventListener("close", () => {
    page.inert = false;
    document.body.classList.remove("modal-open");
    openingStage.hidden = true;
    activeLetter = null;
    if (triggerButton) triggerButton.focus({ preventScroll: true });
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  closeButton.addEventListener("click", closeDialog);

  const setGalleryMode = (enabled) => {
    galleryView.hidden = !enabled;
    letterView.hidden = enabled;
    if (enabled && activeLetter) {
      activeIndex = 0;
      buildDots();
      renderMemory();
      galleryStage.focus({ preventScroll: true });
    }
  };

  showGalleryButton.addEventListener("click", () => setGalleryMode(true));
  backButton.addEventListener("click", () => {
    setGalleryMode(false);
    letterView.focus({ preventScroll: true });
  });

  const buildDots = () => {
    galleryDots.replaceChildren(
      ...activeLetter.memories.map((memory, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "gallery-dot";
        dot.setAttribute("aria-label", `Ir al recuerdo ${index + 1}`);
        dot.addEventListener("click", () => {
          activeIndex = index;
          renderMemory();
        });
        return dot;
      })
    );
  };

  const renderMemory = () => {
    const memories = activeLetter.memories;
    const memory = memories[activeIndex];
    galleryStage.classList.remove("is-changing");
    void galleryStage.offsetWidth;
    galleryStage.classList.add("is-changing");
    galleryImage.src = memory.src;
    galleryImage.alt = memory.alt;
    galleryCaption.textContent = memory.caption;
    galleryCounter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(memories.length).padStart(2, "0")}`;
    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === memories.length - 1;
    [...galleryDots.children].forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
      dot.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    });

    const nextMemory = memories[activeIndex + 1];
    if (nextMemory) {
      const preloader = new Image();
      preloader.src = nextMemory.src;
    }
  };

  const changeMemory = (direction) => {
    if (!activeLetter) return;
    activeIndex = Math.max(0, Math.min(activeLetter.memories.length - 1, activeIndex + direction));
    renderMemory();
  };

  previousButton.addEventListener("click", () => changeMemory(-1));
  nextButton.addEventListener("click", () => changeMemory(1));

  galleryStage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") changeMemory(-1);
    if (event.key === "ArrowRight") changeMemory(1);
  });

  galleryStage.addEventListener("pointerdown", (event) => {
    touchStartX = event.clientX;
  });

  galleryStage.addEventListener("pointerup", (event) => {
    if (touchStartX === null) return;
    const distance = event.clientX - touchStartX;
    if (Math.abs(distance) > 45) changeMemory(distance > 0 ? -1 : 1);
    touchStartX = null;
  });

  galleryStage.addEventListener("pointercancel", () => {
    touchStartX = null;
  });
})();
