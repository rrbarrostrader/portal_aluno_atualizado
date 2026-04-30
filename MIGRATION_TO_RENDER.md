# Guia de Migração para o Render - Portal Acadêmico IAB FAPEGMA

Este guia explica como fazer o deploy do portal na plataforma [Render](https://render.com/), que é ideal para hospedar aplicações Node.js com banco de dados PostgreSQL.

## 1. Preparação do Repositório

O projeto já possui o arquivo `render.yaml` configurado, o que facilita muito o processo.

1. Crie uma conta no [GitHub](https://github.com/) (se não tiver)
2. Crie um novo repositório privado
3. Envie o código do projeto para este repositório:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

## 2. Configuração no Render

1. Crie uma conta no [Render](https://render.com/) e faça login
2. Conecte sua conta do GitHub ao Render

### 2.1 Criar o Banco de Dados (PostgreSQL)

1. No painel do Render, clique em **New** → **PostgreSQL**
2. Preencha os dados:
   - **Name:** `iab-fapegma-db`
   - **Database:** `iab_fapegma`
   - **User:** `iab_admin`
   - **Region:** Escolha a mais próxima (ex: Ohio ou Frankfurt)
   - **PostgreSQL Version:** 15
   - **Instance Type:** Free (para testes) ou Starter (para produção)
3. Clique em **Create Database**
4. Aguarde a criação e copie a **Internal Database URL** (será usada no próximo passo)

### 2.2 Criar o Web Service (Node.js)

O Render pode usar o arquivo `render.yaml` para configurar tudo automaticamente, mas se preferir fazer manualmente:

1. Clique em **New** → **Web Service**
2. Selecione **Build and deploy from a Git repository**
3. Conecte o repositório que você criou no GitHub
4. Preencha os dados:
   - **Name:** `iab-fapegma-portal`
   - **Region:** A mesma do banco de dados
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `pnpm install --no-frozen-lockfile && pnpm run build`
   - **Start Command:** `pnpm run db:push && pnpm run start`
   - **Instance Type:** Free ou Starter

### 2.3 Configurar Variáveis de Ambiente

Na seção **Environment Variables** do Web Service, adicione:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | Cole a **Internal Database URL** do passo 2.1 |
| `JWT_SECRET` | Clique em "Generate" ou cole uma string longa e segura |
| `NODE_ENV` | `production` |
| `VITE_APP_ID` | `iab-fapegma-portal` |

5. Clique em **Create Web Service**

## 3. Primeiro Acesso e Setup do Banco

O comando `pnpm run db:push` configurado no Render irá criar automaticamente as tabelas no banco de dados durante o deploy.

Quando o deploy terminar (status "Live"):

1. Acesse a URL fornecida pelo Render (ex: `https://iab-fapegma-portal.onrender.com`)
2. O servidor criará automaticamente o usuário admin padrão na primeira execução
3. Faça login com:
   - **Email:** `admin@iabfapgema.com.br`
   - **Senha:** `IAB_@2026_START`

## 4. Conectando o DBeaver ao Banco do Render (Opcional)

Se você quiser gerenciar o banco de dados de produção usando o DBeaver no seu Windows:

1. No painel do Render, vá até o seu PostgreSQL
2. Copie a **External Database URL**
3. No DBeaver, crie uma nova conexão PostgreSQL
4. Cole a URL no campo apropriado (o DBeaver preencherá os campos automaticamente)
5. Na aba **SSL**, marque a opção **Use SSL** e defina o modo como `require`
6. Teste a conexão e salve

## 5. Domínio Personalizado (Opcional)

Para usar um domínio como `portal.iabfapgema.com.br`:

1. No painel do Web Service no Render, vá em **Settings**
2. Role até **Custom Domains**
3. Clique em **Add Custom Domain**
4. Digite seu domínio e siga as instruções para configurar os registros CNAME/A no seu provedor de DNS (Registro.br, Cloudflare, etc.)

---

**Nota sobre o plano Free do Render:**
Se você usar o plano gratuito, o servidor entrará em "hibernação" após 15 minutos de inatividade. O próximo acesso pode demorar até 50 segundos para carregar enquanto o servidor "acorda". Para um portal acadêmico real, recomenda-se o plano Starter ($7/mês).
