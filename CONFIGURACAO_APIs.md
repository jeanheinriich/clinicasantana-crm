# Guia de Configuração de APIs — Clínica Santana CRM

Este documento explica como obter as credenciais necessárias do **Meta Ads** e do **Kommo CRM** para ativar as integrações do sistema.

---

## Variáveis necessárias — visão rápida

| Variável | De onde vem |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL |
| `AUTH_SECRET` | Você gera |
| `CRON_SECRET` | Você gera |
| `NEXT_PUBLIC_BASE_URL` | URL do sistema no Vercel |
| `META_APP_ID` | Meta for Developers |
| `META_APP_SECRET` | Meta for Developers |
| `META_AD_ACCOUNT_ID` | Gerenciador de Anúncios |
| `KOMMO_CLIENT_ID` | Kommo OAuth App |
| `KOMMO_CLIENT_SECRET` | Kommo OAuth App |
| `KOMMO_SUBDOMAIN` | URL da sua conta Kommo |
| `KOMMO_SECRET` | Kommo Webhook Settings |

---

## Parte 1 — Chaves que você mesmo gera

Execute o comando abaixo **duas vezes** no terminal para gerar `AUTH_SECRET` e `CRON_SECRET`:

```bash
openssl rand -base64 32
```

Guarde os dois valores gerados.

---

## Parte 2 — Meta Ads (Facebook)

### Passo 1 — Acessar o Meta for Developers

1. Acesse **https://developers.facebook.com/**
2. Faça login com a conta que administra os anúncios da clínica
3. Clique em **"Meus Apps"** no menu superior

### Passo 2 — Criar o App

1. Clique em **"Criar app"**
2. Tipo: **"Outros"** → Avançar
3. Categoria: **"Business"** → Avançar
4. Preencha:
   - **Nome do app:** `Clinica Santana CRM`
   - **Email:** seu email
   - **Conta Business:** selecione a conta da clínica (se houver)
5. Clique em **"Criar app"**

### Passo 3 — Obter META_APP_ID e META_APP_SECRET

1. No menu lateral, clique em **"Configurações" → "Básico"**
2. **"ID do aplicativo"** → copie → este é o `META_APP_ID`
3. Clique em **"Mostrar"** ao lado de **"Chave secreta"** → copie → este é o `META_APP_SECRET`

> A chave secreta nunca deve ser compartilhada ou publicada.

### Passo 4 — Adicionar o produto Marketing API

1. No menu lateral, clique em **"Adicionar produto"**
2. Localize **"Marketing API"** → clique em **"Configurar"**
3. Vá em **Configurações → Básico** e localize **"URIs de redirecionamento OAuth válidos"**
4. Adicione (substitua pelo domínio real do sistema):
   ```
   https://clinicasantana.vercel.app/api/integracoes/meta/callback
   ```
5. Clique em **"Salvar alterações"**

### Passo 5 — Solicitar permissões

1. No menu lateral, clique em **"Permissões e recursos"**
2. Solicite as três permissões abaixo:
   - `ads_read` — leitura de campanhas e métricas
   - `leads_retrieval` — leads gerados pelos anúncios
   - `pages_read_engagement` — engajamento da página

> **Nota:** Em **Modo de Desenvolvimento**, o app funciona imediatamente para usuários Admin sem precisar de revisão da Meta. Para produção com usuários externos, é necessário passar pela revisão.

### Passo 6 — Adicionar usuário de teste (Modo Dev)

1. Vá em **"Funções" → "Testadores"**
2. Adicione o usuário Facebook que irá autorizar a conexão com o sistema

### Passo 7 — Obter META_AD_ACCOUNT_ID

1. Acesse **https://business.facebook.com/** e selecione a conta da clínica
2. Clique em **"Gerenciador de Anúncios"** (Ads Manager)
3. No canto superior esquerdo, o número entre parênteses ao lado do nome da conta é o ID
   - Exemplo: `Clínica Santana (123456789012345)`
4. Adicione o prefixo `act_` ao número:
   ```
   META_AD_ACCOUNT_ID=act_123456789012345
   ```

---

## Parte 3 — Kommo CRM

### Passo 1 — Identificar o subdomínio

1. Faça login na sua conta Kommo
2. Observe a URL: `https://clinicasantana.kommo.com`
3. A parte antes de `.kommo.com` é o subdomínio:
   ```
   KOMMO_SUBDOMAIN=clinicasantana
   ```

### Passo 2 — Criar o OAuth App

1. Acesse: `https://SEU_SUBDOMAIN.kommo.com/oauth/`
2. Clique em **"Criar integração"**
3. Preencha:
   - **Nome:** `CRM Clínica Santana`
   - **Descrição:** `Integração com o sistema CRM interno`
   - **URL de redirecionamento:**
     ```
     https://clinicasantana.vercel.app/api/integracoes/kommo/callback
     ```
   - **Permissões:** marque todas relacionadas a Leads e CRM
4. Clique em **"Salvar"**

### Passo 3 — Obter CLIENT ID e CLIENT SECRET

Após salvar, a tela exibirá:
- **Client ID** (formato UUID) → `KOMMO_CLIENT_ID`
- **Client Secret** (string longa) → `KOMMO_CLIENT_SECRET`

Copie e guarde os dois valores.

### Passo 4 — Configurar o Webhook

1. Na mesma tela do App, vá até a seção **"Webhooks"**
2. Em **"URL do Webhook"**, insira:
   ```
   https://clinicasantana.vercel.app/api/webhooks/kommo
   ```
3. Marque os eventos:
   - ✅ Leads — Adicionar
   - ✅ Leads — Atualizar
   - ✅ Leads — Alterar status
   - ✅ Notas — Adicionar _(opcional)_
4. No campo **"Chave secreta"** / **"Secret key"**: copie o valor gerado → `KOMMO_SECRET`
5. Clique em **"Salvar"**

> Se não encontrar o campo de chave secreta aqui, procure em **Configurações → API → Webhooks**.

---

## Parte 4 — Banco de dados (Neon PostgreSQL)

### Passo 1 — Criar projeto no Neon

1. Acesse **https://neon.tech/** e crie uma conta gratuita
2. Clique em **"New Project"**
3. Preencha:
   - **Project name:** `clinicasantana`
   - **Database name:** `crm`
   - **Region:** `South America (São Paulo)` ou `US East`
4. Clique em **"Create project"**

### Passo 2 — Obter DATABASE_URL

1. Na tela do projeto, clique em **"Connection string"**
2. No dropdown, selecione o formato **"Prisma"**
3. Copie a string completa (começa com `postgresql://...`) → este é o `DATABASE_URL`

---

## Parte 5 — NEXT_PUBLIC_BASE_URL

Defina como a URL pública do sistema, sem barra no final:

- Desenvolvimento: `http://localhost:3000`
- Produção: `https://clinicasantana.vercel.app`

---

## Parte 6 — Configurar no Vercel (produção)

1. Acesse **https://vercel.com/** e abra o projeto
2. Vá em **"Settings" → "Environment Variables"**
3. Para cada variável abaixo, clique em **"Add New"**:

| Key | Value | Environment |
|---|---|---|
| `DATABASE_URL` | sua string do Neon | Production, Preview |
| `AUTH_SECRET` | string gerada na Parte 1 | Production, Preview |
| `CRON_SECRET` | string gerada na Parte 1 | Production, Preview |
| `NEXT_PUBLIC_BASE_URL` | URL do sistema | Production, Preview |
| `META_APP_ID` | ID do app Meta | Production, Preview |
| `META_APP_SECRET` | segredo do app Meta | Production, Preview |
| `META_AD_ACCOUNT_ID` | `act_...` | Production, Preview |
| `KOMMO_CLIENT_ID` | UUID do OAuth App | Production, Preview |
| `KOMMO_CLIENT_SECRET` | segredo do OAuth App | Production, Preview |
| `KOMMO_SUBDOMAIN` | seu subdomínio | Production, Preview |
| `KOMMO_SECRET` | chave do webhook | Production, Preview |

4. Clique em **"Save"**
5. Faça um novo **deploy** para as variáveis entrarem em vigor

---

## Parte 7 — Arquivo `.env.local` (desenvolvimento local)

Crie o arquivo `.env.local` na raiz do projeto com o conteúdo abaixo, substituindo pelos valores reais:

```env
# Banco de dados
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/crm?sslmode=require

# Autenticação
AUTH_SECRET=COLE_AQUI_A_STRING_GERADA_1

# URL do sistema
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Cron
CRON_SECRET=COLE_AQUI_A_STRING_GERADA_2

# Meta Ads
META_APP_ID=123456789012345
META_APP_SECRET=abcdef1234567890abcdef1234567890
META_AD_ACCOUNT_ID=act_123456789012345

# Kommo CRM
KOMMO_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
KOMMO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
KOMMO_SUBDOMAIN=clinicasantana
KOMMO_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Parte 8 — Inicializar o banco de dados

Com o `.env.local` preenchido, execute no terminal dentro da pasta do projeto:

```bash
# Cria as tabelas no banco
npm run db:migrate

# Cria o usuário administrador padrão
npm run db:seed
```

O seed cria o acesso inicial:
- **Email:** `admin@clinicasantana.com.br`
- **Senha:** `admin123`

> Troque a senha imediatamente após o primeiro login!

---

## Parte 9 — Conectar as integrações pelo sistema

Após o sistema estar online:

1. Faça login como admin
2. No menu lateral, clique em **"Integrações"**
3. Clique em **"Conectar Meta Ads"** → autorize com a conta Facebook
4. Clique em **"Conectar Kommo"** → autorize com a conta Kommo
5. Clique em **"Sincronizar agora"** para importar dados históricos

---

## Checklist final

- [ ] `DATABASE_URL` preenchida e banco migrado (`npm run db:migrate`)
- [ ] `AUTH_SECRET` gerada e configurada
- [ ] `CRON_SECRET` gerada e configurada
- [ ] `NEXT_PUBLIC_BASE_URL` com a URL real do sistema
- [ ] App Meta criado e `META_APP_ID` + `META_APP_SECRET` copiados
- [ ] `META_AD_ACCOUNT_ID` no formato `act_XXXXXXXXX`
- [ ] Redirect URI do Meta configurado: `.../api/integracoes/meta/callback`
- [ ] Permissões Meta solicitadas: `ads_read`, `leads_retrieval`, `pages_read_engagement`
- [ ] OAuth App do Kommo criado e `KOMMO_CLIENT_ID` + `KOMMO_CLIENT_SECRET` copiados
- [ ] `KOMMO_SUBDOMAIN` definido (sem `.kommo.com`)
- [ ] Webhook Kommo apontando para `.../api/webhooks/kommo` e `KOMMO_SECRET` copiado
- [ ] Todas as variáveis inseridas no Vercel e novo deploy feito
- [ ] `npm run db:migrate` e `npm run db:seed` executados
- [ ] Login testado com `admin@clinicasantana.com.br`
- [ ] Integrações conectadas pela interface do sistema
