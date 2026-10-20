-- Varredura de Inteligência de Mercado do período: 05/10/2026 (Segunda-feira) a 08/10/2026 (Hoje)
-- Fontes: Meio & Mensagem e PropMark

-- Limpa notícias antigas anteriores a segunda-feira (05/10/2026) para manter o radar 100% atualizado
DELETE FROM market_news;

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

-- 08/10/2026 (QUINTA-FEIRA - HOJE)
(
  'noticia_0810_picpay_drum',
  '2026-10-08',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/comunicacao/drum-assume-comunicacao-do-picpay',
  'Drum vence concorrência e assume a conta de comunicação do PicPay',
  'Financeiro e Seguros',
  'PicPay',
  'Drum (Omnicom Media Group)',
  'A Drum, agência pertencente ao grupo Omnicom Media, conquistou a conta integrada de publicidade do PicPay após concorrência que envolveu Fbiz e We. A conta vinha sendo atendida pela BETC Havas e terá agora uma estrutura dedicada dentro da Drum para acelerar aquisição de clientes e novos produtos financeiros.',
  'Troca de agência de grande player financeiro com verba pesada e montagem de nova operação de atendimento.',
  'Agendar reunião de alinhamento com a diretoria de mídia da nova agência Drum para apresentar formatos institucionais do RedeTV! News e projetos especiais de conteúdo financeiro.',
  ARRAY['Financeiro e Seguros', 'Troca de Agência', 'Concorrência', 'PicPay', 'Drum']
),
(
  'noticia_0810_petrobras_concorrencia',
  '2026-10-08',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/comunicacao/petrobras-concorrencia-agencias-publicidade',
  'Petrobras abre concorrência de R$ 550 milhões para escolher quatro agências de publicidade',
  'Petroquímica',
  'Petrobras',
  'Agências Licitantes',
  'A Petrobras publicou oficialmente o edital de sua megaconcorrência pública para selecionar quatro agências de propaganda, com verba global estimada em R$ 550 milhões pelos próximos 30 meses para suas contas institucionais, mercadológicas e de transição energética.',
  'Concorrência Pública Aberta com verba de meio bilhão de reais em disputa para atendimento institucional e de marca.',
  'Mapear o consórcio de agências participantes da licitação para construir pacotes de mídia e projetos sob medida para veiculação no jornalismo e conteúdo da RedeTV!.',
  ARRAY['Petroquímica', 'Concorrência Aberta', 'Institucional', 'Petrobras', 'Contas Públicas']
),
(
  'noticia_0810_byd_regional',
  '2026-10-08',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/comunicacao/byd-expansao-investimentos-midia-brasil',
  'BYD amplia investimento em mídia no Brasil e estrutura novos núcleos de marketing regional',
  'Automotivo',
  'BYD Brasil',
  'We',
  'A montadora de eletrificados BYD anunciou uma ampliação de mais de 40% em seu orçamento publicitário no Brasil para o último trimestre, descentralizando a verba com a criação de núcleos regionais para apoiar a rápida expansão de sua rede de concessionárias e lançamentos de veículos híbridos.',
  'Forte expansão de verba publicitária e demanda por ativação regional em praças de alta densidade.',
  'Apresentar proposta de veiculação combinada nacional e praças regionais da RedeTV!, alinhando o plano aos lançamentos dos novos modelos híbridos e eletrificados.',
  ARRAY['Automotivo', 'Aumento de Verba', 'Lançamento', 'Eletrificados', 'BYD']
),

-- 07/10/2026 (QUARTA-FEIRA)
(
  'noticia_0710_nestle_nba',
  '2026-10-07',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/marketing/nestle-acordo-nba-marcas-brasil',
  'Nestlé fecha acordo plurianual com a NBA para as marcas Nescau, Milo e Nesquik no Brasil',
  'Alimentos',
  'Nestlé Brasil',
  'Ogilvy / Dentsu',
  'A Nestlé oficializou uma parceria estratégica de longo prazo com a NBA contemplando 21 países, incluindo o mercado brasileiro. O acordo prevê grandes campanhas de mídia em massa, embalagens especiais, promoções no varejo e ativações voltadas para o público jovem e familiar com Nescau e Nesquik.',
  'Nova grande plataforma de comunicação e patrocínio esportivo com previsão de forte apoio de mídia nacional.',
  'Apresentar cotas de integração esportiva nos telejornais e programas de entretenimento jovem da RedeTV!, conectando o apelo de basquete e estilo de vida da marca Nescau.',
  ARRAY['Alimentos', 'Patrocínio Esportivo', 'Campanha', 'Nescau', 'Nestlé']
),
(
  'noticia_0710_gwm_concorrencia',
  '2026-10-07',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/comunicacao/gwm-inicia-processo-de-concorrencia-de-sua-conta-publicitaria',
  'GWM avança em concorrência de verba principal e convoca seis agências para fase final',
  'Automotivo',
  'GWM Brasil (Great Wall Motors)',
  'Artplan, Fbiz, Galeria, Gut, LePub e Suno',
  'A montadora GWM avançou na concorrência da sua verba principal de publicidade e mídia. Participam da fase final as agências Artplan (atual agência), Fbiz, Galeria, Gut, LePub e Suno United Creators, com foco em reforçar os lançamentos das linhas Haval e Ora no Brasil.',
  'Concorrência de montadora automotiva de alto crescimento com definição iminente de agência e novos voos de mídia.',
  'Fazer contato consultivo com os diretores de mídia das seis agências finalistas antecipando inventário e oportunidades de branded content automotivo para 2026/2027.',
  ARRAY['Automotivo', 'Concorrência em Andamento', 'GWM', 'Montadoras']
),
(
  'noticia_0710_vivo_disney',
  '2026-10-07',
  'PropMark',
  'https://propmark.com.br/vivo-e-disney-campanha-nacional/',
  'Vivo e Disney+ estreiam campanha nacional multicanal de entretenimento e conectividade',
  'Tech e E-Commerce',
  'Vivo (Telefônica Brasil)',
  'Galeria / Africa Creative',
  'A Vivo e a Disney anunciaram campanha nacional conjunta promovendo a oferta convergente de planos pós-pagos e fibra integrados ao streaming Disney+. A comunicação engloba peças de grande alcance na TV aberta, digital e OOH.',
  'Grande esforço conjunto de mídia com foco no consumidor residencial e famílias em todo o país.',
  'Ofertar cotas nos intervalos comerciais nobres do horário nobre e no programa Operação de Risco para amplificação de audiência de massa.',
  ARRAY['Tech e E-Commerce', 'Telecom', 'Campanha Multicanal', 'Vivo', 'Disney']
),
(
  'noticia_0710_outback_campanha',
  '2026-10-07',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/marketing/outback-campanha-outback-coreia',
  'Outback lança campanha de massa e novo cardápio temático com foco na cultura pop',
  'Alimentos',
  'Outback Steakhouse (Bloomin Brands)',
  'Ampfy',
  'A rede Outback Steakhouse iniciou veiculação de sua nova campanha nacional "Outbac-K", celebrando o fenômeno da cultura coreana com pratos exclusivos. A campanha conta com presença intensa em mídia de vídeo, digital e ações com influenciadores.',
  'Lançamento de produto sazonal com investimento concentrado de curto e médio prazo.',
  'Oferecer inserções de merchandising e ações especiais nos programas de entretenimento da RedeTV! direcionadas ao público jovem e jovem-adulto.',
  ARRAY['Alimentos', 'Lançamento de Produto', 'Campanha', 'Outback', 'Gastronomia']
),

-- 06/10/2026 (TERÇA-FEIRA)
(
  'noticia_0610_sephora_juliette',
  '2026-10-06',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/marketing/sephora-anuncia-juliette-embaixadora-halloween',
  'Sephora anuncia Juliette como embaixadora e reúne mais de 30 marcas patrocinadoras em projeto de beleza',
  'Higiene e Beleza',
  'Sephora Brasil',
  'Agência Hood / Publicis',
  'A Sephora confirmou Juliette como embaixadora da sétima edição de seu Baile de Halloween, tradicional projeto que mobiliza os maiores players da indústria de cosméticos e beleza no Brasil. O projeto envolve ações de conteúdo, desdobramentos em TV e cobertura multiplataforma.',
  'Grande projeto de experiência e branding no setor de beleza com copatrocínio de dezenas de marcas de cosméticos.',
  'Mapear as marcas patrocinadoras do projeto Sephora para oferecer pacotes de cobertura especial e matérias no programa TV Fama.',
  ARRAY['Higiene e Beleza', 'Cosméticos', 'Influência', 'Sephora', 'Eventos']
),
(
  'noticia_0610_mcdonalds_diadascriancas',
  '2026-10-06',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/marketing/mcdonalds-campanha-dia-das-criancas-happy-view',
  'McDonalds estreia campanha nacional Happy View para o Dia das Crianças',
  'Alimentos',
  'Arcos Dorados (McDonalds)',
  'GALERIA.ag',
  'A Arcos Dorados colocou no ar a campanha nacional de celebração do Dia das Crianças para o McLanche Feliz, com estratégia centrada em TV aberta e plataformas digitais para conectar pais e filhos em momentos de lazer em família.',
  'Pico sazonal de investimento em mídia com alto volume de inserções na TV aberta.',
  'Apresentar formatos de breaks comerciais nos finais de semana e no horário nobre popular da RedeTV!.',
  ARRAY['Alimentos', 'Fast Food', 'Campanha Sazonal', 'McDonalds', 'Família']
),
(
  'noticia_0610_sabin_wmcann',
  '2026-10-06',
  'PropMark',
  'https://propmark.com.br/sabin-wmcann-campanha-prevencao-sem-vergonha/',
  'Sabin e WMcCann estreiam campanha de saúde preventiva em TV e canais digitais',
  'Saúde e Bem-Estar',
  'Grupo Sabin Medicina Diagnóstica',
  'WMcCann',
  'O Grupo Sabin lançou a campanha institucional "Prevenção sem Vergonha", criada pela WMcCann, com o objetivo de incentivar a realização de exames preventivos regulares e check-ups de rotina, com veiculação em TV aberta nas principais capitais e redes sociais.',
  'Campanha institucional de conscientização com plano de mídia voltado ao público adulto e sênior.',
  'Apresentar oportunidades de apoio e patrocínio no quadro de saúde dos telejornais da emissora.',
  ARRAY['Saúde e Bem-Estar', 'Campanha Institucional', 'Sabin', 'WMcCann']
),

-- 05/10/2026 (SEGUNDA-FEIRA)
(
  'noticia_0510_gol_druid',
  '2026-10-05',
  'PropMark',
  'https://propmark.com.br/druid-conquista-conta-de-redes-sociais-da-gol-linhas-aereas/',
  'Druid vence concorrência e conquista a conta de redes sociais e conteúdo da GOL e Smiles',
  'Turismo e Serviços',
  'GOL Linhas Aéreas / Smiles / GOLLOG',
  'Druid Creative Gaming',
  'A agência Druid foi a vencedora da concorrência promovida pela GOL Linhas Aéreas para o atendimento integrado de redes sociais, influência e conteúdo das marcas GOL, Smiles e GOLLOG, estreando sua nova divisão Feature com foco em cultura pop e viagens.',
  'Troca de agência para a divisão de conteúdo e ativação de fidelidade das marcas do grupo GOL.',
  'Fazer aproximação comercial com a equipe de marketing da Smiles e da Druid para projetos de conteúdo de turismo e passagens em programas de variedades da RedeTV!.',
  ARRAY['Turismo e Serviços', 'Troca de Agência', 'Concorrência', 'GOL', 'Smiles']
),
(
  'noticia_0510_licitacao_gov_sp',
  '2026-10-05',
  'PropMark',
  'https://propmark.com.br/governo-de-sp-define-agencias-de-publicidade/',
  'Governo de SP homologa resultado de licitação de publicidade com quatro agências vencedoras',
  'Agências de Publicidade',
  'Governo do Estado de São Paulo',
  'Filadélfia, Baila Creative, Calia e Ogilvy',
  'O Governo do Estado de São Paulo concluiu e homologou o resultado de sua licitação de propaganda. As agências classificadas para gerir a verba institucional e de serviços públicos do estado foram Filadélfia (1º), Baila Creative (2º), Calia (3º) e Ogilvy (4º).',
  'Homologação de contrato público milionário com definição oficial das quatro agências executoras de mídia.',
  'Agendar visitas comerciais com os heads de mídia das quatro agências homologadas para apresentar grade de programação e capacidade de cobertura estadual da RedeTV! em São Paulo.',
  ARRAY['Agências de Publicidade', 'Licitação Homologada', 'Governo de SP', 'Contas Públicas']
),
(
  'noticia_0510_kopenhagen_wmcann',
  '2026-10-05',
  'PropMark',
  'https://propmark.com.br/kopenhagen-campanha-smurfs-wmcann/',
  'Kopenhagen e WMcCann lançam campanha nacional com linha licenciada para o público corporativo e infantil',
  'Alimentos',
  'Kopenhagen (Grupo CRM / Nestlé)',
  'WMcCann',
  'A Kopenhagen colocou no ar campanha criada pela WMcCann para apresentar sua nova linha de produtos licenciados, explorando a temática corporativa em tom bem-humorado para impulsionar presentes de fim de ano e o Dia das Crianças nas lojas físicas e e-commerce.',
  'Campanha de impulso de vendas e branding com presença de mídia massiva pré-datas comemorativas.',
  'Apresentar formatos de branded content gastronômico e vinhetas nos programas matinais e vespertinos.',
  ARRAY['Alimentos', 'Campanha', 'Kopenhagen', 'Varejo', 'Licenciamento']
),
(
  'noticia_0510_fanta_halloween',
  '2026-10-05',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/marketing/fanta-campanha-halloween-jump-scares',
  'Fanta estreia campanha Jump Scares com compra massiva de vídeo em streaming e TV',
  'Alimentos',
  'Coca-Cola Brasil (Fanta)',
  'WPP Open X / Ogilvy',
  'A marca de refrigerantes Fanta lançou sua maior campanha do ano para o Halloween, inspirada no universo de suspense e terror. A estratégia inclui cotas de destaque em TV aberta, formatos não-pula em streaming e desdobramentos de ponto de venda no país.',
  'A maior ativação anual da marca com verba expressiva alocada em mídia audiovisual de impacto.',
  'Ofertar inserções comerciais exclusivas em programas de alta afinidade com o público jovem e gamer da RedeTV!.',
  ARRAY['Alimentos', 'Bebidas', 'Campanha Nacional', 'Fanta', 'Coca-Cola']
);
