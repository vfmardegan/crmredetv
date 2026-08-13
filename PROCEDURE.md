# Procedimento de Implantação CRM na AWS EC2 e Ambiente Local

Este documento orienta sobre a preparação, configuração e implantação da aplicação CRM em uma instância Linux Ubuntu na AWS EC2. Também aborda como levantar uma máquina Linux para testar todo o procedimento localmente.

---

## 1. Preparação da Instância na AWS EC2

### 1.1 Criando a Instância
1. Acesse o Console AWS e vá para **EC2**.
2. Clique em **Launch Instance** (Executar Instância).
3. **Nome**: `CRM-Server` (ou de sua escolha).
4. **Imagem de Sistema (AMI)**: Selecione **Ubuntu Server 24.04 LTS** (elegível para nível gratuito - *Free Tier*).
5. **Tipo de Instância**: `t2.micro` (ou `t3.micro` se disponível no seu plano gratuito).
6. **Key Pair (Chave SSH)**: Crie um par de chaves `.pem` (ex: `crm-key.pem`), baixe e guarde em local seguro na sua máquina física.
7. **Configuração de Rede (Security Group)**:
   - Permita tráfego **SSH** (porta 22) apenas do seu IP (recomendado) ou de qualquer lugar (`0.0.0.0/0`).
   - Permita tráfego **HTTP** (porta 80) de qualquer lugar (`0.0.0.0/0`).
   - Permita tráfego **HTTPS** (porta 443) de qualquer lugar (`0.0.0.0/0`).
8. Clique em **Launch Instance**.

### 1.2 Associando um Elastic IP (Opcional, mas Altamente Recomendado)
Para evitar que o IP público da sua instância mude toda vez que ela for reiniciada:
1. No menu lateral do EC2, vai em **Elastic IPs**.
2. Clique em **Allocate Elastic IP address** e depois em **Allocate**.
3. Selecione o IP criado, clique em **Actions** -> **Associate Elastic IP address**.
4. Selecione a instância do CRM criada e associe.

---

## 2. Acesso e Configuração Inicial (via SSH)

1. Ajuste as permissões da sua chave privada baixada (no seu terminal local):
   ```bash
   chmod 400 crm-key.pem
   ```
2. Conecte-se à instância:
   ```bash
   ssh -i crm-key.pem ubuntu@<IP_PUBLICO_DA_INSTANCIA>
   ```

---

## 3. Utilizando os Scripts de Automação

No diretório do projeto, temos dois scripts criados para facilitar o deploy:

### 3.1 `setup.sh` (Instalação das dependências na máquina)
Este script atualiza o sistema e instala o Docker e o Docker Compose.
Para executá-lo no Ubuntu do EC2:
1. Copie o script para o servidor ou clone seu repositório.
2. Dê permissão de execução:
   ```bash
   chmod +x setup.sh
   ```
3. Execute o script:
   ```bash
   ./setup.sh
   ```

### 3.2 `deploy.sh` (Implantação da aplicação)
Este script copia ou puxa a versão mais recente do código e inicializa os containers Docker.
1. Configure as variáveis de ambiente necessárias no arquivo `.env` (se houver).
2. Dê permissão de execução:
   ```bash
   chmod +x deploy.sh
   ```
3. Execute o deploy:
   ```bash
   ./deploy.sh
   ```

---

## 4. Configurando Nginx e SSL (HTTPS) com Let's Encrypt

O Nginx funcionará como um proxy reverso encaminhando as conexões externas (portas 80/443) para o container Docker (porta da aplicação, ex: 8000).

1. O container Nginx já é configurado via Docker Compose, ou você pode instalar o Nginx nativo na máquina:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```
2. Obtenha o certificado SSL gratuito (substitua pelo seu domínio configurado no DNS):
   ```bash
   sudo certbot --nginx -d crm.seudominio.com
   ```
3. O Certbot configurará automaticamente o redirecionamento de HTTP para HTTPS no Nginx.

---

## 5. Simulação e Teste Local em um Ambiente Linux

Se você deseja testar a instalação e os scripts localmente antes de criar a instância na AWS, podemos criar uma máquina Ubuntu local usando Docker.

### 5.1 Criando uma Instância Ubuntu Local via Docker
Execute o seguinte comando no seu terminal do macOS para subir um container rodando Ubuntu:
```bash
docker run -dit --name crm-test-linux -p 8080:80 -p 8443:443 ubuntu:24.04
```

### 5.2 Acessando o terminal do Ubuntu de Testes
```bash
docker exec -it crm-test-linux bash
```

### 5.3 Executando os Scripts no Container de Testes
Dentro do terminal do container `crm-test-linux`:
1. Instale dependências básicas como `sudo`, `curl` e `git`:
   ```bash
   apt update && apt install -y sudo curl git
   ```
2. Crie a pasta do projeto:
   ```bash
   mkdir -p /app/crm
   ```
3. Copie os scripts (`setup.sh`, `deploy.sh`, `docker-compose.yml`, `nginx.conf`) para dentro do container:
   - Em outro terminal do macOS:
     ```bash
     docker cp /Users/administrator/Desktop/Rossi/Desenvolvimento/CRM/. crm-test-linux:/app/crm/
     ```
4. Volte ao container e execute o `setup.sh` e o `deploy.sh`:
   ```bash
   cd /app/crm
   chmod +x setup.sh deploy.sh
   ./setup.sh
   ./deploy.sh
   ```
*(Nota: Executar Docker dentro de um container Docker (DinD) requer privilégios extras ou simulação. O script `setup.sh` instalará as ferramentas corretamente no container).*
