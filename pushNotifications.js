// pushNotifications.js - VERSÃO SIMPLIFICADA E FUNCIONAL
// ============================================

const PushNotificationSystem = {
    // Estado do sistema
    state: {
        isInitialized: false,
        token: null,
        isSubscribed: false,
        permission: 'default'
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
            // Verificar se o navegador suporta notificações
            if (!('Notification' in window)) {
                console.warn('⚠️ Este navegador não suporta notificações');
                return false;
            }
            
            // Verificar permissão atual
            this.state.permission = Notification.permission;
            console.log('📋 Permissão atual:', this.state.permission);
            
            // Se a permissão já foi concedida, obter token
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
            
            // 2. Obter instância do messaging
            const messaging = firebase.messaging();
            
            // 3. Verificar/obter permissão
            const currentPermission = Notification.permission;
            
            if (currentPermission === 'denied') {
                console.warn('❌ Permissão para notificações negada');
                return null;
            }
            
            if (currentPermission === 'default') {
                console.log('🔔 Solicitando permissão...');
                const permission = await Notification.requestPermission();
                
                if (permission !== 'granted') {
                    console.warn('❌ Usuário não concedeu permissão');
                    return null;
                }
                
                this.state.permission = permission;
            }
            
            // 4. Registrar Service Worker para Firebase
            console.log('👷 Registrando Service Worker...');
            
            let registration;
            try {
                // Usar caminho correto para GitHub Pages
                const swPath = '/sistema-demandas-escolares/sw-notificacoes.js';
                registration = await navigator.serviceWorker.register(swPath, {
                    scope: '/sistema-demandas-escolares/'
                });
                
                console.log('✅ Service Worker registrado:', registration.scope);
                await navigator.serviceWorker.ready;
                
            } catch (swError) {
                console.error('❌ Erro no Service Worker:', swError);
                // Tentar caminho alternativo
                try {
                    registration = await navigator.serviceWorker.register('sw-notificacoes.js');
                    console.log('✅ Service Worker (fallback) registrado');
                } catch (fallbackError) {
                    console.error('❌ Fallback também falhou:', fallbackError);
                    return null;
                }
            }
            
            // 5. Obter token FCM
            console.log('🔐 Gerando token FCM...');
            
            // VAPID KEY - SUBSTITUA PELA SUA CHAVE REAL
            const vapidKey = "BEOHDwWjTbmMFmT8RQl6T6CF4GPC9EjrEVuVkSaCgfgWg4cI68s6LRlIL196LCRjEWr6AEMMHhrjW4OXtrKwUsw";
            
            const token = await messaging.getToken({
                vapidKey: vapidKey,
                serviceWorkerRegistration: registration
            });
            
            if (!token) {
                console.warn('⚠️ Não foi possível obter token FCM');
                return null;
            }
            
            // 6. Salvar token
            console.log('✅ TOKEN FCM OBTIDO COM SUCESSO!');
            console.log('📋 Token:', token.substring(0, 30) + '...');
            console.log('📏 Comprimento:', token.length, 'caracteres');
            
            this.state.token = token;
            this.state.isSubscribed = true;
            
            // 7. Salvar no servidor
            await this.saveTokenToServer(token);
            
            return token;
            
        } catch (error) {
            console.error('❌ Erro ao obter token FCM:', error);
            return null;
        }
    },
    
    /**
     * 💾 SALVA TOKEN NO SERVIDOR
     */
    saveTokenToServer: async function(token) {
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
    },
    
    /**
     * 👤 OBTÉM DADOS DO USUÁRIO LOGADO
     */
    getUserData: function() {
        try {
            // Tentar obter do localStorage
            const usuarioSalvo = localStorage.getItem('usuario_demandas');
            if (usuarioSalvo) {
                return JSON.parse(usuarioSalvo);
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
    },
    
    /**
     * 📡 ENVIA DADOS PARA O SERVIDOR
     */
    sendToServer: async function(dados) {
        try {
            // URL do seu Google Apps Script
            const url = 'https://script.google.com/macros/s/AKfycbwfLZDqCBVfBUVnvOODB7Ws8bySdrGsZuxY6nusAtlv1_fD4qBCWprznPRD-V0KvjgUcg/exec';
            
            // Usar JSONP para contornar CORS
            return await this.jsonpRequest(url, dados);
            
        } catch (error) {
            console.error('❌ Erro ao enviar para servidor:', error);
            return { sucesso: false, erro: error.message };
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
                await this.getFCMToken();
                return { success: true, permission: permission };
            } else {
                console.warn('⚠️ Permissão negada:', permission);
                return { success: false, permission: permission };
            }
            
        } catch (error) {
            console.error('❌ Erro ao solicitar permissão:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * 🔕 DESATIVA NOTIFICAÇÕES
     */
    unsubscribe: async function() {
        try {
            console.log('🔕 Desativando notificações...');
            
            // Se tiver token, tentar deletar do Firebase
            if (this.state.token && firebase && firebase.messaging) {
                try {
                    await firebase.messaging().deleteToken();
                    console.log('✅ Token removido do Firebase');
                } catch (firebaseError) {
                    console.warn('⚠️ Não foi possível remover token do Firebase:', firebaseError);
                }
            }
            
            // Resetar estado
            this.state.token = null;
            this.state.isSubscribed = false;
            
            // Remover do localStorage
            localStorage.removeItem('fcm_token');
            
            console.log('✅ Notificações desativadas');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao desativar notificações:', error);
            return false;
        }
    },
    
    /**
     * 📊 OBTÉM STATUS DO SISTEMA
     */
    getStatus: function() {
        return {
            inicializado: this.state.isInitialized,
            permissao: this.state.permission,
            inscrito: this.state.isSubscribed,
            token: this.state.token ? this.state.token.substring(0, 20) + '...' : null
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
            
            // Dados para notificação de teste
            const dados = {
                acao: 'enviarNotificacaoTeste',
                tokenFCM: this.state.token,
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
    },
    
    /**
     * 🚀 TESTA O SISTEMA COMPLETO
     */
    testSystem: async function() {
        console.log('🚀 Iniciando teste completo do sistema...');
        
        const results = {
            suporte: 'Notification' in window,
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
};

// Exportar para uso global
window.PushNotificationSystem = PushNotificationSystem;

console.log('✅ PushNotificationSystem carregado (versão simplificada)!');

// Inicializar automaticamente quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        PushNotificationSystem.initialize();
    }, 3000);
});
