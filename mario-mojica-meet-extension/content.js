// Mario Mojica - B2B Meet Translator v1.7.0 (Dual Engine Stream)
(function() {
  console.log("%c[Mario Mojica Copilot v1.7.0]%c Escáner Dual Conectado", "color:#06b6d4;font-weight:bold;font-size:14px;", "color:#333;");

  let currentSala = "henn";
  let fontSize = 14;
  let isMinimized = false;
  let lastCapturedSentence = "";
  let debounceTimer = null;

  // 1. Inyectar Overlay UI
  const overlay = document.createElement("div");
  overlay.id = "mm-translator-overlay";
  overlay.innerHTML = `
    <div class="mm-header" id="mm-header-drag">
      <div class="mm-title-area">
        <span class="mm-badge-logo">MM</span>
        <span class="mm-title">Traductor B2B</span>
        <span class="mm-live-tag">live</span>
      </div>
      <div class="mm-controls">
        <button class="mm-btn" id="mm-font-minus" title="Letra más pequeña">A-</button>
        <button class="mm-btn" id="mm-font-plus" title="Letra más grande">A+</button>
        <button class="mm-btn" id="mm-btn-clear" title="Limpiar">Limpiar</button>
        <button class="mm-btn" id="mm-btn-minimize" title="Minimizar">_</button>
      </div>
    </div>
    <div class="mm-feed-container" id="mm-feed">
      <div class="mm-empty-state" id="mm-empty">
        <strong>Esperando subtítulos...</strong>
        Activa los subtítulos (<b>CC</b>) en Google Meet. Las frases y su traducción aparecerán aquí de inmediato.
      </div>
    </div>
    <div class="mm-footer">
      <span>Mesa: <a href="https://mariomojica.com/traductor-vivo/${currentSala}" target="_blank" class="mm-sala-link">${currentSala}</a></span>
      <span>🟢 Sincronizado</span>
    </div>
  `;

  document.body.appendChild(overlay);

  const feedContainer = document.getElementById("mm-feed");
  const emptyState = document.getElementById("mm-empty");

  // Controles UI
  document.getElementById("mm-font-plus").addEventListener("click", () => {
    fontSize = Math.min(24, fontSize + 1);
    document.querySelectorAll(".mm-text-trans").forEach(el => el.style.fontSize = fontSize + "px");
  });

  document.getElementById("mm-font-minus").addEventListener("click", () => {
    fontSize = Math.max(11, fontSize - 1);
    document.querySelectorAll(".mm-text-trans").forEach(el => el.style.fontSize = fontSize + "px");
  });

  document.getElementById("mm-btn-clear").addEventListener("click", () => {
    feedContainer.innerHTML = "";
    if (emptyState) feedContainer.appendChild(emptyState);
  });

  document.getElementById("mm-btn-minimize").addEventListener("click", () => {
    isMinimized = !isMinimized;
    overlay.classList.toggle("minimized", isMinimized);
    document.getElementById("mm-btn-minimize").textContent = isMinimized ? "▢" : "_";
  });

  // Arrastrar
  const headerDrag = document.getElementById("mm-header-drag");
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  headerDrag.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = overlay.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    overlay.style.top = initialTop + "px";
    overlay.style.left = initialLeft + "px";
    overlay.style.right = "auto";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    overlay.style.left = (initialLeft + (e.clientX - startX)) + "px";
    overlay.style.top = (initialTop + (e.clientY - startY)) + "px";
  });

  document.addEventListener("mouseup", () => { isDragging = false; });

  // 2. Traductor Rápido
  async function translateText(text) {
    try {
      const gUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=es&q=${encodeURIComponent(text)}`;
      const res = await fetch(gUrl);
      if (res.ok) {
        const data = await res.json();
        const trans = Array.isArray(data) ? data.join("") : String(data || text);
        if (trans && trans !== text) return trans;
      }
    } catch (e) {}

    try {
      const res2 = await fetch("https://mariomojica.com/api/copiloto/traducir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fromLang: "auto", toLang: "es" })
      });
      const data2 = await res2.json();
      return data2.translation || text;
    } catch (e) {}

    return text;
  }

  // 3. Renderizar Card en el Overlay
  async function renderCard(originalText, speakerName, preTranslatedText) {
    const clean = originalText.trim();
    if (!clean || clean.length < 3 || clean === lastCapturedSentence) return;

    lastCapturedSentence = clean;

    if (emptyState && emptyState.parentElement) {
      emptyState.remove();
    }

    const speaker = speakerName || "Mario Mojica";
    const isMario = speaker.toLowerCase().includes("mario");

    console.log("%c[Traductor B2B] 🗣️ " + speaker + ": %c" + clean, "color:#7ee787;font-weight:bold;", "color:#fff;");

    const card = document.createElement("div");
    card.className = "mm-msg-card";
    card.innerHTML = `
      <div class="mm-speaker-name ${isMario ? "" : "client"}">${speaker}</div>
      <div class="mm-text-orig">${clean}</div>
      <div class="mm-text-trans" style="font-size: ${fontSize}px;">${preTranslatedText || "Traduciendo..."}</div>
    `;

    feedContainer.appendChild(card);
    feedContainer.scrollTop = feedContainer.scrollHeight;

    let finalTranslation = preTranslatedText;
    if (!finalTranslation) {
      finalTranslation = await translateText(clean);
      const transEl = card.querySelector(".mm-text-trans");
      if (transEl) {
        transEl.textContent = finalTranslation;
      }
    }

    // Sincronizar con mariomojica.com en paralelo
    try {
      fetch("https://mariomojica.com/api/copiloto/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_message",
          sala: currentSala,
          message: {
            id: "msg_meet_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
            speaker: isMario ? "mario" : "cliente",
            speakerName: speaker,
            originalText: clean,
            translatedText: finalTranslation || clean,
            fromLang: "pt",
            toLang: "es",
            timestamp: Date.now()
          }
        })
      }).catch(() => {});
    } catch (e) {}
  }

  // 4. MOTOR DUAL DE CAPTURA DE SUBTÍTULOS
  function dualScanCaptions() {
    // MÉTODO 1: Si Trippi está en pantalla, leer directamente los bloques de Trippi
    const trippiCards = document.querySelectorAll('div[class*="trippi"] div, div[id*="trippi"] div, .trippi-item');
    if (trippiCards.length > 0) {
      for (let i = trippiCards.length - 1; i >= 0; i--) {
        const card = trippiCards[i];
        const text = (card.innerText || "").trim();
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
          const speaker = lines[0];
          const orig = lines[1];
          const trans = lines.length >= 3 ? lines[2] : "";
          if (orig && orig.length > 3 && orig !== lastCapturedSentence) {
            renderCard(orig, speaker, trans);
            return;
          }
        }
      }
    }

    // MÉTODO 2: Escaneo directo del texto de subtítulos en streaming de Google Meet en el fondo
    // Busca cualquier elemento de texto largo visible en la parte inferior de la videollamada
    const allElements = document.querySelectorAll('div, span, p');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (el.closest('#mm-translator-overlay') || el.closest('[class*="trippi"]')) continue;
      if (el.closest('button, nav, [role="button"], [role="toolbar"]')) continue;
      if (el.childElementCount > 2) continue;

      const rect = el.getBoundingClientRect();
      // Está en la zona inferior visible de los subtítulos de Google Meet
      if (rect.top > window.innerHeight * 0.65 && rect.bottom < window.innerHeight - 40 && rect.width > 250) {
        const text = (el.innerText || el.textContent || "").trim();
        if (text.length > 15 && text !== lastCapturedSentence) {
          // Descartar avisos de botones
          if (text.toLowerCase().includes("micrófono") || text.toLowerCase().includes("cámara")) continue;

          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            renderCard(text, "Mario Mojica");
          }, 300);
          return;
        }
      }
    }
  }

  const observer = new MutationObserver(() => {
    dualScanCaptions();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  setInterval(dualScanCaptions, 250);

  console.log("%c[Mario Mojica Copilot v1.7.0]%c Escáner Dual Activo.", "color:#7ee787;font-weight:bold;");
})();