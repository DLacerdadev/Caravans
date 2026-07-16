/* ==========================================================================
   Interações locais (simuladas) — Sobrevivendo ao Horror
   Revelar pistas, enviar intenção, abas do caso, histórico e andamento.
   ========================================================================== */
(function () {
  /* ---- Toast (região live única e reutilizável) ---- */
  function toast(msg) {
    var t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    clearTimeout(t._h1); clearTimeout(t._h2);
    t.textContent = msg;
    requestAnimationFrame(function () { t.classList.add("show"); });
    t._h1 = setTimeout(function () { t.classList.remove("show"); }, 2400);
    t._h2 = setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2800);
  }
  window.SH = window.SH || {}; SH.toast = toast;

  /* ---- Abas (padrão ARIA: roving tabindex, setas ativam, Home/End) ---- */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute("aria-controls"));
        if (p) p.hidden = !on;
      });
      if (focus) {
        tab.focus();
        tab.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
    }

    tabs.forEach(function (tab) {
      // Inicializa o roving tabindex a partir do aria-selected do HTML.
      tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var i = tabs.indexOf(tab), n = tabs.length, dest;
        if (e.key === "ArrowRight") dest = tabs[(i + 1) % n];
        else if (e.key === "ArrowLeft") dest = tabs[(i - 1 + n) % n];
        else if (e.key === "Home") dest = tabs[0];
        else if (e.key === "End") dest = tabs[n - 1];
        if (dest) { e.preventDefault(); select(dest, true); }
      });
    });
  });

  /* ---- Revelar pista (clique ou teclado numa pista bloqueada) ---- */
  function revealClue(el) {
    if (!el.classList.contains("locked")) return;
    el.classList.remove("locked");
    el.classList.add("found", "clue--revealing");
    el.removeAttribute("role");
    el.removeAttribute("tabindex");
    el.removeAttribute("aria-label");
    var caseId = el.dataset.case || (window.SH.currentCaseId && SH.currentCaseId());
    if (caseId && el.dataset.clue) {
      SH.addFound(caseId, el.dataset.clue);
      toast("Pista descoberta e registrada no caso.");
      refreshProgress(caseId);
    }
  }
  document.querySelectorAll("[data-clue]").forEach(function (el) {
    // Marca as pistas já descobertas ao abrir a cena.
    var caseId = el.dataset.case || (window.SH.currentCaseId && SH.currentCaseId());
    if (caseId && el.dataset.clue && SH.getFound(caseId).indexOf(el.dataset.clue) !== -1) {
      el.classList.remove("locked"); el.classList.add("found");
      el.removeAttribute("role"); el.removeAttribute("tabindex"); el.removeAttribute("aria-label");
    }
    el.addEventListener("click", function () { revealClue(el); });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); revealClue(el); }
    });
  });

  /* ---- Enviar intenção ao mestre (simula aprovação após alguns segundos) ---- */
  document.querySelectorAll("[data-intent]").forEach(function (btn) {
    var status = document.querySelector(btn.dataset.intent);
    btn.addEventListener("click", function () {
      if (!status) return;
      status.textContent = "Aguardando aprovação";
      status.className = "status status--waiting";
      btn.disabled = true; btn.classList.add("is-loading");
      setTimeout(function () {
        status.textContent = "Intenção aprovada";
        status.className = "status status--approved";
        btn.disabled = false; btn.classList.remove("is-loading");
        toast("O mestre aprovou sua intenção.");
      }, 2600);
    });
  });

  /* ---- Histórico de pistas (renderiza a partir do localStorage) ---- */
  function renderHistory(container) {
    var caseId = container.dataset.caseHistory;
    var c = SH.CASES[caseId]; if (!c) return;
    var found = SH.getFound(caseId);
    if (!found.length) {
      container.innerHTML = '<p class="page-sub" style="margin:0">Nenhuma pista registrada ainda. Investigue a cena para descobrir pistas.</p>';
      return;
    }
    var html = "";
    c.clues.forEach(function (clue) {
      if (found.indexOf(SH.clueKey(clue)) !== -1) {
        html += '<div class="clue found"><span class="dt">DT ' + clue.dt + '</span>' +
                '<span class="ct"><strong>' + clue.skill + '</strong> — ' + clue.text + '</span></div>';
      }
    });
    container.innerHTML = html;
  }
  document.querySelectorAll("[data-case-history]").forEach(renderHistory);

  /* ---- Andamento da investigação (só pistas coletadas, sem total) ---- */
  function refreshProgress(caseId) {
    document.querySelectorAll('[data-progress="' + caseId + '"]').forEach(function (wrap) {
      var lbl = wrap.querySelector("[data-progress-label]");
      var found = SH.getFound(caseId).length;
      if (lbl) {
        lbl.textContent = found === 0
          ? "Nenhuma pista descoberta"
          : found + (found === 1 ? " pista descoberta" : " pistas descobertas");
      }
    });
    document.querySelectorAll("[data-case-history]").forEach(renderHistory);
  }
  SH.refreshProgress = refreshProgress;
  document.querySelectorAll("[data-progress]").forEach(function (wrap) {
    refreshProgress(wrap.dataset.progress);
  });
})();
