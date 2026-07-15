/* ==========================================================================
   Dados simulados — Sobrevivendo ao Horror
   Sem backend: os casos vivem aqui e o progresso é guardado em localStorage
   para simular persistência entre as telas.

   NOTA DE DESIGN
   - O relógio de ameaça (threat/threatMax) é OCULTO aos jogadores. Fica nos
     dados para o futuro painel do mestre, mas não aparece nas telas do jogador.
   - As "dicas" foram substituídas por um QUADRO DE INVESTIGAÇÃO (board):
     recorte de jornal, post-it, ficha de pessoa de interesse ligada por
     barbante, observações indiretas de relatório e perguntas em aberto.
     Nada é entregue de forma direta — o objetivo é provocar questionamento.
   ========================================================================== */
window.SH = window.SH || {};

SH.CASES = {
  relojoeiro: {
    id: "relojoeiro",
    name: "O Gabinete do Relojoeiro",
    place: "Marylebone, Londres",
    risk: "elevado",
    threat: 1, threatMax: 5,               // OCULTO aos jogadores
    time: "21h47",
    summary: "Um artesão desapareceu de um cômodo trancado por dentro. Não há sinal de arrombamento — apenas sangue onde não deveria haver, e um relógio que parou no instante exato do sumiço.",
    poi: "Marca de sangue",
    clues: [
      { skill: "Investigação", dt: 10, text: "O sangue é humano." },
      { skill: "Investigação", dt: 15, text: "Há dois padrões distintos de respingo." },
      { skill: "Investigação", dt: 20, text: "Parte da marca foi produzida depois da morte." },
      { skill: "Ocultismo",    dt: 15, text: "O sangue foi usado como componente de um ritual." }
    ],
    board: {
      clipping: {
        source: "The Strand Chronicle · 3 de outubro de 1891",
        headline: "Artesão some de oficina trancada por dentro",
        excerpt: "Vizinhos relatam ter ouvido um carrilhão tocar em plena madrugada, seguido de completo silêncio. A polícia recolheu o pouco que havia e não descarta nenhuma hipótese."
      },
      postit: "A chave estava POR DENTRO da fechadura. Então como ele saiu?",
      person: {
        name: "Elias Warrick",
        role: "Relojoeiro — desaparecido",
        photo: "🧔",
        description: "Alto, magro, mãos manchadas de óleo. Colete cinza. Recluso desde a morte da esposa, há dois invernos.",
        missions: ["A Encomenda do Coronel", "O Pêndulo que Atrasava"]
      },
      observations: [
        "Agentes estiveram no local. A porta continuava trancada por dentro; a chave, ainda na fechadura.",
        "Uma vizinha afirma que o carrilhão tocou às 21h47 — a mesma hora em que todos os relógios da oficina pararam.",
        "Há sangue na parede leste: pouco, e em dois pontos que não se conectam.",
        "O pó acumulado no batente da janela dos fundos foi perturbado recentemente."
      ],
      questions: [
        "Qual seria a motivação para o desaparecimento?",
        "Como alguém deixa um cômodo trancado por dentro?",
        "O que os relógios parados às 21h47 tentam dizer?",
        "Warrick tinha envolvimento com o outro lado?"
      ]
    }
  },

  ondina: {
    id: "ondina",
    name: "A Carga do Ondina",
    place: "Docas de Wapping",
    risk: "baixo",
    threat: 1, threatMax: 5,
    time: "03h10",
    summary: "Um navio atracou com a tripulação inteira — e completamente muda. Ninguém explica o que carregava no porão, e o manifesto de carga foi rasgado.",
    poi: "Manifesto rasgado",
    clues: [
      { skill: "Investigação", dt: 10, text: "A carga saiu de um porto no Báltico." },
      { skill: "Investigação", dt: 15, text: "Um nome foi deliberadamente arrancado do papel." },
      { skill: "Ocultismo",    dt: 15, text: "O verso traz um selo que não deveria existir." }
    ],
    board: {
      clipping: {
        source: "Gazeta do Porto · madrugada de terça",
        headline: "Navio atraca com tripulação em silêncio absoluto",
        excerpt: "Estivadores descreveram homens descendo em fila, sem responder a chamados. Nenhum ferimento visível. O comandante recusou-se — ou foi incapaz — de prestar depoimento."
      },
      postit: "Ninguém fala. Ou ninguém PODE falar?",
      person: {
        name: "Cap. Halloran",
        role: "Comandante do Ondina",
        photo: "🧑‍✈️",
        description: "Rosto marcado pelo sol, olhar vazio. Não pronuncia uma palavra desde a atracação. Aperta um caderno encharcado contra o peito.",
        missions: ["Rota do Báltico"]
      },
      observations: [
        "Testemunhas viram a tripulação descer em fila, em silêncio, sem olhar para os lados.",
        "O manifesto de carga foi rasgado; um único nome, arrancado.",
        "Médicos não encontram doença nos homens — apenas a mudez.",
        "O porão ainda está alagado, embora não haja rombo no casco."
      ],
      questions: [
        "O que a carga realmente era?",
        "A mudez é trauma — ou foi imposta?",
        "Que nome foi arrancado do manifesto, e por quê?"
      ]
    }
  },

  quarto: {
    id: "quarto",
    name: "O Quarto que Não Existia",
    place: "Highgate",
    risk: "mortal",
    threat: 3, threatMax: 5,
    time: "—:—",
    summary: "A planta da casa mostra doze cômodos. Os moradores juram que sempre foram onze. O décimo-segundo aparece apenas para quem já não deveria voltar.",
    poi: "Planta da casa",
    clues: [
      { skill: "Investigação", dt: 15, text: "A parede do corredor é 40 cm mais grossa que as outras." },
      { skill: "Ocultismo",    dt: 20, text: "O cômodo existe — mas não neste tempo." }
    ],
    board: {
      clipping: {
        source: "Registro Predial de Highgate · arquivo",
        headline: "Planta oficial aponta cômodo que moradores negam",
        excerpt: "O documento original, datado de 1864, descreve doze cômodos. Todos os moradores atuais, sem exceção, insistem que sempre foram onze."
      },
      postit: "Onze ou doze? Depende de quem está contando.",
      person: {
        name: "Sra. Ashcombe",
        role: "Moradora mais antiga",
        photo: "👵",
        description: "Idosa, evita o corredor leste a qualquer custo. Refere-se ao 'quarto' apenas em sussurros, e nunca à noite.",
        missions: []
      },
      observations: [
        "A planta de 1864 registra doze cômodos; os moradores contam onze.",
        "A parede do corredor leste é 40 cm mais grossa que todas as demais.",
        "Objetos deixados no corredor desaparecem — e reaparecem trocados de lugar.",
        "Ninguém soube dizer quem morou na casa entre 1889 e 1890."
      ],
      questions: [
        "Onde, afinal, está o décimo-segundo cômodo?",
        "Por que todos os moradores o negam?",
        "O que entra e sai por aquela parede?"
      ]
    }
  },

  congregacao: {
    id: "congregacao",
    name: "A Congregação de Ferro",
    place: "Whitechapel",
    risk: "elevado",
    threat: 2, threatMax: 5,
    time: "19h02",
    summary: "Uma seita compra, uma a uma, todas as propriedades ao redor de um único ponto do mapa. Falta descobrir o que há embaixo — e por que têm tanta pressa.",
    poi: "Mapa das propriedades",
    clues: [
      { skill: "Investigação", dt: 10, text: "Todas as compras foram feitas pela mesma firma de fachada." },
      { skill: "Investigação", dt: 15, text: "O ponto central é uma antiga capela desativada." }
    ],
    board: {
      clipping: {
        source: "Cartório de Whitechapel · protocolos",
        headline: "Firma adquire quarteirão inteiro em poucas semanas",
        excerpt: "Onze escrituras, uma mesma assinatura. Antigos proprietários venderam por valores acima do mercado — e mudaram-se às pressas, sem deixar novo endereço."
      },
      postit: "Todas as compras. A mesma firma. Por que a pressa?",
      person: {
        name: "Sr. Crale",
        role: "Procurador da firma",
        photo: "🕴️",
        description: "Sempre de luvas, mesmo no calor. Assina por uma firma que não consta em registro algum da cidade.",
        missions: ["O Testamento Vazio"]
      },
      observations: [
        "Todas as propriedades foram compradas pela mesma firma de fachada.",
        "O centro geométrico das aquisições é uma capela desativada há décadas.",
        "As obras no terreno central acontecem apenas depois do anoitecer.",
        "Dois antigos proprietários foram procurados: nenhum foi encontrado."
      ],
      questions: [
        "O que existe sob a capela?",
        "Quem, de fato, financia a firma?",
        "Por que tanta pressa para fechar o quarteirão?"
      ]
    }
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

/* ---- Caso atual a partir da URL (?id=...) ---- */
SH.currentCaseId = function () {
  var id = new URLSearchParams(location.search).get("id");
  return (id && SH.CASES[id]) ? id : "relojoeiro";
};
