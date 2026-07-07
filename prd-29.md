# PRD-029 — Controle de Entregadores

| Campo | Valor |
|--------|--------|
| **Projeto** | ERP Comercial Grifres |
| **Versão** | 1.0.0 |
| **Status** | Aprovado |
| **Prioridade** | Alta |

---

# 1. Objetivo

Implementar o módulo de Controle de Entregadores do ERP Comercial Grifres.

Este módulo será responsável pelo cadastro, gerenciamento e acompanhamento dos entregadores responsáveis pelas entregas da loja.

Cada pedido poderá ser atribuído manualmente a um entregador, permitindo acompanhar sua disponibilidade, histórico de entregas e desempenho.

---

# 2. Objetivos

- Cadastrar entregadores.
- Controlar disponibilidade.
- Vincular entregadores aos pedidos.
- Registrar histórico de entregas.
- Medir desempenho.
- Preparar integração com o módulo de entregas.

---

# 3. Escopo

Este PRD contempla:

- Cadastro de entregadores.
- Situação do entregador.
- Dados pessoais.
- Pesquisa.
- Filtros.
- Histórico.
- Estatísticas.

Não contempla:

- Rastreamento GPS.
- Compartilhamento de localização.
- Aplicativo para entregador.
- Assinatura digital.

---

# 4. Cadastro

Criar cadastro contendo:

```text
Nome

Telefone

CPF (opcional)

Documento (opcional)

Observações

Status
```

---

# 5. Status

Cada entregador poderá possuir os seguintes status:

```text
Disponível

Em Entrega

Ausente

Folga

Inativo
```

Apenas entregadores com status **Disponível** poderão receber novos pedidos.

---

# 6. Administração

Criar página:

```text
/administrativo/entregadores
```

---

## Funcionalidades

- Cadastrar.
- Editar.
- Alterar status.
- Excluir logicamente.
- Pesquisa.
- Filtros.
- Histórico.

---

# 7. Pesquisa

Permitir pesquisar por:

```text
Nome

Telefone

CPF
```

---

# 8. Filtros

Permitir filtrar por:

```text
Disponível

Em Entrega

Ausente

Folga

Inativo
```

---

# 9. Histórico

Cada entregador deverá possuir:

```text
Total de entregas

Pedidos entregues

Pedidos cancelados

Última entrega

Data de cadastro
```

Esses indicadores serão atualizados automaticamente.

---

# 10. Integração com Pedidos

Na tela do pedido deverá existir:

```text
Entregador

[Selecionar]
```

Ao selecionar um entregador:

- o pedido ficará vinculado ao entregador;
- o status do entregador poderá ser alterado para **Em Entrega** quando o pedido sair para entrega.

---

# 11. Dashboard

Preparar indicadores:

```text
Entregadores ativos

Entregadores disponíveis

Entregadores em rota

Total de entregas

Entregador com mais entregas
```

---

# 12. Backend

Expandir:

```text
DeliveryModule
```

Criar:

```text
DeliveryPersonModule

DeliveryPersonService

DeliveryPersonController
```

---

# 13. Endpoints

```http
GET /delivery-persons

GET /delivery-persons/:id

POST /delivery-persons

PUT /delivery-persons/:id

PATCH /delivery-persons/:id/status

DELETE /delivery-persons/:id
```

---

# 14. Banco de Dados

Tabela:

```text
delivery_persons
```

Campos:

```text
id

name

phone

cpf

document

status

notes

created_at

updated_at

deleted_at
```

Utilizar exclusão lógica (`deleted_at`).

---

# 15. Regras de Negócio

- Não permitir dois entregadores com o mesmo CPF (quando informado).
- Apenas entregadores ativos poderão receber pedidos.
- Apenas entregadores disponíveis poderão ser vinculados a novos pedidos.
- A exclusão deverá ser lógica.
- O histórico nunca deverá ser perdido.

---

# 16. Segurança

Implementar:

- JWT.
- Guards.
- Controle de permissões.
- Auditoria completa.

---

# 17. Performance

- Índice por nome.
- Índice por telefone.
- Índice por status.
- Paginação.
- Cache da lista de entregadores disponíveis.

---

# 18. Responsividade

Obrigatório:

- Desktop.
- Notebook.
- Tablet.
- Smartphone.

Toda a gestão deverá funcionar em dispositivos móveis.

---

# 19. Critérios de Aceitação

O PRD será considerado concluído quando:

- Cadastro funcionando.
- Edição funcionando.
- Pesquisa funcionando.
- Filtros funcionando.
- Alteração de status funcionando.
- Integração com pedidos funcionando.
- Histórico funcionando.
- Dashboard preparado.

---

# 20. Fora do Escopo

Não implementar:

- Aplicativo do entregador.
- Rastreamento em tempo real.
- Compartilhamento de localização.
- Assinatura digital.
- Integração com Google Maps.

Esses recursos poderão ser adicionados futuramente.

---

# 21. Observações

O Controle de Entregadores permitirá organizar a operação logística da Grifres de forma simples e eficiente.

Inicialmente, a distribuição dos pedidos será manual, feita pelo administrador. A arquitetura foi projetada para permitir evoluções futuras, como aplicativo para entregadores, notificações automáticas e rastreamento em tempo real, sem necessidade de alterações estruturais.