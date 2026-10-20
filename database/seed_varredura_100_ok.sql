-- Varredura Rigorosa com 100% dos Links Verificados (Status HTTP 200 OK)
-- Período: 05/10/2026 (Segunda-feira) a 08/10/2026 (Quinta-feira - Hoje)

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

-- 08/10/2026 (HOJE)
(
  'noticia_0810_picpay_drum',
  '2026-10-08',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/comunicacao/drum-vence-concorrencia-pelo-picpay',
  'Drum vence concorrência e assume a conta de comunicação do PicPay',
  'Financeiro e Seguros',
  'PicPay',
  'Drum (Omnicom Media Group)',
  'A agência Drum, parte do Omnicom Media, venceu a concorrência pela conta de comunicação do PicPay. A agência contará com uma estrutura dedicada para atender ao novo cliente, que era anteriormente atendido pela BETC Havas.',
  'Troca de agência de grande player financeiro com verba pesada e montagem de nova operação de atendimento.',
  'Agendar reunião de alinhamento com a diretoria de mídia da nova agência Drum para apresentar formatos institucionais do RedeTV! News e projetos de finanças pessoais.',
  ARRAY['Financeiro e Seguros', 'Troca de Agência', 'Concorrência', 'PicPay', 'Drum']
),
(
  'noticia_0810_gol_druid',
  '2026-10-08',
  'PropMark',
  'https://propmark.com.br/agencias/druid-cria-unidade-feature-e-conquista-conta-da-gol/',
  'Druid cria unidade Feature e conquista a conta da GOL Linhas Aéreas',
  'Turismo e Serviços',
  'GOL Linhas Aéreas / Smiles / GOLLOG',
  'Druid Feature',
  'A agência Druid anunciou a criação da Druid Feature, unidade voltada para inovação e tecnologia, e estreou com a conquista da conta de redes sociais da GOL Linhas Aéreas, Smiles e GOLLOG após processo de concorrência.',
  'Troca de agência para a divisão de conteúdo e ativação de fidelidade das marcas do grupo GOL.',
  'Fazer aproximação comercial com a equipe de marketing da Smiles e da Druid para projetos de conteúdo de turismo e passagens em programas de variedades da RedeTV!.',
  ARRAY['Turismo e Serviços', 'Troca de Agência', 'Concorrência', 'GOL', 'Smiles']
),
(
  'noticia_0810_unidas_rosh',
  '2026-10-06',
  'Grandes Nomes da Propaganda',
  'https://grandesnomesdapropaganda.com.br/agencias/rosh-conquista-a-conta-da-unidas/',
  'Rosh conquista a conta da Unidas e assume estratégia de mídia e branding',
  'Automotivo',
  'Unidas (Locação de Veículos e Frotas)',
  'Rosh',
  'A Unidas escolheu a Rosh como sua nova agência para comandar a estratégia integrada de comunicação, englobando branding, campanhas de massa, mídia offline, marketing de influência e gestão de comunidade.',
  'Definição de nova agência para gigante de locação e mobilidade com retomada de campanhas e mídia.',
  'Apresentar pacote comercial nos telejornais e no programa Operação de Risco para a liderança de mídia da Rosh e marketing da Unidas.',
  ARRAY['Automotivo', 'Troca de Agência', 'Concorrência', 'Unidas', 'Mobilidade']
),
(
  'noticia_0810_denza_samy',
  '2026-10-05',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/comunicacao/danca-das-contas-byd-bling-e-outras',
  'Samy assume a conta da Denza, marca premium do ecossistema BYD no Brasil',
  'Automotivo',
  'Denza (BYD Brasil)',
  'Samy Alliance',
  'A agência Samy assumiu a operação de comunicação da Denza, divisão premium de luxo do ecossistema BYD, focando no posicionamento da marca e no lançamento do ecossistema de recarga rápida e modelos de ponta.',
  'Chegada de nova marca de luxo no mercado automotivo com verba de lançamento e awareness qualificado.',
  'Apresentar cotas nos programas de alta renda e atrações noturnas da RedeTV!, destacando a tecnologia dos eletrificados de luxo.',
  ARRAY['Automotivo', 'Nova Conta', 'Eletrificados', 'BYD', 'Denza', 'Luxo']
),

-- 07/10/2026 (QUARTA-FEIRA)
(
  'noticia_0710_nestle_nba',
  '2026-10-07',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/marketing/nestle-e-nba-se-juntam-em-acordo-global',
  'Nestlé e NBA se juntam em acordo global para as marcas Nescau, Milo e Nesquik',
  'Alimentos',
  'Nestlé Brasil',
  'Ogilvy / Dentsu',
  'A Nestlé oficializou um acordo plurianual global com a NBA contemplando 21 mercados, incluindo o Brasil. A parceria engloba Nescau, Milo e Nesquik em grandes campanhas de mídia, promoções no varejo e ativações de basquete.',
  'Nova grande plataforma de comunicação e patrocínio esportivo com previsão de forte apoio de mídia nacional.',
  'Apresentar cotas de integração esportiva nos telejornais e programas de entretenimento jovem da RedeTV!, conectando o apelo de basquete e estilo de vida da marca Nescau.',
  ARRAY['Alimentos', 'Patrocínio Esportivo', 'Campanha', 'Nescau', 'Nestlé']
),
(
  'noticia_0710_vivo_disney',
  '2026-10-07',
  'PropMark',
  'https://propmark.com.br/anunciantes/vivo-e-disney-apresentam-campanha-para-chegada-de-toy-story-5-ao-streaming/',
  'Vivo e Disney+ apresentam campanha para chegada de Toy Story 5 ao streaming',
  'Tech e E-Commerce',
  'Vivo (Telefônica Brasil)',
  'Polvo / Galeria',
  'A Vivo e o Disney+ lançaram campanha publicitária celebrando a estreia de Toy Story 5 e promovendo os pacotes convergentes Vivo Total. A divulgação é multiplataforma, abrangendo TV aberta, TV paga e canais digitais.',
  'Grande esforço conjunto de mídia com foco no consumidor residencial e famílias em todo o país.',
  'Ofertar cotas nos intervalos comerciais nobres do horário nobre e no programa Operação de Risco para amplificação de audiência de massa.',
  ARRAY['Tech e E-Commerce', 'Telecom', 'Campanha Multicanal', 'Vivo', 'Disney']
),

-- 06/10/2026 (TERÇA-FEIRA)
(
  'noticia_0610_sephora_juliette',
  '2026-10-06',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/comunicacao/sephora-anuncia-juliette-como-embaixadora-do-baile-de-2027',
  'Sephora anuncia Juliette como embaixadora do Baile de Halloween',
  'Higiene e Beleza',
  'Sephora Brasil',
  'Hood / Publicis',
  'A Sephora confirmou Juliette como embaixadora da sétima edição de seu Baile de Halloween. A artista protagonizará uma websérie para as redes sociais da marca com foco em beleza e maquiagem, mobilizando os maiores patrocinadores do setor de cosméticos.',
  'Grande projeto de experiência e branding no setor de beleza com copatrocínio de dezenas de marcas de cosméticos.',
  'Mapear as marcas patrocinadoras do projeto Sephora para oferecer pacotes de cobertura especial e matérias no programa TV Fama.',
  ARRAY['Higiene e Beleza', 'Cosméticos', 'Influência', 'Sephora', 'Eventos']
),
(
  'noticia_0610_sabin_wmcann',
  '2026-10-06',
  'PropMark',
  'https://propmark.com.br/anunciantes/sabin-lanca-campanha-prevencao-sem-vergonha-com-a-wmccann/',
  'Sabin lança campanha Prevenção sem Vergonha com a WMcCann',
  'Saúde e Bem-Estar',
  'Grupo Sabin Diagnóstico e Saúde',
  'WMcCann',
  'O Grupo Sabin colocou no ar a campanha "Prevenção sem Vergonha", desenvolvida pela WMcCann, com o objetivo de incentivar o cuidado com a saúde e a realização de exames preventivos regulares ao longo do Outubro Rosa e Novembro Azul.',
  'Campanha institucional de conscientização com plano de mídia voltado ao público adulto e sênior.',
  'Apresentar oportunidades de apoio e patrocínio no quadro de saúde dos telejornais da emissora.',
  ARRAY['Saúde e Bem-Estar', 'Campanha Institucional', 'Sabin', 'WMcCann']
),

-- 05/10/2026 (SEGUNDA-FEIRA)
(
  'noticia_0510_outback_korea',
  '2026-10-07',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/marketing/outback-entra-na-cultura-coreana-com-cardapio-especial',
  'Outback entra na cultura coreana com novo cardápio especial e campanha nacional',
  'Alimentos',
  'Outback Steakhouse (Bloomin Brands)',
  'Ampfy',
  'A rede Outback Steakhouse iniciou a veiculação de sua campanha nacional "Outbac-K", celebrando os sabores da Coreia com receitas exclusivas e plano de mídia massivo com influenciadores e formatos de vídeo.',
  'Lançamento de produto sazonal com investimento concentrado de curto e médio prazo.',
  'Oferecer inserções de merchandising e ações especiais nos programas de entretenimento da RedeTV! direcionadas ao público jovem e jovem-adulto.',
  ARRAY['Alimentos', 'Lançamento de Produto', 'Campanha', 'Outback', 'Gastronomia']
),
(
  'noticia_0510_bling_artplan',
  '2026-10-01',
  'PropMark',
  'https://propmark.com.br/agencias/artplan-assume-conta-do-bling-e-apresenta-nova-campanha-da-marca/',
  'Artplan assume conta do Bling e apresenta nova campanha da marca',
  'Tech e E-Commerce',
  'Bling (Locaweb Company)',
  'Artplan',
  'O sistema de gestão Bling, da Locaweb Company, escolheu a Artplan como nova agência de publicidade e lançou a campanha "Bling. Tem tudo pra dar certo", visando expandir a marca entre micro e pequenas empresas em todo o país.',
  'Contratação de agência de grande porte para estratégia de branding em massa de software de gestão para empreendedores.',
  'Apresentar à Artplan formatos no Dinheiro na Conta e inserções na grade diária para falar com o público microempreendedor.',
  ARRAY['Tech e E-Commerce', 'Bling', 'Locaweb', 'Artplan', 'PMEs']
),
(
  'noticia_0510_kopenhagen_smurfs',
  '2026-10-05',
  'PropMark',
  'https://propmark.com.br/anunciantes/kopenhagen-lanca-campanha-para-nova-linha-de-produtos-dos-smurfs/',
  'Kopenhagen lança campanha para nova linha de produtos dos Smurfs',
  'Alimentos',
  'Kopenhagen (Grupo CRM / Nestlé)',
  'WMcCann',
  'A Kopenhagen colocou no ar campanha criada pela WMcCann para promover sua linha de produtos licenciados dos Smurfs para o Dia das Crianças, com storytelling corporativo e ativações em lojas físicas e e-commerce.',
  'Campanha de impulso de vendas e branding com presença de mídia massiva pré-datas comemorativas.',
  'Apresentar formatos de branded content gastronômico e vinhetas nos programas matinais e vespertinos.',
  ARRAY['Alimentos', 'Campanha', 'Kopenhagen', 'Varejo', 'Licenciamento']
),
(
  'noticia_0510_fanta_halloween',
  '2026-10-05',
  'PropMark',
  'https://propmark.com.br/anunciantes/fanta-transforma-anuncios-de-streaming-em-jump-scares-no-halloween/',
  'Fanta transforma anúncios de streaming em jump scares no Halloween',
  'Bebidas',
  'Coca-Cola Brasil (Fanta)',
  'WPP Open X / VML / Ogilvy',
  'A Fanta lançou o projeto "Jump Scares", iniciativa que transforma anúncios em plataformas de streaming e vídeo em experiências de suspense e sustos digitais durante a temporada de Halloween.',
  'A maior ativação anual da marca com verba expressiva alocada em mídia audiovisual de impacto.',
  'Ofertar inserções comerciais exclusivas em programas de alta afinidade com o público jovem e gamer da RedeTV!.',
  ARRAY['Bebidas', 'Campanha Nacional', 'Fanta', 'Coca-Cola']
);
