const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(__dirname));

// Rotas de autenticação
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email e senha são obrigatórios' 
            });
        }

        const usuario = await db.autenticarUsuario(email, password);
        
        if (usuario) {
            res.json({
                success: true,
                user: usuario,
                message: 'Login realizado com sucesso'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, userType } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nome, email e senha são obrigatórios'
            });
        }

        // Verificar se o usuário já existe
        const usuarioExistente = await db.buscarUsuarioPorEmail(email);
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'Usuário já existe com este email'
            });
        }

        const novoUsuario = await db.cadastrarUsuario({
            name,
            email,
            password,
            userType: userType || 'user'
        });

        res.json({
            success: true,
            user: novoUsuario,
            message: 'Usuário cadastrado com sucesso'
        });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rotas para itens
app.get('/api/itens', async (req, res) => {
    try {
        const itens = await db.buscarItens();
        res.json(itens);
    } catch (error) {
        console.error('Erro ao buscar itens:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar itens'
        });
    }
});

app.get('/api/itens/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const item = await db.buscarItemPorId(id);
        
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({
                success: false,
                message: 'Item não encontrado'
            });
        }
    } catch (error) {
        console.error('Erro ao buscar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar item'
        });
    }
});

app.post('/api/itens', async (req, res) => {
    try {
        const itemData = req.body;
        const itemId = await db.inserirItem(itemData);
        
        res.json({
            success: true,
            itemId: itemId,
            message: 'Item cadastrado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao inserir item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao cadastrar item'
        });
    }
});

// Rotas para requisições
app.post('/api/requisicoes', async (req, res) => {
    try {
        const { userId, itemId, quantidade, centroCusto, projeto, justificativa } = req.body;
        
        if (!userId || !itemId || !quantidade || !centroCusto || !projeto || !justificativa) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }

        // Verificar se o item existe e tem quantidade suficiente
        const item = await db.buscarItemPorId(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado'
            });
        }

        if (item.quantidade < quantidade) {
            return res.status(400).json({
                success: false,
                message: 'Quantidade insuficiente no estoque'
            });
        }

        const requisicaoId = await db.criarRequisicao({
            userId,
            itemId,
            quantidade,
            centroCusto,
            projeto,
            justificativa
        });

        res.json({
            success: true,
            requisicaoId: requisicaoId,
            message: 'Requisição criada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar requisição:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar requisição'
        });
    }
});

app.get('/api/requisicoes/usuario/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const requisicoes = await db.buscarRequisicoesUsuario(userId);
        res.json(requisicoes);
    } catch (error) {
        console.error('Erro ao buscar requisições do usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar requisições'
        });
    }
});

app.get('/api/requisicoes/pendentes', async (req, res) => {
    try {
        const requisicoes = await db.buscarRequisicoesPendentes();
        res.json(requisicoes);
    } catch (error) {
        console.error('Erro ao buscar requisições pendentes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar requisições pendentes'
        });
    }
});

app.post('/api/requisicoes/:id/aprovar', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar dados da requisição corretamente
        const requisicao = await db.buscarRequisicaoPorId(id);
        
        if (!requisicao) {
            return res.status(404).json({
                success: false,
                message: 'Requisição não encontrada'
            });
        }

        // Verificar se ainda há quantidade no estoque
        const item = await db.buscarItemPorId(requisicao.itemId);
        if (item.quantidade < requisicao.quantidade) {
            return res.status(400).json({
                success: false,
                message: 'Quantidade insuficiente no estoque'
            });
        }

        // Atualizar status da requisição
        await db.atualizarStatusRequisicao(id, 'aprovada', 'Aprovada pelo administrador');
        
        // Descontar do estoque
        await db.descontarEstoque(requisicao.itemId, requisicao.quantidade);
        
        // Registrar movimentação
        await db.inserirMovimentacao({
            itemId: requisicao.itemId,
            itemNome: item.nome,
            tipo: 'saida',
            quantidade: requisicao.quantidade,
            destino: requisicao.centroCusto,
            descricao: `Requisição aprovada - Projeto: ${requisicao.projeto}`
        });

        res.json({
            success: true,
            message: 'Requisição aprovada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao aprovar requisição:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao aprovar requisição'
        });
    }
});

app.post('/api/requisicoes/:id/rejeitar', async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        
        await db.atualizarStatusRequisicao(id, 'rejeitada', motivo || 'Rejeitada pelo administrador');
        
        res.json({
            success: true,
            message: 'Requisição rejeitada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao rejeitar requisição:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao rejeitar requisição'
        });
    }
});

// Rotas para movimentações
app.get('/api/movimentacoes', async (req, res) => {
    try {
        const { dias = 30 } = req.query;
        const movimentacoes = await db.buscarMovimentacoes(dias);
        res.json(movimentacoes);
    } catch (error) {
        console.error('Erro ao buscar movimentações:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar movimentações'
        });
    }
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

// Rota para servir o HTML principal

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/requisi', (req, res) => {
    res.sendFile(path.join(__dirname, 'requisi.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
    
    // Verificar integridade do banco
    db.verificarBanco().then(isOk => {
        if (isOk) {
            console.log('Banco de dados verificado e funcionando');
        } else {
            console.error('Problemas detectados no banco de dados');
        }
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nDesligando servidor...');
    db.fecharConexao();
    process.exit(0);
});

module.exports = app;