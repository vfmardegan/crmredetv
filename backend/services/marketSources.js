/**
 * Curadoria Oficial de Fontes de Inteligência e Varredura do Radar de Mercado
 * Total: 161 fontes mapeadas e auditadas (Núcleo Publicitário, Economia/Negócios e Verticais Setoriais)
 */

const MARKET_SOURCES = {
  // 1. PUBLICIDADE, MARKETING & MÍDIA (Núcleo Central - Transversal)
  publicidade_marketing: [
    { nome: "Meio & Mensagem", dominio: "meioemensagem.com.br", tipo: "portal", prioridade: 1 },
    { nome: "PropMark", dominio: "propmark.com.br", tipo: "portal", prioridade: 1 },
    { nome: "Adnews", dominio: "adnews.com.br", tipo: "portal", prioridade: 1 },
    { nome: "Grandes Nomes da Propaganda (GNP)", dominio: "grandesnomesdapropaganda.com.br", tipo: "portal", prioridade: 1 },
    { nome: "Marcas Mais", dominio: "marcasmais.com.br", tipo: "portal", prioridade: 2 },
    { nome: "VoxNews", dominio: "voxnews.com.br", tipo: "portal", prioridade: 2 },
    { nome: "Clube de Criação", dominio: "clubedecriacao.com.br", tipo: "portal", prioridade: 2 },
    { nome: "Promoview", dominio: "promoview.com.br", tipo: "portal", foco: "Live Marketing & Brand Experience", prioridade: 2 },
    { nome: "Portal da Propaganda", dominio: "portaldapropaganda.com.br", tipo: "portal", prioridade: 3 }
  ],

  // 2. ECONOMIA, NEGÓCIOS & CAPITAL (Transversal de Alto Impacto)
  economia_negocios: [
    { nome: "Valor Econômico / Pipeline", dominio: "valor.globo.com", tipo: "portal", prioridade: 1 },
    { nome: "Exame (Negócios & Marketing)", dominio: "exame.com", tipo: "portal", prioridade: 1 },
    { nome: "InfoMoney", dominio: "infomoney.com.br", tipo: "portal", prioridade: 1 },
    { nome: "Brazil Journal", dominio: "braziljournal.com", tipo: "portal", prioridade: 1 },
    { nome: "NeoFeed", dominio: "neofeed.com.br", tipo: "portal", prioridade: 1 },
    { nome: "Broadcast / Estadão Economia", dominio: "estadao.com.br/economia", tipo: "portal", prioridade: 2 },
    { nome: "Painel S.A. / Folha de S.Paulo", dominio: "folha.uol.com.br/mercado", tipo: "portal", prioridade: 2 },
    { nome: "Bloomberg Línea Brasil", dominio: "bloomberglinea.com.br", tipo: "portal", prioridade: 2 },
    { nome: "Fusões & Aquisições (F&A)", dominio: "fusoesaquisicoes.com", tipo: "portal", prioridade: 2 }
  ],

  // 3. SETORIAIS MAPEADOS CONFORME OS SEGMENTOS DO CRM REDETV!
  setoriais: {
    "Automotivo": [
      { nome: "ANFAVEA", dominio: "anfavea.com.br", tipo: "associacao" },
      { nome: "FENABRAVE", dominio: "fenabrave.org.br", tipo: "associacao" },
      { nome: "ABRACICLO", dominio: "abraciclo.com.br", tipo: "associacao" },
      { nome: "FENAUTO", dominio: "fenauto.org.br", tipo: "associacao" },
      { nome: "ALVESP", dominio: "alvesp.com.br", tipo: "associacao" },
      { nome: "SINDIPEÇAS / SINCOPEÇAS", dominio: "sindipecas.org.br", tipo: "associacao" },
      { nome: "ABVE (Veículos Elétricos)", dominio: "abve.org.br", tipo: "associacao" },
      { nome: "ABLA (Locadoras)", dominio: "abla.com.br", tipo: "associacao" },
      { nome: "ABRAVEI", dominio: "abravei.org", tipo: "associacao" },
      { nome: "AutoData", dominio: "autodata.com.br", tipo: "portal" },
      { nome: "Automotive Business", dominio: "automotivebusiness.com.br", tipo: "portal" },
      { nome: "Quatro Rodas", dominio: "quatrorodas.abril.com.br", tipo: "portal" },
      { nome: "Autoesporte", dominio: "autoesporte.globo.com", tipo: "portal" },
      { nome: "Motor1 Brasil", dominio: "motor1.uol.com.br", tipo: "portal" },
      { nome: "Mobiauto Notícias", dominio: "mobiauto.com.br", tipo: "portal" }
    ],

    "Agro e Meio-Ambiente": [
      { nome: "CNA Brasil", dominio: "cnabrasil.org.br", tipo: "associacao" },
      { nome: "ABAG", dominio: "abag.com.br", tipo: "associacao" },
      { nome: "ANDAV", dominio: "andav.com.br", tipo: "associacao" },
      { nome: "ABIMAQ / CSMAC", dominio: "abimaq.org.br", tipo: "associacao" },
      { nome: "OCB (Cooperativas)", dominio: "somoscooperativismo.coop.br", tipo: "associacao" },
      { nome: "SRB (Sociedade Rural Brasileira)", dominio: "srb.org.br", tipo: "associacao" },
      { nome: "Canal Rural", dominio: "canalrural.com.br", tipo: "portal" },
      { nome: "Globo Rural", dominio: "globorural.globo.com", tipo: "portal" },
      { nome: "AgroLink", dominio: "agrolink.com.br", tipo: "portal" },
      { nome: "Notícias Agrícolas", dominio: "noticiasagricolas.com.br", tipo: "portal" },
      { nome: "AgFeed", dominio: "agfeed.com.br", tipo: "portal" },
      { nome: "Revista Cultivar", dominio: "revistacultivar.com.br", tipo: "portal" }
    ],

    "Apostas Esportivas": [
      { nome: "SPA / Ministério da Fazenda", dominio: "gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas", tipo: "orgao_oficial" },
      { nome: "IBJR (Jogo Responsável)", dominio: "ibjr.org", tipo: "associacao" },
      { nome: "ANJL (Jogos e Loterias)", dominio: "anjl.com.br", tipo: "associacao" },
      { nome: "BNLData", dominio: "bnldata.com.br", tipo: "portal" },
      { nome: "Games Magazine Brasil (GMB)", dominio: "gamesbras.com", tipo: "portal" },
      { nome: "Yogonet Brasil", dominio: "yogonet.com/brasil", tipo: "portal" },
      { nome: "SBC Notícias Brasil", dominio: "sbcnoticias.com/brasil", tipo: "portal" },
      { nome: "iGaming Brazil", dominio: "igamingbrazil.com", tipo: "portal" }
    ],

    "Alimentos": [
      { nome: "ABIA", dominio: "abia.org.br", tipo: "associacao" },
      { nome: "ABIR (Trigo e Panificação)", dominio: "abitrigo.com.br", tipo: "associacao" },
      { nome: "ABPA (Proteína Animal)", dominio: "abpa-br.org", tipo: "associacao" },
      { nome: "ABICS (Café)", dominio: "abics.com.br", tipo: "associacao" },
      { nome: "Revista Alimentos & Bebidas", dominio: "alimentosebebidas.com.br", tipo: "portal" },
      { nome: "Food Connection", dominio: "foodconnection.com.br", tipo: "portal" },
      { nome: "Giro News (Alimentos)", dominio: "gironews.com/food-service", tipo: "portal" },
      { nome: "SuperVarejo", dominio: "supervarejo.com.br", tipo: "portal" }
    ],

    "Bebidas": [
      { nome: "ABRABE", dominio: "abrabe.org.br", tipo: "associacao" },
      { nome: "CERVBRASIL", dominio: "cervbrasil.org.br", tipo: "associacao" },
      { nome: "ABIR (Refrigerantes)", dominio: "abir.org.br", tipo: "associacao" },
      { nome: "ABRADEF", dominio: "abradef.com.br", tipo: "associacao" },
      { nome: "Catalisi", dominio: "catalisi.com.br", tipo: "portal" },
      { nome: "Guia da Cerveja", dominio: "guiadacervejabr.com", tipo: "portal" },
      { nome: "Revista da Cerveja", dominio: "revistadacerveja.com.br", tipo: "portal" },
      { nome: "Giro News (Bebidas)", dominio: "gironews.com/bebidas", tipo: "portal" }
    ],

    "Atacarejo": [
      { nome: "ABAD", dominio: "abad.com.br", tipo: "associacao" },
      { nome: "ABRAS", dominio: "abras.com.br", tipo: "associacao" },
      { nome: "APAS", dominio: "portalapas.com.br", tipo: "associacao" },
      { nome: "Giro News (Cash & Carry)", dominio: "gironews.com/atacado-autosservico", tipo: "portal" },
      { nome: "Revista Distribuição", dominio: "revistadistribuicao.com.br", tipo: "portal" },
      { nome: "Newtrade", dominio: "newtrade.com.br", tipo: "portal" }
    ],

    "Vestuário e Moda": [
      { nome: "ABIT (Têxtil e Confecção)", dominio: "abit.org.br", tipo: "associacao" },
      { nome: "ABICALÇADOS", dominio: "abicalcados.com.br", tipo: "associacao" },
      { nome: "ABIESV", dominio: "abiesv.org.br", tipo: "associacao" },
      { nome: "IBGM (Joias e Gemas)", dominio: "ibgm.com.br", tipo: "associacao" },
      { nome: "Fashion Network Brasil", dominio: "br.fashionnetwork.com", tipo: "portal" },
      { nome: "FFW (Fashion Forward)", dominio: "ffw.uol.com.br", tipo: "portal" },
      { nome: "Revista Lançamentos", dominio: "lancamentos.com.br", tipo: "portal" },
      { nome: "Vogue Brasil (Negócios)", dominio: "vogue.globo.com/moda", tipo: "portal" },
      { nome: "Textília.net", dominio: "textilia.net", tipo: "portal" }
    ],

    "Educação": [
      { nome: "ABMES (Ensino Superior)", dominio: "abmes.org.br", tipo: "associacao" },
      { nome: "SEMESP", dominio: "semesp.org.br", tipo: "associacao" },
      { nome: "FENEP (Escolas Particulares)", dominio: "fenep.org.br", tipo: "associacao" },
      { nome: "ANUP", dominio: "anup.org.br", tipo: "associacao" },
      { nome: "Revista Educação", dominio: "revistaeducacao.com.br", tipo: "portal" },
      { nome: "Desafios da Educação", dominio: "desafiosdaeducacao.grupoa.com.br", tipo: "portal" },
      { nome: "Guia da Carreira", dominio: "guiadacarreira.com.br", tipo: "portal" },
      { nome: "Porvir", dominio: "porvir.org", tipo: "portal" }
    ],

    "Telecom": [
      { nome: "Conexis Brasil Digital", dominio: "conexis.org.br", tipo: "associacao" },
      { nome: "ABRINT (ISPs & Fibra)", dominio: "abrint.com.br", tipo: "associacao" },
      { nome: "ABRATEL", dominio: "abratel.org.br", tipo: "associacao" },
      { nome: "ANATEL (Atos e Editais)", dominio: "gov.br/anatel", tipo: "orgao_oficial" },
      { nome: "TELE.SÍNTESE", dominio: "telesintese.com.br", tipo: "portal" },
      { nome: "Teletime", dominio: "teletime.com.br", tipo: "portal" },
      { nome: "Mobile Time", dominio: "mobiletime.com.br", tipo: "portal" },
      { nome: "Convergência Digital", dominio: "convergenciadigital.com.br", tipo: "portal" },
      { nome: "Minha Operadora", dominio: "minhaoperadora.com.br", tipo: "portal" }
    ],

    "Entretenimento": [
      { nome: "ABRAPE (Promotores de Eventos)", dominio: "abrape.com.br", tipo: "associacao" },
      { nome: "ADIBRA (Parques)", dominio: "adibra.com.br", tipo: "associacao" },
      { nome: "SIAESP (Audiovisual)", dominio: "siaesp.org.br", tipo: "associacao" },
      { nome: "Portal POPline", dominio: "popline.com.br", tipo: "portal" },
      { nome: "TMDQA!", dominio: "tenhomaisdiscosqueamigos.com", tipo: "portal" },
      { nome: "Filme B", dominio: "filmeb.com.br", tipo: "portal" },
      { nome: "Portal Exibidor", dominio: "exibidor.com.br", tipo: "portal" }
    ],

    "Tech e E-Commerce": [
      { nome: "ABCOMM", dominio: "abcomm.org", tipo: "associacao" },
      { nome: "BRASSCOM", dominio: "brasscom.org.br", tipo: "associacao" },
      { nome: "ABES Software", dominio: "abessoftware.com.br", tipo: "associacao" },
      { nome: "ABStartups", dominio: "abstartups.com.br", tipo: "associacao" },
      { nome: "E-Commerce Brasil", dominio: "ecommercebrasil.com.br", tipo: "portal" },
      { nome: "Startups.com.br", dominio: "startups.com.br", tipo: "portal" },
      { nome: "TI Inside", dominio: "tiinside.com.br", tipo: "portal" },
      { nome: "Canaltech Corporativo", dominio: "canaltech.com.br/mercado", tipo: "portal" }
    ],

    "Financeiro e Seguros": [
      { nome: "FEBRABAN", dominio: "febraban.org.br", tipo: "associacao" },
      { nome: "CNseg", dominio: "cnseg.org.br", tipo: "associacao" },
      { nome: "ABBC Bancos", dominio: "abbc.org.br", tipo: "associacao" },
      { nome: "FENACOR", dominio: "fenacor.org.br", tipo: "associacao" },
      { nome: "Finsiders Brasil", dominio: "finsidersbrasil.com.br", tipo: "portal" },
      { nome: "Revista Apólice", dominio: "revistaapolice.com.br", tipo: "portal" },
      { nome: "CQCS (Seguros)", dominio: "cqcs.com.br", tipo: "portal" },
      { nome: "Valor Investe", dominio: "valorinveste.globo.com", tipo: "portal" }
    ],

    "Higiene e Beleza": [
      { nome: "ABIHPEC", dominio: "abihpec.org.br", tipo: "associacao" },
      { nome: "ABRALEST", dominio: "abralest.org.br", tipo: "associacao" },
      { nome: "Cosmetics Innovation Brasil", dominio: "cosmeticsinnovation.com.br", tipo: "portal" },
      { nome: "Beauty Fair Negócios", dominio: "beautyfair.com.br", tipo: "portal" },
      { nome: "Atualidade Cosmética", dominio: "atualidadecosmetica.com.br", tipo: "portal" }
    ],

    "Farma e Saúde": [
      { nome: "SINDUSFARMA", dominio: "sindusfarma.org.br", tipo: "associacao" },
      { nome: "ABRAFARMA", dominio: "abrafarma.com.br", tipo: "associacao" },
      { nome: "INTERFARMA", dominio: "interfarma.org.br", tipo: "associacao" },
      { nome: "Guia da Farmácia", dominio: "guiadafarmacia.com.br", tipo: "portal" },
      { nome: "Panorama Farmacêutico", dominio: "panoramafarmaceutico.com.br", tipo: "portal" },
      { nome: "Revista da Farmácia", dominio: "revistadafarmacia.com.br", tipo: "portal" },
      { nome: "Saúde Business", dominio: "saudebusiness.com", tipo: "portal" }
    ],

    "Construção, Imobiliário e Decoração": [
      { nome: "CBIC", dominio: "cbic.org.br", tipo: "associacao" },
      { nome: "SECOVI-SP", dominio: "secovi.com.br", tipo: "associacao" },
      { nome: "ABRAMAT", dominio: "abramat.org.br", tipo: "associacao" },
      { nome: "SINDUSCON", dominio: "sindusconsp.com.br", tipo: "associacao" },
      { nome: "ABD (Design de Interiores)", dominio: "abd.org.br", tipo: "associacao" },
      { nome: "Revista Anamaco", dominio: "revistaanamaco.com.br", tipo: "portal" },
      { nome: "Imobi Report", dominio: "imobireport.com.br", tipo: "portal" },
      { nome: "Construção Mercado (Pini)", dominio: "pini.com.br", tipo: "portal" },
      { nome: "Revista Projeto", dominio: "revistaprojeto.com.br", tipo: "portal" }
    ],

    "Petroquímica": [
      { nome: "ABIQUIM", dominio: "abiquim.org.br", tipo: "associacao" },
      { nome: "IBP (Petróleo e Gás)", dominio: "ibp.org.br", tipo: "associacao" },
      { nome: "ABICOM", dominio: "abicom.com.br", tipo: "associacao" },
      { nome: "SINDICOM / Plural", dominio: "somosplural.com.br", tipo: "associacao" },
      { nome: "EPBR", dominio: "epbr.com.br", tipo: "portal" },
      { nome: "Petronotícias", dominio: "petronoticias.com.br", tipo: "portal" },
      { nome: "Química e Derivados", dominio: "quimica.com.br", tipo: "portal" },
      { nome: "CanalEnergia", dominio: "canalenergia.com.br", tipo: "portal" }
    ],

    "Eletro-Eletrônicos": [
      { nome: "ELETROS", dominio: "eletros.org.br", tipo: "associacao" },
      { nome: "ABINEE", dominio: "abinee.org.br", tipo: "associacao" },
      { nome: "Eletrolar News", dominio: "eletrolar.com", tipo: "portal" },
      { nome: "Mundo do Hardware", dominio: "mundodohardware.com.br", tipo: "portal" }
    ],

    "Turismo": [
      { nome: "ABEAR (Aéreas)", dominio: "abear.com.br", tipo: "associacao" },
      { nome: "BRAZTOA (Operadoras)", dominio: "braztoa.com.br", tipo: "associacao" },
      { nome: "ABAV (Agências)", dominio: "abav.com.br", tipo: "associacao" },
      { nome: "ABIH (Hotéis)", dominio: "abih.com.br", tipo: "associacao" },
      { nome: "Panrotas", dominio: "panrotas.com.br", tipo: "portal" },
      { nome: "Mercado & Eventos", dominio: "mercadoeeventos.com.br", tipo: "portal" },
      { nome: "Hotelier News", dominio: "hoteliernews.com.br", tipo: "portal" },
      { nome: "Diário do Turismo", dominio: "diariodoturismo.com.br", tipo: "portal" }
    ]
  }
};

/**
 * Retorna todas as fontes ativas cadastradas em lista plana única
 */
function getAllActiveSources() {
  const sourcesMap = new Map();

  // Publicidade
  MARKET_SOURCES.publicidade_marketing.forEach((s) => {
    sourcesMap.set(s.dominio, { ...s, categoria: "Publicidade & Mídia", segmento: "Geral Publicidade" });
  });

  // Economia
  MARKET_SOURCES.economia_negocios.forEach((s) => {
    sourcesMap.set(s.dominio, { ...s, categoria: "Economia & Negócios", segmento: "Geral Negócios" });
  });

  // Setoriais
  Object.entries(MARKET_SOURCES.setoriais).forEach(([segmento, list]) => {
    list.forEach((s) => {
      if (!sourcesMap.has(s.dominio)) {
        sourcesMap.set(s.dominio, { ...s, categoria: "Setorial", segmento });
      }
    });
  });

  return Array.from(sourcesMap.values());
}

/**
 * Retorna as fontes relevantes para um segmento específico do CRM
 */
function getSourcesForSegment(segmentName) {
  const transversais = [
    ...MARKET_SOURCES.publicidade_marketing,
    ...MARKET_SOURCES.economia_negocios
  ];

  const setoriais = MARKET_SOURCES.setoriais[segmentName] || [];
  return [...transversais, ...setoriais];
}

module.exports = {
  MARKET_SOURCES,
  getAllActiveSources,
  getSourcesForSegment,
};
