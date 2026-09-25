-- =============================================================
-- Script de Seed: Usuários Pré-cadastrados do CRM RedeTV! v2
-- Execute este script UMA VEZ no banco de dados para registrar
-- as contas corporativas com seus perfis corretos, sem precisar
-- que cada pessoa faça o primeiro login pelo Google.
--
-- Como executar (com Docker):
--   docker exec -i crm-postgres psql -U crm_user -d crm_db < backend/seed_users.sql
-- =============================================================

-- Insere os usuários com ON CONFLICT para não duplicar caso já existam.
-- O campo google_id usa o próprio e-mail como placeholder, pois o ID
-- real do Google só é conhecido no primeiro login. No login, o sistema
-- busca por google_id e, se não encontrar, busca por e-mail e atualiza.

INSERT INTO usuarios (google_id, email, nome, foto_url, perfil)
VALUES
  ('seed_vitor.mardegan',       'vitor.mardegan@redetv.com.br',    'Vitor Mardegan',       '', 'admin'),
  ('seed_neto',                 'neto@redetv.com.br',              'Neto',                 '', 'admin'),
  ('seed_nicolle.carvalho',     'nicolle.carvalho@redetv.com.br',  'Nicolle Carvalho',     '', 'diretor'),
  ('seed_silvia.szekely',       'silvia.szekely@redetv.com.br',    'Sílvia Szekely',       '', 'executivo'),
  ('seed_bruno.camargo',        'bruno.camargo@redetv.com.br',     'Bruno Camargo',        '', 'executivo'),
  ('seed_andre.barcellos',      'andre.barcellos@redetv.com.br',   'André Barcellos',      '', 'especialista'),
  ('seed_tarco',                'tarco@redetv.com.br',             'Talita Arco',          '', 'especialista')
ON CONFLICT (email) DO UPDATE
  SET perfil = EXCLUDED.perfil,
      nome   = EXCLUDED.nome;
