/* ==========================================================================
   Navegação e a travessia "O Limiar" — Sobrevivendo ao Horror
   Intercepta a mudança de contexto (zona segura → missão e volta) para exibir
   o momento de travessia antes de trocar de página. O véu de chegada
   (html.is-entering) é revelado por CSS na página de destino, costurando as
   duas metades da travessia sem flash.
   ========================================================================== */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var docEl = document.documentElement;

  function ensureOverlay() {
    var el = document.querySelector(".limiar");
    if (el) return el;
    el = document.createElement("div");
    el.className = "limiar";
    el.setAttribute("role", "status");        // anuncia a travessia p/ leitores de tela
    el.setAttribute("aria-live", "assertive");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="limiar__t"></div><div class="limiar__s"></div>';
    document.body.appendChild(el);
    return el;
  }

  function limiarDuration() {
    var v = getComputedStyle(docEl).getPropertyValue("--limiar-duration");
    return parseFloat(v) || 900; // ms
  }

  function cross(href, toMode, trigger) {
    if (docEl.dataset.crossing) return;       // trava contra toque duplo
    docEl.dataset.crossing = "1";
    if (trigger) trigger.classList.add("is-committing"); // feedback imediato no botão

    var el = ensureOverlay();
    var returning = toMode === "safe";
    el.classList.toggle("returning", returning);
    el.querySelector(".limiar__t").textContent = returning ? "De volta à luz" : "O Limiar";
    el.querySelector(".limiar__s").textContent = returning ? "a proteção do lampião" : "algo observa de volta";
    el.classList.add("active");
    el.setAttribute("aria-hidden", "false");

    // Espera o véu cobrir por completo (>= duração do fade) antes de trocar de página.
    // Ida (para o Vígil) segura um pouco mais que a volta (alívio mais rápido).
    var dur = limiarDuration();
    var HOLD = reduce ? 140 : (returning ? dur + 250 : dur + 500);
    window.setTimeout(function () { window.location.href = href; }, HOLD);
  }

  document.addEventListener("click", function (e) {
    var enter = e.target.closest("[data-enter]");
    if (enter && enter.dataset.href) { e.preventDefault(); cross(enter.dataset.href, "mission", enter); return; }
    var ret = e.target.closest("[data-return]");
    if (ret && ret.dataset.href) { e.preventDefault(); cross(ret.dataset.href, "safe", ret); return; }
  });
})();
