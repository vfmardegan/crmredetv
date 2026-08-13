# CRM RedeTV! — Especificação da API (substitui o `window.storage`)

**Objetivo deste documento:** dar ao time de desenvolvimento uma especificação concreta e implementável da API que precisa existir entre o `App.jsx` (front-end React) e o Postgres (`crm-redetv-schema-completo.sql`), substituindo as 3 chamadas a `window.storage` que hoje não funcionam fora do ambiente Claude.

**Não está nesse escopo ainda:** autenticação/login (ver seção 6 do pack de migração). Todos os endpoints abaixo assumem, por enquanto, acesso único sem usuário — igual ao protótipo. Quando o login existir, é só adicionar o middleware de auth em cima disso.

---

## 1. Convenções gerais

- Base URL: `/api/v1`
- Formato: JSON em tudo (`Content-Type: application/json`).
- IDs: strings (os mesmos formatos já usados no protótipo — `a1`, `c1`, `o1`, `e1` etc. — ou troque por UUID gerado no backend; o front-end não depende do formato específico, só de o id existir).
- Erros: `{ "error": "mensagem legível" }` com status HTTP apropriado (400 validação, 404 não encontrado, 500 erro interno).
- Datas: `"AAAA-MM-DD"` (ISO simples, sem hora) para `data_criacao`/`data_entrega`/etc. Períodos continuam como string `"AAAA-Mês"` (ex: `"2026-Ago"`) — é o formato que toda a lógica de cálculo do front-end já espera; **não mude esse formato**, só persista como veio.

---

## 2. O substituto direto do `window.storage.get` — carga inicial

Hoje o app faz **uma** chamada (`window.storage.get`) e recebe tudo de uma vez. Pra minimizar o tamanho da reescrita, mantenha esse padrão na carga inicial:

### `GET /api/v1/bootstrap`

Resposta (mesma forma que `JSON.parse(res.value)` tem hoje no front-end):

```json
{
  "advertisers": [ /* clients + agency_links já resolvidos, ver 3.1 */ ],
  "contacts": [ /* ver 3.2 */ ],
  "opportunities": [ /* ver 3.3 */ ],
  "proposals": [ /* ver 3.4 */ ],
  "faturamentoEfetivo": [ /* ver 3.5 */ ],
  "monthlyMetas": { /* ver 3.6 */ },
  "executivos": [ /* ver 3.7 */ ],
  "segmentoExecutivo": { /* ver 3.7 */ }
}
```

**No front-end**, troque:
```js
const res = await window.storage.get(STORAGE_KEY, false);
const parsed = JSON.parse(res.value);
```
por:
```js
const parsed = await fetch("/api/v1/bootstrap").then(r => r.json());
```
O resto da função (`setAdvertisers`, `setOpportunities` etc.) não muda — ela já espera exatamente esse formato.

---

## 3. Formato de cada entidade

### 3.1 `advertisers` (clientes)
O front-end espera cada item já com `atendeAnunciantes` embutido (resultado do `JOIN` com `agency_links`):
```json
{
  "id": "a1", "codigo": "1001", "razaoSocial": "Vantana Alimentos Ltda.",
  "cnpj": "12345678000190", "nomeFantasia": "Grupo Vantana Alimentos",
  "name": "Grupo Vantana Alimentos",
  "type": "Anunciante", "segmento": "Alimentos",
  "atendeAnunciantes": []
}
```
Para uma Agência, `atendeAnunciantes` é a lista de ids de Anunciante vinculados (via `agency_links`); para Anunciante, fica `[]`.

**Endpoints:**
- `POST /api/v1/clients` — cria cliente. Body igual ao formato acima (sem `id`).
- `PUT /api/v1/clients/:id` — edita cliente. Mesmo body.
- `PUT /api/v1/clients/:id/links` — body `{ "atendeAnunciantes": ["a1", "a6"] }` (só para Agência) ou, se o cliente é Anunciante, `{ "vinculoAgencias": ["a2", "a4"] }`. O backend reconcilia `agency_links` nos dois sentidos (isso já é feito hoje no front-end em `addAdvertiser`/edição — mover essa reconciliação pro backend evita inconsistência se dois usuários editarem ao mesmo tempo).

### 3.2 `contacts`
```json
{
  "id": "c1", "clientId": "a1", "name": "Marina Costa", "cargo": "Gerente de Mídia",
  "departamento": "Marketing", "nivelDecisao": "Gerência", "celular": "11987650001",
  "email": "marina.costa@vantana.com.br", "esportes": ["Corrida", "Vôlei"],
  "esportesOutro": "", "hobbies": [], "hobbiesOutro": "", "timeCoracao": "Palmeiras", "filhos": 1
}
```
- `POST /api/v1/contacts` / `PUT /api/v1/contacts/:id` — mesmo formato.

### 3.3 `opportunities`
```json
{
  "id": "o1", "title": "Patrocínio novela das 21h", "executivo": "Bruno Camargo",
  "agencyId": "direto", "advertiserId": "a1", "contactId": "c1",
  "products": ["Superpop"], "value": 850000, "stage": "Quente",
  "periodMonths": ["2026-Ago", "2026-Set"], "briefing": "...",
  "createdAt": "2026-06-01", "deliveryDate": "2026-07-20", "expectedCloseDate": "2026-07-15",
  "responsavel": "", "tipo": "Novo", "versao": 1, "status": "Pendente",
  "observacao": "", "planDeliveryDate": ""
}
```
- **Atenção**: `agencyId` no front-end usa o valor `"direto"` como sentinela pra "Cliente Direto" (sem agência) — no banco (`crm-redetv-schema-completo.sql`) isso é `NULL`. A API precisa fazer essa tradução nos dois sentidos (`NULL` ↔ `"direto"`).
- `POST /api/v1/opportunities` — cria (usada em `addOpportunity`).
- `PUT /api/v1/opportunities/:id` — edita **qualquer campo**. É usada em vários lugares: mudança de estágio no Kanban (`updateStage`), edição inline no Pipeline Planejamento (`updatePlanningField` — responsavel/tipo/versao/status/observacao/planDeliveryDate), então precisa aceitar atualização parcial (PATCH semanticamente, mesmo que o verbo HTTP seja PUT).

### 3.4 `proposals` (sent_proposals)
```json
{ "id": "p1", "templateId": "superpop", "contactId": "c1", "opportunityId": "o1", "sentAt": "2026-07-01T14:32:00Z" }
```
- `POST /api/v1/proposals` — registra envio (chamado depois que o front-end já abriu o `mailto:` e baixou o PDF — é só um log, não envia e-mail de verdade).

### 3.5 `faturamentoEfetivo`
```json
{ "id": "f1", "clienteCodigo": "1001", "periodo": "2026-Mai", "valor": 180000 }
```
- **Somente leitura pelo front-end.** `GET /api/v1/bootstrap` traz tudo; não há tela de criar/editar no app (é alimentado pelo job do OPEC, fora do escopo desta API). Se quiser um endpoint de ingestão pro job do OPEC chamar, sugiro `POST /api/v1/faturamento/sync` com upsert em lote, autenticado separadamente (chave de serviço, não a mesma auth do usuário).

### 3.6 `monthlyMetas`
Formato aninhado que o front-end espera — **não achatar**:
```json
{
  "Alimentos": { "2026-Jan": 210000, "2026-Fev": 225000, "...": "..." },
  "Financeiro e Seguros": { "2026-Jan": 210000, "...": "..." }
}
```
- Também somente leitura pelo front-end (carga via SQL do financeiro, conforme já decidido). `GET /api/v1/bootstrap` inclui; não precisa de endpoint de escrita pro app.

### 3.7 `executivos` e `segmentoExecutivo` (Carteira)
```json
"executivos": [{ "id": "e1", "nome": "Bruno Camargo" }],
"segmentoExecutivo": { "Alimentos": "e1", "Financeiro e Seguros": "e2" }
```
- `POST /api/v1/executivos` — cria executivo (`addExecutivo`).
- `DELETE /api/v1/executivos/:id` — exclui (`deleteExecutivo`) — **o backend também precisa liberar os segmentos que esse executivo tinha** (mesma lógica que já existe no front-end: remover as entradas de `segmentoExecutivo` que apontavam pra esse id).
- `PUT /api/v1/carteira/:segmento` — body `{ "executivoId": "e2" }` ou `{ "executivoId": null }` pra liberar (`assignSegmentoToExecutivo`). Como a regra é exclusiva (um segmento, um executivo), isso é um upsert simples na tabela `segmento_executivo`, que já tem `segmento` como chave primária — não precisa de lógica extra de "roubar" no backend, o `upsert` resolve sozinho.

---

## 4. Tabela de conversão: cada chamada antiga → nova

| Onde no `App.jsx` | Hoje | Depois |
|---|---|---|
| `useEffect` de carga (linha ~1667) | `window.storage.get(STORAGE_KEY, false)` | `fetch("/api/v1/bootstrap")` |
| `useEffect` de salvamento (linha ~1712) | `window.storage.set(STORAGE_KEY, JSON.stringify({...}), false)` — salva **tudo de uma vez**, em debounce | **Remover esse useEffect por completo.** Ele existe só porque `window.storage` só sabe salvar um blob. Numa API de verdade, cada ação do usuário já dispara sua própria chamada (ver tabela abaixo) — não precisa (e não deve) reenviar tudo a cada mudança. |
| `resetToSeedData` (linha ~2016) | `window.storage.delete(STORAGE_KEY, false)` | Endpoint próprio se quiser manter esse botão em produção — `POST /api/v1/reset-to-seed` (ou simplesmente remover o botão da UI em produção; ele foi pensado como rede de segurança do protótipo, não como recurso de produto). |

**Cada função de mutação do front-end precisa de uma chamada de API própria, no lugar de só mexer no `useState` e deixar o `useEffect` genérico salvar tudo depois:**

| Função no `App.jsx` | Chamada nova a adicionar |
|---|---|
| `addAdvertiser` | `POST /api/v1/clients` (+ `PUT /clients/:id/links` se tiver vínculo) |
| `addContact` | `POST /api/v1/contacts` |
| `addOpportunity` | `POST /api/v1/opportunities` |
| `updateStage` | `PUT /api/v1/opportunities/:id` `{ stage }` |
| `updatePlanningField` | `PUT /api/v1/opportunities/:id` `{ [campo]: valor }` |
| `confirmQuickCreateClient` | `POST /api/v1/clients` |
| Envio de proposta (botão "Enviar por e-mail") | `POST /api/v1/proposals` |
| `addExecutivo` | `POST /api/v1/executivos` |
| `deleteExecutivo` | `DELETE /api/v1/executivos/:id` |
| `assignSegmentoToExecutivo` | `PUT /api/v1/carteira/:segmento` |

---

## 5. O que **não** precisa ir pro backend

Toda a lógica de **cálculo e exibição** — `STAGE_WEIGHTS`, `monthlyValueOfOpp`, `periodAdjustedValue`, GAP (`Faturado − Meta` e `Meta − Faturado`), o velocímetro, os agrupamentos por segmento — continua **inteiramente no front-end**, exatamente como está. É lógica de apresentação em cima do dado bruto; o backend só precisa entregar e guardar o dado, não recalcular nada disso.

---

## 6. Ordem sugerida de implementação

1. `GET /api/v1/bootstrap` primeiro — sozinho, já destrava o app abrir e mostrar dado real (mesmo que ainda não seja possível editar nada).
2. Trocar a carga inicial no `App.jsx` (passo simples, uma função).
3. Remover o `useEffect` de salvamento genérico.
4. Implementar os endpoints de escrita um por um, na ordem da tabela da seção 4, plugando cada `POST`/`PUT`/`DELETE` na função correspondente do front-end.
5. Testar cada aba isoladamente (Clientes → Contatos → Pipeline → Pipeline Planejamento → Executivos) antes de considerar pronto.
