# Sistema de Pacotes de Requisições

## Funcionalidades Implementadas

### 1. **Requisições em Pacote**
- Os usuários agora podem criar requisições com múltiplos itens de uma só vez
- Interface reformulada para adicionar/remover itens dinamicamente
- Validação de estoque para cada item antes do envio

### 2. **Gestão Administrativa Granular**
- Administradores podem aprovar/rejeitar itens individualmente dentro de um pacote
- Opção de aprovar/rejeitar todos os itens de uma vez
- Status do pacote atualizado automaticamente baseado no status dos itens

### 3. **Status de Pacotes**
- **Pendente**: Pacote criado, aguardando análise
- **Aprovado**: Todos os itens foram aprovados
- **Rejeitado**: Todos os itens foram rejeitados  
- **Parcialmente Aprovado**: Alguns itens aprovados, outros rejeitados

### 4. **Interface Melhorada**
- Modal detalhado para visualizar itens do pacote
- Tabelas com informações resumidas dos pacotes
- Indicadores visuais de status por cores
- Botões de ação contextuais para administradores

## Estrutura do Banco de Dados

### Novas Tabelas Criadas:

#### `pacotes_requisicoes`
- `id`: ID único do pacote
- `userId`: ID do usuário solicitante
- `centroCusto`: Centro de custo
- `projeto`: Projeto/WBS
- `justificativa`: Justificativa da requisição
- `status`: Status do pacote (pendente, aprovado, rejeitado, parcialmente_aprovado)
- `data`: Data de criação
- `observacoes`: Observações administrativas

#### `itens_pacote_requisicoes`
- `id`: ID único do item no pacote
- `pacoteId`: Referência ao pacote
- `itemId`: Referência ao item do estoque
- `quantidade`: Quantidade solicitada
- `status`: Status do item (pendente, aprovado, rejeitado)
- `observacoes`: Observações específicas do item

## API Endpoints Adicionados

### Criação e Consulta
- `POST /api/pacotes-requisicoes` - Criar novo pacote
- `GET /api/pacotes-requisicoes/usuario/:userId` - Pacotes do usuário
- `GET /api/pacotes-requisicoes/pendentes` - Pacotes pendentes (admin)
- `GET /api/pacotes-requisicoes/:id` - Detalhes do pacote
- `GET /api/pacotes-requisicoes/:id/itens` - Itens do pacote

### Aprovação/Rejeição Individual
- `POST /api/pacotes-requisicoes/:pacoteId/itens/:itemId/aprovar` - Aprovar item
- `POST /api/pacotes-requisicoes/:pacoteId/itens/:itemId/rejeitar` - Rejeitar item

### Aprovação/Rejeição em Lote
- `POST /api/pacotes-requisicoes/:id/aprovar-todos` - Aprovar todos itens pendentes
- `POST /api/pacotes-requisicoes/:id/rejeitar-todos` - Rejeitar todos itens pendentes

## Fluxo de Trabalho

### Para Usuários:
1. Acessar "Nova Requisição (Pacote)"
2. Preencher informações gerais (centro de custo, projeto, justificativa)
3. Adicionar itens um por um (validação automática de estoque)
4. Enviar pacote completo
5. Acompanhar status na aba "Meus Pacotes de Requisições"

### Para Administradores:
1. Acessar "Aprovar Pacotes de Requisições"
2. Clicar em "Gerenciar" no pacote desejado
3. Visualizar todos os itens do pacote
4. Aprovar/rejeitar itens individualmente OU
5. Usar "Aprovar Todos" / "Rejeitar Todos" para ações em lote
6. Status do pacote é atualizado automaticamente

## Vantagens do Sistema

### Eficiência
- Reduz tempo de criação de múltiplas requisições individuais
- Processo de aprovação mais ágil para administradores
- Visão consolidada de requisições por projeto

### Flexibilidade
- Aprovação parcial permite melhor gestão de estoque
- Administradores podem priorizar itens críticos
- Justificativas e observações contextuais

### Controle
- Rastreabilidade completa de cada item
- Histórico de decisões administrativas
- Integração com sistema de movimentações existente

### Compatibilidade
- Sistema mantém funcionalidades existentes
- Migração transparente para usuários
- Interface intuitiva e responsiva

## Tecnologias Utilizadas
- **Backend**: Node.js, Express, SQLite
- **Frontend**: JavaScript Vanilla, CSS3, HTML5
- **Banco de Dados**: SQLite com novas tabelas relacionais
- **Validações**: Client-side e server-side

---

**Desenvolvido como extensão do sistema de estoque existente, mantendo total compatibilidade e adicionando funcionalidades avançadas de gestão de requisições.**