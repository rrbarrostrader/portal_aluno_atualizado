# Guia de Setup Local - Portal Acadêmico IAB FAPEGMA

Este guia fornece instruções passo a passo para configurar e executar o portal localmente no Windows usando PostgreSQL e DBeaver.

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

1. **Node.js** (versão 18 ou superior) - [Download](https://nodejs.org/)
2. **PostgreSQL** (versão 12 ou superior) - [Download](https://www.postgresql.org/download/windows/)
3. **DBeaver** (Community Edition) - [Download](https://dbeaver.io/download/)
4. **Git** (opcional, mas recomendado) - [Download](https://git-scm.com/download/win)

## Passo 1: Instalar e Configurar PostgreSQL

### 1.1 Instalação do PostgreSQL

1. Execute o instalador do PostgreSQL
2. Escolha a pasta de instalação (padrão: `C:\Program Files\PostgreSQL\15`)
3. Defina a senha do usuário `postgres` (exemplo: `postgres`)
4. Mantenha a porta padrão: **5432**
5. Selecione o locale como **Portuguese (Brazil)**
6. Conclua a instalação

### 1.2 Verificar Instalação

Abra o **Command Prompt** (cmd) e teste a conexão:

```bash
psql -U postgres -h localhost
```

Digite a senha quando solicitado. Se conectar com sucesso, digite `\q` para sair.

## Passo 2: Criar Banco de Dados

### 2.1 Usando DBeaver

1. Abra o **DBeaver**
2. Clique em **Database** → **New Database Connection**
3. Selecione **PostgreSQL** e clique em **Next**
4. Preencha os dados:
   - **Server Host:** `localhost`
   - **Port:** `5432`
   - **Database:** deixe em branco por enquanto
   - **Username:** `postgres`
   - **Password:** a senha que você definiu na instalação
5. Clique em **Test Connection** para verificar
6. Clique em **Finish**

### 2.2 Criar Banco de Dados

1. No DBeaver, clique com botão direito em **Databases** (na conexão PostgreSQL)
2. Selecione **Create New Database**
3. Preencha:
   - **Database name:** `iab_fapegma`
   - **Template:** `template0`
   - **Encoding:** `UTF8`
4. Clique em **Create**

### 2.3 Executar Script SQL

1. No DBeaver, clique com botão direito no banco `iab_fapegma`
2. Selecione **SQL Editor** → **Open SQL Script**
3. Abra o arquivo `setup_database.sql` do projeto
4. Clique em **Execute** (ou pressione `Ctrl+Enter`)
5. Verifique se todas as tabelas foram criadas com sucesso

Você deve ver as seguintes tabelas criadas:
- `users`
- `courses`
- `subjects`
- `enrollments`
- `grades`
- `attendance`
- `announcements`
- `loginHistory`
- `auditLogs`

## Passo 3: Configurar o Projeto

### 3.1 Instalar Dependências

1. Abra o **Command Prompt** ou **PowerShell**
2. Navegue até a pasta do projeto:
   ```bash
   cd C:\caminho\para\iab_fapegma_portal-main
   ```

3. Instale o gerenciador de pacotes `pnpm` (se não tiver):
   ```bash
   npm install -g pnpm
   ```

4. Instale as dependências do projeto:
   ```bash
   pnpm install
   ```

### 3.2 Configurar Variáveis de Ambiente

1. Abra o arquivo `.env.local` na raiz do projeto
2. Atualize as variáveis conforme necessário:

```env
# Banco de Dados PostgreSQL
DATABASE_URL=postgres://postgres:sua_senha@localhost:5432/iab_fapegma

# Segredo JWT
JWT_SECRET=iab_fapegma_portal_secret_key_2026_local_dev

# Ambiente
NODE_ENV=development
PORT=3000

# ID do Aplicativo
VITE_APP_ID=iab-fapegma-portal
```

**Importante:** Substitua `sua_senha` pela senha do usuário `postgres` que você definiu.

## Passo 4: Executar o Servidor

### 4.1 Iniciar em Modo Desenvolvimento

No Command Prompt ou PowerShell, execute:

```bash
pnpm dev
```

Você deve ver uma saída similar a:

```
Server running on http://localhost:3000/
```

### 4.2 Acessar o Portal

Abra seu navegador e acesse:

```
http://localhost:3000
```

Você será redirecionado para a página de login.

## Passo 5: Fazer Login

### Credenciais Padrão

Use as seguintes credenciais para acessar como administrador:

- **Email:** `admin@iabfapgema.com.br`
- **Senha:** `IAB_@2026_START`

Após o login bem-sucedido, você será redirecionado para o painel administrativo.

## Solução de Problemas

### Erro: "ECONNREFUSED" ao iniciar o servidor

**Causa:** PostgreSQL não está rodando ou a conexão está incorreta.

**Solução:**
1. Verifique se PostgreSQL está rodando (procure por `postgres.exe` no Gerenciador de Tarefas)
2. Se não estiver, inicie o serviço PostgreSQL:
   - Abra **Serviços** (services.msc)
   - Procure por **postgresql-x64-15** (ou versão similar)
   - Clique em **Iniciar**

### Erro: "password authentication failed"

**Causa:** Senha incorreta no arquivo `.env.local`.

**Solução:**
1. Verifique a senha do usuário `postgres` no DBeaver
2. Atualize o arquivo `.env.local` com a senha correta

### Erro: "database does not exist"

**Causa:** O banco de dados `iab_fapegma` não foi criado.

**Solução:**
1. Siga o **Passo 2** para criar o banco de dados
2. Certifique-se de executar o script SQL `setup_database.sql`

### Login falha com "Invalid email or password"

**Causa:** O usuário admin não foi criado ou o hash está incorreto.

**Solução:**
1. Verifique no DBeaver se há registros na tabela `users`:
   ```sql
   SELECT * FROM users;
   ```
2. Se não houver registros, execute novamente o script `setup_database.sql`

### Porta 3000 já está em uso

**Causa:** Outra aplicação está usando a porta 3000.

**Solução:**
1. Altere a porta no arquivo `.env.local`:
   ```env
   PORT=3001
   ```
2. Acesse o portal em `http://localhost:3001`

## Comandos Úteis

### Compilar para Produção

```bash
pnpm build
```

### Executar Testes

```bash
pnpm test
```

### Formatar Código

```bash
pnpm format
```

### Verificar Tipos TypeScript

```bash
pnpm check
```

## Próximos Passos

Após configurar localmente com sucesso:

1. **Criar Cursos:** Acesse o painel admin e crie cursos
2. **Criar Alunos:** Cadastre alunos e atribua-os aos cursos
3. **Adicionar Disciplinas:** Crie disciplinas para cada curso
4. **Registrar Notas:** Insira notas e frequência dos alunos

## Migração para Render

Quando estiver pronto para fazer deploy em produção, consulte o arquivo `MIGRATION_TO_RENDER.md` para instruções detalhadas.

## Suporte

Para dúvidas ou problemas, verifique:

1. Os logs do servidor (console do Command Prompt)
2. O console do navegador (F12 → Console)
3. Os logs do DBeaver para erros de banco de dados

---

**Última atualização:** Março de 2026
