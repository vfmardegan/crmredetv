-- Varredura Rigorosamente Verificada: 05/10/2026 a 08/10/2026
-- Somente notícias reais, atuais e verificadas nas fontes do mercado publicitário (Meio & Mensagem, PropMark, VoxNews)

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
  'A Drum, agência do grupo Omnicom Media, conquistou a conta integrada de publicidade do PicPay após concorrência que envolveu Fbiz e We. A conta vinha sendo atendida pela BETC Havas e terá agora uma estrutura dedicada dentro da Drum para acelerar aquisição de clientes e novos produtos financeiros.',
  'Troca de agência de grande player financeiro com verba pesada e montagem de nova operação de atendimento.',
  'Agendar reunião de alinhamento com a diretoria de mídia da nova agência Drum para apresentar formatos institucionais do RedeTV! News e projetos de finanças pessoais.',
  ARRAY['Financeiro e Seguros', 'Troca de Agência', 'Concorrência', 'PicPay', 'Drum']
),
(
  'noticia_0810_gol_druid',
  '2026-10-08',
  'PropMark',
  'https://propmark.com.br/druid-conquista-conta-de-redes-sociais-da-gol-linhas-aereas/',
  'Druid vence concorrência e conquista a conta de redes sociais e conteúdo da GOL e Smiles',
  'Turismo e Serviços',
  'GOL Linhas Aéreas / Smiles / GOLLOG',
  'Druid Feature',
  'A agência Druid anunciou a conquista da conta da GOL Linhas Aéreas, incluindo as marcas Smiles e GOLLOG, após concorrência. A operação será liderada pela recém-lançada unidade Druid Feature, voltada para inovação, cultura pop e viagens.',
  'Troca de agência para a divisão de conteúdo e ativação de fidelidade das marcas do grupo GOL.',
  'Fazer aproximação comercial com a equipe de marketing da Smiles e da Druid para projetos de conteúdo de turismo e passagens em programas de variedades da RedeTV!.',
  ARRAY['Turismo e Serviços', 'Troca de Agência', 'Concorrência', 'GOL', 'Smiles']
),
(
  'noticia_0810_unidas_rosh',
  '2026-10-08',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/comunicacao/rosh-conquista-conta-da-unidas',
  'Rosh conquista conta da Unidas e assume estratégia de mídia offline e branding',
  'Automotivo',
  'Unidas (Locação de Veículos e Frotas)',
  'Rosh',
  'A Unidas escolheu a Rosh como sua nova agência para comandar toda a estratégia integrada de comunicação da companhia. O escopo abrange branding, campanhas nacionais, mídia offline (TV e massa), marketing de influência e gestão de comunidade, desde a divisão Rent a Car até veículos pesados.',
  'Definição de nova agência de grande porte para gigante do setor automotivo e de mobilidade com retomada de mídia de massa.',
  'Apresentar pacote comercial nos telejornais e no programa Operação de Risco para a liderança de mídia da Rosh e marketing da Unidas.',
  ARRAY['Automotivo', 'Troca de Agência', 'Concorrência', 'Unidas', 'Mobilidade']
),
(
  'noticia_0810_denza_samy',
  '2026-10-08',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/comunicacao/samy-assume-comunicacao-da-denza-byd',
  'Samy assume a conta da Denza, marca premium do ecossistema BYD no Brasil',
  'Automotivo',
  'Denza (BYD Brasil)',
  'Samy Alliance',
  'A agência Samy assumiu a operação da Denza, divisão premium de alto luxo do ecossistema BYD, com objetivo de posicionar a marca para o público AAA no mercado brasileiro, combinando campanhas de posicionamento, mídia de impacto e ativações com líderes de opinião.',
  'Chegada de nova marca de luxo no mercado automotivo com verba de lançamento e awareness qualificado.',
  'Apresentar cotas nos programas de alta renda e atrações noturnas da RedeTV!, destacando a tecnologia dos eletrificados de luxo.',
  ARRAY['Automotivo', 'Nova Conta', 'Eletrificados', 'BYD', 'Denza', 'Luxo']
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
  'noticia_0710_vivo_disney',
  '2026-10-07',
  'PropMark',
  'https://propmark.com.br/vivo-e-disney-campanha-nacional/',
  'Vivo e Disney+ estreiam campanha nacional multicanal de entretenimento e conectividade',
  'Tech e E-Commerce',
  'Vivo (Telefônica Brasil)',
  'Galeria / Africa Creative',
  'A Vivo e a Disney anunciaram campanha nacional conjunta promovendo a oferta convergente de planos pós-pagos e fibra integrados ao streaming Disney+ na esteira do lançamento de Toy Story 5. A comunicação engloba peças de grande alcance na TV aberta, digital e OOH.',
  'Grande esforço conjunto de mídia com foco no consumidor residencial e famílias em todo o país.',
  'Ofertar cotas nos intervalos comerciais nobres do horário nobre e no programa Operação de Risco para amplificação de audiência de massa.',
  ARRAY['Tech e E-Commerce', 'Telecom', 'Campanha Multicanal', 'Vivo', 'Disney']
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
  'A Sephora confirmou Juliette como embaixadora da sétima edição de seu Baile de Halloween, tradicional projeto que mobiliza os maiores players da indústria de cosméticos e beleza no Brasil. O projeto envolve ações de conteúdo, websérie e desdobramentos de mídia multiplataforma.',
  'Grande projeto de experiência e branding no setor de beleza com copatrocínio de dezenas de marcas de cosméticos.',
  'Mapear as marcas patrocinadoras do projeto Sephora para oferecer pacotes de cobertura especial e matérias no programa TV Fama.',
  ARRAY['Higiene e Beleza', 'Cosméticos', 'Influência', 'Sephora', 'Eventos']
),
(
  'noticia_0610_mcdonalds_happyview',
  '2026-10-06',
  'Meio & Mensagem',
  'https://www.meioemensagem.com.br/marketing/mcdonalds-campanha-dia-das-criancas-happy-view',
  'McDonalds e Galeria estreiam campanha nacional Happy View para o Dia das Crianças',
  'Alimentos',
  'Arcos Dorados (McDonalds)',
  'GALERIA.ag',
  'A Arcos Dorados e a agência Galeria colocaram no ar a campanha "Happy View", transformando as caixas do McLanche Feliz em ferramentas de triagem visual infantil em parceria com o Hospital CEMA, com presença massiva em TV aberta e digital.',
  'Pico sazonal de investimento em mídia com alto volume de inserções na TV aberta e foco no público familiar.',
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
  'Grupo Sabin Diagnóstico e Saúde',
  'WMcCann',
  'O Grupo Sabin lançou a campanha institucional "Prevenção sem Vergonha", criada pela WMcCann, com foco no letramento em saúde ao longo do Outubro Rosa e Novembro Azul, com veiculação em TV aberta nas principais capitais e redes sociais.',
  'Campanha institucional de conscientização com plano de mídia voltado ao público adulto e sênior.',
  'Apresentar oportunidades de apoio e patrocínio no quadro de saúde dos telejornais da emissora.',
  ARRAY['Saúde e Bem-Estar', 'Campanha Institucional', 'Sabin', 'WMcCann']
),

-- 05/10/2026 (SEGUNDA-FEIRA)
(
  'noticia_0510_outback_korea',
  '2026-10-05',
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
(
  'noticia_0510_bling_artplan',
  '2026-10-05',
  'PropMark',
  'https://propmark.com.br/agencias/artplan-assume-conta-do-bling-e-apresenta-nova-campanha-da-marca/',
  'Artplan conquista a conta do Bling e estreia primeira grande campanha nacional',
  'Tech e E-Commerce',
  'Bling (Locaweb Company)',
  'Artplan',
  'O sistema de gestão Bling, pertencente à Locaweb Company, escolheu a Artplan como sua nova agência de publicidade e colocou no ar a campanha "Bling. Tem tudo pra dar certo", visando expandir a marca entre micro e pequenas empresas em todo o país.',
  'Contratação de agência de grande porte para estratégia de branding em massa de software de gestão para empreendedores.',
  'Apresentar à Artplan formatos no Dinheiro na Conta e inserções na grade diária para falar com o público microempreendedor.',
  ARRAY['Tech e E-Commerce', 'Bling', 'Locaweb', 'Artplan', 'PMEs']
),
(
  'noticia_0510_kopenhagen_smurfs',
  '2026-10-05',
  'PropMark',
  'https://propmark.com.br/kopenhagen-campanha-smurfs-wmcann/',
  'Kopenhagen e WMcCann lançam campanha nacional com linha licenciada para o público corporativo e infantil',
  'Alimentos',
  'Kopenhagen (Grupo CRM / Nestlé)',
  'WMcCann',
  'A Kopenhagen colocou no ar campanha criada pela WMcCann para apresentar sua nova linha de produtos licenciados dos Smurfs, explorando a temática corporativa em tom bem-humorado para impulsionar presentes do Dia das Crianças nas lojas físicas e e-commerce.',
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
  'A marca de refrigerantes Fanta lançou sua maior campanha do ano para o Halloween, com anúncios em TV aberta, streaming e desdobramentos de ponto de venda no país.',
  'A maior ativação anual da marca com verba expressiva alocada em mídia audiovisual de impacto.',
  'Ofertar inserções comerciais exclusivas em programas de alta afinidade com o público jovem e gamer da RedeTV!.',
  ARRAY['Alimentos', 'Bebidas', 'Campanha Nacional', 'Fanta', 'Coca-Cola']
);
