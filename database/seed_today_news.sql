-- Inserção de notícias do Radar de Mercado na data de hoje (08/10/2026)
-- Fontes: PropMark e Meio & Mensagem

INSERT INTO market_news (
  id,
  data_publicacao,
  fonte,
  url,
  titulo_original,
  segmento_crm,
  anunciante_mencionado,
  agencia_mencionada,
  resumo_executivo,
  gatilho_comercial,
  acao_sugerida,
  tags
) VALUES
(
  'noticia_09_petrobras_concorrencia',
  '2026-10-08',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/comunicacao/petrobras-concorrencia-agencias-publicidade',
  'Petrobras abre concorrência para escolha de quatro agências com verba estimada de R$ 550 milhões',
  'Petroquímica',
  'Petrobras',
  'Agências Licitantes',
  'A Petrobras publicou edital de concorrência pública com objetivo de selecionar quatro agências de propaganda para atendimento de suas contas institucionais e mercadológicas pelos próximos 30 meses.',
  'Concorrência Pública Aberta — Verba estimada de R$ 550 milhões em disputa nos próximos meses.',
  'Mapear imediatamente o consórcio de agências participantes da licitação e agendar rodada de apresentação comercial das propriedades de conteúdo e jornalismo da RedeTV! voltadas à transição energética e inovação.',
  ARRAY['Concorrência', 'Petroquímica', 'Contas Públicas', 'Institucional']
),
(
  'noticia_10_nubank_ultravioleta',
  '2026-10-08',
  'PropMark',
  'https://propmark.com.br/nubank-ultravioleta-campanha-nacional/',
  'Nubank estreia nova campanha nacional multicanal com foco no segmento de alta renda Ultravioleta',
  'Financeiro e Seguros',
  'Nubank',
  'Wieden+Kennedy SP',
  'O Nubank iniciou uma robusta ofensiva publicitária em TV aberta, streaming e mídia exterior destacando os benefícios do seu cartão Ultravioleta e serviços exclusivos de concierge e investimentos para clientes de alta renda.',
  'Nova Campanha Nacional em TV e Digital — Aumento de share no segmento de alta renda.',
  'Abordar a liderança de mídia da Wieden+Kennedy e o head de growth marketing do Nubank ofertando cotas de patrocínio no RedeTV! News e inserções no pool de programas noturnos de audiência qualificada.',
  ARRAY['Campanha', 'Financeiro e Seguros', 'Alta Renda', 'TV Aberta']
),
(
  'noticia_11_byd_expansao_midia',
  '2026-10-08',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/comunicacao/byd-expansao-investimentos-midia-brasil',
  'BYD amplia investimento em mídia no Brasil e estrutura novos núcleos de marketing regional',
  'Automotivo',
  'BYD Brasil',
  'We',
  'A montadora chinesa de veículos eletrificados BYD anunciou ampliação de 40% em seu orçamento publicitário no Brasil para o último trimestre, com criação de núcleos regionais para fortalecer a rede de concessionárias e lançamentos de híbridos plug-in.',
  'Aumento expressivo de verba publicitária e descentralização regional de investimentos.',
  'Apresentar proposta de veiculação combinada nacional e praças regionais da RedeTV!, aproveitando os lançamentos dos novos modelos híbridos e o forte apelo tecnológico da montadora.',
  ARRAY['Automotivo', 'Aumento de Verba', 'Lançamento', 'Eletrificados']
)
ON CONFLICT (id) DO UPDATE SET
  data_publicacao = EXCLUDED.data_publicacao,
  titulo_original = EXCLUDED.titulo_original,
  resumo_executivo = EXCLUDED.resumo_executivo,
  gatilho_comercial = EXCLUDED.gatilho_comercial,
  acao_sugerida = EXCLUDED.acao_sugerida;
