// pushNotifications.js - SISTEMA DE NOTIFICAÇÕES COMPLETO
// Versão simplificada e funcional

const PushNotificationSystem = {
    // Estado do sistema
    state: {
        isSupported: false,
        permission: 'default',
        token: null,
        isSubscribed: false,
        isInitialized: false
    },

    // ============================================
    // MÉTODOS DE VERIFICAÇÃO
    // ============================================

    /**
     * Verifica suporte do navegador
     */
    checkSupport: function() {
        const supported = 'Notification' in window &&
                         'serviceWorker' in navigator &&
                         'PushManager' in window;
        
        this.state.isSupported = supported;
        console.log('📱 Suporte verificado:', supported);
        return supported;
    },

    /**
     * Verifica permissão atual
     */
    checkPermission: function() {
        this.state.permission = Notification.permission;
        return this.state.permission;
    },

    // ============================================
    // MÉTODOS PRINCIPAIS
    // ============================================

    /**
     * Inicializa o sistema de notificações
     */
    initialize: async function() {
        console.log('🔔 Inicializando sistema de notificações...');
        
        try {
            // Verificar suporte
            const suportado = this.checkSupport();
            if (!suportado) {
                console.warn('⚠️ Navegador não suporta notificações push');
                return false;
            }

            // Verificar permissão atual
            this.checkPermission();
            console.log('📋 Permissão atual:', this.state.permission);

            // Se já tem permissão, tentar obter token
            if (this.state.permission === 'granted') {
                await this.getFCMToken();
            }

            this.state.isInitialized = true;
            console.log('✅ Sistema de notificações inicializado');
            return true;

        } catch (error) {
            console.error('❌ Erro ao inicializar notificações:', error);
            return false;
        }
    },

    /**
     * 🔥 OBTÉM TOKEN FCM DO FIREBASE
     */
    getFCMToken: async function() {
        console.log('🔥 Tentando obter token FCM...');

        try {
            // 1. Verificar se Firebase está disponível
            if (typeof firebase === 'undefined' || !firebase.messaging) {
                console.warn('⚠️ Firebase não está disponível');
                return null;
            }

            const messaging = firebase.messaging();

            // 2. Verificar permissão
            if (this.state.permission !== 'granted') {
                console.log('🔔 Solicitando permissão...');
                const permission = await Notification.requestPermission();
                this.state.permission = permission;

                if (permission !== 'granted') {
                    console.warn('❌ Usuário não concedeu permissão');
                    return null;
                }
            }

            // 3. Registrar Service Worker
            console.log('👷 Registrando Service Worker...');
            
            let registration;
            try {
                registration = await navigator.serviceWorker.register(
                    '/sistema-demandas-escolares/sw-notificacoes.js',
                    {
                        scope: '/sistema-demandas-escolares/'
                    }
                );
                console.log('✅ Service Worker registrado:', registration.scope);
            } catch (error) {
                console.error('❌ Erro no Service Worker:', error);
                return null;
            }

            // Aguardar ativação
            await navigator.serviceWorker.ready;

            // 4. Obter token FCM
            console.log('🔐 Gerando token FCM...');
            
            const vapidKey = "BMQIERFqdSFhiX319L_Wfa176UU8nzop-9-SB4pPxowM6yBo9gIrnU5-PtsENsc_XWXZJTQHCgMeYtiztUE9C3Q";
            
            const token = await messaging.getToken({
                vapidKey: vapidKey,
                serviceWorkerRegistration: registration
            });

            if (!token) {
                console.warn('⚠️ Não foi possível obter token FCM');
                return null;
            }

            console.log('✅ TOKEN FCM OBTIDO COM SUCESSO!');
            console.log('📋 Token:', token.substring(0, 30) + '...');
            console.log('📏 Comprimento:', token.length, 'caracteres');

            this.state.token = token;
            this.state.isSubscribed = true;

            // 5. Salvar no servidor
            await this.saveTokenToServer(token);

            // 6. Configurar listener para mensagens
            this.setupMessageListener(messaging);

            return token;

        } catch (error) {
            console.error('❌ Erro ao obter token FCM:', error);
            return null;
        }
    },

    /**
     * Configura listener para mensagens Firebase
     */
    setupMessageListener: function(messaging) {
        try {
            messaging.onMessage((payload) => {
                console.log('📨 Mensagem recebida em foreground:', payload);
                
                // Mostrar notificação local
                if (payload.notification) {
                    this.showLocalNotification(
                        payload.notification.title,
                        payload.notification.body,
                        payload.data
                    );
                }
            });
            
            console.log('✅ Listener configurado para mensagens Firebase');
        } catch (error) {
            console.error('❌ Erro ao configurar listener:', error);
        }
    },

    /**
     * Mostra notificação local
     */
    showLocalNotification: function(title, body, data) {
        if (!('Notification' in window)) return;
        
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '/sistema-demandas-escolares/public/icons/192x192.png',
                badge: '/sistema-demandas-escolares/public/icons/96x96.png',
                data: data || {}
            });

            notification.onclick = function() {
                if (this.data && this.data.demandaId) {
                    // Abrir detalhes da demanda
                    if (typeof window.mostrarDetalhesDemanda === 'function') {
                        window.mostrarDetalhesDemanda(this.data.demandaId);
                    }
                }
                this.close();
            };
        }
    },

    /**
     * 💾 SALVA TOKEN NO SERVIDOR
     */
    saveTokenToServer: async function(token) {
        try {
            console.log('💾 Salvando token no servidor...');

            // Obter dados do usuário
            let usuario = null;
            try {
                const usuarioSalvo = localStorage.getItem('usuario_demandas');
                if (usuarioSalvo) {
                    usuario = JSON.parse(usuarioSalvo);
                }
            } catch (e) {
                console.error('❌ Erro ao ler usuário:', e);
            }

            const dados = {
                acao: 'salvarSubscription',
                tipo: 'firebase',
                fcmToken: token,
                usuario: usuario ? {
                    email: usuario.email,
                    nome: usuario.nome,
                    departamento: usuario.departamento
                } : null,
                timestamp: new Date().toISOString()
            };

            // Usar função global do app.js
            if (typeof window.enviarParaGoogleAppsScript === 'function') {
                const resultado = await window.enviarParaGoogleAppsScript(dados);
                if (resultado && resultado.sucesso) {
                    console.log('✅ Token salvo no servidor!');
                    return true;
                }
            }

            // Fallback: JSONP
            const resultado = await this.jsonpRequest(
                'https://script.google.com/macros/s/AKfycbwUOIb2a7sVBrHk30HaxgBxyWLIa5T2H5jJcKoQ2EeP373XJCUEBYqioHRza2z3cjdRQA/exec',
                dados
            );

            if (resultado && resultado.sucesso) {
                console.log('✅ Token salvo no servidor!');
                return true;
            } else {
                console.warn('⚠️ Não foi possível salvar token');
                return false;
            }

        } catch (error) {
            console.error('❌ Erro ao salvar token:', error);
            return false;
        }
    },

    /**
     * 🔄 REQUISIÇÃO JSONP
     */
    jsonpRequest: function(url, dados) {
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
                reject(new Error('Timeout na requisição'));
            }, 10000);

            // Tratar erro
            script.onerror = function() {
                clearTimeout(timeout);
                reject(new Error('Falha ao carregar script'));
            };

            // Adicionar ao documento
            document.head.appendChild(script);
        });
    },

    /**
     * 🔔 PEDE PERMISSÃO PARA NOTIFICAÇÕES
     */
    requestPermission: async function() {
        try {
            console.log('🔔 Solicitando permissão para notificações...');

            const permission = await Notification.requestPermission();
            this.state.permission = permission;

            if (permission === 'granted') {
                console.log('✅ Permissão concedida!');
                const token = await this.getFCMToken();
                return { 
                    success: true, 
                    permission: permission, 
                    token: token 
                };
            } else {
                console.warn('⚠️ Permissão negada:', permission);
                return { 
                    success: false, 
                    permission: permission 
                };
            }

        } catch (error) {
            console.error('❌ Erro ao solicitar permissão:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    },

    /**
     * 📊 OBTÉM STATUS DO SISTEMA
     */
    getInfo: function() {
        return {
            suportado: this.state.isSupported,
            permissao: this.state.permission,
            inscrito: this.state.isSubscribed,
            token: this.state.token ? this.state.token.substring(0, 20) + '...' : null,
            inicializado: this.state.isInitialized
        };
    },

    /**
     * 🧪 ENVIA NOTIFICAÇÃO DE TESTE
     */
    sendTest: async function() {
        try {
            console.log('🧪 Enviando notificação de teste...');

            if (!this.state.token) {
                console.warn('⚠️ Não há token FCM para enviar teste');
                return false;
            }

            const dados = {
                acao: 'enviarNotificacaoTeste',
                token: this.state.token,
                titulo: '🔔 Teste do Sistema',
                mensagem: 'Esta é uma notificação de teste do sistema de demandas!',
                timestamp: new Date().toISOString()
            };

            const resultado = await this.jsonpRequest(
                'https://script.google.com/macros/s/AKfycbwUOIb2a7sVBrHk30HaxgBxyWLIa5T2H5jJcKoQ2EeP373XJCUEBYqioHRza2z3cjdRQA/exec',
                dados
            );

            if (resultado && resultado.sucesso) {
                console.log('✅ Teste enviado com sucesso!');
                
                // Mostrar notificação local também
                this.showLocalNotification(
                    'Teste do Sistema',
                    'Notificação de teste enviada com sucesso!'
                );
                
                return true;
            } else {
                console.warn('⚠️ Falha ao enviar teste:', resultado?.erro);
                return false;
            }

        } catch (error) {
            console.error('❌ Erro ao enviar teste:', error);
            return false;
        }
    },

    /**
     * 🚀 TESTA O SISTEMA COMPLETO
     */
    testSystem: async function() {
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
                            token: this.state.token
                        };

                        const resposta = await this.jsonpRequest(
                            'https://script.google.com/macros/s/AKfycbwUOIb2a7sVBrHk30HaxgBxyWLIa5T2H5jJcKoQ2EeP373XJCUEBYqioHRza2z3cjdRQA/exec',
                            dados
                        );
                        
                        results.saved = resposta && resposta.sucesso;

                        console.log('📋 RESULTADO FINAL DO TESTE:', results);

                        // Mostrar resultado em um alerta amigável
                        const mensagem = `
                        🧪 TESTE COMPLETO DO SISTEMA:

                        ✅ Suporte a notificações: ${results.suporte ? 'SIM' : 'NÃO'}
                        ✅ Firebase disponível: ${results.firebase ? 'SIM' : 'NÃO'}
                        ✅ Firebase Messaging: ${results.messaging ? 'SIM' : 'NÃO'}
                        ✅ Service Worker: ${results.serviceWorker ? 'SIM' : 'NÃO'}
                        ✅ Permissão concedida: ${results.permission}
                        ✅ Token obtido: ${results.token}
                        ✅ Token salvo no servidor: ${results.saved ? 'SIM' : 'NÃO'}

                        ${results.saved ? '🎉 TUDO FUNCIONANDO PERFEITAMENTE!' : '⚠️ ALGUM PROBLEMA FOI DETECTADO!'}
                        `;

                        alert(mensagem);

                        // Se tudo funcionou, mostrar confirmação na interface
                        if (results.saved && typeof window.mostrarToast === 'function') {
                            window.mostrarToast('Teste', 'Sistema de notificações funcionando!', 'success');
                        }

                    }, 2000);
                }
            }
        } catch (error) {
            console.error('❌ Erro no teste:', error);
        }

        return results;
    }
};

// Exportar para uso global
window.PushNotificationSystem = PushNotificationSystem;

console.log('✅ PushNotificationSystem carregado com sucesso!');

// Inicializar automaticamente quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para o app carregar completamente
    setTimeout(() => {
        if (window.PushNotificationSystem) {
            window.PushNotificationSystem.initialize().then(success => {
                if (success) {
                    console.log('🎉 Sistema de notificações pronto para uso!');
                    
                    // Se usuário está logado e não tem permissão, mostrar aviso
                    const usuario = localStorage.getItem('usuario_demandas');
                    const info = window.PushNotificationSystem.getInfo();
                    
                    if (usuario && info.permission === 'default') {
                        // Mostrar aviso amigável após 3 segundos
                        setTimeout(() => {
                            if (typeof window.mostrarToast === 'function') {
                                window.mostrarToast(
                                    'Notificações', 
                                    'Ative as notificações para receber alertas de novas demandas!', 
                                    'info'
                                );
                            }
                        }, 3000);
                    }
                }
            });
        }
    }, 3000);
});
