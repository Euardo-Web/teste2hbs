// Adicione estas funções ao seu arquivo requisi.js

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

// Função para verificar acesso ao estoque (adicionar ao arquivo principal do estoque)
function verificarAcessoEstoque() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!userData.userType || userData.userType !== 'admin') {
        alert('Acesso negado! Apenas administradores podem acessar o sistema de estoque.');
        window.location.href = 'requisi.html'; // Redirecionar para requisições
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
    
    // Carregar requisições do usuário
    carregarMinhasRequisicoes();
    
    // Se for admin, carregar requisições pendentes
    if (isUserAdmin()) {
        carregarRequisicoesPendentes();
    }
    
    // Configurar interface baseada no tipo de usuário (mover para o final)
    setTimeout(() => {
        configureUserInterface();
    }, 100);
}

// Função para carregar dados do usuário logado
function carregarDadosUsuario() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    // Você pode adicionar um indicador do tipo de usuário na interface
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

// Modificar a função existente de carregar itens para o select
function carregarItensSelect() {
    fetch('/api/itens')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('itemRequisicao');
            select.innerHTML = '<option value="">Selecione um item...</option>';
            
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.nome} (Disponível: ${item.quantidade})`;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar itens:', error);
        });
}

// Adicionar verificação de acesso ao estoque no arquivo principal do estoque
// Esta função deve ser chamada no início do arquivo script do estoque
function protegerPaginaEstoque() {
    document.addEventListener('DOMContentLoaded', function() {
        if (!verificarAcessoEstoque()) {
            return; // Impede a execução do resto do código
        }
        
        // Resto da inicialização do sistema de estoque...
    });
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    inicializarSistemaRequisicoes();
    adicionarBotaoLogout();
});

// Função para logout com limpeza completa
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

// Função para carregar requisições do usuário
function carregarMinhasRequisicoes() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    fetch(`/api/requisicoes/usuario/${userData.id}`)
        .then(response => response.json())
        .then(data => {
            const tabela = document.getElementById('tabelaMinhasRequisicoes').getElementsByTagName('tbody')[0];
            tabela.innerHTML = '';
            data.forEach(req => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(req.data).toLocaleDateString()}</td>
                    <td>${req.item_nome}</td>
                    <td>${req.quantidade}</td>
                    <td>${req.centroCusto}</td>
                    <td><span class="status-${req.status}">${req.status}</span></td>
                    <td>${req.observacoes || '-'}</td>
                `;
                tabela.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar requisições:', error);
        });
}

// Função para carregar requisições pendentes (admin)
function carregarRequisicoesPendentes() {
    fetch('/api/requisicoes/pendentes')
        .then(response => response.json())
        .then(data => {
            const tabela = document.getElementById('tabelaAprovarRequisicoes').getElementsByTagName('tbody')[0];
            tabela.innerHTML = '';
            data.forEach(req => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(req.data).toLocaleDateString()}</td>
                    <td>${req.usuario_nome}</td>
                    <td>${req.item_nome}</td>
                    <td>${req.quantidade}</td>
                    <td>${req.centroCusto}</td>
                    <td>${req.projeto}</td>
                    <td>${req.justificativa}</td>
                    <td>
                        <button class="btn btn-success" onclick="aprovarRequisicao(${req.id})">Aprovar</button>
                        <button class="btn btn-danger" onclick="rejeitarRequisicao(${req.id})">Rejeitar</button>
                    </td>
                `;
                tabela.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar requisições pendentes:', error);
        });
}

// Função para aprovar requisição
function aprovarRequisicao(id) {
    fetch(`/api/requisicoes/${id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Requisição aprovada com sucesso!');
            carregarRequisicoesPendentes();
            carregarMinhasRequisicoes(); // Atualiza também o histórico do usuário
        } else {
            alert(data.message || 'Erro ao aprovar requisição');
        }
    })
    .catch(error => {
        alert('Erro ao aprovar requisição');
    });
}

// Função para rejeitar requisição
function rejeitarRequisicao(id) {
    const motivo = prompt('Motivo da rejeição:');
    if (motivo === null) return;
    fetch(`/api/requisicoes/${id}/rejeitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Requisição rejeitada com sucesso!');
            carregarRequisicoesPendentes();
            carregarMinhasRequisicoes(); // Atualiza também o histórico do usuário
        } else {
            alert(data.message || 'Erro ao rejeitar requisição');
        }
    })
    .catch(error => {
        alert('Erro ao rejeitar requisição');
    });
}

function enviarNovaRequisicao(event) {
    event.preventDefault();
    const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const itemId = document.getElementById('itemRequisicao').value;
    const quantidade = document.getElementById('quantidadeRequisicao').value;
    const centroCusto = document.getElementById('centroCusto').value;
    const projeto = document.getElementById('projeto').value;
    const justificativa = document.getElementById('justificativa').value;
    if (!itemId || !quantidade || !centroCusto || !projeto || !justificativa) {
        alert('Preencha todos os campos!');
        return;
    }
    fetch('/api/requisicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: userData.id,
            itemId,
            quantidade,
            centroCusto,
            projeto,
            justificativa
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Requisição enviada com sucesso!');
            document.getElementById('requisicaoForm').reset();
            carregarMinhasRequisicoes();
        } else {
            alert(data.message || 'Erro ao enviar requisição');
        }
    })
    .catch(error => {
        alert('Erro ao enviar requisição');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('requisicaoForm');
    if (form) {
        form.addEventListener('submit', enviarNovaRequisicao);
    }
});