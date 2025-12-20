// pushNotifications.js - VERSÃO FINAL COMPLETA
// Compatível com Firebase FCM v10+ e seu sistema atual

class PushNotificationSystem {
    constructor() {
        console.log('🔔 PushNotificationSystem inicializado');
        this.token = null;
        this.permission = Notification.permission;
        this.isInitialized = false;
        this.isSubscribed = false;
        this.serviceWorker = null;
    }

    // ============================================
    // MÉTODOS DE VERIFICAÇÃO
    // ============================================

    /**
     * Verifica suporte do navegador
     */
    checkSupport() {
        const supported = 'Notification' in window &&
                         'serviceWorker' in navigator &&
                         typeof firebase !== 'undefined' &&
                         firebase.messaging !== undefined;
        
        console.log('📱 Suporte verificado:', supported);
        return supported;
    }

    /**
     * Verifica permissão atual
     */
    checkPermission() {
        return Notification.permission;
    }

    // ============================================
    // MÉTODOS PRINCIPAIS
    // ============================================

    /**
     * Inicializa o sistema de notificações
     */
    async initialize() {
        console.log('🔔 Inicializando sistema de notificações...');
        
        try {
            // Verificar suporte
            const suportado = this.checkSupport();
            if (!suportado) {
                console.warn('⚠️ Navegador não suporta notificações Firebase');
                return false;
            }

            // Verificar permissão atual
            this.permission = this.checkPermission();
            console.log('📋 Permissão atual:', this.permission);

            // Se a permissão já foi concedida, obter token
            if (this.permission === 'granted') {
                const token = await this.getFCMToken();
                if (token) {
                    this.isSubscribed = true;
                    this.token = token;
                    this.isInitialized = true;
                    return true;
                }
            }

            this.isInitialized = true;
            return true;

        } catch (error) {
            console.error('❌ Erro ao inicializar notificações:', error);
            return false;
        }
    }

    /**
     * 🔥 OBTÉM TOKEN FCM DO FIREBASE
     */
    async getFCMToken() {
        console.log('🔥 Tentando obter token FCM...');

        try {
            // 1. Obter instância do messaging
            const messaging = firebase.messaging();

            // 2. Verificar/obter permissão
            if (this.permission !== 'granted') {
                console.log('🔔 Solicitando permissão...');
                const permission = await Notification.requestPermission();
                this.permission = permission;

                if (permission !== 'granted') {
                    console.warn('❌ Usuário não concedeu permissão');
                    return null;
                }
            }

            // 3. Registrar Service Worker
            await this.registerServiceWorker();

            if (!this.serviceWorker) {
                console.warn('⚠️ Service Worker não registrado');
                return null;
            }

            // 4. Obter token FCM
            console.log('🔐 Gerando token FCM...');
            
            // VAPID KEY - SUA CHAVE CORRETA
            const vapidKey = "BMQIERFqdSFhiX319L_Wfa176UU8nzop-9-SB4pPxowM6yBo9gIrnU5-PtsENsc_XWXZJTQHCgMeYtiztUE9C3Q";
            
            const token = await messaging.getToken({
                vapidKey: vapidKey,
                serviceWorkerRegistration: this.serviceWorker
            });

            if (!token) {
                console.warn('⚠️ Não foi possível obter token FCM');
                return null;
            }

            // 5. Salvar token
            console.log('✅ TOKEN FCM OBTIDO COM SUCESSO!');
            console.log('📋 Token:', token.substring(0, 30) + '...');
            console.log('📏 Comprimento:', token.length, 'caracteres');

            this.token = token;
            this.isSubscribed = true;

            // 6. Salvar no servidor
            await this.saveTokenToServer(token);

            return token;

        } catch (error) {
            console.error('❌ Erro ao obter token FCM:', error);
            return null;
        }
    }

    /**
     * Registra Service Worker
     */
    async registerServiceWorker() {
        try {
            console.log('👷 Registrando Service Worker...');
            
            const registration = await navigator.serviceWorker.register(
                '/sistema-demandas-escolares/sw-notificacoes.js',
                {
                    scope: '/sistema-demandas-escolares/'
                }
            );

            console.log('✅ Service Worker registrado:', registration.scope);
            
            // Aguardar ativação
            await navigator.serviceWorker.ready;
            this.serviceWorker = registration;

            return registration;

        } catch (error) {
            console.error('❌ Erro ao registrar Service Worker:', error);
            
            // Tentar caminho alternativo
            try {
                const fallbackRegistration = await navigator.serviceWorker.register(
                    'sw-notificacoes.js'
                );
                console.log('✅ Service Worker (fallback) registrado');
                this.serviceWorker = fallbackRegistration;
                return fallbackRegistration;
            } catch (fallbackError) {
                console.error('❌ Fallback também falhou:', fallbackError);
                return null;
            }
        }
    }

    /**
     * 💾 SALVA TOKEN NO SERVIDOR
     */
    async saveTokenToServer(token) {
        try {
            console.log('💾 Salvando token no servidor...');

            // Obter dados do usuário logado
            const usuarioLogado = this.getUserData();

            if (!usuarioLogado || !usuarioLogado.email) {
                console.warn('⚠️ Usuário não logado, token não será salvo');
                return false;
            }

            // Preparar dados para envio
            const dados = {
                acao: 'salvarSubscription',
                tipo: 'firebase',
                fcmToken: token,
                usuario: {
                    email: usuarioLogado.email,
                    nome: usuarioLogado.nome || 'Usuário',
                    departamento: usuarioLogado.departamento || 'Não definido'
                },
                timestamp: new Date().toISOString()
            };

            // Enviar para servidor
            const resposta = await this.sendToServer(dados);

            if (resposta && resposta.sucesso) {
                console.log('✅ Token salvo no servidor com sucesso!');
                return true;
            } else {
                console.warn('⚠️ Não foi possível salvar token:', resposta?.erro || 'Erro desconhecido');
                return false;
            }

        } catch (error) {
            console.error('❌ Erro ao salvar token:', error);
            return false;
        }
    }

    /**
     * 👤 OBTÉM DADOS DO USUÁRIO LOGADO
     */
    getUserData() {
        try {
            // Tentar obter do localStorage
            const usuarioSalvo = localStorage.getItem('usuario_demandas');
            if (usuarioSalvo) {
                const usuario = JSON.parse(usuarioSalvo);
                console.log('👤 Usuário do localStorage:', usuario);
                return usuario;
            }

            // Tentar obter de variável global
            if (window.usuarioAtual) {
                return window.usuarioAtual;
            }

            // Retornar dados padrão se não encontrar
            return {
                email: 'usuario@exemplo.com',
                nome: 'Usuário',
                departamento: 'Não definido'
            };

        } catch (error) {
            console.error('❌ Erro ao obter dados do usuário:', error);
            return null;
        }
    }

    /**
     * 📡 ENVIA DADOS PARA O SERVIDOR
     */
    async sendToServer(dados) {
        try {
            // URL do seu Google Apps Script
            const url = 'https://script.google.com/macros/s/AKfycbwUOIb2a7sVBrHk30HaxgBxyWLIa5T2H5jJcKoQ2EeP373XJCUEBYqioHRza2z3cjdRQA/exec';

            // Usar JSONP para contornar CORS
            return await this.jsonpRequest(url, dados);

        } catch (error) {
            console.error('❌ Erro ao enviar para servidor:', error);
            return { sucesso: false, erro: error.message };
        }
    }

    /**
     * 🔄 REQUISIÇÃO JSONP
     */
    jsonpRequest(url, dados) {
        return new Promise((resolve, reject) => {
            const callbackName = 'callback_' + Date.now();

            // Adicionar callback ao window
            window[callbackName] = function(response) {
                // Limpar
                delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }

                resolve(response);
            };

            // Criar URL com parâmetros
            const params = new URLSearchParams({
                callback: callbackName,
                dados: JSON.stringify(dados),
                _: Date.now()
            });

            // Criar script
            const script = document.createElement('script');
            script.src = url + '?' + params.toString();

            // Timeout
            const timeout = setTimeout(() => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                reject(new Error('Timeout na requisição JSONP'));
            }, 10000);

            // Tratar erro
            script.onerror = function() {
                clearTimeout(timeout);
                reject(new Error('Falha ao carregar script'));
            };

            // Adicionar ao documento
            document.head.appendChild(script);
        });
    }

    /**
     * 🔔 PEDE PERMISSÃO PARA NOTIFICAÇÕES
     */
    async requestPermission() {
        try {
            console.log('🔔 Solicitando permissão para notificações...');

            const permission = await Notification.requestPermission();
            this.permission = permission;

            if (permission === 'granted') {
                console.log('✅ Permissão concedida!');
                const token = await this.getFCMToken();
                return { success: true, permission: permission, token: token };
            } else {
                console.warn('⚠️ Permissão negada:', permission);
                return { success: false, permission: permission };
            }

        } catch (error) {
            console.error('❌ Erro ao solicitar permissão:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 🔕 DESATIVA NOTIFICAÇÕES
     */
    async unsubscribe() {
        try {
            console.log('🔕 Desativando notificações...');

            // Se tiver token, tentar deletar do Firebase
            if (this.token && firebase && firebase.messaging) {
                try {
                    const messaging = firebase.messaging();
                    await messaging.deleteToken();
                    console.log('✅ Token removido do Firebase');
                } catch (firebaseError) {
                    console.warn('⚠️ Não foi possível remover token do Firebase:', firebaseError);
                }
            }

            // Resetar estado
            this.token = null;
            this.isSubscribed = false;

            // Remover do localStorage
            localStorage.removeItem('fcm_token');

            console.log('✅ Notificações desativadas');
            return true;

        } catch (error) {
            console.error('❌ Erro ao desativar notificações:', error);
            return false;
        }
    }

    /**
     * 📊 OBTÉM STATUS DO SISTEMA
     */
    getInfo() {
        return {
            suportado: this.checkSupport(),
            permissao: this.permission,
            inscrito: this.isSubscribed,
            token: this.token ? this.token.substring(0, 20) + '...' : null,
            inicializado: this.isInitialized
        };
    }

    /**
     * 🧪 ENVIA NOTIFICAÇÃO DE TESTE
     */
    async sendTest() {
        try {
            console.log('🧪 Enviando notificação de teste...');

            if (!this.token) {
                console.warn('⚠️ Não há token FCM para enviar teste');
                return false;
            }

            // Dados para notificação de teste
            const dados = {
                acao: 'enviarNotificacaoTeste',
                token: this.token,
                titulo: 'Teste de Notificação',
                mensagem: 'Esta é uma notificação de teste do sistema!',
                usuario: this.getUserData()
            };

            const resposta = await this.sendToServer(dados);

            if (resposta && resposta.sucesso) {
                console.log('✅ Teste enviado com sucesso!');
                return true;
            } else {
                console.warn('⚠️ Falha ao enviar teste:', resposta?.erro);
                return false;
            }

        } catch (error) {
            console.error('❌ Erro ao enviar teste:', error);
            return false;
        }
    }

    /**
     * 🚀 TESTA O SISTEMA COMPLETO
     */
    async testSystem() {
        console.log('🚀 Iniciando teste completo do sistema...');

        const results = {
            suporte: this.checkSupport(),
            firebase: typeof firebase !== 'undefined',
            messaging: firebase && !!firebase.messaging,
            serviceWorker: 'serviceWorker' in navigator,
            permission: Notification.permission,
            token: null,
            saved: false
        };

        console.log('📊 Resultados do teste:', results);

        // Testar obtenção de token
        try {
            if (results.suporte && results.firebase && results.messaging) {
                const token = await this.getFCMToken();
                results.token = token ? 'Sim' : 'Não';

                if (token) {
                    // Verificar se foi salvo
                    setTimeout(async () => {
                        const dados = {
                            acao: 'verificarToken',
                            token: this.token
                        };

                        const resposta = await this.sendToServer(dados);
                        results.saved = resposta && resposta.sucesso;

                        console.log('📋 RESULTADO FINAL DO TESTE:', results);

                        // Mostrar resultado
                        alert(`
                        🧪 TESTE COMPLETO:

                        ✅ Suporte a notificações: ${results.suporte ? 'Sim' : 'Não'}
                        ✅ Firebase disponível: ${results.firebase ? 'Sim' : 'Não'}
                        ✅ Firebase Messaging: ${results.messaging ? 'Sim' : 'Não'}
                        ✅ Service Worker: ${results.serviceWorker ? 'Sim' : 'Não'}
                        ✅ Permissão: ${results.permission}
                        ✅ Token obtido: ${results.token}
                        ✅ Token salvo no servidor: ${results.saved ? 'Sim' : 'Não'}

                        ${results.saved ? '🎉 TUDO FUNCIONANDO!' : '⚠️ ALGO DEU ERRADO!'}
                        `);
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('❌ Erro no teste:', error);
        }

        return results;
    }
}

// Exportar para uso global
window.PushNotificationSystem = new PushNotificationSystem();

console.log('✅ PushNotificationSystem carregado (versão final)!');

// Inicializar automaticamente quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.PushNotificationSystem.initialize();
    }, 3000);
});
