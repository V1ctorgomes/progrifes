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

### Docker Compose (local)

```bash
docker compose up --build
```

## PRDs

- `prd-000.md` — Fundação do projeto
- `prd-001.md` — Home da loja virtual
