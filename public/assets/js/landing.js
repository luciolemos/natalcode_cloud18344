(function () {
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveDataEnabled = !!(navigator.connection && navigator.connection.saveData);
  const lowMemoryDevice = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;
  const weakCpuDevice = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
  const shouldReduceAnimations = prefersReducedMotion || saveDataEnabled;
  const shouldLightenAnimations = shouldReduceAnimations || lowMemoryDevice || weakCpuDevice;
  const markVisualFxReady = () => {
    document.documentElement.classList.add("fx-ready");
  };

  const scheduleAfterFirstPaint = (callback) => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(callback, { timeout: 1400 });
      return;
    }
    window.setTimeout(callback, 360);
  };

  if (document.readyState === "complete") {
    scheduleAfterFirstPaint(markVisualFxReady);
  } else {
    window.addEventListener("load", () => scheduleAfterFirstPaint(markVisualFxReady), { once: true });
  }

  const applyProgressiveSectionDelays = () => {
    if (shouldLightenAnimations) return;
    const sections = Array.from(document.querySelectorAll("header.hero, section"));
    sections.forEach((section, sectionIndex) => {
      const sectionOffset = Math.min(sectionIndex * 45, 270);
      const animatedEls = Array.from(section.querySelectorAll("[data-aos]"));
      animatedEls.forEach((el) => {
        const currentDelay = Number.parseInt(el.getAttribute("data-aos-delay") || "0", 10);
        const baseDelay = Number.isFinite(currentDelay) ? currentDelay : 0;
        el.setAttribute("data-aos-delay", String(baseDelay + sectionOffset));
      });
    });
  };

  scheduleAfterFirstPaint(applyProgressiveSectionDelays);

  const applySectionMotionProfiles = () => {
    const profiles = [
      { selector: "#features [data-aos]", duration: 560, easing: "ease-out-sine" },
      { selector: "#projects [data-aos], #depoimentos [data-aos]", duration: 620, easing: "ease-out-back" },
      { selector: "#how [data-aos], #docs [data-aos], #labs-links [data-aos]", duration: 520, easing: "ease-out-sine" }
    ];
    profiles.forEach(({ selector, duration, easing }) => {
      const nodes = document.querySelectorAll(selector);
      nodes.forEach((node) => {
        node.setAttribute("data-aos-duration", String(duration));
        node.setAttribute("data-aos-easing", easing);
      });
    });
  };

  scheduleAfterFirstPaint(applySectionMotionProfiles);

  // AOS
  if (window.AOS) {
    const initAOS = () => {
      AOS.init({
        duration: shouldLightenAnimations ? 420 : 650,
        once: true,
        offset: shouldLightenAnimations ? 60 : 90,
        easing: "ease-out",
        disable: shouldReduceAnimations
      });
    };

    scheduleAfterFirstPaint(initAOS);
  }

  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Floating buttons (back-to-top + WhatsApp)
  const btn = document.getElementById("backToTop");
  const whatsappFloat = document.querySelector(".whatsapp-float");
  const scrollProgress = document.getElementById("scrollProgress");
  const toggleFloatingButtons = () => {
    const show = window.scrollY > 120;
    if (btn) {
      btn.style.opacity = show ? "1" : "0";
      btn.style.visibility = show ? "visible" : "hidden";
    }
    if (whatsappFloat) {
      whatsappFloat.style.opacity = show ? "1" : "0";
      whatsappFloat.style.visibility = show ? "visible" : "hidden";
    }
  };
  window.addEventListener("scroll", toggleFloatingButtons, { passive: true });
  toggleFloatingButtons();

  const updateScrollProgress = () => {
    if (!scrollProgress) return;
    const doc = document.documentElement;
    const body = document.body;
    const scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
    const scrollHeight = Math.max(
      body.scrollHeight, doc.scrollHeight,
      body.offsetHeight, doc.offsetHeight,
      body.clientHeight, doc.clientHeight
    );
    const clientHeight = window.innerHeight || doc.clientHeight || body.clientHeight || 1;
    const total = scrollHeight - clientHeight;
    const pct = total > 0 ? (scrollTop / total) * 100 : 0;
    scrollProgress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);
  window.addEventListener("load", updateScrollProgress);
  updateScrollProgress();

  if (btn) {
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Palette switcher (front-only)
  const paletteLink = document.querySelector("link[data-palette-link]");
  const paletteButtons = Array.from(document.querySelectorAll("[data-palette-btn]"));
  const fallbackAllowedPalettes = ["blue", "red", "emerald", "amber", "violet"];
  const parseAllowedPalettes = () => {
    if (paletteLink) {
      const fromData = paletteLink.getAttribute("data-palette-allowed");
      if (fromData) {
        try {
          const parsed = JSON.parse(fromData);
          if (Array.isArray(parsed)) {
            const cleaned = parsed
              .map((value) => String(value || "").toLowerCase().trim())
              .filter(Boolean);
            if (cleaned.length) return Array.from(new Set(cleaned));
          }
        } catch (e) {}
      }
    }
    const fromApp = window.APP && Array.isArray(window.APP.allowedPalettes) ? window.APP.allowedPalettes : [];
    if (fromApp.length) {
      return Array.from(new Set(fromApp.map((value) => String(value || "").toLowerCase().trim()).filter(Boolean)));
    }
    return fallbackAllowedPalettes;
  };
  const allowedPalettes = parseAllowedPalettes();
  const isValidPalette = (value) => allowedPalettes.includes(value);
  const getPaletteFromUrl = () => {
    const url = new URL(window.location.href);
    const p = url.searchParams.get("palette");
    return isValidPalette(p || "") ? p : "";
  };
  const resolveCookiePath = () => {
    const baseUrl = window.APP && typeof window.APP.baseUrl === "string" ? window.APP.baseUrl.trim() : "";
    if (!baseUrl || baseUrl === "/") return "/";
    return `/${baseUrl.replace(/^\/+|\/+$/g, "")}/`;
  };
  const persistPaletteCookie = (palette) => {
    if (!isValidPalette(palette)) return;
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `palette=${encodeURIComponent(palette)}; expires=${expires}; path=${resolveCookiePath()}; SameSite=Lax${secure}`;
  };
  const updatePaletteQuery = (palette) => {
    const url = new URL(window.location.href);
    url.searchParams.set("palette", palette);
    window.history.replaceState({}, "", url.toString());
  };
  const applyPalette = (palette) => {
    if (!paletteLink || !isValidPalette(palette)) return;
    const base = paletteLink.getAttribute("data-palette-base");
    if (!base) return;
    paletteLink.setAttribute("href", `${base}/${palette}.css`);
    document.documentElement.setAttribute("data-palette", palette);
    paletteButtons.forEach((btn) => {
      const isActive = btn.getAttribute("data-palette-btn") === palette;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  if (paletteLink) {
    const defaultPalette = paletteLink.getAttribute("data-palette-default") || "blue";
    let activePalette = isValidPalette(defaultPalette) ? defaultPalette : "blue";
    const fromUrl = getPaletteFromUrl();
    if (fromUrl) {
      activePalette = fromUrl;
    } else {
      try {
        const saved = localStorage.getItem("palette");
        if (isValidPalette(saved || "")) activePalette = saved;
      } catch (e) {}
    }
    applyPalette(activePalette);
    persistPaletteCookie(activePalette);
  }

  if (paletteButtons.length) {
    paletteButtons.forEach((buttonEl) => {
      buttonEl.addEventListener("click", () => {
        const next = buttonEl.getAttribute("data-palette-btn") || "";
        if (!isValidPalette(next)) return;
        applyPalette(next);
        updatePaletteQuery(next);
        persistPaletteCookie(next);
        try { localStorage.setItem("palette", next); } catch (e) {}
      });
    });
  }

  const paletteFab = document.querySelector("[data-palette-fab]");
  const paletteFabToggle = document.getElementById("paletteFabToggle");
  const setPaletteFabOpen = (isOpen) => {
    if (!paletteFab || !paletteFabToggle) return;
    paletteFab.classList.toggle("is-open", isOpen);
    paletteFabToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  };
  if (paletteFab && paletteFabToggle) {
    paletteFabToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setPaletteFabOpen(!paletteFab.classList.contains("is-open"));
    });
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!paletteFab.contains(target)) setPaletteFabOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setPaletteFabOpen(false);
    });
    paletteButtons.forEach((buttonEl) => {
      buttonEl.addEventListener("click", () => setPaletteFabOpen(false));
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth < 992) setPaletteFabOpen(false);
    });
  }

  // Theme toggle
  const themeBtns = [document.getElementById("themeToggle"), document.getElementById("themeToggleMobile")]
    .filter(Boolean);
  const root = document.documentElement;
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const isValidTheme = (value) => value === "dark" || value === "light";
  const getTheme = () => {
    const current = root.getAttribute("data-theme");
    return isValidTheme(current) ? current : "dark";
  };

  const updateIcon = (t) => {
    themeBtns.forEach((btnEl) => {
      const icon = btnEl.querySelector("i");
      if (icon) icon.className = t === "dark" ? "bi bi-moon-stars" : "bi bi-sun";
    });
  };

  const updateThemeColor = (t) => {
    if (themeColorMeta) themeColorMeta.setAttribute("content", t === "dark" ? "#0b0f19" : "#f8fafc");
  };

  const updateA11y = (t) => {
    const nextLabel = t === "dark" ? "Ativar tema claro" : "Ativar tema escuro";
    themeBtns.forEach((btnEl) => {
      btnEl.setAttribute("aria-pressed", t === "light" ? "true" : "false");
      btnEl.setAttribute("title", nextLabel);
      btnEl.setAttribute("aria-label", nextLabel);
    });
  };

  const applyTheme = (value) => {
    const theme = isValidTheme(value) ? value : "dark";
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
    updateIcon(theme);
    updateA11y(theme);
    updateThemeColor(theme);
  };

  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  const fallbackTheme = prefersLight ? "light" : "dark";
  let initialTheme = getTheme();
  try {
    const saved = localStorage.getItem("theme");
    if (isValidTheme(saved)) {
      initialTheme = saved;
    } else if (!isValidTheme(root.getAttribute("data-theme"))) {
      initialTheme = fallbackTheme;
    }
  } catch (e) {
    initialTheme = isValidTheme(root.getAttribute("data-theme")) ? getTheme() : fallbackTheme;
  }
  applyTheme(initialTheme);

  themeBtns.forEach((btnEl) => {
    btnEl.addEventListener("click", () => {
      const next = getTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  });

  // Copy mode toggle (soft <-> growth)
  const copyModeToggle = document.getElementById("copyModeToggle");
  if (copyModeToggle) {
    const isValidCopyMode = (value) => value === "soft" || value === "growth";
    const getCurrentCopyMode = () => {
      const fromData = copyModeToggle.getAttribute("data-copy-mode");
      return isValidCopyMode(fromData) ? fromData : "soft";
    };

    const updateCopyToggleUi = (mode) => {
      const current = isValidCopyMode(mode) ? mode : "soft";
      const next = current === "growth" ? "soft" : "growth";
      const currentLabel = current === "growth" ? "Growth" : "Soft";
      const nextLabel = next === "growth" ? "Growth" : "Soft";
      copyModeToggle.textContent = `Copy: ${currentLabel}`;
      copyModeToggle.setAttribute("title", `Alternar para ${nextLabel}`);
      copyModeToggle.setAttribute("aria-label", `Alternar copy para modo ${nextLabel}`);
    };

    const buildNextCopyUrl = (nextMode) => {
      const url = new URL(window.location.href);
      if (nextMode === "soft") {
        url.searchParams.delete("copy");
      } else {
        url.searchParams.set("copy", "growth");
      }
      return url.toString();
    };

    updateCopyToggleUi(getCurrentCopyMode());

    copyModeToggle.addEventListener("click", () => {
      const current = getCurrentCopyMode();
      const next = current === "growth" ? "soft" : "growth";
      window.location.assign(buildNextCopyUrl(next));
    });
  }

  // In-page smooth scroll with focus management
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;
    if (anchor.hasAttribute("data-bs-toggle")) return;
    const hash = anchor.getAttribute("href");
    if (!hash || hash === "#") return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({
      behavior: shouldReduceAnimations ? "auto" : "smooth",
      block: "start"
    });
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", hash);
    }
    window.setTimeout(() => {
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
    }, shouldReduceAnimations ? 0 : 280);
  });

  // CTA + form tracking (GA4 dataLayer/gtag + Meta Pixel fbq)
  const query = new URLSearchParams(window.location.search);
  const copyMode = query.get("copy") === "growth" ? "growth" : "soft";
  const activePalette =
    document.documentElement.getAttribute("data-palette") ||
    query.get("palette") ||
    document.querySelector("link[data-palette-link]")?.getAttribute("data-palette-default") ||
    "blue";

  const emitAnalyticsEvent = (eventName, payload = {}) => {
    const basePayload = {
      copy_mode: copyMode,
      palette: activePalette,
      page_path: window.location.pathname,
      page_url: window.location.href,
      ...payload
    };
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        ...basePayload
      });
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, basePayload);
    }
    if (eventName === "cta_click" && typeof window.fbq === "function") {
      window.fbq("trackCustom", "CTA_Click", basePayload);
    }
  };

  const formResultAlert = document.querySelector("[data-form-result-event][data-form-result-id]");
  if (formResultAlert) {
    const resultEvent = (formResultAlert.getAttribute("data-form-result-event") || "").trim();
    const resultId = (formResultAlert.getAttribute("data-form-result-id") || "").trim();
    const requestId = (formResultAlert.getAttribute("data-form-request-id") || "").trim();
    const resultType = (formResultAlert.getAttribute("data-form-result-type") || "").trim();
    if (resultEvent !== "" && resultId !== "") {
      emitAnalyticsEvent(resultEvent, {
        event_id: resultId,
        request_id: requestId,
        result_type: resultType
      });
    }
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.cta-track");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    emitAnalyticsEvent("cta_click", {
      cta_id: (link.getAttribute("data-cta-id") || "unknown").trim() || "unknown",
      cta_text: (link.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
      cta_href: href,
      cta_type: href.startsWith("#") ? "anchor" : "link"
    });
  });

  // Quick-proof randomizer: picks one testimonial on each page load
  const quickProofRoot = document.querySelector(".js-quick-proof");
  if (quickProofRoot) {
    const quickProofAvatar = document.getElementById("quickProofAvatar");
    const quickProofText = document.getElementById("quickProofText");
    const quickProofMeta = document.getElementById("quickProofMeta");
    const testimonialCards = Array.from(document.querySelectorAll("#depoimentos .quote-card"));

    const testimonialPool = testimonialCards
      .map((card) => {
        const img = card.querySelector("img.avatar");
        const text = card.querySelector("p.text-secondary-emphasis");
        const name = card.querySelector(".fw-semibold");
        const meta = card.querySelector(".small.text-secondary-emphasis");
        return {
          avatarSrc: img ? img.getAttribute("src") || "" : "",
          avatarSrcSet: img ? img.getAttribute("srcset") || "" : "",
          avatarAlt: img ? img.getAttribute("alt") || "Cliente da NatalCode" : "Cliente da NatalCode",
          quote: text ? (text.textContent || "").trim() : "",
          who: name ? (name.textContent || "").trim() : "",
          detail: meta ? (meta.textContent || "").trim() : ""
        };
      })
      .filter((item) => item.quote !== "" && item.who !== "");

    let lastIndex = -1;
    const storageKey = "quick_proof_last_index";
    const readStoredIndex = () => {
      try {
        const raw = window.sessionStorage.getItem(storageKey);
        const parsed = Number.parseInt(raw || "-1", 10);
        return Number.isInteger(parsed) ? parsed : -1;
      } catch (e) {
        return -1;
      }
    };
    const storeIndex = (index) => {
      try {
        window.sessionStorage.setItem(storageKey, String(index));
      } catch (e) {}
    };

    const pickNextIndex = () => {
      if (testimonialPool.length <= 1) return 0;
      const previous = readStoredIndex();
      let next = Math.floor(Math.random() * testimonialPool.length);
      let guard = 0;
      while ((next === previous || next === lastIndex) && guard < 12) {
        next = Math.floor(Math.random() * testimonialPool.length);
        guard += 1;
      }
      return next;
    };

    const paintQuickProof = (entry) => {
      if (!entry || !quickProofText || !quickProofMeta) return;
      if (quickProofAvatar && entry.avatarSrc) {
        quickProofAvatar.setAttribute("src", entry.avatarSrc);
        if (entry.avatarSrcSet) {
          quickProofAvatar.setAttribute("srcset", entry.avatarSrcSet);
        } else {
          quickProofAvatar.removeAttribute("srcset");
        }
        quickProofAvatar.setAttribute("sizes", "56px");
        quickProofAvatar.setAttribute("alt", entry.avatarAlt || "Cliente da NatalCode");
      }
      quickProofText.textContent = `"${entry.quote.replace(/^\"|\"$/g, "")}"`;
      quickProofMeta.textContent = entry.detail ? `${entry.who} • ${entry.detail}` : entry.who;
    };

    const applyRandomQuickProof = () => {
      const nextIndex = pickNextIndex();
      const nextEntry = testimonialPool[nextIndex];
      if (!nextEntry) return;
      lastIndex = nextIndex;
      storeIndex(nextIndex);
      paintQuickProof(nextEntry);
    };

    if (testimonialPool.length) {
      applyRandomQuickProof();
    }
  }

  // Lead form wizard (2 steps)
  const leadForm = document.querySelector(".js-lead-form");
  if (leadForm) {
    const formSteps = Array.from(leadForm.querySelectorAll("[data-form-step]"));
    const totalSteps = formSteps.length;
    const progressBar = document.getElementById("leadFormProgressBar");
    const stepLabels = Array.from(leadForm.querySelectorAll("[data-form-step-label]"));
    const prevButton = document.getElementById("leadFormPrev");
    const nextButton = document.getElementById("leadFormNext");
    const submitButton = document.getElementById("leadFormSubmit");
    const formStatusLiveRegion = document.getElementById("leadFormStatus");
    const phoneInput = leadForm.querySelector("#cta-telefone");
    let currentStep = 1;

    const setFormStatus = (text) => {
      if (!formStatusLiveRegion) return;
      formStatusLiveRegion.textContent = text;
    };

    const normalizeDigits = (value) => value.replace(/\D/g, "").slice(0, 11);
    const formatBrazilianPhone = (value) => {
      const digits = normalizeDigits(value);
      if (!digits) return "";
      if (digits.length <= 2) return `(${digits}`;
      if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    if (phoneInput) {
      phoneInput.addEventListener("input", () => {
        phoneInput.value = formatBrazilianPhone(phoneInput.value);
      });
    }

    const getFieldsForStep = (step) => {
      const wrappers = Array.from(leadForm.querySelectorAll(`[data-step-field="${step}"]`));
      return wrappers.flatMap((wrapper) =>
        Array.from(wrapper.querySelectorAll("input, textarea, select")).filter((field) => !field.disabled)
      );
    };

    const validateStep = (step) => {
      const fields = getFieldsForStep(step);
      let firstInvalid = null;
      const isValid = fields.every((field) => {
        const valid = field.checkValidity();
        if (!valid && !firstInvalid) firstInvalid = field;
        return valid;
      });
      if (!isValid && firstInvalid) {
        emitAnalyticsEvent("lead_form_validation_error", {
          step: step,
          field_id: firstInvalid.id || firstInvalid.name || "unknown"
        });
        setFormStatus("Há campos obrigatórios pendentes nesta etapa.");
        firstInvalid.reportValidity();
        firstInvalid.focus();
      }
      return isValid;
    };

    const setStep = (step, shouldFocus = false) => {
      currentStep = Math.max(1, Math.min(step, totalSteps));
      formSteps.forEach((panel) => {
        const panelStep = Number(panel.getAttribute("data-form-step"));
        panel.classList.toggle("d-none", panelStep !== currentStep);
      });
      stepLabels.forEach((label) => {
        const labelStep = Number(label.getAttribute("data-form-step-label"));
        label.classList.toggle("active", labelStep === currentStep);
      });
      if (progressBar) {
        const width = `${(currentStep / totalSteps) * 100}%`;
        progressBar.style.width = width;
      }
      if (prevButton) prevButton.classList.toggle("d-none", currentStep === 1);
      if (nextButton) nextButton.classList.toggle("d-none", currentStep === totalSteps);
      if (submitButton) submitButton.classList.toggle("d-none", currentStep !== totalSteps);
      setFormStatus(`Etapa ${currentStep} de ${totalSteps}.`);

      if (shouldFocus) {
        const firstField = getFieldsForStep(currentStep)[0];
        if (firstField) firstField.focus();
      }
    };

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        if (!validateStep(currentStep)) return;
        emitAnalyticsEvent("lead_form_step_advance", {
          from_step: currentStep,
          to_step: currentStep + 1
        });
        setStep(currentStep + 1, true);
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        setStep(currentStep - 1, true);
      });
    }

    leadForm.addEventListener("submit", (event) => {
      if (currentStep !== totalSteps) {
        event.preventDefault();
        if (validateStep(currentStep)) setStep(totalSteps, true);
        return;
      }
      if (!validateStep(currentStep)) {
        event.preventDefault();
        return;
      }
      emitAnalyticsEvent("lead_form_submit_attempt", {
        current_step: currentStep
      });
    });

    const hasStep2Errors = leadForm.querySelector('[data-step-field="2"] .is-invalid');
    setStep(hasStep2Errors ? 2 : 1, false);
  }

  // Collapse mobile menu after clicking a nav link
  const nav = document.getElementById("topNav");
  const toggler = document.querySelector('.navbar-toggler[data-bs-target="#topNav"]');
  const isNavOpen = () => nav && nav.classList.contains("show");
  const closeNav = () => {
    if (!nav) return;
    nav.classList.remove("show", "collapsing");
    nav.style.height = "";
    if (toggler) toggler.classList.add("collapsed");
    if (toggler) toggler.setAttribute("aria-expanded", "false");
  };

  if (nav) {
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a.nav-link, a.btn, button.btn");
      if (!link) return;
      if (!nav.contains(link)) return;
      setTimeout(closeNav, 0);
    });
  }

  document.addEventListener("click", (event) => {
    if (!isNavOpen()) return;
    const isToggler = toggler && (event.target === toggler || toggler.contains(event.target));
    if (nav.contains(event.target) || isToggler) return;
    setTimeout(closeNav, 0);
  });

  window.addEventListener("scroll", () => {
    if (!isNavOpen()) return;
    closeNav();
  }, { passive: true });

  window.addEventListener("hashchange", () => {
    setTimeout(closeNav, 0);
  });

  // Active nav link on scroll (single page)
  const navLinks = Array.from(document.querySelectorAll('.navbar .nav-link[href^="#"]'));
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href").slice(1);
      const el = document.getElementById(id);
      return el ? { link, el } : null;
    })
    .filter(Boolean);

  const setActiveLink = () => {
    if (!sections.length) return;
    const offset = 140;
    const scrollPos = window.scrollY + offset;
    let current = sections[0].link;
    for (const s of sections) {
      if (s.el.offsetTop <= scrollPos) current = s.link;
    }
    navLinks.forEach((l) => l.classList.remove("active"));
    current.classList.add("active");
  };

  window.addEventListener("scroll", setActiveLink, { passive: true });
  window.addEventListener("load", setActiveLink);

  // Tablet carousels (projects + testimonials): arrows + pagination dots
  const tabletRange = window.matchMedia("(min-width: 768px) and (max-width: 1366px)");
  const carouselTargets = [
    { sectionId: "projects", gridSelector: ".projects-grid", label: "projetos" },
    { sectionId: "depoimentos", gridSelector: ".testimonials-grid", label: "depoimentos" }
  ];

  const createTabletCarousel = ({ sectionId, gridSelector, label }) => {
    const section = document.getElementById(sectionId);
    if (!section) return null;
    const grid = section.querySelector(gridSelector);
    if (!grid) return null;
    const slides = Array.from(grid.children);
    if (!slides.length) return null;

    const controls = document.createElement("div");
    controls.className = "tablet-carousel-controls";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", `Navegacao de ${label}`);

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "tablet-carousel-arrow";
    prevBtn.setAttribute("aria-label", "Slide anterior");
    prevBtn.innerHTML = '<i class="bi bi-chevron-left" aria-hidden="true"></i>';

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "tablet-carousel-arrow";
    nextBtn.setAttribute("aria-label", "Proximo slide");
    nextBtn.innerHTML = '<i class="bi bi-chevron-right" aria-hidden="true"></i>';

    const dots = document.createElement("div");
    dots.className = "tablet-carousel-dots";
    dots.setAttribute("aria-label", `Paginacao de ${label}`);

    const dotButtons = slides.map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "tablet-carousel-dot";
      dot.setAttribute("aria-label", `Ir para slide ${index + 1}`);
      dot.addEventListener("click", () => scrollToIndex(index));
      dots.appendChild(dot);
      return dot;
    });

    controls.appendChild(prevBtn);
    controls.appendChild(dots);
    controls.appendChild(nextBtn);
    grid.insertAdjacentElement("afterend", controls);

    let activeIndex = 0;
    let scrollTicking = false;

    const getNearestIndex = () => {
      const viewportCenter = grid.scrollLeft + (grid.clientWidth / 2);
      let nearest = 0;
      let nearestDiff = Number.POSITIVE_INFINITY;
      slides.forEach((slide, idx) => {
        const slideCenter = slide.offsetLeft + (slide.clientWidth / 2);
        const diff = Math.abs(slideCenter - viewportCenter);
        if (diff < nearestDiff) {
          nearestDiff = diff;
          nearest = idx;
        }
      });
      return nearest;
    };

    const syncUi = () => {
      activeIndex = getNearestIndex();
      prevBtn.disabled = activeIndex <= 0;
      nextBtn.disabled = activeIndex >= slides.length - 1;
      dotButtons.forEach((dot, idx) => {
        dot.classList.toggle("active", idx === activeIndex);
        if (idx === activeIndex) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    };

    const scrollToIndex = (index) => {
      const clamped = Math.max(0, Math.min(index, slides.length - 1));
      const target = slides[clamped];
      if (!target) return;
      grid.scrollTo({
        left: target.offsetLeft,
        behavior: "smooth"
      });
    };

    prevBtn.addEventListener("click", () => scrollToIndex(activeIndex - 1));
    nextBtn.addEventListener("click", () => scrollToIndex(activeIndex + 1));

    grid.addEventListener("scroll", () => {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(() => {
        syncUi();
        scrollTicking = false;
      });
    }, { passive: true });

    const onViewportChange = () => {
      controls.hidden = !tabletRange.matches;
      if (tabletRange.matches) syncUi();
    };
    onViewportChange();

    return { syncUi, onViewportChange };
  };

  const carouselInstances = carouselTargets
    .map(createTabletCarousel)
    .filter(Boolean);

  const refreshCarousels = () => {
    carouselInstances.forEach((instance) => {
      instance.onViewportChange();
      instance.syncUi();
    });
  };

  if (tabletRange.addEventListener) {
    tabletRange.addEventListener("change", refreshCarousels);
  } else if (tabletRange.addListener) {
    tabletRange.addListener(refreshCarousels);
  }
  window.addEventListener("resize", refreshCarousels);
  window.addEventListener("load", refreshCarousels);
})();
