/* ==========================================================================
   Interações locais (simuladas) — Sobrevivendo ao Horror
   Revelar pistas, enviar intenção, abas do caso, histórico e andamento.
   ========================================================================== */
(function () {
  /* ---- Toast ---- */
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () { t.classList.remove("show"); }, 2400);
    setTimeout(function () { t.remove(); }, 2800);
  }
  window.SH = window.SH || {}; SH.toast = toast;

  /* ---- Abas (página do caso) ---- */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          t.setAttribute("aria-selected", "false");
          var p = document.getElementById(t.getAttribute("aria-controls"));
          if (p) p.hidden = true;
        });
        tab.setAttribute("aria-selected", "true");
        var panel = document.getElementById(tab.getAttribute("aria-controls"));
        if (panel) panel.hidden = false;
      });
      tab.addEventListener("keydown", function (e) {
        var i = tabs.indexOf(tab);
        if (e.key === "ArrowRight") { e.preventDefault(); tabs[(i + 1) % tabs.length].focus(); }
        if (e.key === "ArrowLeft")  { e.preventDefault(); tabs[(i - 1 + tabs.length) % tabs.length].focus(); }
      });
    });
  });

  /* ---- Revelar pista (clique numa pista bloqueada = simular teste bem-sucedido) ---- */
  document.querySelectorAll("[data-clue]").forEach(function (el) {
    el.addEventListener("click", function () {
      if (!el.classList.contains("locked")) return;
      el.classList.remove("locked"); el.classList.add("found");
      var caseId = el.dataset.case || (window.SH.currentCaseId && SH.currentCaseId());
      if (caseId && el.dataset.clue) {
        SH.addFound(caseId, el.dataset.clue);
        toast("Pista descoberta e registrada no caso.");
        refreshProgress(caseId);
      }
    });
  });

  /* ---- Marca as pistas já descobertas ao abrir a cena ---- */
  document.querySelectorAll("[data-clue]").forEach(function (el) {
    var caseId = el.dataset.case || (window.SH.currentCaseId && SH.currentCaseId());
    if (caseId && el.dataset.clue && SH.getFound(caseId).indexOf(el.dataset.clue) !== -1) {
      el.classList.remove("locked"); el.classList.add("found");
    }
  });

  /* ---- Enviar intenção ao mestre (simula aprovação após alguns segundos) ---- */
  document.querySelectorAll("[data-intent]").forEach(function (btn) {
    var status = document.querySelector(btn.dataset.intent);
    btn.addEventListener("click", function () {
      if (!status) return;
      status.textContent = "Aguardando aprovação";
      status.className = "status status--pending";
      btn.disabled = true; btn.style.opacity = ".6";
      setTimeout(function () {
        status.textContent = "Intenção aprovada";
        status.className = "status status--approved";
        btn.disabled = false; btn.style.opacity = "1";
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

  /* ---- Andamento da investigação ---- */
  function refreshProgress(caseId) {
    document.querySelectorAll('[data-progress="' + caseId + '"]').forEach(function (wrap) {
      var lbl = wrap.querySelector("[data-progress-label]");
      var found = SH.getFound(caseId).length;
      // Mostra apenas as pistas coletadas — nunca quantas faltam.
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
