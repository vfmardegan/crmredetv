# Como encaixar essa API no que já existe

Este `backend/` é um ponto de partida funcional, não um pacote plug-and-play
— revise, teste no seu ambiente e ajuste onde fizer sentido. Ele implementa
exatamente os endpoints descritos em `crm-redetv-api-spec.md`.

## 1. Onde colocar

```
projeto/
├── src/                  (já existe — App.jsx, main.jsx, index.css)
├── backend/               <- esta pasta
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── routes/
├── docker-compose.yml
├── nginx.conf
└── ...
```

## 2. `docker-compose.yml` — adicionar um serviço novo

Adicione um serviço `crm-api` ao lado dos que já existem (`web`, `crm-app`, `db`):

```yaml
  crm-api:
    image: node:20-alpine
    container_name: crm-api
    restart: always
    environment:
      - API_PORT=8001
      - DATABASE_URL=postgresql://postgres:redetv@db:5432/crm_redetv
    volumes:
      - ./backend:/usr/src/app
    working_dir: /usr/src/app
    command: >
      sh -c "npm install && npm start"
    depends_on:
      - db
```

E adicione `crm-api` na lista de `depends_on` do serviço `web` (Nginx), já que ele agora também precisa da API de pé.

## 3. `nginx.conf` — rotear `/api/` para a API

Dentro do `server { listen 443 ssl; ... }`, adicione **antes** do `location /` que já existe (a ordem importa — o Nginx usa o primeiro `location` que casar):

```nginx
    location /api/ {
        proxy_pass http://crm-api:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

## 4. `App.jsx` — já está pronto

O `App.jsx` deste pacote já foi atualizado: a chamada `window.storage.get`
virou `fetch("/api/v1/bootstrap")`, o `useEffect` que salvava tudo de uma
vez foi removido, e cada função de criar/editar (`addAdvertiser`,
`addContact`, `addOpportunity`, `updateStage`, `updatePlanningField`,
`addExecutivo`, `deleteExecutivo`, `assignSegmentoToExecutivo`, envio de
proposta) já dispara a chamada de API correspondente, além de continuar
atualizando o estado local imediatamente (a tela não trava esperando
resposta do servidor).

Um detalhe: `resetToSeedData` (o botão "Restaurar dados de exemplo") foi
**desativado** de propósito — num banco compartilhado de verdade, apagar
tudo com um clique é perigoso demais pra deixar como está. Se quiser manter
essa funcionalidade, ela precisa virar uma ação de admin protegida por
login, não um botão que qualquer pessoa pode clicar.

## 5. Testando

```bash
docker compose up -d --build
curl https://<seu-dominio-ou-ip>/api/v1/health
# esperado: {"ok":true}

curl https://<seu-dominio-ou-ip>/api/v1/bootstrap
# esperado: JSON com advertisers, contacts, opportunities etc. — os
# mesmos dados que já estão em crm-redetv-schema-completo.sql
```

Se `bootstrap` retornar vazio, confirme que o schema SQL já rodou dentro do
container `crm-db` (ele roda automaticamente na primeira subida, via
`docker-entrypoint-initdb.d`, mas só se o volume `crm-db-data` ainda não
tiver dado nenhum — se já tiver subido antes sem o schema completo, talvez
seja preciso recriar o volume).

## 6. O que ainda falta (fora do escopo deste pacote)

- Autenticação/login (ver seção 6 do `crm-redetv-v1-pack-migracao.md`).
- Validação de payload mais rigorosa (os endpoints aqui fazem validação
  básica; antes de produção com dado real, vale reforçar).
- Job de sincronização com o OPEC (`faturamento_efetivo`) e carga de Metas
  — hoje essas duas tabelas só têm o dado de exemplo do schema SQL.
