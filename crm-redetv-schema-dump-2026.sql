--
-- PostgreSQL database dump
--

\restrict 1ruXRxYYN3JGNGZ5LfQm4zte9QH7A9JosHlID05wRFRb2pKJxEa3OouiHFZxInf

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agency_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agency_links (
    agency_id text NOT NULL,
    advertiser_id text NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    user_email character varying(255) NOT NULL,
    action character varying(255) NOT NULL,
    details text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: bkp_faturamento_efetivo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bkp_faturamento_efetivo (
    id text,
    cliente_codigo text,
    periodo text,
    valor numeric(14,2),
    updated_at timestamp with time zone
);


--
-- Name: carteira_key_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carteira_key_accounts (
    executivo_id character varying(255) NOT NULL,
    client_id character varying(255) NOT NULL
);


--
-- Name: client_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_interactions (
    id character varying(255) NOT NULL,
    client_id character varying(255),
    user_id integer,
    date date NOT NULL,
    note text NOT NULL,
    ai_summary text,
    ai_next_action text,
    ai_risk character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(50) DEFAULT 'note'::character varying,
    direction character varying(10) DEFAULT 'outbound'::character varying,
    message_id character varying(255),
    in_reply_to character varying(255),
    sender_email character varying(255)
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id text NOT NULL,
    codigo text,
    razao_social text NOT NULL,
    cnpj text,
    nome_fantasia text,
    type text NOT NULL,
    segmento text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(20) DEFAULT 'Ativo'::character varying,
    ai_summary text,
    CONSTRAINT clients_type_check CHECK ((type = ANY (ARRAY['Agência'::text, 'Anunciante'::text])))
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id text NOT NULL,
    client_id text,
    name text NOT NULL,
    cargo text,
    departamento text,
    nivel_decisao text,
    celular text,
    email text,
    esportes text[] DEFAULT '{}'::text[] NOT NULL,
    esportes_outro text,
    hobbies text[] DEFAULT '{}'::text[] NOT NULL,
    hobbies_outro text,
    time_coracao text,
    filhos integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: diretor_executivos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diretor_executivos (
    diretor_id integer NOT NULL,
    executivo_id character varying(255) NOT NULL
);


--
-- Name: executivos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.executivos (
    id text NOT NULL,
    nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: faturamento_efetivo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faturamento_efetivo (
    id text NOT NULL,
    cliente_codigo text NOT NULL,
    periodo text NOT NULL,
    valor numeric(14,2) DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: metas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metas (
    id text NOT NULL,
    segmento text,
    periodo text NOT NULL,
    valor numeric(14,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id text
);


--
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacoes (
    id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) NOT NULL,
    client_id text,
    read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notificacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificacoes_id_seq OWNED BY public.notificacoes.id;


--
-- Name: opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunities (
    id text NOT NULL,
    title text NOT NULL,
    executivo text,
    agency_id text,
    advertiser_id text NOT NULL,
    contact_id text,
    products text[] DEFAULT '{}'::text[] NOT NULL,
    value numeric(14,2) DEFAULT 0 NOT NULL,
    stage text NOT NULL,
    period_months text[] DEFAULT '{}'::text[] NOT NULL,
    briefing text,
    responsavel text,
    tipo text,
    versao integer DEFAULT 1 NOT NULL,
    status text,
    observacao text,
    plan_delivery_date date,
    data_criacao date,
    data_entrega date,
    previsao_fechamento date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    product_values jsonb DEFAULT '{}'::jsonb,
    attachments jsonb DEFAULT '[]'::jsonb,
    executivo_id character varying(255),
    CONSTRAINT opportunities_stage_check CHECK ((stage = ANY (ARRAY['Desenvolvimento'::text, 'Frio'::text, 'Morno'::text, 'Quente'::text, 'Fechado'::text, 'Negado'::text]))),
    CONSTRAINT opportunities_status_check CHECK ((status = ANY (ARRAY['Pendente'::text, 'Desenvolvimento'::text, 'Aprovação'::text, 'Entregue'::text, 'Comercializado'::text, 'Negativado'::text, 'Cancelado'::text]))),
    CONSTRAINT opportunities_tipo_check CHECK ((tipo = ANY (ARRAY['Novo'::text, 'Refação'::text, 'Customização'::text])))
);


--
-- Name: produtos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produtos (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    categoria character varying(50) NOT NULL,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT produtos_categoria_check CHECK (((categoria)::text = ANY (ARRAY[('televisao'::character varying)::text, ('digital'::character varying)::text, ('especiais'::character varying)::text])))
);


--
-- Name: produtos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.produtos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: produtos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.produtos_id_seq OWNED BY public.produtos.id;


--
-- Name: proposal_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposal_templates (
    id text NOT NULL,
    product text,
    title text NOT NULL,
    subtitle text,
    horario text,
    periodo text,
    pdf_file_name text,
    pdf_data_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    xls_file_name character varying(255),
    xls_data_uri text
);


--
-- Name: segmento_executivo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.segmento_executivo (
    segmento text NOT NULL,
    executivo_id text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sent_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sent_proposals (
    id text NOT NULL,
    template_id text,
    contact_id text,
    opportunity_id text,
    sent_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    google_id character varying(255),
    email character varying(255) NOT NULL,
    nome character varying(255) NOT NULL,
    foto_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    perfil character varying(50) DEFAULT 'executivo'::character varying,
    executivo_id character varying(255),
    google_refresh_token text,
    google_access_token text,
    google_token_expires_at timestamp without time zone,
    ativo boolean DEFAULT true,
    senha_hash text,
    token_version integer DEFAULT 1
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: notificacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_id_seq'::regclass);


--
-- Name: produtos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos ALTER COLUMN id SET DEFAULT nextval('public.produtos_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: agency_links agency_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_links
    ADD CONSTRAINT agency_links_pkey PRIMARY KEY (agency_id, advertiser_id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: carteira_key_accounts carteira_key_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carteira_key_accounts
    ADD CONSTRAINT carteira_key_accounts_pkey PRIMARY KEY (executivo_id, client_id);


--
-- Name: client_interactions client_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_interactions
    ADD CONSTRAINT client_interactions_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: diretor_executivos diretor_executivos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diretor_executivos
    ADD CONSTRAINT diretor_executivos_pkey PRIMARY KEY (diretor_id, executivo_id);


--
-- Name: executivos executivos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.executivos
    ADD CONSTRAINT executivos_pkey PRIMARY KEY (id);


--
-- Name: faturamento_efetivo faturamento_efetivo_cliente_codigo_periodo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faturamento_efetivo
    ADD CONSTRAINT faturamento_efetivo_cliente_codigo_periodo_key UNIQUE (cliente_codigo, periodo);


--
-- Name: faturamento_efetivo faturamento_efetivo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faturamento_efetivo
    ADD CONSTRAINT faturamento_efetivo_pkey PRIMARY KEY (id);


--
-- Name: metas metas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metas
    ADD CONSTRAINT metas_pkey PRIMARY KEY (id);


--
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);


--
-- Name: opportunities opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_pkey PRIMARY KEY (id);


--
-- Name: produtos produtos_nome_categoria_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT produtos_nome_categoria_key UNIQUE (nome, categoria);


--
-- Name: produtos produtos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT produtos_pkey PRIMARY KEY (id);


--
-- Name: proposal_templates proposal_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_templates
    ADD CONSTRAINT proposal_templates_pkey PRIMARY KEY (id);


--
-- Name: segmento_executivo segmento_executivo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.segmento_executivo
    ADD CONSTRAINT segmento_executivo_pkey PRIMARY KEY (segmento);


--
-- Name: sent_proposals sent_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_proposals
    ADD CONSTRAINT sent_proposals_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- Name: clients unique_codigo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT unique_codigo UNIQUE (codigo, type);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_google_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_google_id_key UNIQUE (google_id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_agency_links_advertiser_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agency_links_advertiser_id ON public.agency_links USING btree (advertiser_id);


--
-- Name: idx_agency_links_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agency_links_agency_id ON public.agency_links USING btree (agency_id);


--
-- Name: idx_client_interactions_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_interactions_client_id ON public.client_interactions USING btree (client_id);


--
-- Name: idx_client_interactions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_interactions_date ON public.client_interactions USING btree (date DESC);


--
-- Name: idx_client_interactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_interactions_type ON public.client_interactions USING btree (type);


--
-- Name: idx_client_interactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_interactions_user_id ON public.client_interactions USING btree (user_id);


--
-- Name: idx_clients_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_cnpj ON public.clients USING btree (cnpj);


--
-- Name: idx_clients_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_codigo ON public.clients USING btree (codigo);


--
-- Name: idx_clients_nome_fantasia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_nome_fantasia ON public.clients USING btree (nome_fantasia);


--
-- Name: idx_clients_razao_social; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_razao_social ON public.clients USING btree (razao_social);


--
-- Name: idx_clients_segmento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_segmento ON public.clients USING btree (segmento);


--
-- Name: idx_clients_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_type ON public.clients USING btree (type);


--
-- Name: idx_contacts_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_client_id ON public.contacts USING btree (client_id);


--
-- Name: idx_contacts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_email ON public.contacts USING btree (email);


--
-- Name: idx_contacts_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_name ON public.contacts USING btree (name);


--
-- Name: idx_faturamento_cliente_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faturamento_cliente_codigo ON public.faturamento_efetivo USING btree (cliente_codigo);


--
-- Name: idx_faturamento_efetivo_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faturamento_efetivo_codigo ON public.faturamento_efetivo USING btree (cliente_codigo);


--
-- Name: idx_faturamento_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faturamento_periodo ON public.faturamento_efetivo USING btree (periodo);


--
-- Name: idx_metas_cli_per; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_metas_cli_per ON public.metas USING btree (client_id, periodo) WHERE (client_id IS NOT NULL);


--
-- Name: idx_metas_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_metas_client_id ON public.metas USING btree (client_id);


--
-- Name: idx_metas_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_metas_periodo ON public.metas USING btree (periodo);


--
-- Name: idx_metas_seg_per; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_metas_seg_per ON public.metas USING btree (segmento, periodo) WHERE (client_id IS NULL);


--
-- Name: idx_metas_segmento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_metas_segmento ON public.metas USING btree (segmento);


--
-- Name: idx_opportunities_advertiser_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_advertiser_id ON public.opportunities USING btree (advertiser_id);


--
-- Name: idx_opportunities_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_agency_id ON public.opportunities USING btree (agency_id);


--
-- Name: idx_opportunities_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_contact_id ON public.opportunities USING btree (contact_id);


--
-- Name: idx_opportunities_executivo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_executivo ON public.opportunities USING btree (executivo);


--
-- Name: idx_opportunities_executivo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_executivo_id ON public.opportunities USING btree (executivo_id);


--
-- Name: idx_opportunities_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_stage ON public.opportunities USING btree (stage);


--
-- Name: idx_segmento_executivo_executivo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_segmento_executivo_executivo_id ON public.segmento_executivo USING btree (executivo_id);


--
-- Name: agency_links agency_links_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_links
    ADD CONSTRAINT agency_links_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: agency_links agency_links_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_links
    ADD CONSTRAINT agency_links_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: carteira_key_accounts carteira_key_accounts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carteira_key_accounts
    ADD CONSTRAINT carteira_key_accounts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: carteira_key_accounts carteira_key_accounts_executivo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carteira_key_accounts
    ADD CONSTRAINT carteira_key_accounts_executivo_id_fkey FOREIGN KEY (executivo_id) REFERENCES public.executivos(id) ON DELETE CASCADE;


--
-- Name: client_interactions client_interactions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_interactions
    ADD CONSTRAINT client_interactions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_interactions client_interactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_interactions
    ADD CONSTRAINT client_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: diretor_executivos diretor_executivos_diretor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diretor_executivos
    ADD CONSTRAINT diretor_executivos_diretor_id_fkey FOREIGN KEY (diretor_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: diretor_executivos diretor_executivos_executivo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diretor_executivos
    ADD CONSTRAINT diretor_executivos_executivo_id_fkey FOREIGN KEY (executivo_id) REFERENCES public.executivos(id) ON DELETE CASCADE;


--
-- Name: notificacoes notificacoes_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: notificacoes notificacoes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: opportunities opportunities_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.clients(id);


--
-- Name: opportunities opportunities_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.clients(id);


--
-- Name: opportunities opportunities_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);


--
-- Name: opportunities opportunities_executivo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_executivo_id_fkey FOREIGN KEY (executivo_id) REFERENCES public.executivos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: segmento_executivo segmento_executivo_executivo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.segmento_executivo
    ADD CONSTRAINT segmento_executivo_executivo_id_fkey FOREIGN KEY (executivo_id) REFERENCES public.executivos(id) ON DELETE CASCADE;


--
-- Name: sent_proposals sent_proposals_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_proposals
    ADD CONSTRAINT sent_proposals_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);


--
-- Name: sent_proposals sent_proposals_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_proposals
    ADD CONSTRAINT sent_proposals_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id);


--
-- Name: sent_proposals sent_proposals_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_proposals
    ADD CONSTRAINT sent_proposals_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.proposal_templates(id);


--
-- Name: usuarios usuarios_executivo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_executivo_id_fkey FOREIGN KEY (executivo_id) REFERENCES public.executivos(id) ON DELETE SET NULL;


--
-- Name: agency_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agency_links ENABLE ROW LEVEL SECURITY;

--
-- Name: agency_links allow_all_agency_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_agency_links ON public.agency_links USING (true) WITH CHECK (true);


--
-- Name: clients allow_all_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_clients ON public.clients USING (true) WITH CHECK (true);


--
-- Name: contacts allow_all_contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_contacts ON public.contacts USING (true) WITH CHECK (true);


--
-- Name: executivos allow_all_executivos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_executivos ON public.executivos USING (true) WITH CHECK (true);


--
-- Name: faturamento_efetivo allow_all_faturamento_efetivo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_faturamento_efetivo ON public.faturamento_efetivo USING (true) WITH CHECK (true);


--
-- Name: metas allow_all_metas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_metas ON public.metas USING (true) WITH CHECK (true);


--
-- Name: opportunities allow_all_opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_opportunities ON public.opportunities USING (true) WITH CHECK (true);


--
-- Name: proposal_templates allow_all_proposal_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_proposal_templates ON public.proposal_templates USING (true) WITH CHECK (true);


--
-- Name: segmento_executivo allow_all_segmento_executivo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_segmento_executivo ON public.segmento_executivo USING (true) WITH CHECK (true);


--
-- Name: sent_proposals allow_all_sent_proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_sent_proposals ON public.sent_proposals USING (true) WITH CHECK (true);


--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: executivos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.executivos ENABLE ROW LEVEL SECURITY;

--
-- Name: faturamento_efetivo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faturamento_efetivo ENABLE ROW LEVEL SECURITY;

--
-- Name: metas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

--
-- Name: proposal_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: segmento_executivo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.segmento_executivo ENABLE ROW LEVEL SECURITY;

--
-- Name: sent_proposals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sent_proposals ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 1ruXRxYYN3JGNGZ5LfQm4zte9QH7A9JosHlID05wRFRb2pKJxEa3OouiHFZxInf

