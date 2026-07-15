/* ==========================================================================
   Navegação e a travessia "O Limiar" — Sobrevivendo ao Horror
   Intercepta a mudança de contexto (zona segura → missão e volta) para exibir
   o momento de travessia antes de trocar de página.
   ========================================================================== */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HOLD = reduce ? 0 : 850;

  function ensureOverlay() {
    var el = document.querySelector(".limiar");
    if (el) return el;
    el = document.createElement("div");
    el.className = "limiar";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="limiar__t"></div><div class="limiar__s"></div>';
    document.body.appendChild(el);
    return el;
  }

  function cross(href, toMode) {
    var el = ensureOverlay();
    var returning = toMode === "safe";
    el.classList.toggle("returning", returning);
    el.querySelector(".limiar__t").textContent = returning ? "De volta à luz" : "O Limiar";
    el.querySelector(".limiar__s").textContent = returning ? "a proteção do lampião" : "algo observa de volta";
    el.classList.add("active");
    el.setAttribute("aria-hidden", "false");
    window.setTimeout(function () { window.location.href = href; }, HOLD);
  }

  // Entrar na missão  → [data-enter] com data-href
  // Retornar à zona segura → [data-return] com data-href
  document.addEventListener("click", function (e) {
    var enter = e.target.closest("[data-enter]");
    if (enter && enter.dataset.href) { e.preventDefault(); cross(enter.dataset.href, "mission"); return; }
    var ret = e.target.closest("[data-return]");
    if (ret && ret.dataset.href) { e.preventDefault(); cross(ret.dataset.href, "safe"); return; }
  });
})();
