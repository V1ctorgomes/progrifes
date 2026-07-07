# ERP Comercial Grifres

Monorepo do ERP Comercial Grifres.

## Estrutura

```text
progrifes/
├── frontend/     # Next.js — Loja virtual (Home)
├── backend/      # NestJS — API (scaffold para PRDs futuros)
├── docker/       # Configurações Docker/Nginx
├── docs/         # Documentação
└── scripts/      # Scripts utilitários
```

## Desenvolvimento local

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:3000

### Backend

```bash
cd backend
npm install
npm run start:dev
```

Health check: http://localhost:3001/api/health

## Docker / EasyPanel

Cada serviço possui seu próprio `Dockerfile` otimizado para deploy no EasyPanel:

- **Frontend**: porta `3000` (Next.js standalone)
- **Backend**: porta `3001` (NestJS)

### Deploy no EasyPanel

1. Crie um serviço apontando para o repositório
2. Defina o **Build Path** como `frontend` ou `backend`
3. Configure as variáveis de ambiente conforme `.env.example`
4. Exponha a porta correspondente

#### Checklist de autenticação (EasyPanel)

1. **PostgreSQL** rodando e acessível pelo backend
2. **Backend** com `DATABASE_URL`, `JWT_*` e `CORS_ORIGIN` (URL do frontend)
3. **Frontend** com `BACKEND_URL` apontando para a URL do backend
4. Teste: `https://SEU-FRONTEND/api/health` deve retornar `backend: ok`
5. Teste: `https://SEU-BACKEND/api/health` deve retornar status da API

### Docker Compose (local)

```bash
docker compose up --build
```

## PRDs

- `prd-000.md` — Fundação do projeto
- `prd-001.md` — Home da loja virtual
- `prd-002.md` — Sistema de Banners
- `prd-003.md` — Sistema de Categorias
- `prd-004.md` — Autenticação e Controle de Acesso
- `prd-005.md` — Administração de Banners e Categorias
- `prd-006.md` — Sistema de Produtos
- `prd-007.md` — Sistema de Variantes (Cor, Tamanho, SKU e Estoque)
- `prd-009.md` — Carrinho de Compras
- `prd-010.md` — Checkout via WhatsApp

## Autenticação (PRD-004)

### Credenciais iniciais (seed)

- **E-mail:** `admin@grifres.com`
- **Senha:** `12345678`

### Rotas

- **Login admin:** `/admin/login`
- **Área administrativa:** `/admin` (protegida)

### Variáveis de ambiente

Configure `backend/.env` conforme `backend/.env.example` (PostgreSQL, JWT, CORS).

No frontend, defina `BACKEND_URL` (ex.: `http://localhost:3001`).

### Docker Compose

O `docker compose up` sobe PostgreSQL, backend e frontend. O backend executa migrations e seed automaticamente na inicialização (`node dist/database/run-seed.js`).

O seed cria/atualiza o admin e popula banners e categorias iniciais quando as tabelas estão vazias.
