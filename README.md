# CRM Comercial RedeTV!

Plataforma integrada de gestão comercial, inteligência de mercado, controle de oportunidades e governança corporativa da **RedeTV!**.

---

## 📌 Visão Geral

O **CRM Comercial RedeTV!** foi concebido e arquitetado para digitalizar, padronizar e otimizar o fluxo de ponta a ponta da área comercial da emissora, desde a prospecção de anunciantes e agências até o fechamento contratual, conciliação e faturamento.

A plataforma substitui controles descentralizados por uma visão única e em tempo real da carteira de clientes, metas financeiras, pipeline de oportunidades e movimentações de mercado.

---

## 🚀 Principais Módulos do Sistema

### 1. Comercial & Pipeline de Vendas
* **Pipeline Estruturado (Kanban):** Gestão visual das oportunidades comerciais divididas em etapas (*Prospecção*, *Qualificação*, *Proposta Apresentada*, *Negociação*, *Fechado* e *Perdido*).
* **Gestão de Carteiras de Clientes:** Cadastro e acompanhamento detalhado de Anunciantes, Marcas e Agências de Publicidade vinculadas a cada executivo de contas.
* **Propostas Comerciais:** Elaboração, precificação, aprovação com alçadas de desconto e emissão padronizada de propostas comerciais por e-mail com modelos corporativos.
* **Faturamento Efetivo & Metas:** Visão consolidada de metas mensais por executivo e segmento, comparando faturamento realizado (notas fiscais) vs. faturado projetado.

### 2. Inteligência de Mercado (Radar de Mercado)
* **Varredura Automatizada:** Crawler de notícias de mercado e investimentos publicitários nos principais portais do setor (Meio & Mensagem, Propmark, Valor Econômico, Exame, etc.).
* **Inteligência Artificial:** Resumo analítico, identificação de anunciantes potenciais e geração de sugestões de abordagem comercial (*Gatilhos & Ações*).
* **Segmentação por Perfil:** Visibilidade segmentada de notícias por carteira de cada executivo de contas ou visão macro para a diretoria.

### 3. Governança, Acessos & Auditoria
* **Controle de Acessos Baseado em Perfis (ACL):** Perfis estruturados (*Administrador*, *Diretoria*, *Executivo de Contas*, *Especialista de Apoio*).
* **Trilha de Auditoria (*Audit Log*):** Registro de auditoria contendo data, hora, IP, usuário e payload de todas as alterações críticas realizadas no sistema.
* **Segurança e Criptografia:** Hashing de senhas com algoritmo `bcrypt`, autenticação por tokens de sessão e isolamento de rotas com middlewares dedicados.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias Utilizadas |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Recharts, SheetJS (XLSX) |
| **Backend API** | Node.js, Express, WebSocket (notificações em tempo real) |
| **Banco de Dados** | PostgreSQL 16 (AWS RDS) com pooling otimizado de conexões |
| **Infraestrutura** | Docker, Docker Compose, Nginx (Reverse Proxy & Terminação SSL) |
| **Integração & IA** | Integração com LLMs (Gemini API) para enriquecimento de mercado |

---

## 📂 Estrutura do Projeto

```
crm-redetv/
├── src/                        # Código-fonte da aplicação Frontend (React)
│   ├── components/             # Componentes de tela, modais e abas
│   │   ├── Executivos/         # Painéis administrativos de metas, propostas e usuários
│   │   ├── Modals/             # Modais de cadastro, fechamento e oportunidades
│   │   └── UI/                 # Componentes reutilizáveis (KpiCard, Filters, etc.)
│   ├── services/               # Camada de comunicação com a API REST
│   ├── utils/                  # Formatadores, helpers e utilitários
│   ├── App.jsx                 # Componente raiz, roteamento e controle de estado
│   └── main.jsx                # Ponto de entrada do React
├── backend/                    # API REST e serviços de backend (Node.js)
│   ├── routes/                 # Endpoints da aplicação (/auth, /opportunities, etc.)
│   ├── services/               # Agendadores (cron) e crawlers de inteligência
│   ├── utils/                  # Utilitários de segurança, auditoria e ACL
│   ├── db.js                   # Conexão e queries com o PostgreSQL
│   └── server.js               # Inicialização do servidor Express
├── database/                   # Scripts DDL, migrations e seeds do banco de dados
├── public/                     # Assets estáticos, ícones e manifesto PWA
├── docker-compose.yml          # Orquestração de containers para produção
├── nginx.conf                  # Configuração de roteamento seguro e proxy reverso
├── package.json                # Dependências do frontend
└── .env.example                # Template de variáveis de ambiente
```

---

## ⚙️ Instalação e Execução Local

### Pré-requisitos
* **Node.js** v20 ou superior
* **npm** v10 ou superior
* Acesso à instância do banco de dados PostgreSQL

### Passo a Passo

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/RedeTVRevolution/crm.git
   cd crm
   ```

2. **Configurar Variáveis de Ambiente:**
   Copie o arquivo de exemplo e preencha as credenciais da AWS e da API:
   ```bash
   cp .env.example .env
   ```

3. **Instalar Dependências:**
   ```bash
   # Dependências do Frontend
   npm install

   # Dependências do Backend
   cd backend && npm install && cd ..
   ```

4. **Executar em Modo de Desenvolvimento:**
   ```bash
   # Em um terminal (Frontend):
   npm run dev

   # Em outro terminal (Backend):
   cd backend && npm start
   ```
   A aplicação estará acessível em `http://localhost:8000`.

---

## 🔒 Segurança e Boas Práticas

* **Autenticação:** Protegida por tokens de sessão validados em todas as requisições privadas.
* **Autorização:** Middlewares de verificação de escopo e perfil antes da execução de operações sensíveis de banco.
* **Sanitização de Dados:** Tratamento de queries parametrizadas para mitigação de riscos de *SQL Injection*.
* **Rate Limiting:** Proteção contra abusos e requisições repetitivas no backend.

---

## 📄 Licença e Confidencialidade

Este projeto é de propriedade exclusiva da **RedeTV! (Rede TV! / TV Ômega Ltda.)**. O código, estruturas e regras de negócio contidos neste repositório são estritamente confidenciais e destinados exclusivamente para uso interno e processos de auditoria autorizados.
