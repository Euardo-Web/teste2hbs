// Sistema de Pacotes de Requisições

// Variáveis globais
let itensPacote = [];
let itensDisponiveis = [];

// Função para verificar se o usuário é admin
function isUserAdmin() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    return userData.userType === 'admin';
}

// Função para configurar visibilidade dos elementos baseado no tipo de usuário
function configureUserInterface() {
    const isAdmin = isUserAdmin();
    
    // Mostrar/ocultar botão "Voltar ao Estoque" para usuários admin
    const btnVoltar = document.getElementById('btnVoltarEstoque') || document.querySelector('.btn-voltar-estoque');
    if (btnVoltar) {
        btnVoltar.style.display = isAdmin ? 'block' : 'none';
        btnVoltar.onclick = null;
        if (isAdmin) {
            btnVoltar.addEventListener('click', function() {
                window.location.href = 'index.html';
            });
        }
    }
    
    // Mostrar/ocultar seção de aprovar requisições baseado no tipo de usuário
    const adminButtons = document.querySelectorAll('.admin-only');
    adminButtons.forEach(button => {
        if (!isAdmin) {
            button.style.display = 'none';
        } else {
            button.style.display = 'block';
        }
    });
    
    // Ajustar layout dos botões de navegação se necessário
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons && !isAdmin) {
        navButtons.style.justifyContent = 'flex-start';
    }
}

// Função para verificar acesso ao estoque
function verificarAcessoEstoque() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!userData.userType || userData.userType !== 'admin') {
        alert('Acesso negado! Apenas administradores podem acessar o sistema de estoque.');
        window.location.href = 'requisi.html';
        return false;
    }
    return true;
}

// Função para inicializar o sistema de requisições
function inicializarSistemaRequisicoes() {
    // Verificar se o usuário está logado
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!userData.id) {
        alert('Você precisa estar logado para acessar o sistema.');
        window.location.href = 'login.html';
        return;
    }
    
    // Carregar dados específicos do usuário
    carregarDadosUsuario();
    
    // Carregar itens para o select
    carregarItensSelect();
    
    // Carregar pacotes do usuário
    carregarMeusPacotes();
    
    // Se for admin, carregar pacotes pendentes
    if (isUserAdmin()) {
        carregarPacotesPendentes();
    }
    
    // Configurar interface baseada no tipo de usuário
    setTimeout(() => {
        configureUserInterface();
    }, 100);
    
    // Configurar eventos
    configurarEventos();
}

// Função para carregar dados do usuário logado
function carregarDadosUsuario() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    // Adicionar indicador do tipo de usuário na interface
    const userTypeIndicator = document.createElement('div');
    userTypeIndicator.className = 'user-type-indicator';
    userTypeIndicator.innerHTML = `
        <span class="user-info">
            Logado como: <strong>${userData.name}</strong> 
            ${userData.userType === 'admin' ? '(Administrador)' : '(Usuário)'}
        </span>
    `;
    
    // Adicionar ao header
    const header = document.querySelector('.header');
    if (header) {
        header.appendChild(userTypeIndicator);
    }
}

// Carregar itens para o select
function carregarItensSelect() {
    fetch('/api/itens')
        .then(response => response.json())
        .then(data => {
            itensDisponiveis = data;
            const select = document.getElementById('itemSelect');
            select.innerHTML = '<option value="">Selecione um item...</option>';
            
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.nome} (Disponível: ${item.quantidade})`;
                option.dataset.quantidade = item.quantidade;
                option.dataset.nome = item.nome;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar itens:', error);
        });
}

// Configurar eventos da página
function configurarEventos() {
    // Evento para adicionar item ao pacote
    const btnAdicionar = document.getElementById('adicionarItem');
    if (btnAdicionar) {
        btnAdicionar.addEventListener('click', adicionarItemAoPacote);
    }
    
    // Evento para enviar pacote
    const form = document.getElementById('requisicaoForm');
    if (form) {
        form.addEventListener('submit', enviarPacoteRequisicoes);
    }
    
    // Evento para fechar modal
    const closeModal = document.querySelector('.close');
    if (closeModal) {
        closeModal.addEventListener('click', fecharModal);
    }
    
    // Fechar modal clicando fora
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('modalPacote');
        if (event.target === modal) {
            fecharModal();
        }
    });
}

// Adicionar item ao pacote
function adicionarItemAoPacote() {
    const itemSelect = document.getElementById('itemSelect');
    const quantidadeInput = document.getElementById('quantidadeItem');
    
    const itemId = itemSelect.value;
    const quantidade = parseInt(quantidadeInput.value);
    
    if (!itemId || !quantidade || quantidade <= 0) {
        alert('Selecione um item e informe uma quantidade válida!');
        return;
    }
    
    const itemSelecionado = itemSelect.options[itemSelect.selectedIndex];
    const quantidadeDisponivel = parseInt(itemSelecionado.dataset.quantidade);
    const nomeItem = itemSelecionado.dataset.nome;
    
    if (quantidade > quantidadeDisponivel) {
        alert(`Quantidade insuficiente! Disponível: ${quantidadeDisponivel}`);
        return;
    }
    
    // Verificar se o item já foi adicionado
    const itemExistente = itensPacote.find(item => item.itemId === itemId);
    if (itemExistente) {
        alert('Este item já foi adicionado ao pacote!');
        return;
    }
    
    // Adicionar item ao array
    itensPacote.push({
        itemId: itemId,
        nome: nomeItem,
        quantidade: quantidade,
        quantidadeDisponivel: quantidadeDisponivel
    });
    
    // Atualizar interface
    atualizarListaItens();
    
    // Limpar campos
    itemSelect.value = '';
    quantidadeInput.value = '';
}

// Atualizar lista de itens na interface
function atualizarListaItens() {
    const listaItens = document.getElementById('listaItens');
    listaItens.innerHTML = '';
    
    if (itensPacote.length === 0) {
        listaItens.innerHTML = '<p>Nenhum item adicionado ao pacote.</p>';
        return;
    }
    
    itensPacote.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-adicionado';
        itemDiv.innerHTML = `
            <div class="item-info">
                <div class="item-nome">${item.nome}</div>
                <div class="item-quantidade">Quantidade: ${item.quantidade}</div>
            </div>
            <button class="btn-remover" onclick="removerItemDoPacote(${index})">Remover</button>
        `;
        listaItens.appendChild(itemDiv);
    });
}

// Remover item do pacote
function removerItemDoPacote(index) {
    itensPacote.splice(index, 1);
    atualizarListaItens();
}

// Enviar pacote de requisições
function enviarPacoteRequisicoes(event) {
    event.preventDefault();
    
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const centroCusto = document.getElementById('centroCusto').value;
    const projeto = document.getElementById('projeto').value;
    const justificativa = document.getElementById('justificativa').value;
    
    if (!centroCusto || !projeto) {
        alert('Preencha todos os campos obrigatórios!');
        return;
    }
    
    if (itensPacote.length === 0) {
        alert('Adicione pelo menos um item ao pacote!');
        return;
    }
    
    const dadosRequisicao = {
        userId: userData.id,
        centroCusto,
        projeto,
        justificativa,
        itens: itensPacote.map(item => ({
            itemId: parseInt(item.itemId),
            quantidade: item.quantidade
        }))
    };
    
    fetch('/api/pacotes-requisicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosRequisicao)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Pacote de requisições enviado com sucesso!');
            document.getElementById('requisicaoForm').reset();
            itensPacote = [];
            atualizarListaItens();
            carregarMeusPacotes();
        } else {
            alert(data.message || 'Erro ao enviar pacote de requisições');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao enviar pacote de requisições');
    });
}

// Carregar pacotes do usuário
function carregarMeusPacotes() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    fetch(`/api/pacotes-requisicoes/usuario/${userData.id}`)
        .then(response => response.json())
        .then(data => {
            const tabela = document.getElementById('tabelaMinhasRequisicoes').getElementsByTagName('tbody')[0];
            tabela.innerHTML = '';
            
            data.forEach(pacote => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(pacote.data).toLocaleDateString()}</td>
                    <td>${pacote.centroCusto}</td>
                    <td>${pacote.projeto}</td>
                    <td>${pacote.total_itens || 0}</td>
                    <td><span class="status-badge status-${pacote.status}">${formatarStatus(pacote.status)}</span></td>
                    <td>${pacote.observacoes || '-'}</td>
                    <td>
                        <button class="btn-view" onclick="verDetalhesPacote(${pacote.id})">Ver Detalhes</button>
                    </td>
                `;
                tabela.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar pacotes:', error);
        });
}

// Carregar pacotes pendentes (admin)
function carregarPacotesPendentes() {
    fetch('/api/pacotes-requisicoes/pendentes')
        .then(response => response.json())
        .then(data => {
            const tabela = document.getElementById('tabelaAprovarRequisicoes').getElementsByTagName('tbody')[0];
            tabela.innerHTML = '';
            
            data.forEach(pacote => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(pacote.data).toLocaleDateString()}</td>
                    <td>${pacote.usuario_nome}</td>
                    <td>${pacote.centroCusto}</td>
                    <td>${pacote.projeto}</td>
                    <td>${pacote.total_itens || 0}</td>
                    <td>${pacote.itens_pendentes || 0}</td>
                    <td><span class="status-badge status-${pacote.status}">${formatarStatus(pacote.status)}</span></td>
                    <td>
                        <button class="btn-view" onclick="gerenciarPacote(${pacote.id})">Gerenciar</button>
                    </td>
                `;
                tabela.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar pacotes pendentes:', error);
        });
}

// Ver detalhes do pacote
function verDetalhesPacote(pacoteId) {
    fetch(`/api/pacotes-requisicoes/${pacoteId}`)
        .then(response => response.json())
        .then(pacote => {
            return fetch(`/api/pacotes-requisicoes/${pacoteId}/itens`)
                .then(response => response.json())
                .then(itens => {
                    mostrarModalPacote(pacote, itens, false);
                });
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes do pacote:', error);
            alert('Erro ao carregar detalhes do pacote');
        });
}

// Gerenciar pacote (admin)
function gerenciarPacote(pacoteId) {
    fetch(`/api/pacotes-requisicoes/${pacoteId}`)
        .then(response => response.json())
        .then(pacote => {
            return fetch(`/api/pacotes-requisicoes/${pacoteId}/itens`)
                .then(response => response.json())
                .then(itens => {
                    mostrarModalPacote(pacote, itens, true);
                });
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes do pacote:', error);
            alert('Erro ao carregar detalhes do pacote');
        });
}

// Mostrar modal com detalhes do pacote
function mostrarModalPacote(pacote, itens, isAdmin = false) {
    const modal = document.getElementById('modalPacote');
    const titulo = document.getElementById('modalTitulo');
    const conteudo = document.getElementById('modalConteudo');
    
    titulo.textContent = isAdmin ? 'Gerenciar Pacote de Requisições' : 'Detalhes do Pacote';
    
    let html = `
        <div class="pacote-info">
            <h3>Informações do Pacote</h3>
            <p><strong>Solicitante:</strong> ${pacote.usuario_nome}</p>
            <p><strong>Data:</strong> ${new Date(pacote.data).toLocaleDateString()}</p>
            <p><strong>Centro de Custo:</strong> ${pacote.centroCusto}</p>
            <p><strong>Projeto:</strong> ${pacote.projeto}</p>
            <p><strong>Justificativa:</strong> ${pacote.justificativa || 'Não informada'}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${pacote.status}">${formatarStatus(pacote.status)}</span></p>
        </div>
        
        <div class="itens-pacote">
            <h3>Itens do Pacote</h3>
    `;
    
    itens.forEach(item => {
        html += `
            <div class="item-pacote ${item.status}">
                <div class="item-info">
                    <div class="item-nome">${item.item_nome}</div>
                    <div class="item-quantidade">Quantidade: ${item.quantidade} ${item.unidade || ''}</div>
                    <div class="item-estoque">Estoque disponível: ${item.quantidade_estoque}</div>
                    ${item.observacoes ? `<div class="item-observacoes">Observações: ${item.observacoes}</div>` : ''}
                </div>
                <div class="item-status">
                    <span class="status-badge status-${item.status}">${formatarStatus(item.status)}</span>
                    ${isAdmin && item.status === 'pendente' ? `
                        <div class="acoes-item">
                            <button class="btn-aprovar" onclick="aprovarItem(${pacote.id}, ${item.id})">Aprovar</button>
                            <button class="btn-rejeitar" onclick="rejeitarItem(${pacote.id}, ${item.id})">Rejeitar</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    if (isAdmin) {
        const itensPendentes = itens.filter(item => item.status === 'pendente');
        if (itensPendentes.length > 0) {
            html += `
                <div class="acoes-pacote">
                    <button class="btn btn-success" onclick="aprovarTodosPacote(${pacote.id})">Aprovar Todos</button>
                    <button class="btn btn-danger" onclick="rejeitarTodosPacote(${pacote.id})">Rejeitar Todos</button>
                </div>
            `;
        }
    }
    
    conteudo.innerHTML = html;
    modal.style.display = 'block';
}

// Aprovar item individual
function aprovarItem(pacoteId, itemId) {
    fetch(`/api/pacotes-requisicoes/${pacoteId}/itens/${itemId}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Item aprovado com sucesso!');
            gerenciarPacote(pacoteId); // Recarregar modal
            carregarPacotesPendentes(); // Atualizar lista
        } else {
            alert(data.message || 'Erro ao aprovar item');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao aprovar item');
    });
}

// Rejeitar item individual
function rejeitarItem(pacoteId, itemId) {
    const motivo = prompt('Motivo da rejeição:');
    if (motivo === null) return;
    
    fetch(`/api/pacotes-requisicoes/${pacoteId}/itens/${itemId}/rejeitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Item rejeitado com sucesso!');
            gerenciarPacote(pacoteId); // Recarregar modal
            carregarPacotesPendentes(); // Atualizar lista
        } else {
            alert(data.message || 'Erro ao rejeitar item');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao rejeitar item');
    });
}

// Aprovar todos os itens do pacote
function aprovarTodosPacote(pacoteId) {
    if (!confirm('Aprovar todos os itens pendentes deste pacote?')) return;
    
    fetch(`/api/pacotes-requisicoes/${pacoteId}/aprovar-todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            let mensagem = data.message;
            if (data.erros) {
                mensagem += '\n\nErros:\n' + data.erros.join('\n');
            }
            alert(mensagem);
            gerenciarPacote(pacoteId); // Recarregar modal
            carregarPacotesPendentes(); // Atualizar lista
        } else {
            alert(data.message || 'Erro ao aprovar itens');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao aprovar itens');
    });
}

// Rejeitar todos os itens do pacote
function rejeitarTodosPacote(pacoteId) {
    const motivo = prompt('Motivo para rejeitar todos os itens:');
    if (motivo === null) return;
    
    fetch(`/api/pacotes-requisicoes/${pacoteId}/rejeitar-todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            gerenciarPacote(pacoteId); // Recarregar modal
            carregarPacotesPendentes(); // Atualizar lista
        } else {
            alert(data.message || 'Erro ao rejeitar itens');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao rejeitar itens');
    });
}

// Fechar modal
function fecharModal() {
    document.getElementById('modalPacote').style.display = 'none';
}

// Formatar status para exibição
function formatarStatus(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'aprovado': 'Aprovado',
        'rejeitado': 'Rejeitado',
        'parcialmente_aprovado': 'Parcialmente Aprovado'
    };
    return statusMap[status] || status;
}

// Função para logout
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Adicionar botão de logout na interface
function adicionarBotaoLogout() {
    const logoutButton = document.createElement('button');
    logoutButton.className = 'btn btn-logout';
    logoutButton.textContent = 'Sair';
    logoutButton.onclick = logout;
    logoutButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 200px;
        background: #dc3545;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    `;
    
    document.body.appendChild(logoutButton);
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    inicializarSistemaRequisicoes();
    adicionarBotaoLogout();
});