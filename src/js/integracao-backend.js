// src/js/integracao-backend.js
/**
 * SISTEMA DE INTEGRAÇÃO COM BACKEND GOOGLE APPS SCRIPT
 * 
 * Conexão segura com todas as funcionalidades do backend:
 * - Autenticação de usuários
 * - CRUD de demandas
 * - Upload de arquivos
 * - Envio de e-mails
 * - Notificações push
 */

const BACKEND_CONFIG = {
    // URL principal do backend
    url: 'https://script.google.com/macros/s/AKfycbwpwemYlgy4jCJTaginH21BjPUntVXNDNiy41wGZNWtCZ_ol8f6l046Qe7e7PjzneOe/exec',
    
    // Timeout padrão para requisições (10 segundos)
    timeout: 10000,
    
    // Métodos suportados
    metodos: {
        GET: 'GET',
        POST: 'POST'
    },
    
    // Endpoints principais
    endpoints: {
        // Autenticação
        validarLogin: 'validarLogin',
        salvarUsuario: 'salvarUsuario',
        
        // Demandas
        listarDemandas: 'listarDemandas',
        salvarDemanda: 'salvarDemanda',
        atualizarDemanda: 'atualizarDemanda',
        excluirDemanda: 'excluirDemanda',
        
        // Notificações
        salvarSubscription: 'salvarSubscription',
        enviarNotificacao: 'enviarNotificacao',
        
        // E-mail
        enviarEmailDemanda: 'enviarEmailDemanda',
        
        // Upload
        uploadArquivo: 'uploadArquivo',
        
        // Sistema
        infoSistema: 'info'
    }
};

class IntegracaoBackend {
    constructor() {
        this.estaConectado = false;
        this.ultimaResposta = null;
        this.callbacks = new Map();
        this.callbackIndex = 0;
        
        // Configurar timeout global
        this.timeoutController = null;
    }

    /**
     * Testa a conexão com o backend
     * @returns {Promise<Object>} Resultado do teste
     */
    async testarConexao() {
        console.log('🔗 Testando conexão com o backend...');
        
        try {
            const resultado = await this._enviarRequisicaoJSONP({
                action: BACKEND_CONFIG.endpoints.infoSistema,
                timestamp: new Date().toISOString()
            });
            
            this.estaConectado = resultado.sucesso === true;
            
            if (this.estaConectado) {
                console.log('✅ Backend conectado com sucesso!');
                console.log('📊 Dados do sistema:', resultado.dados);
            } else {
                console.warn('⚠️ Backend respondeu mas indicou falha');
            }
            
            return {
                sucesso: this.estaConectado,
                dados: resultado.dados || resultado,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Erro na conexão:', error);
            this.estaConectado = false;
            
            return {
                sucesso: false,
                erro: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Método genérico para enviar requisições JSONP
     * @param {Object} dados - Dados para enviar
     * @returns {Promise<Object>} Resposta do servidor
     */
    _enviarRequisicaoJSONP(dados) {
        return new Promise((resolve, reject) => {
            // Gerar ID único para o callback
            const callbackId = `callback_${Date.now()}_${this.callbackIndex++}`;
            
            // Adicionar callback global
            window[callbackId] = (resposta) => {
                // Limpar callback
                delete window[callbackId];
                
                if (this.callbacks.has(callbackId)) {
                    clearTimeout(this.callbacks.get(callbackId));
                    this.callbacks.delete(callbackId);
                }
                
                // Processar resposta
                if (resposta && typeof resposta === 'object') {
                    resolve(resposta);
                } else {
                    resolve({
                        sucesso: true,
                        dados: resposta
                    });
                }
            };
            
            // Construir URL com parâmetros
            const params = new URLSearchParams();
            Object.keys(dados).forEach(key => {
                params.append(key, dados[key]);
            });
            params.append('callback', callbackId);
            
            const url = `${BACKEND_CONFIG.url}?${params.toString()}`;
            
            // Configurar timeout
            const timeoutId = setTimeout(() => {
                delete window[callbackId];
                this.callbacks.delete(callbackId);
                
                reject(new Error(`Timeout após ${BACKEND_CONFIG.timeout}ms`));
            }, BACKEND_CONFIG.timeout);
            
            this.callbacks.set(callbackId, timeoutId);
            
            // Criar e injetar script
            const script = document.createElement('script');
            script.src = url;
            script.onerror = () => {
                clearTimeout(timeoutId);
                delete window[callbackId];
                this.callbacks.delete(callbackId);
                reject(new Error('Erro ao carregar script JSONP'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Método genérico para enviar requisições POST
     * @param {string} action - Ação a ser executada
     * @param {Object} dados - Dados para enviar
     * @returns {Promise<Object>} Resposta do servidor
     */
    async _enviarRequisicaoPOST(action, dados) {
        console.log(`📤 Enviando POST para ${action}:`, dados);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), BACKEND_CONFIG.timeout);
            
            const response = await fetch(BACKEND_CONFIG.url, {
                method: BACKEND_CONFIG.metodos.POST,
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: action,
                    ...dados
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Nota: Com 'no-cors' não podemos ler a resposta,
            // mas podemos saber se foi enviada com sucesso
            this.ultimaResposta = {
                sucesso: response.ok,
                status: response.status,
                timestamp: new Date().toISOString()
            };
            
            return this.ultimaResposta;
            
        } catch (error) {
            console.error(`❌ Erro no POST para ${action}:`, error);
            
            return {
                sucesso: false,
                erro: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * VALIDAÇÃO DE LOGIN
     * @param {string} email - E-mail do usuário
     * @param {string} senha - Senha do usuário
     * @returns {Promise<Object>} Dados do usuário autenticado
     */
    async validarLogin(email, senha) {
        console.log('🔐 Validando login para:', email);
        
        try {
            const resultado = await this._enviarRequisicaoJSONP({
                action: BACKEND_CONFIG.endpoints.validarLogin,
                email: email,
                senha: senha,
                origem: 'sistema_demandas'
            });
            
            if (resultado.sucesso && resultado.dados) {
                console.log('✅ Login realizado com sucesso!');
                
                // Salvar dados do usuário no localStorage
                localStorage.setItem('usuario_demandas', JSON.stringify({
                    ...resultado.dados,
                    ultimo_login: new Date().toISOString(),
                    token_sessao: this._gerarTokenSessao()
                }));
                
                return {
                    sucesso: true,
                    usuario: resultado.dados,
                    mensagem: resultado.mensagem || 'Login realizado com sucesso'
                };
            } else {
                return {
                    sucesso: false,
                    erro: resultado.erro || 'Credenciais inválidas',
                    mensagem: resultado.mensagem || 'Falha na autenticação'
                };
            }
            
        } catch (error) {
            console.error('❌ Erro na validação de login:', error);
            
            return {
                sucesso: false,
                erro: error.message,
                mensagem: 'Erro de conexão com o servidor'
            };
        }
    }

    /**
     * LISTAR DEMANDAS
     * @param {Object} filtros - Filtros para a listagem
     * @returns {Promise<Array>} Lista de demandas
     */
    async listarDemandas(filtros = {}) {
        console.log('📋 Listando demandas com filtros:', filtros);
        
        try {
            const resultado = await this._enviarRequisicaoJSONP({
                action: BACKEND_CONFIG.endpoints.listarDemandas,
                ...filtros,
                timestamp: new Date().toISOString()
            });
            
            if (resultado.sucesso && Array.isArray(resultado.dados)) {
                console.log(`✅ ${resultado.dados.length} demandas carregadas`);
                
                // Atualizar contadores no localStorage
                this._atualizarContadoresDemandas(resultado.dados);
                
                return {
                    sucesso: true,
                    demandas: resultado.dados,
                    total: resultado.dados.length,
                    timestamp: new Date().toISOString()
                };
            } else {
                console.warn('⚠️ Nenhuma demanda encontrada ou erro no formato');
                
                return {
                    sucesso: false,
                    demandas: [],
                    total: 0,
                    mensagem: resultado.mensagem || 'Nenhuma demanda encontrada'
                };
            }
            
        } catch (error) {
            console.error('❌ Erro ao listar demandas:', error);
            
            // Fallback para dados locais
            const demandasLocais = this._carregarDemandasLocais();
            
            return {
                sucesso: false,
                demandas: demandasLocais,
                total: demandasLocais.length,
                erro: error.message,
                mensagem: 'Usando dados locais (offline)'
            };
        }
    }

    /**
     * SALVAR NOVA DEMANDA
     * @param {Object} demanda - Dados da demanda
     * @returns {Promise<Object>} Resultado da operação
     */
    async salvarDemanda(demanda) {
        console.log('💾 Salvando nova demanda:', demanda);
        
        // Validar dados obrigatórios
        const validacao = this._validarDadosDemanda(demanda);
        if (!validacao.valido) {
            return {
                sucesso: false,
                erro: validacao.erro,
                mensagem: 'Dados da demanda inválidos'
            };
        }
        
        try {
            // Adicionar metadados
            const demandaCompleta = {
                ...demanda,
                id: this._gerarIdUnico(),
                data_criacao: new Date().toISOString(),
                criado_por: this._obterUsuarioLogado()?.email || 'sistema',
                status: 'Pendente',
                ultima_atualizacao: new Date().toISOString()
            };
            
            // Enviar para o backend
            const resultado = await this._enviarRequisicaoJSONP({
                action: BACKEND_CONFIG.endpoints.salvarDemanda,
                demanda: demandaCompleta,
                enviar_email: demanda.enviar_email || false,
                corpo_email: demanda.corpo_email || '',
                timestamp: new Date().toISOString()
            });
            
            if (resultado.sucesso) {
                console.log('✅ Demanda salva com sucesso! ID:', resultado.id || demandaCompleta.id);
                
                // Salvar localmente (fallback)
                this._salvarDemandaLocal(demandaCompleta);
                
                // Enviar notificação push se configurado
                if (demanda.enviar_email) {
                    this._enviarNotificacaoNovaDemanda(demandaCompleta);
                }
                
                return {
                    sucesso: true,
                    id: resultado.id || demandaCompleta.id,
                    mensagem: resultado.mensagem || 'Demanda criada com sucesso!',
                    dados: demandaCompleta
                };
            } else {
                return {
                    sucesso: false,
                    erro: resultado.erro,
                    mensagem: resultado.mensagem || 'Erro ao salvar demanda'
                };
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar demanda:', error);
            
            // Fallback: salvar localmente
            demanda.id = this._gerarIdUnico();
            this._salvarDemandaLocal(demanda);
            
            return {
                sucesso: false,
                id: demanda.id,
                mensagem: 'Demanda salva localmente (modo offline)',
                offline: true
            };
        }
    }

    /**
     * UPLOAD DE ARQUIVO
     * @param {File} arquivo - Arquivo para upload
     * @param {string} demandaId - ID da demanda relacionada
     * @returns {Promise<Object>} Resultado do upload
     */
    async uploadArquivo(arquivo, demandaId) {
        console.log('📎 Fazendo upload de arquivo:', arquivo.name);
        
        // Validar arquivo
        if (!arquivo || arquivo.size > 10 * 1024 * 1024) { // 10MB
            return {
                sucesso: false,
                erro: 'Arquivo muito grande ou inválido (máx. 10MB)'
            };
        }
        
        try {
            // Ler arquivo como base64
            const base64 = await this._fileToBase64(arquivo);
            
            const resultado = await this._enviarRequisicaoJSONP({
                action: BACKEND_CONFIG.endpoints.uploadArquivo,
                nome_arquivo: arquivo.name,
                tipo_arquivo: arquivo.type,
                tamanho: arquivo.size,
                dados_base64: base64.split(',')[1], // Remover prefixo
                demanda_id: demandaId,
                timestamp: new Date().toISOString()
            });
            
            if (resultado.sucesso && resultado.dados) {
                console.log('✅ Arquivo enviado com sucesso! URL:', resultado.dados.url);
                
                return {
                    sucesso: true,
                    arquivo: {
                        nome: arquivo.name,
                        tipo: arquivo.type,
                        tamanho: arquivo.size,
                        url: resultado.dados.url,
                        id_google_drive: resultado.dados.id
                    },
                    mensagem: 'Arquivo enviado com sucesso'
                };
            } else {
                return {
                    sucesso: false,
                    erro: resultado.erro || 'Erro ao enviar arquivo',
                    mensagem: 'Falha no upload'
                };
            }
            
        } catch (error) {
            console.error('❌ Erro no upload:', error);
            
            return {
                sucesso: false,
                erro: error.message,
                mensagem: 'Erro ao enviar arquivo'
            };
        }
    }

    /**
     * ENVIAR E-MAIL DE DEMANDA
     * @param {Object} dados - Dados do e-mail
     * @returns {Promise<Object>} Resultado do envio
     */
    async enviarEmailDemanda(dados) {
        console.log('📧 Enviando e-mail para demanda:', dados.demanda_id);
        
        try {
            const resultado = await this._enviarRequisicaoJSONP({
                action: BACKEND_CONFIG.endpoints.enviarEmailDemanda,
                ...dados,
                timestamp: new Date().toISOString()
            });
            
            if (resultado.sucesso) {
                console.log('✅ E-mail enviado com sucesso!');
                
                return {
                    sucesso: true,
                    mensagem: resultado.mensagem || 'E-mail enviado com sucesso',
                    detalhes: resultado.dados
                };
            } else {
                return {
                    sucesso: false,
                    erro: resultado.erro,
                    mensagem: resultado.mensagem || 'Erro ao enviar e-mail'
                };
            }
            
        } catch (error) {
            console.error('❌ Erro ao enviar e-mail:', error);
            
            return {
                sucesso: false,
                erro: error.message,
                mensagem: 'Falha no envio de e-mail'
            };
        }
    }

    /**
     * SALVAR TOKEN PARA NOTIFICAÇÕES PUSH
     * @param {string} token - Token FCM/Web Push
     * @returns {Promise<Object>} Resultado da operação
     */
    async salvarTokenNotificacao(token) {
        console.log('🔔 Salvando token de notificação:', token.substring(0, 20) + '...');
        
        try {
            const usuario = this._obterUsuarioLogado();
            
            const resultado = await this._enviarRequisicaoJSONP({
                action: BACKEND_CONFIG.endpoints.salvarSubscription,
                token: token,
                usuario_email: usuario?.email || 'anonimo',
                usuario_nome: usuario?.nome || 'Usuário',
                dispositivo: navigator.userAgent.substring(0, 100),
                timestamp: new Date().toISOString()
            });
            
            if (resultado.sucesso) {
                console.log('✅ Token salvo com sucesso!');
                
                // Salvar localmente
                localStorage.setItem('token_notificacao', token);
                localStorage.setItem('token_notificacao_salvo', 'true');
                
                return {
                    sucesso: true,
                    mensagem: 'Token de notificação salvo com sucesso'
                };
            } else {
                return {
                    sucesso: false,
                    erro: resultado.erro,
                    mensagem: 'Erro ao salvar token'
                };
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar token:', error);
            
            return {
                sucesso: false,
                erro: error.message,
                mensagem: 'Falha ao salvar token'
            };
        }
    }

    // ============================================
    // MÉTODOS AUXILIARES (PRIVADOS)
    // ============================================

    /**
     * Gera um ID único para demandas
     * @returns {string} ID único
     */
    _gerarIdUnico() {
        return 'dem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Gera um token de sessão simples
     * @returns {string} Token de sessão
     */
    _gerarTokenSessao() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Obtém o usuário logado do localStorage
     * @returns {Object|null} Dados do usuário
     */
    _obterUsuarioLogado() {
        try {
            const usuario = localStorage.getItem('usuario_demandas');
            return usuario ? JSON.parse(usuario) : null;
        } catch (error) {
            console.error('❌ Erro ao obter usuário:', error);
            return null;
        }
    }

    /**
     * Valida os dados de uma demanda
     * @param {Object} demanda - Dados da demanda
     * @returns {Object} Resultado da validação
     */
    _validarDadosDemanda(demanda) {
        const camposObrigatorios = ['titulo', 'descricao', 'escolas', 'responsavel', 'prazo'];
        
        for (const campo of camposObrigatorios) {
            if (!demanda[campo] || 
                (Array.isArray(demanda[campo]) && demanda[campo].length === 0) ||
                (typeof demanda[campo] === 'string' && demanda[campo].trim() === '')) {
                return {
                    valido: false,
                    erro: `Campo obrigatório faltando: ${campo}`
                };
            }
        }
        
        // Validar prazo (deve ser data futura)
        const prazo = new Date(demanda.prazo);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        if (prazo < hoje) {
            return {
                valido: false,
                erro: 'O prazo deve ser uma data futura'
            };
        }
        
        return { valido: true };
    }

    /**
     * Converte arquivo para base64
     * @param {File} file - Arquivo para converter
     * @returns {Promise<string>} String base64
     */
    _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    /**
     * Atualiza contadores de demandas no localStorage
     * @param {Array} demandas - Lista de demandas
     */
    _atualizarContadoresDemandas(demandas) {
        const contadores = {
            total: demandas.length,
            pendentes: demandas.filter(d => d.status === 'Pendente').length,
            andamento: demandas.filter(d => d.status === 'Em andamento').length,
            concluidas: demandas.filter(d => d.status === 'Concluída').length,
            atrasadas: demandas.filter(d => {
                if (!d.prazo || d.status === 'Concluída') return false;
                const prazo = new Date(d.prazo);
                const hoje = new Date();
                return prazo < hoje;
            }).length
        };
        
        localStorage.setItem('contadores_demandas', JSON.stringify(contadores));
        localStorage.setItem('ultima_atualizacao_demandas', new Date().toISOString());
        
        // Disparar evento para atualizar UI
        window.dispatchEvent(new CustomEvent('demandasAtualizadas', {
            detail: { contadores, total: demandas.length }
        }));
    }

    /**
     * Salva demanda localmente (fallback offline)
     * @param {Object} demanda - Dados da demanda
     */
    _salvarDemandaLocal(demanda) {
        try {
            const demandasLocais = this._carregarDemandasLocais();
            demandasLocais.push(demanda);
            
            localStorage.setItem('demandas_locais', JSON.stringify(demandasLocais));
            console.log('💾 Demanda salva localmente:', demanda.id);
        } catch (error) {
            console.error('❌ Erro ao salvar demanda local:', error);
        }
    }

    /**
     * Carrega demandas salvas localmente
     * @returns {Array} Lista de demandas locais
     */
    _carregarDemandasLocais() {
        try {
            const demandas = localStorage.getItem('demandas_locais');
            return demandas ? JSON.parse(demandas) : [];
        } catch (error) {
            console.error('❌ Erro ao carregar demandas locais:', error);
            return [];
        }
    }

    /**
     * Envia notificação push para nova demanda
     * @param {Object} demanda - Dados da demanda
     */
    _enviarNotificacaoNovaDemanda(demanda) {
        if (window.PushNotificationSystem && typeof window.PushNotificationSystem.sendNotification === 'function') {
            window.PushNotificationSystem.sendNotification({
                title: 'Nova Demanda Criada',
                body: `${demanda.titulo} - Prazo: ${new Date(demanda.prazo).toLocaleDateString('pt-BR')}`,
                icon: '/sistema-demandas-escolares/public/icons/192x192.png',
                tag: `demanda_${demanda.id}`,
                data: {
                    demandaId: demanda.id,
                    tipo: 'nova_demanda',
                    url: window.location.href
                }
            });
        }
    }

    /**
     * Verifica status da conexão
     * @returns {Object} Status atual
     */
    getStatus() {
        return {
            conectado: this.estaConectado,
            ultimaResposta: this.ultimaResposta,
            urlBackend: BACKEND_CONFIG.url,
            usuarioLogado: this._obterUsuarioLogado() ? true : false
        };
    }
}

// Criar instância global
window.BackendIntegracao = new IntegracaoBackend();

// Teste automático de conexão ao carregar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando integração com backend...');
    
    // Aguardar 2 segundos para não interferir com carregamento inicial
    setTimeout(async () => {
        const status = await window.BackendIntegracao.testarConexao();
        
        if (status.sucesso) {
            console.log('✅ Sistema de integração pronto para uso!');
            
            // Se há usuário logado, verificar permissões
            const usuario = window.BackendIntegracao._obterUsuarioLogado();
            if (usuario) {
                console.log(`👤 Usuário logado: ${usuario.nome} (${usuario.tipo_usuario})`);
            }
        } else {
            console.warn('⚠️ Sistema funcionando em modo limitado (offline)');
        }
    }, 2000);
});

console.log('🔧 Módulo de integração com backend carregado!');
