// src/js/autenticacao-integrada.js
/**
 * SISTEMA DE AUTENTICAÇÃO INTEGRADO COM BACKEND
 * 
 * Conecta o login.html ao backend do Google Apps Script
 * com os 3 tipos de usuário: supervisor, gestor, comum
 */

class SistemaAutenticacaoIntegrado {
    constructor() {
        this.backendUrl = 'https://script.google.com/macros/s/AKfycbwpwemYlgy4jCJTaginH21BjPUntVXNDNiy41wGZNWtCZ_ol8f6l046Qe7e7PjzneOe/exec';
        this.isInitialized = false;
    }

    /**
     * Inicializa o sistema de autenticação
     */
    inicializar() {
        if (this.isInitialized) return;
        
        console.log('🔐 Sistema de autenticação integrado inicializando...');
        
        // Verificar se já está logado
        this._verificarLoginAnterior();
        
        // Configurar formulário de login
        this._configurarFormularioLogin();
        
        // Configurar formulário de solicitação de acesso
        this._configurarSolicitacaoAcesso();
        
        this.isInitialized = true;
        console.log('✅ Sistema de autenticação integrado pronto!');
    }

    /**
     * Verifica se há login anterior
     */
    _verificarLoginAnterior() {
        const usuarioSalvo = localStorage.getItem('usuario_demandas');
        
        if (usuarioSalvo) {
            try {
                const usuario = JSON.parse(usuarioSalvo);
                console.log('👤 Usuário logado anteriormente:', usuario.nome);
                
                // Verificar se a sessão ainda é válida
                if (this._sessaoValida(usuario)) {
                    console.log('✅ Sessão válida, redirecionando...');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                } else {
                    console.log('⏰ Sessão expirada, removendo...');
                    localStorage.removeItem('usuario_demandas');
                }
            } catch (error) {
                console.error('❌ Erro ao verificar login:', error);
                localStorage.removeItem('usuario_demandas');
            }
        }
    }

    /**
     * Configura o formulário de login
     */
    _configurarFormularioLogin() {
        const formLogin = document.getElementById('form-login');
        
        if (!formLogin) {
            console.warn('⚠️ Formulário de login não encontrado');
            return;
        }
        
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this._realizarLogin();
        });
        
        console.log('✅ Formulário de login configurado');
    }

    /**
     * Realiza o processo de login
     */
    async _realizarLogin() {
        console.log('🔐 Iniciando processo de login...');
        
        // Obter dados do formulário
        const email = document.getElementById('login-email').value.trim();
        const senha = document.getElementById('login-senha').value;
        const lembrar = document.getElementById('lembrar-login').checked;
        
        // Validar dados
        if (!this._validarDadosLogin(email, senha)) {
            return;
        }
        
        // Mostrar loading
        this._mostrarLoading(true);
        
        try {
            // Usar o sistema de integração backend
            if (!window.BackendIntegracao) {
                throw new Error('Sistema de integração não carregado');
            }
            
            console.log('📤 Enviando credenciais para validação...');
            
            // Validar login usando o backend
            const resultado = await window.BackendIntegracao.validarLogin(email, senha);
            
            console.log('📥 Resultado do login:', resultado);
            
            if (resultado.sucesso && resultado.usuario) {
                // Login bem-sucedido!
                await this._processarLoginSucesso(resultado.usuario, lembrar);
            } else {
                // Login falhou
                this._mostrarErroLogin(resultado.erro || resultado.mensagem || 'Credenciais inválidas');
            }
            
        } catch (error) {
            console.error('❌ Erro no processo de login:', error);
            this._mostrarErroLogin('Erro de conexão: ' + error.message);
        } finally {
            this._mostrarLoading(false);
        }
    }

    /**
     * Processa login bem-sucedido
     */
    async _processarLoginSucesso(usuario, lembrar) {
        console.log('✅ Login autorizado!', usuario);
        
        // Adicionar metadados
        usuario.ultimo_login = new Date().toISOString();
        usuario.token_sessao = this._gerarTokenSessao();
        usuario.lembrar_login = lembrar;
        
        // Salvar no localStorage
        localStorage.setItem('usuario_demandas', JSON.stringify(usuario));
        
        // Salvar também no sessionStorage se "lembrar" estiver marcado
        if (lembrar) {
            sessionStorage.setItem('usuario_demandas', JSON.stringify(usuario));
        }
        
        // Mostrar mensagem de sucesso
        this._mostrarMensagem(`Bem-vindo(a), ${usuario.nome}!`, 'success');
        
        // Verificar se é supervisor para salvar token de notificação
        if (usuario.tipo_usuario === 'supervisor') {
            await this._inicializarNotificacoes(usuario);
        }
        
        // Redirecionar após 1 segundo
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    /**
     * Configura solicitação de acesso
     */
    _configurarSolicitacaoAcesso() {
        // Botão para abrir modal
        const btnSolicitar = document.getElementById('btn-solicitar-acesso');
        if (btnSolicitar) {
            btnSolicitar.addEventListener('click', () => {
                this._abrirModalSolicitacao();
            });
        }
        
        // Botões para fechar modal
        const btnFechar = document.getElementById('btn-fechar-solicitacao');
        const btnCancelar = document.getElementById('btn-cancelar-solicitacao');
        
        if (btnFechar) btnFechar.addEventListener('click', () => this._fecharModalSolicitacao());
        if (btnCancelar) btnCancelar.addEventListener('click', () => this._fecharModalSolicitacao());
        
        // Formulário de solicitação
        const formSolicitar = document.getElementById('form-solicitar-acesso');
        if (formSolicitar) {
            formSolicitar.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this._enviarSolicitacaoAcesso();
            });
        }
        
        // Mostrar/ocultar departamento conforme tipo
        const tipoSelect = document.getElementById('solicitar-tipo');
        if (tipoSelect) {
            tipoSelect.addEventListener('change', () => this._ajustarCampoDepartamento());
        }
        
        console.log('✅ Solicitação de acesso configurada');
    }

    /**
     * Envia solicitação de acesso
     */
    async _enviarSolicitacaoAcesso() {
        console.log('📋 Enviando solicitação de acesso...');
        
        // Obter dados do formulário
        const dados = this._obterDadosSolicitacao();
        
        if (!dados) return;
        
        // Mostrar loading
        this._mostrarLoading(true);
        
        try {
            // Usar backend para enviar solicitação
            const resultado = await this._enviarParaBackend('solicitarAcesso', dados);
            
            console.log('📥 Resultado da solicitação:', resultado);
            
            if (resultado.sucesso) {
                this._mostrarMensagem('✅ Solicitação enviada com sucesso! Aguarde autorização.', 'success');
                this._limparFormularioSolicitacao();
                this._fecharModalSolicitacao();
            } else {
                this._mostrarErroLogin(resultado.erro || 'Erro ao enviar solicitação');
            }
            
        } catch (error) {
            console.error('❌ Erro ao enviar solicitação:', error);
            this._mostrarErroLogin('Erro de conexão: ' + error.message);
        } finally {
            this._mostrarLoading(false);
        }
    }

    /**
     * Envia dados para o backend
     */
    async _enviarParaBackend(action, dados) {
        return new Promise((resolve, reject) => {
            const callbackName = `callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            window[callbackName] = (resposta) => {
                delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                clearTimeout(timeoutId);
                
                if (resposta && typeof resposta === 'object') {
                    resolve(resposta);
                } else {
                    reject(new Error('Resposta inválida do servidor'));
                }
            };
            
            const params = new URLSearchParams();
            params.append('action', action);
            params.append('callback', callbackName);
            
            // Adicionar dados como parâmetro JSON
            params.append('dados', JSON.stringify(dados));
            
            const url = `${this.backendUrl}?${params.toString()}`;
            
            const script = document.createElement('script');
            script.src = url;
            script.onerror = () => {
                clearTimeout(timeoutId);
                if (window[callbackName]) delete window[callbackName];
                reject(new Error('Falha na conexão'));
            };
            
            const timeoutId = setTimeout(() => {
                if (window[callbackName]) delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                reject(new Error('Timeout de conexão'));
            }, 15000);
            
            document.head.appendChild(script);
        });
    }

    /**
     * Ajusta campo departamento conforme tipo de usuário
     */
    _ajustarCampoDepartamento() {
        const tipoSelect = document.getElementById('solicitar-tipo');
        const deptContainer = document.getElementById('departamento-container');
        const deptSelect = document.getElementById('solicitar-departamento');
        
        if (!tipoSelect || !deptContainer) return;
        
        if (tipoSelect.value === 'Usuario Comum') {
            deptContainer.style.display = 'block';
            if (deptSelect) deptSelect.required = true;
        } else {
            deptContainer.style.display = 'none';
            if (deptSelect) {
                deptSelect.required = false;
                deptSelect.value = '';
            }
        }
    }

    /**
     * Inicializa notificações para supervisor
     */
    async _inicializarNotificacoes(usuario) {
        if (window.PushNotificationSystem && usuario.tipo_usuario === 'supervisor') {
            try {
                await window.PushNotificationSystem.initialize();
                console.log('🔔 Notificações inicializadas para supervisor');
            } catch (error) {
                console.warn('⚠️ Erro ao inicializar notificações:', error);
            }
        }
    }

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================

    _validarDadosLogin(email, senha) {
        if (!email || !senha) {
            this._mostrarErroLogin('Preencha todos os campos');
            return false;
        }
        
        if (!this._validarEmail(email)) {
            this._mostrarErroLogin('Digite um e-mail válido');
            return false;
        }
        
        if (senha.length < 4) {
            this._mostrarErroLogin('A senha deve ter pelo menos 4 caracteres');
            return false;
        }
        
        return true;
    }

    _obterDadosSolicitacao() {
        const nome = document.getElementById('solicitar-nome')?.value.trim() || '';
        const email = document.getElementById('solicitar-email')?.value.trim() || '';
        const telefone = document.getElementById('solicitar-telefone')?.value.trim() || '';
        const escola = document.getElementById('solicitar-escola')?.value || '';
        const tipo = document.getElementById('solicitar-tipo')?.value || '';
        const departamento = document.getElementById('solicitar-departamento')?.value || '';
        const mensagem = document.getElementById('solicitar-mensagem')?.value.trim() || '';
        
        // Validações
        if (!nome || !email || !telefone || !escola || !tipo) {
            this._mostrarErroLogin('Preencha todos os campos obrigatórios');
            return null;
        }
        
        if (!this._validarEmail(email)) {
            this._mostrarErroLogin('Digite um e-mail válido');
            return null;
        }
        
        if (tipo === 'Usuario Comum' && !departamento) {
            this._mostrarErroLogin('Usuário comum deve selecionar um departamento');
            return null;
        }
        
        return {
            nome,
            email,
            telefone,
            escola,
            tipo_usuario: tipo,
            departamento,
            mensagem: mensagem || 'Solicitação de acesso ao sistema',
            data_solicitacao: new Date().toISOString(),
            status: 'pendente'
        };
    }

    _validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    _sessaoValida(usuario) {
        if (!usuario.ultimo_login) return false;
        
        const ultimoLogin = new Date(usuario.ultimo_login);
        const agora = new Date();
        const diferencaHoras = (agora - ultimoLogin) / (1000 * 60 * 60);
        
        // Sessão válida por 24 horas
        return diferencaHoras < 24;
    }

    _gerarTokenSessao() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    _mostrarLoading(mostrar) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = mostrar ? 'flex' : 'none';
        }
    }

    _mostrarMensagem(texto, tipo = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        
        let icon = 'fas fa-info-circle';
        if (tipo === 'success') icon = 'fas fa-check-circle';
        if (tipo === 'error') icon = 'fas fa-exclamation-circle';
        
        toast.innerHTML = `
            <div class="toast-icon"><i class="${icon}"></i></div>
            <div class="toast-content"><div class="toast-message">${texto}</div></div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 5000);
    }

    _mostrarErroLogin(mensagem) {
        this._mostrarMensagem(mensagem, 'error');
    }

    _abrirModalSolicitacao() {
        const modal = document.getElementById('modal-solicitar-acesso');
        if (modal) modal.style.display = 'flex';
    }

    _fecharModalSolicitacao() {
        const modal = document.getElementById('modal-solicitar-acesso');
        if (modal) modal.style.display = 'none';
    }

    _limparFormularioSolicitacao() {
        const form = document.getElementById('form-solicitar-acesso');
        if (form) form.reset();
        this._ajustarCampoDepartamento();
    }
}

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na página de login
    if (window.location.pathname.includes('login.html') || 
        document.querySelector('.login-container')) {
        
        console.log('🚀 Inicializando autenticação integrada...');
        
        // Criar instância global
        window.AutenticacaoIntegrada = new SistemaAutenticacaoIntegrado();
        window.AutenticacaoIntegrada.inicializar();
        
        // Remover completamente botões flutuantes
        setTimeout(() => {
            const botoes = document.querySelectorAll('.btn-floating, #btn-nova-demanda');
            botoes.forEach(botao => {
                botao.style.display = 'none';
                botao.remove();
            });
        }, 100);
    }
});

console.log('🔧 Sistema de autenticação integrado carregado');
