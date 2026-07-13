# Plano de otimização — Admin Grifres

Status: **pendente** (guardar para implementar depois)  
Contexto: o admin está lento nos carregamentos. React Query já está razoável; o gargalo principal é payload/API e hop BFF.

## Diagnóstico (resumo)

1. Listagens trazem dados de detalhe (itens, histórico, imagens).
2. Selects baixam catálogo inteiro (`limit: 200` com payload completo).
3. Toda request admin passa pelo BFF Next → Nest (hop extra).
4. Faltam índices em `Order` e `Product`.
5. Dashboard financeiro é pesado e faz polling a cada 60s.

## Quick wins (prioridade alta)

- [ ] Slim includes nas listagens (pedidos, AP/AR, estoque, produtos) — só colunas da tabela
- [ ] Endpoint leve para selects: produtos/fornecedores/clientes (`id` + `nome`, sem imagens)
- [ ] Trocar `limit: 200` nos formulários/filtros pelo endpoint leve
- [ ] Índices Prisma: `Order(status)`, `Order(createdAt)`, `Order(customerId)`; `Product(deletedAt, ativo)`, `Product(categoriaId)`
- [ ] Debounce na busca de produtos (admin)
- [ ] Aliviar dashboard financeiro (COGS sem carregar todos os itens; reduzir/remover `refetchInterval`)

## Melhorias médias

- [ ] Separar `listInclude` vs `detailInclude` em todos os repositórios admin
- [ ] Avaliar chamar Nest direto do browser no admin (ou rewrite) para reduzir hop BFF
- [ ] `next/dynamic` nos hubs (estoque, entregas, financeiro)
- [ ] Typeahead paginado para produtos/variantes
- [ ] `staleTime` maior para catálogos estáveis (categorias, tags)

## Não over-engineerar

- Redis/CDN só para admin
- GraphQL só para cortar overfetch
- Reescrever React Query / Zustand por “re-renders”
- Micro-otimizar `memo`/`useCallback` no layout
- SSR das páginas admin

## Arquivos-chave

- `backend/src/modules/orders/orders.repository.ts`
- `backend/src/modules/accounts-payable/accounts-payable.repository.ts`
- `backend/src/modules/accounts-receivable/accounts-receivable.repository.ts`
- `backend/src/modules/inventory/inventory-*.repository.ts`
- `backend/src/modules/products/products.repository.ts`
- `backend/prisma/schema.prisma` (índices Order/Product)
- `frontend/src/lib/admin-proxy.ts` / `frontend/src/lib/admin-api.ts`
- `frontend/src/features/admin/financial/FinancialOverviewPage.tsx`
- Formulários com `limit: 200` (estoque, compras, financeiro)

## Ordem sugerida de implementação

1. Slim listagens + índices  
2. Selects leves  
3. Dashboard financeiro  
4. Code-split hubs  
5. Avaliar remoção/redução do hop BFF
