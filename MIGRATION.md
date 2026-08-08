# Guia de Migração do Render para o Vercel (LB Performance)

Este guia foi elaborado para garantir uma migração 100% segura do aplicativo **LB Performance** da hospedagem Render para a plataforma **Vercel**, preservando todos os dados de atletas, treinos, avaliações, logins e histórico, sem perda de nenhum trabalho já realizado.

---

## 1. Visão Geral da Arquitetura de Migração
A hospedagem no **Vercel** utiliza um ambiente **Serverless** otimizado, rápido e de baixíssimo custo/grátis.
Como as funções Serverless não mantêm conexões persistentes ou estados locais, as conexões de banco de dados e APIs foram adaptadas no arquivo `server.ts` para tolerar esse comportamento (com fallbacks e remoção de loops persistentes de conexão).

Para o funcionamento do banco de dados na Vercel, o sistema utilizará o **Supabase** (tanto via conexão Postgres direta quanto via API REST nativa do Supabase JS Client como fallback automático resiliente).

---

## 2. Passo a Passo do Backup dos Dados Atuais (Render)
Para garantir que nenhum trabalho já realizado seja perdido, siga estas instruções para extrair seus dados atuais:

1. **Acessar as credenciais do seu banco de dados atual no Render:**
   - Acesse o painel do seu serviço de banco de dados no Render (*Render Dashboard*).
   - Copie a string de conexão (`External Database URL`), que se parece com: `postgresql://usuário:senha@host.render.com/nome_do_banco`

2. **Gerar o arquivo de Backup localmente:**
   No terminal do seu projeto atual, você pode rodar o script de exportação integrado. Crie um arquivo `.env` com a sua `DATABASE_URL` do Render e execute:
   ```bash
   npm install tsx
   npx tsx scripts/export_data.ts
   ```
   *Isso gerará o arquivo `old_database_backup.json` na raiz do seu projeto contendo todos os usuários, atletas, avaliações, prontidões, treinos e sessões existentes.*

---

## 3. Preparando o Banco de Dados de Destino (Supabase)

1. **Criar um projeto no Supabase:**
   - Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
   - Crie um novo projeto (ex: `LB Performance`). Defina a senha do banco de dados e anote-a.

2. **Configurar as Tabelas (Schema):**
   - No painel do seu projeto no Supabase, vá em **SQL Editor** no menu lateral esquerdo.
   - Clique em **New Query**.
   - Abra o arquivo `supabase_migration.sql` (ou `supabase_schema.sql`) presente na raiz deste repositório, copie todo o seu conteúdo, cole no editor do Supabase e clique em **Run**.
   *Isso criará de forma instantânea toda a estrutura de tabelas necessária (atletas, usuários, treinos, avaliações, prontidões, etc.) com todos os índices e chaves estrangeiras necessárias.*

3. **Migrar os Dados do Render para o Supabase:**
   Para transferir os dados do backup gerado no passo 2 para o seu novo banco do Supabase, você pode rodar o script de migração:
   - Configure no seu arquivo `.env` as seguintes variáveis:
     - `DATABASE_URL`: A string de conexão do Render (origem).
     - `SUPABASE_DATABASE_URL`: A string de conexão Postgres do Supabase (pode ser encontrada em *Project Settings > Database > Connection string > URI*).
   - Execute o script no terminal:
     ```bash
     npx tsx scripts/migrate.ts
     ```
   *O script irá ler todas as informações do banco antigo e persistir no novo banco do Supabase de forma segura e incremental.*

---

## 4. Configurando a Hospedagem e Deploy na Vercel

1. **Criar o Projeto no Vercel:**
   - Acesse [vercel.com](https://vercel.com) e conecte sua conta do GitHub.
   - Clique em **Add New > Project** e selecione o repositório do seu app.

2. **Configurar as Variáveis de Ambiente (CRÍTICO):**
   No painel da Vercel, antes de clicar em *Deploy*, vá em **Environment Variables** e insira as seguintes chaves obrigatórias:

   | Nome da Variável | Descrição / Valor |
   |---|---|
   | `DATABASE_URL` | A URI de conexão direta do Postgres do seu novo Supabase (com o parâmetro `?sslmode=require`). |
   | `VITE_SUPABASE_URL` | A URL da API do seu projeto Supabase (ex: `https://xxxxxx.supabase.co`). |
   | `VITE_SUPABASE_ANON_KEY` | A chave pública anônima do seu Supabase (anon/public key). |
   | `GEMINI_API_KEY` | Sua chave de API do Google Gemini para as prescrições e laudos automatizados com IA. |
   | `JWT_SECRET` | Uma senha forte e arbitrária para criptografia dos tokens de login dos atletas e treinador (ex: `chave-secreta-lb-performance`). |

3. **Executar o Deploy:**
   - Clique em **Deploy**. A Vercel irá ler o arquivo `vercel.json` na raiz do projeto, compilar os assets do React (Vite) de forma estática e transformar o `server.ts` em uma API Express servida por funções Serverless automaticamente sob o caminho `/api/*`.

---

## 5. Garantias de Segurança e Resiliência contra Perda de Dados
Nosso sistema agora conta com um mecanismo de **Sincronização Bidirecional Resiliente de Alta Disponibilidade**:
- **Offline-First:** Se o atleta ou treinador estiver sem internet ou o banco estiver instável, todas as alterações são salvas localmente no navegador e sincronizadas de forma silenciosa e resiliente em segundo plano assim que a conexão se restabelecer.
- **Supabase REST Fallback:** Caso a conexão Postgres direta via Pool (`DATABASE_URL`) falhe ou esteja congestionada, o backend faz um **fallback automático e transparente** para o Supabase JS Client usando chamadas HTTPS REST autenticadas. Isso garante que o app **nunca fique fora do ar** e as escritas de dados sempre aconteçam.
- **Login Seguro:** O login foi ajustado para buscar o usuário Leandro (ou qualquer atleta registrado) primeiro no banco de dados e no Supabase, garantindo acesso instantâneo.

Seguindo este guia, seu sistema estará operando com máxima velocidade, segurança e estabilidade, aproveitando o que há de melhor no ecossistema moderno do Vercel e Supabase!
