/* ==========================================================================
   Dados simulados — Sobrevivendo ao Horror
   Sem backend: os casos vivem aqui e o progresso é guardado em localStorage
   para simular persistência entre as telas.
   ========================================================================== */
window.SH = window.SH || {};

SH.CASES = {
  relojoeiro: {
    id: "relojoeiro",
    name: "O Gabinete do Relojoeiro",
    place: "Marylebone, Londres",
    risk: "elevado",
    threat: 2, threatMax: 4,
    time: "21h47",
    summary: "Um artesão desapareceu de um cômodo trancado por dentro. Não há sinal de arrombamento — apenas sangue onde não deveria haver, e um relógio que parou no instante exato do sumiço.",
    hints: [
      "Comece pela marca de sangue: a origem dos respingos dirá se houve luta.",
      "O relógio parado pode marcar a hora do evento — cruze com o testemunho da vizinha.",
      "A porta trancada por dentro sugere passagem oculta ou algo que não usou a porta."
    ],
    poi: "Marca de sangue",
    clues: [
      { skill: "Investigação", dt: 10, text: "O sangue é humano." },
      { skill: "Investigação", dt: 15, text: "Há dois padrões distintos de respingo." },
      { skill: "Investigação", dt: 20, text: "Parte da marca foi produzida depois da morte." },
      { skill: "Ocultismo",    dt: 15, text: "O sangue foi usado como componente de um ritual." }
    ],
    photos: [
      { icon: "🩸", cap: "Respingo — parede leste" },
      { icon: "🕰️", cap: "Relógio parado 21h47" },
      { icon: "🚪", cap: "Porta trancada por dentro" },
      { icon: "🔍", cap: "Bancada do relojoeiro" }
    ]
  },
  ondina: {
    id: "ondina",
    name: "A Carga do Ondina",
    place: "Docas de Wapping",
    risk: "baixo",
    threat: 1, threatMax: 4,
    time: "03h10",
    summary: "Um navio atracou com a tripulação inteira — e completamente muda. Ninguém explica o que carregava no porão, e o manifesto de carga foi rasgado.",
    hints: [
      "O manifesto rasgado pode ser remontado com paciência (Investigação).",
      "A mudez coletiva não é natural: procure sinais de trauma ou influência (Medicina/Ocultismo)."
    ],
    poi: "Manifesto rasgado",
    clues: [
      { skill: "Investigação", dt: 10, text: "A carga saiu de um porto no Báltico." },
      { skill: "Investigação", dt: 15, text: "Um nome foi deliberadamente arrancado do papel." },
      { skill: "Ocultismo",    dt: 15, text: "O verso traz um selo que não deveria existir." }
    ],
    photos: [
      { icon: "📜", cap: "Manifesto rasgado" },
      { icon: "⚓", cap: "Convés do Ondina" },
      { icon: "🌊", cap: "Porão alagado" }
    ]
  },
  quarto: {
    id: "quarto",
    name: "O Quarto que Não Existia",
    place: "Highgate",
    risk: "mortal",
    threat: 3, threatMax: 4,
    time: "—:—",
    summary: "A planta da casa mostra doze cômodos. Os moradores juram que sempre foram onze. O décimo-segundo aparece apenas para quem já não deveria voltar.",
    hints: [
      "Compare a planta antiga com a atual — a diferença é a porta que ninguém abre.",
      "Ouça os moradores separadamente: a contradição está no que eles omitem."
    ],
    poi: "Planta da casa",
    clues: [
      { skill: "Investigação", dt: 15, text: "A parede do corredor é 40 cm mais grossa que as outras." },
      { skill: "Ocultismo",    dt: 20, text: "O cômodo existe — mas não neste tempo." }
    ],
    photos: [
      { icon: "🏚️", cap: "Fachada, Highgate" },
      { icon: "🗺️", cap: "Planta original (12 cômodos)" },
      { icon: "🕯️", cap: "Corredor sem fim" }
    ]
  },
  congregacao: {
    id: "congregacao",
    name: "A Congregação de Ferro",
    place: "Whitechapel",
    risk: "elevado",
    threat: 2, threatMax: 4,
    time: "19h02",
    summary: "Uma seita compra, uma a uma, todas as propriedades ao redor de um único ponto do mapa. Falta descobrir o que há embaixo — e por que têm tanta pressa.",
    hints: [
      "Mapeie as compras: o centro geométrico é o alvo real.",
      "Siga o dinheiro — quem financia costuma ser o elo mais frágil."
    ],
    poi: "Mapa das propriedades",
    clues: [
      { skill: "Investigação", dt: 10, text: "Todas as compras foram feitas pela mesma firma de fachada." },
      { skill: "Investigação", dt: 15, text: "O ponto central é uma antiga capela desativada." }
    ],
    photos: [
      { icon: "🗺️", cap: "Mapa das aquisições" },
      { icon: "⛪", cap: "Capela desativada" },
      { icon: "🕳️", cap: "Cripta (acesso lacrado)" }
    ]
  }
};

/* ---- Identidade e persistência das pistas ---- */
SH.clueKey = function (clue) { return clue.skill + "-" + clue.dt; };
SH.storageKey = function (caseId) { return "sh:" + caseId + ":found"; };

SH.getFound = function (caseId) {
  try { return JSON.parse(localStorage.getItem(SH.storageKey(caseId))) || []; }
  catch (e) { return []; }
};
SH.addFound = function (caseId, key) {
  var found = SH.getFound(caseId);
  if (found.indexOf(key) === -1) { found.push(key); }
  localStorage.setItem(SH.storageKey(caseId), JSON.stringify(found));
  return found;
};
SH.resetFound = function (caseId) { localStorage.removeItem(SH.storageKey(caseId)); };

SH.progress = function (caseId) {
  var c = SH.CASES[caseId]; if (!c) return 0;
  var found = SH.getFound(caseId).length;
  return Math.round((found / c.clues.length) * 100);
};

/* ---- Caso atual a partir da URL (?id=...) ---- */
SH.currentCaseId = function () {
  var id = new URLSearchParams(location.search).get("id");
  return (id && SH.CASES[id]) ? id : "relojoeiro";
};
