# Marvel Saga Tracker

Organize suas sagas, títulos e issues da Marvel em um PWA simples, rápido e sincronizado com Supabase.

O projeto nasceu para resolver um problema bem específico: acompanhar leituras longas de quadrinhos, eventos, tie-ins, prelúdios, epílogos e edições anuais sem se perder no meio do caminho.

## Recursos

- Cadastro de sagas com era, universo, ano e notas.
- Cadastro de títulos reutilizáveis para issues.
- Cadastro de issues com número, volume, edição anual, ano, tipo de história, ordem de leitura e notas.
- Agrupamento por tipo de história: principal, tie-in, prelúdio, epílogo e graphic novel.
- Controle de progresso de leitura por saga.
- Estatísticas gerais.
- Importação e exportação de dados em JSON.
- Importação e exportação de issues por saga.
- Login com email e senha via Supabase Auth.
- Dados isolados por usuário com Row Level Security.
- PWA com suporte a instalação.
- Tema claro, escuro e sistema.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn-ui
- Supabase
- React Router
- TanStack Query

## Começando

Clone o projeto:

```sh
git clone git@github.com:thailoeduardo/marvel-saga-tracker.git
cd marvel-saga-tracker
```

Instale as dependências:

```sh
npm install
```

Crie o arquivo `.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Rode o projeto:

```sh
npm run dev
```

## Configurando o Supabase

1. Crie um projeto no Supabase.
2. Copie `Project URL` para `VITE_SUPABASE_URL`.
3. Copie a chave publishable/anon para `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. No SQL Editor do Supabase, execute o conteúdo de:

```txt
supabase/schema.sql
```

5. Em Authentication, habilite login por email/senha.

As tabelas principais são:

- `titles`
- `sagas`
- `issues`

Todas usam `user_id` com RLS para garantir que cada usuário veja apenas os próprios dados.

## Scripts

```sh
npm run dev
npm run build
npm run lint
npm run preview
```

## Importação e Backup

O app permite exportar um backup completo em JSON e importar esse backup novamente.

Com Supabase configurado, a importação salva os dados no banco do usuário logado. Sem Supabase, o app usa o armazenamento local do navegador como fallback.

## Segurança

Não coloque chaves privadas no frontend.

Variáveis esperadas no `.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Nunca use `service_role_key` no app React.

## Contribuindo

Contribuições são bem-vindas.

Fluxo sugerido:

```sh
git checkout -b minha-feature
npm install
npm run dev
```

Antes de abrir um pull request:

```sh
npm run build
npx tsc --noEmit
```

## Licença

Este projeto é open source. Defina uma licença no arquivo `LICENSE` antes de publicar oficialmente.
