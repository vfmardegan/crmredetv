-- =========================================================
-- CRM Comercial RedeTV! — schema único, para implementação do zero
-- Consolida o que antes eram 4 arquivos incrementais num só.
-- Todas as tabelas já nascem com a estrutura final (sem ALTER TABLE).
-- Gerado a partir do protótipo (crm-comercial-redetv.jsx).
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- TABELAS
-- ---------------------------------------------------------

create table clients (
  id text primary key,
  codigo text,
  razao_social text not null,
  cnpj text,
  nome_fantasia text,
  type text not null check (type in ('Agência', 'Anunciante')),
  segmento text,
  created_at timestamptz not null default now()
);

create table agency_links (
  agency_id text not null references clients(id) on delete cascade,
  advertiser_id text not null references clients(id) on delete cascade,
  primary key (agency_id, advertiser_id)
);

create table contacts (
  id text primary key,
  client_id text references clients(id) on delete cascade,
  name text not null,
  cargo text,
  departamento text,
  nivel_decisao text,
  celular text,
  email text,
  esportes text[] not null default '{}',
  esportes_outro text,
  hobbies text[] not null default '{}',
  hobbies_outro text,
  time_coracao text,
  filhos integer,
  created_at timestamptz not null default now()
);

create table executivos (
  id text primary key,
  nome text not null,
  created_at timestamptz not null default now()
);

-- Carteira: segmento é a própria chave primária — garante no banco que um
-- segmento nunca pertence a mais de um executivo ao mesmo tempo.
create table segmento_executivo (
  segmento text primary key,
  executivo_id text not null references executivos(id) on delete cascade,
  updated_at timestamptz not null default now()
);

create table opportunities (
  id text primary key,
  title text not null,
  executivo text,                               -- nome do executivo (ver nota no fim do arquivo)
  agency_id text references clients(id),        -- null = Cliente Direto
  advertiser_id text not null references clients(id),
  contact_id text references contacts(id),
  products text[] not null default '{}',
  value numeric(14,2) not null default 0,
  stage text not null check (stage in ('Desenvolvimento','Frio','Morno','Quente','Fechado','Negado')),
  period_months text[] not null default '{}',   -- códigos "AAAA-Mês", ex. "2026-Out"
  briefing text,
  responsavel text,
  tipo text check (tipo in ('Novo','Refação','Customização')),
  versao integer not null default 1,
  status text check (status in ('Pendente','Desenvolvimento','Aprovação','Entregue','Comercializado','Negativado','Cancelado')),
  observacao text,
  plan_delivery_date date,
  data_criacao date,
  data_entrega date,
  previsao_fechamento date,
  created_at timestamptz not null default now()
);

create table proposal_templates (
  id text primary key,
  product text,
  title text not null,
  subtitle text,
  horario text,
  periodo text,
  pdf_file_name text,
  pdf_data_uri text,
  created_at timestamptz not null default now()
);

create table sent_proposals (
  id text primary key,
  template_id text references proposal_templates(id),
  contact_id text references contacts(id),
  opportunity_id text references opportunities(id),
  sent_at timestamptz not null default now()
);

-- Faturamento efetivo: feed diário do sistema OPEC, por Código do cliente.
create table faturamento_efetivo (
  id text primary key,
  cliente_codigo text not null,
  periodo text not null,        -- código "AAAA-Mês", ex. "2026-Jun"
  valor numeric(14,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (cliente_codigo, periodo)
);

-- Metas: por Segmento (nunca por cliente), carga de dados via SQL.
create table metas (
  id text primary key,
  segmento text not null,
  periodo text not null,        -- código "AAAA-Mês", ex. "2026-Out"
  valor numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (segmento, periodo)
);

create index idx_contacts_client_id on contacts(client_id);
create index idx_opportunities_advertiser_id on opportunities(advertiser_id);
create index idx_opportunities_agency_id on opportunities(agency_id);
create index idx_opportunities_contact_id on opportunities(contact_id);
create index idx_segmento_executivo_executivo_id on segmento_executivo(executivo_id);
create index idx_faturamento_efetivo_codigo on faturamento_efetivo(cliente_codigo);
create index idx_metas_segmento on metas(segmento);

-- ---------------------------------------------------------
-- RLS — habilitado, com política aberta de leitura/escrita.
-- Adequado só para prototipagem/dado de exemplo. Antes de
-- qualquer dado real, troque por políticas amarradas a auth.uid().
-- ---------------------------------------------------------
alter table clients enable row level security;
create policy "allow_all_clients" on clients for all using (true) with check (true);
alter table agency_links enable row level security;
create policy "allow_all_agency_links" on agency_links for all using (true) with check (true);
alter table contacts enable row level security;
create policy "allow_all_contacts" on contacts for all using (true) with check (true);
alter table executivos enable row level security;
create policy "allow_all_executivos" on executivos for all using (true) with check (true);
alter table segmento_executivo enable row level security;
create policy "allow_all_segmento_executivo" on segmento_executivo for all using (true) with check (true);
alter table opportunities enable row level security;
create policy "allow_all_opportunities" on opportunities for all using (true) with check (true);
alter table proposal_templates enable row level security;
create policy "allow_all_proposal_templates" on proposal_templates for all using (true) with check (true);
alter table sent_proposals enable row level security;
create policy "allow_all_sent_proposals" on sent_proposals for all using (true) with check (true);
alter table faturamento_efetivo enable row level security;
create policy "allow_all_faturamento_efetivo" on faturamento_efetivo for all using (true) with check (true);
alter table metas enable row level security;
create policy "allow_all_metas" on metas for all using (true) with check (true);

-- ---------------------------------------------------------
-- DADOS DE EXEMPLO (ordem respeita as chaves estrangeiras)
-- ---------------------------------------------------------

-- Clientes
insert into clients (id, codigo, razao_social, cnpj, nome_fantasia, type, segmento) values
  ('a1', '1001', 'Vantana Alimentos Ltda.', '12345678000190', 'Grupo Vantana Alimentos', 'Anunciante', 'Alimentos'),
  ('a2', '1002', 'Fluxo Comunicação e Publicidade Ltda.', '23456789000181', 'Agência Fluxo Comunicação', 'Agência', NULL),
  ('a3', '1003', 'Banco Horizonte S.A.', '34567890000172', 'Banco Horizonte', 'Anunciante', 'Financeiro e Seguros'),
  ('a4', '1004', 'Prisma Mídia Planejamento Ltda.', '45678900000163', 'Agência Prisma Mídia', 'Agência', NULL),
  ('a5', '1005', 'Bela Linha Indústria de Cosméticos Ltda.', '56789000000154', 'Bela Linha Cosméticos', 'Anunciante', 'Higiene e Beleza'),
  ('a6', '1006', 'Construtora Amplo Engenharia Ltda.', '67890100000145', 'Construtora Amplo', 'Anunciante', 'Construção, Imobiliário e Decoração');

-- Vínculos Agência -> Anunciantes atendidos
insert into agency_links (agency_id, advertiser_id) values
  ('a2', 'a1'),
  ('a2', 'a6'),
  ('a4', 'a5');

-- Contatos
insert into contacts (id, client_id, name, cargo, departamento, nivel_decisao, celular, email, esportes, hobbies, time_coracao, filhos) values
  ('c1', 'a1', 'Marina Costa', 'Gerente de Mídia', 'Marketing', 'Gerência', '11987650001', 'marina.costa@vantana.com.br', '{"Corrida","Vôlei"}', '{}', 'Palmeiras', 1),
  ('c2', 'a2', 'Rafael Andrade', 'Diretor de Contas', 'Atendimento', 'Diretoria', '11987650002', 'rafael.andrade@fluxocomunicacao.com.br', '{"Futebol","Tênis"}', '{}', 'Flamengo', 2),
  ('c3', 'a3', 'Juliana Prado', 'Coordenadora de Marketing', 'Marketing', 'Analista', '11987650003', 'juliana.prado@bancohorizonte.com.br', '{"Natação"}', '{}', NULL, 0),
  ('c4', 'a4', 'Eduardo Lima', 'Planejador de mídia', 'Planejamento', 'Operação', '11987650004', 'eduardo.lima@prismamidia.com.br', '{"Futebol","Corrida"}', '{}', 'Corinthians', 0),
  ('c5', 'a5', 'Patrícia Nogueira', 'Head de Marketing', 'Marketing', 'C-Level', '11987650005', 'patricia.nogueira@belalinha.com.br', '{"Golfe","Tênis"}', '{}', 'São Paulo', 2),
  ('c6', 'a6', 'Carlos Bittencourt', 'Gerente Comercial', 'Comercial', 'Gerência', '11987650006', 'carlos.bittencourt@construtoraamplo.com.br', '{"Futebol","Artes Marciais"}', '{}', 'Vasco da Gama', 3);

-- Executivos
insert into executivos (id, nome) values
  ('e1', 'Bruno Camargo'),
  ('e2', 'Ana Beatriz Souza'),
  ('e3', 'Diego Martins'),
  ('e4', 'Larissa Ferreira'),
  ('e5', 'Rodrigo Nunes');

-- Carteira (Segmento -> Executivo)
insert into segmento_executivo (segmento, executivo_id) values
  ('Alimentos', 'e1'),
  ('Financeiro e Seguros', 'e2'),
  ('Higiene e Beleza', 'e3'),
  ('Construção, Imobiliário e Decoração', 'e4'),
  ('Tech e E-Commerce', 'e5'),
  ('Entretenimento', 'e5');

-- Oportunidades
insert into opportunities (id, title, executivo, agency_id, advertiser_id, contact_id, products, value, stage, period_months, briefing, responsavel, tipo, versao, status, observacao, plan_delivery_date, data_criacao, data_entrega, previsao_fechamento) values
  ('o1', 'Patrocínio novela das 21h', 'Bruno Camargo', NULL, 'a1', 'c1', '{"Superpop"}', 850000, 'Quente', '{"2026-Ago","2026-Set"}', 'Cliente quer presença forte em abertura e encerramento do programa, com menção do apresentador ao vivo. Pediu para evitar concorrentes diretos do setor de alimentos na mesma janela. Já usou formato parecido em 2025 com boa recepção.', 'Camila Rezende', 'Novo', 1, 'Aprovação', 'Cliente pediu contraproposta com bônus de inserções — aguardando aprovação do valor final.', NULL, '2026-06-01', '2026-07-20', '2026-07-15'),
  ('o2', 'Pacote comercial futebol', 'Ana Beatriz Souza', 'a2', 'a1', 'c2', '{"Bola Na Rede"}', 420000, 'Morno', '{"2026-Jul"}', NULL, 'Thiago Alves', 'Novo', 1, 'Desenvolvimento', NULL, NULL, '2026-06-10', '2026-06-28', '2026-06-25'),
  ('o3', 'Merchandising programa manhã', 'Diego Martins', NULL, 'a3', 'c3', '{"Fica Com A Gente"}', 180000, 'Frio', '{"2026-Set"}', NULL, NULL, 'Novo', 1, 'Pendente', NULL, NULL, '2026-06-15', '2026-08-20', '2026-08-10'),
  ('o4', 'Cross-media grade + digital', 'Larissa Ferreira', 'a4', 'a5', 'c4', '{"Social Media","Google Partner Sales"}', 610000, 'Desenvolvimento', '{"2026-Out","2026-Nov","2026-Dez","2027-Jan","2027-Fev","2027-Mar"}', 'Anunciante quer testar formato cross-media pela primeira vez, com foco em performance digital casado com presença na grade. Pediu relatório mensal de resultados e possibilidade de ajuste de verba entre os canais ao longo da campanha.', NULL, 'Customização', 1, 'Pendente', NULL, NULL, '2026-06-20', '2026-09-25', '2026-09-15'),
  ('o5', 'Comercial 15" horário nobre', 'Rodrigo Nunes', NULL, 'a5', 'c5', '{"TV Fama"}', 260000, 'Fechado', '{"2026-Jun"}', NULL, 'Thiago Alves', 'Novo', 1, 'Comercializado', NULL, '2026-05-28', '2026-05-05', '2026-05-28', '2026-05-25'),
  ('o6', 'Patrocínio previsão do tempo', 'Bruno Camargo', NULL, 'a6', 'c6', '{"RedeTV! Notícias - 1ª Edição"}', 320000, 'Quente', '{"2026-Ago"}', NULL, 'Juliana Matos', 'Novo', 1, 'Aprovação', NULL, NULL, '2026-06-12', '2026-07-25', '2026-07-20'),
  ('o7', 'Ação de merchandising verão', 'Ana Beatriz Souza', NULL, 'a1', 'c1', '{"Sensacional"}', 150000, 'Negado', '{"2026-Jan"}', NULL, NULL, 'Novo', 1, 'Negativado', NULL, '2026-01-15', '2025-11-10', '2026-01-15', '2026-01-10'),
  ('o8', 'Renovação pacote anual', 'Diego Martins', 'a2', 'a6', 'c2', '{"Superpop","TV Fama"}', 980000, 'Frio', '{"2027-Jan","2027-Fev","2027-Mar","2027-Abr","2027-Mai","2027-Jun","2027-Jul","2027-Ago","2027-Set","2027-Out","2027-Nov","2027-Dez"}', 'Renovação do pacote anual vigente, com pedido de revisão de valor por conta do aumento de verba do grupo para o próximo exercício.', NULL, 'Refação', 2, 'Pendente', 'Segunda revisão do pacote anual; financeiro do grupo pediu novo desconto.', NULL, '2026-06-22', '2026-12-15', '2026-11-30'),
  ('o9', 'Patrocínio À Tarde É Sua', 'Larissa Ferreira', NULL, 'a3', 'c3', '{"A Tarde É Sua"}', 410000, 'Desenvolvimento', '{"2026-Set","2026-Out"}', 'Banco quer aproveitar o horário de maior audiência feminina para reforçar campanha de crédito consignado. Pediu formato que permita testemunhal de clientes reais.', NULL, 'Novo', 1, 'Pendente', NULL, NULL, '2026-06-25', '2026-08-30', '2026-08-20'),
  ('o10', 'Comercial Rodada De Negócios', 'Rodrigo Nunes', 'a2', 'a1', 'c2', '{"Rodada De Negócios"}', 275000, 'Desenvolvimento', '{"2026-Nov"}', 'Cliente pede visibilidade em rodada de negócios voltada para varejo alimentício, com foco em relacionamento B2B e geração de leads qualificados.', NULL, 'Novo', 1, 'Pendente', NULL, NULL, '2026-06-28', '2026-10-20', '2026-10-10'),
  ('o11', 'Ação Para Aqui — Feirão Imobiliário', 'Bruno Camargo', NULL, 'a6', 'c6', '{"Para Aqui"}', 198000, 'Desenvolvimento', '{"2026-Ago"}', 'Construtora quer aproveitar o quadro para divulgar feirão de lançamentos imobiliários na Grande SP, com chamada direta para visitação do stand.', NULL, 'Novo', 1, 'Pendente', NULL, NULL, '2026-06-18', '2026-07-30', '2026-07-25'),
  ('o12', 'Patrocínio Bezona', 'Ana Beatriz Souza', 'a4', 'a5', 'c4', '{"Bezona"}', 356000, 'Desenvolvimento', '{"2026-Dez"}', 'Marca de cosméticos busca associar produto a quadro de humor popular entre público jovem, com menção de produto em cena.', NULL, 'Novo', 1, 'Pendente', NULL, NULL, '2026-06-29', '2026-11-25', '2026-11-15'),
  ('o13', 'Cota RedeTV! Notícias — 1ª Edição', 'Diego Martins', NULL, 'a3', 'c3', '{"RedeTV! Notícias - 1ª Edição"}', 289000, 'Frio', '{"2026-Set"}', 'Anunciante avalia entrada no telejornal para reforçar solidez institucional após lançamento de nova linha de investimentos.', NULL, 'Novo', 1, 'Pendente', NULL, NULL, '2026-06-05', '2026-08-25', '2026-08-15'),
  ('o15', 'Pacote Social Media Bela Linha', 'Larissa Ferreira', NULL, 'a5', 'c5', '{"Social Media"}', 145000, 'Frio', '{"2026-Ago","2026-Set"}', 'Cliente quer testar pacote 100% digital antes de comprometer verba de TV, com foco em performance nas redes.', NULL, 'Novo', 1, 'Pendente', NULL, NULL, '2026-06-11', '2026-07-28', '2026-07-20'),
  ('o16', 'Patrocínio American Zone', 'Rodrigo Nunes', 'a4', 'a5', 'c4', '{"American Zone"}', 398000, 'Frio', '{"2026-Nov"}', 'Marca de beleza avalia o formato internacional do quadro para posicionar produto premium junto ao público classe AB.', NULL, 'Novo', 1, 'Pendente', NULL, NULL, '2026-06-14', '2026-10-15', '2026-10-05'),
  ('o17', 'Ação de Trade Leitura Dinâmica', 'Bruno Camargo', 'a2', 'a1', 'c2', '{"Leitura Dinâmica"}', 233000, 'Morno', '{"2026-Set"}', 'Anunciante quer patrocinar quadro educativo, alinhado com iniciativa de responsabilidade social da marca.', 'Camila Rezende', 'Novo', 1, 'Desenvolvimento', NULL, NULL, '2026-06-02', '2026-08-18', '2026-08-08'),
  ('o18', 'Cota Rotativo — Praça SP', 'Ana Beatriz Souza', NULL, 'a6', 'c6', '{"Rotativo"}', 176000, 'Morno', '{"2026-Jul","2026-Ago"}', 'Cliente pede cota rotativa para começar a testar presença na emissora antes de negociar pacote fechado maior.', 'Thiago Alves', 'Novo', 1, 'Desenvolvimento', NULL, NULL, '2026-05-30', '2026-07-10', '2026-07-05'),
  ('o19', 'Pacote Digital Performance', 'Diego Martins', 'a4', 'a5', 'c4', '{"Google Partner Sales","Soft News"}', 267000, 'Morno', '{"2026-Ago","2026-Set","2026-Out"}', 'Agência propõe combinar mídia programática digital com conteúdo editorial de bem-estar para a marca.', 'Juliana Matos', 'Customização', 1, 'Desenvolvimento', 'Combinação de formatos ainda em validação com o time de planejamento digital.', NULL, '2026-06-01', '2026-07-25', '2026-07-18'),
  ('o20', 'Patrocínio É Notícia', 'Larissa Ferreira', NULL, 'a3', 'c3', '{"É Notícia"}', 342000, 'Morno', '{"2026-Set","2026-Out"}', 'Anunciante quer aproveitar o debate direto do quadro para reforçar transparência de seus produtos financeiros.', 'Camila Rezende', 'Novo', 1, 'Desenvolvimento', NULL, NULL, '2026-06-06', '2026-08-22', '2026-08-12'),
  ('o21', 'Cota Nacional RJ Do Povo', 'Rodrigo Nunes', 'a2', 'a6', 'c2', '{"RJ Do Povo"}', 621000, 'Quente', '{"2026-Ago","2026-Set","2026-Out"}', 'Agência negocia cota nacional para reforçar presença da construtora em praças estratégicas do Rio e do Sudeste.', 'Thiago Alves', 'Novo', 1, 'Aprovação', NULL, NULL, '2026-06-15', '2026-07-31', '2026-07-22'),
  ('o22', 'Patrocínio Nordeste Do Povo', 'Bruno Camargo', NULL, 'a1', 'c1', '{"Nordeste Do Povo"}', 458000, 'Quente', '{"2026-Jul","2026-Ago"}', 'Cliente quer associar a marca a conteúdo popular e regional, reforçando conexão com o consumidor nordestino.', 'Juliana Matos', 'Novo', 1, 'Aprovação', NULL, NULL, '2026-06-03', '2026-07-15', '2026-07-08'),
  ('o23', 'Ação Pegadinhas + Esportes Digital', 'Ana Beatriz Souza', NULL, 'a5', 'c5', '{"Pegadinhas","Esportes"}', 189000, 'Fechado', '{"2026-Jun"}', 'Ação fechada de pegadinha personalizada com a marca, mais impulsionamento esportivo digital, já em fase de produção.', 'Camila Rezende', 'Novo', 1, 'Comercializado', NULL, '2026-06-20', '2026-05-10', '2026-06-20', '2026-06-15'),
  ('o24', 'Comercial Brasil Do Povo', 'Diego Martins', 'a2', 'a1', 'c2', '{"Brasil Do Povo"}', 372000, 'Negado', '{"2026-Mai"}', 'Proposta recusada pelo cliente por incompatibilidade de calendário com campanha já fechada de concorrente direto.', NULL, 'Novo', 1, 'Negativado', 'Cliente fechou com concorrente direto no mesmo período — sem espaço pra revisão.', '2026-05-25', '2026-04-20', '2026-05-25', '2026-05-18'),
  ('o25', 'Renovação Cota Programmatic TV', 'Larissa Ferreira', 'a4', 'a5', 'c4', '{"Programmatic TV"}', 210000, 'Fechado', '{"2027-Jan","2027-Fev"}', 'Renovação automática do pacote programático do ano anterior, já aprovada pelo financeiro do anunciante.', 'Juliana Matos', 'Refação', 2, 'Comercializado', NULL, '2027-01-15', '2026-06-20', '2027-01-15', '2027-01-05'),
  ('o26', 'Patrocínio Operação De Risco', 'Rodrigo Nunes', NULL, 'a6', 'c6', '{"Operação De Risco"}', 295000, 'Negado', '{"2027-Mar"}', 'Cliente optou por não renovar o patrocínio após reavaliação do budget de marketing para o próximo trimestre.', NULL, 'Novo', 1, 'Negativado', NULL, '2027-02-20', '2026-06-25', '2027-02-20', '2027-02-10'),
  ('o27', 'Patrocínio Superpop — Renovação Trimestral', 'Bruno Camargo', 'a4', 'a5', 'c4', '{"Superpop"}', 445000, 'Desenvolvimento', '{"2026-Nov","2026-Dez","2027-Jan"}', 'Cliente quer estender o patrocínio já ativo por mais um trimestre, incluindo a virada de ano, aproveitando a sazonalidade de fim de ano no varejo.', NULL, 'Refação', 2, 'Pendente', 'Extensão do patrocínio ativo; só falta assinatura do aditivo.', NULL, '2026-06-20', '2026-10-25', '2026-10-15'),
  ('o28', 'Cota Fica Com A Gente — Lançamento de Produto', 'Ana Beatriz Souza', NULL, 'a1', 'c1', '{"Fica Com A Gente"}', 265000, 'Desenvolvimento', '{"2026-Ago"}', 'Anunciante lança nova linha de produtos e quer presença no programa matinal para gerar recall imediato com o público consumidor.', NULL, 'Novo', 1, 'Pendente', NULL, NULL, '2026-06-22', '2026-07-28', '2026-07-20'),
  ('o29', 'Patrocínio A Tarde É Sua — 1ª Edição', 'Diego Martins', 'a2', 'a6', 'c2', '{"A Tarde É Sua - 1ª Edição"}', 312000, 'Desenvolvimento', '{"2026-Set","2026-Out"}', 'Construtora busca associar a marca a conteúdo de entretenimento vespertino, com foco em público interessado em decoração e reforma.', NULL, 'Novo', 1, 'Pendente', NULL, NULL, '2026-06-24', '2026-08-28', '2026-08-18'),
  ('o30', 'Comercial RedeTV! News', 'Larissa Ferreira', NULL, 'a3', 'c3', '{"RedeTV! News"}', 187000, 'Frio', '{"2026-Ago"}', 'Banco quer testar formato de telejornal noturno para reforçar presença institucional fora do horário nobre tradicional.', NULL, 'Novo', 1, 'Pendente', NULL, NULL, '2026-06-07', '2026-07-25', '2026-07-15'),
  ('o31', 'Ação Rotativo + Digital', 'Rodrigo Nunes', 'a4', 'a5', 'c4', '{"Rotativo","Soft News"}', 229000, 'Frio', '{"2026-Set","2026-Out"}', 'Marca de beleza avalia combinar cota rotativa de TV com inserção digital editorial, buscando eficiência de custo por impacto.', NULL, 'Novo', 1, 'Pendente', NULL, NULL, '2026-06-09', '2026-08-20', '2026-08-10'),
  ('o32', 'Patrocínio Rodada De Negócios — Feira Setorial', 'Bruno Camargo', NULL, 'a6', 'c6', '{"Rodada De Negócios"}', 341000, 'Morno', '{"2026-Ago"}', 'Construtora quer patrocinar a cobertura de feira setorial de construção civil, com menção direta a lançamentos da empresa.', 'Camila Rezende', 'Novo', 1, 'Desenvolvimento', NULL, NULL, '2026-05-28', '2026-07-20', '2026-07-12'),
  ('o33', 'Cota Bola Na Rede — Copa Regional', 'Ana Beatriz Souza', 'a2', 'a1', 'c2', '{"Bola Na Rede"}', 578000, 'Morno', '{"2026-Jul","2026-Ago"}', 'Alimentício quer aproveitar o pico de audiência da competição regional de futebol para reforçar a marca junto ao público masculino.', 'Thiago Alves', 'Novo', 1, 'Desenvolvimento', NULL, NULL, '2026-05-25', '2026-07-08', '2026-07-01'),
  ('o35', 'Cota Programmatic TV + RedeTV! Noticias', 'Diego Martins', 'a4', 'a5', 'c4', '{"Programmatic TV","RedeTV! Noticias"}', 254000, 'Quente', '{"2026-Ago","2026-Set"}', 'Agência sugere combinar cota programática com conteúdo de notícias digital, testando um novo mix de canais para a marca.', 'Juliana Matos', 'Customização', 1, 'Aprovação', NULL, NULL, '2026-06-10', '2026-07-22', '2026-07-14'),
  ('o36', 'Ação Sensacional — Degustação ao Vivo', 'Larissa Ferreira', NULL, 'a1', 'c1', '{"Sensacional"}', 389000, 'Quente', '{"2026-Jul","2026-Ago"}', 'Anunciante quer fazer degustação ao vivo no quadro de variedades, com amostra de produto distribuída ao público presente.', 'Camila Rezende', 'Novo', 1, 'Aprovação', NULL, NULL, '2026-06-01', '2026-07-18', '2026-07-10'),
  ('o37', 'Cota RedeTV! Notícias — 2ª Edição', 'Rodrigo Nunes', 'a2', 'a6', 'c2', '{"RedeTV! Notícias - 2ª Edição"}', 412000, 'Quente', '{"2026-Ago","2026-Set","2026-Out"}', 'Construtora negocia a segunda edição do telejornal para reforçar frequência de exposição em praças estratégicas.', 'Thiago Alves', 'Novo', 1, 'Aprovação', NULL, NULL, '2026-06-12', '2026-07-29', '2026-07-20'),
  ('o38', 'Patrocínio Leitura Dinâmica — Educação Financeira', 'Bruno Camargo', NULL, 'a3', 'c3', '{"Leitura Dinâmica"}', 223000, 'Fechado', '{"2026-Jun"}', 'Banco fecha patrocínio de quadro educativo como parte da campanha de educação financeira do cliente, já aprovada internamente.', 'Juliana Matos', 'Novo', 1, 'Comercializado', NULL, '2026-06-18', '2026-05-02', '2026-06-18', '2026-06-12'),
  ('o39', 'Ação TV Fama — Lançamento Linha Verão', 'Ana Beatriz Souza', 'a4', 'a5', 'c4', '{"TV Fama"}', 334000, 'Fechado', '{"2026-Jun","2026-Jul"}', 'Marca de beleza fecha ação para lançamento de linha de verão, com a apresentadora testando produtos ao vivo.', 'Camila Rezende', 'Novo', 1, 'Comercializado', NULL, '2026-06-25', '2026-05-15', '2026-06-25', '2026-06-18'),
  ('o40', 'Cota Nordeste Do Povo — Expansão Regional', 'Diego Martins', NULL, 'a6', 'c6', '{"Nordeste Do Povo"}', 276000, 'Negado', '{"2026-Mai"}', 'Proposta de expansão regional recusada após a construtora redirecionar verba para reforço em praça já consolidada.', NULL, 'Novo', 1, 'Negativado', NULL, '2026-05-20', '2026-04-15', '2026-05-20', '2026-05-12'),
  ('o41', 'Patrocínio American Zone — Linha Importados', 'Larissa Ferreira', 'a2', 'a1', 'c2', '{"American Zone"}', 401000, 'Negado', '{"2026-Abr"}', 'Cliente optou por não renovar o patrocínio do formato internacional após revisão do portfólio de marcas importadas.', NULL, 'Novo', 1, 'Negativado', NULL, '2026-04-22', '2026-03-10', '2026-04-22', '2026-04-15');

-- Faturamento efetivo (exemplo — na prática vem do job diário do OPEC)
insert into faturamento_efetivo (id, cliente_codigo, periodo, valor) values
  ('f1', '1001', '2026-Mai', 180000),
  ('f2', '1001', '2026-Jun', 195000),
  ('f3', '1003', '2026-Mai', 220000),
  ('f4', '1003', '2026-Jun', 235000),
  ('f5', '1005', '2026-Mai', 150000),
  ('f6', '1005', '2026-Jun', 160000),
  ('f7', '1006', '2026-Mai', 140000),
  ('f8', '1006', '2026-Jun', 155000);

-- Metas por segmento
insert into metas (id, segmento, periodo, valor) values
  ('m1', 'Alimentos', '2026-Jan', 210000),
  ('m2', 'Alimentos', '2026-Fev', 225000),
  ('m3', 'Alimentos', '2026-Mar', 255000),
  ('m4', 'Alimentos', '2026-Abr', 270000),
  ('m5', 'Alimentos', '2026-Mai', 285000),
  ('m6', 'Alimentos', '2026-Jun', 300000),
  ('m7', 'Alimentos', '2026-Jul', 315000),
  ('m8', 'Alimentos', '2026-Ago', 330000),
  ('m9', 'Alimentos', '2026-Set', 345000),
  ('m10', 'Alimentos', '2026-Out', 390000),
  ('m11', 'Alimentos', '2026-Nov', 435000),
  ('m12', 'Alimentos', '2026-Dez', 480000),
  ('m13', 'Alimentos', '2027-Jan', 230000),
  ('m14', 'Alimentos', '2027-Fev', 248000),
  ('m15', 'Alimentos', '2027-Mar', 281000),
  ('m16', 'Alimentos', '2027-Abr', 297000),
  ('m17', 'Alimentos', '2027-Mai', 314000),
  ('m18', 'Alimentos', '2027-Jun', 330000),
  ('m19', 'Alimentos', '2027-Jul', 347000),
  ('m20', 'Alimentos', '2027-Ago', 363000),
  ('m21', 'Alimentos', '2027-Set', 380000),
  ('m22', 'Alimentos', '2027-Out', 429000),
  ('m23', 'Alimentos', '2027-Nov', 479000),
  ('m24', 'Alimentos', '2027-Dez', 528000),
  ('m25', 'Financeiro e Seguros', '2026-Jan', 210000),
  ('m26', 'Financeiro e Seguros', '2026-Fev', 225000),
  ('m27', 'Financeiro e Seguros', '2026-Mar', 255000),
  ('m28', 'Financeiro e Seguros', '2026-Abr', 270000),
  ('m29', 'Financeiro e Seguros', '2026-Mai', 285000),
  ('m30', 'Financeiro e Seguros', '2026-Jun', 300000),
  ('m31', 'Financeiro e Seguros', '2026-Jul', 315000),
  ('m32', 'Financeiro e Seguros', '2026-Ago', 330000),
  ('m33', 'Financeiro e Seguros', '2026-Set', 345000),
  ('m34', 'Financeiro e Seguros', '2026-Out', 390000),
  ('m35', 'Financeiro e Seguros', '2026-Nov', 435000),
  ('m36', 'Financeiro e Seguros', '2026-Dez', 480000),
  ('m37', 'Financeiro e Seguros', '2027-Jan', 230000),
  ('m38', 'Financeiro e Seguros', '2027-Fev', 248000),
  ('m39', 'Financeiro e Seguros', '2027-Mar', 281000),
  ('m40', 'Financeiro e Seguros', '2027-Abr', 297000),
  ('m41', 'Financeiro e Seguros', '2027-Mai', 314000),
  ('m42', 'Financeiro e Seguros', '2027-Jun', 330000),
  ('m43', 'Financeiro e Seguros', '2027-Jul', 347000),
  ('m44', 'Financeiro e Seguros', '2027-Ago', 363000),
  ('m45', 'Financeiro e Seguros', '2027-Set', 380000),
  ('m46', 'Financeiro e Seguros', '2027-Out', 429000),
  ('m47', 'Financeiro e Seguros', '2027-Nov', 479000),
  ('m48', 'Financeiro e Seguros', '2027-Dez', 528000),
  ('m49', 'Higiene e Beleza', '2026-Jan', 140000),
  ('m50', 'Higiene e Beleza', '2026-Fev', 150000),
  ('m51', 'Higiene e Beleza', '2026-Mar', 170000),
  ('m52', 'Higiene e Beleza', '2026-Abr', 180000),
  ('m53', 'Higiene e Beleza', '2026-Mai', 190000),
  ('m54', 'Higiene e Beleza', '2026-Jun', 200000),
  ('m55', 'Higiene e Beleza', '2026-Jul', 210000),
  ('m56', 'Higiene e Beleza', '2026-Ago', 220000),
  ('m57', 'Higiene e Beleza', '2026-Set', 230000),
  ('m58', 'Higiene e Beleza', '2026-Out', 260000),
  ('m59', 'Higiene e Beleza', '2026-Nov', 290000),
  ('m60', 'Higiene e Beleza', '2026-Dez', 320000),
  ('m61', 'Higiene e Beleza', '2027-Jan', 154000),
  ('m62', 'Higiene e Beleza', '2027-Fev', 165000),
  ('m63', 'Higiene e Beleza', '2027-Mar', 187000),
  ('m64', 'Higiene e Beleza', '2027-Abr', 198000),
  ('m65', 'Higiene e Beleza', '2027-Mai', 209000),
  ('m66', 'Higiene e Beleza', '2027-Jun', 220000),
  ('m67', 'Higiene e Beleza', '2027-Jul', 231000),
  ('m68', 'Higiene e Beleza', '2027-Ago', 242000),
  ('m69', 'Higiene e Beleza', '2027-Set', 253000),
  ('m70', 'Higiene e Beleza', '2027-Out', 286000),
  ('m71', 'Higiene e Beleza', '2027-Nov', 319000),
  ('m72', 'Higiene e Beleza', '2027-Dez', 352000),
  ('m73', 'Construção, Imobiliário e Decoração', '2026-Jan', 140000),
  ('m74', 'Construção, Imobiliário e Decoração', '2026-Fev', 150000),
  ('m75', 'Construção, Imobiliário e Decoração', '2026-Mar', 170000),
  ('m76', 'Construção, Imobiliário e Decoração', '2026-Abr', 180000),
  ('m77', 'Construção, Imobiliário e Decoração', '2026-Mai', 190000),
  ('m78', 'Construção, Imobiliário e Decoração', '2026-Jun', 200000),
  ('m79', 'Construção, Imobiliário e Decoração', '2026-Jul', 210000),
  ('m80', 'Construção, Imobiliário e Decoração', '2026-Ago', 220000),
  ('m81', 'Construção, Imobiliário e Decoração', '2026-Set', 230000),
  ('m82', 'Construção, Imobiliário e Decoração', '2026-Out', 260000),
  ('m83', 'Construção, Imobiliário e Decoração', '2026-Nov', 290000),
  ('m84', 'Construção, Imobiliário e Decoração', '2026-Dez', 320000),
  ('m85', 'Construção, Imobiliário e Decoração', '2027-Jan', 154000),
  ('m86', 'Construção, Imobiliário e Decoração', '2027-Fev', 165000),
  ('m87', 'Construção, Imobiliário e Decoração', '2027-Mar', 187000),
  ('m88', 'Construção, Imobiliário e Decoração', '2027-Abr', 198000),
  ('m89', 'Construção, Imobiliário e Decoração', '2027-Mai', 209000),
  ('m90', 'Construção, Imobiliário e Decoração', '2027-Jun', 220000),
  ('m91', 'Construção, Imobiliário e Decoração', '2027-Jul', 231000),
  ('m92', 'Construção, Imobiliário e Decoração', '2027-Ago', 242000),
  ('m93', 'Construção, Imobiliário e Decoração', '2027-Set', 253000),
  ('m94', 'Construção, Imobiliário e Decoração', '2027-Out', 286000),
  ('m95', 'Construção, Imobiliário e Decoração', '2027-Nov', 319000),
  ('m96', 'Construção, Imobiliário e Decoração', '2027-Dez', 352000);

-- Nenhum dado inicial para proposal_templates / sent_proposals — o modelo
-- SuperPop inclui um PDF em base64 grande demais para valer a pena
-- transcrever aqui; gere à parte se quiser.

-- NOTA: opportunities.executivo é o NOME do executivo (texto), não uma
-- referência a executivos.id — ainda não há login de usuário no v1, então
-- não existe FK real entre oportunidade e executivo. Quando o login
-- existir, troque para executivo_id (ver documento de migração, seção 6).