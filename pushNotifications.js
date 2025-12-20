// pushNotifications.js - VERSÃO SIMPLIFICADA E CORRIGIDA
// Compatível com Firebase FCM v10+

class PushNotificationSystem {
    constructor() {
        this.token = null;
        this.permission = Notification.permission;
        this.isSupported = this.checkSupport();
        this.isSubscribed = false;
    }

    /**
     * Verifica suporte do navegador
     */
    checkSupport() {
        return 'Notification' in window &&
               'serviceWorker' in navigator &&
               'PushManager' in window;
    }

    /**
     * Inicializa o sistema
     */
    async initialize() {
        console.log('🔔 Inicializando sistema de notificações...');
        
        if (!this.isSupported) {
            console.warn('⚠️ Navegador não suporta notificações push');
            return false;
        }

        try {
            // Verificar permissão atual
            console.log('📋 Permissão atual:', this.permission);
            
            // Se já tem permissão, obter token
            if (this.permission === 'granted') {
                await this.getFCMToken();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            return false;
        }
    }

    /**
     * Obtém token FCM do Firebase
     */
    async getFCMToken() {
        console.log('🔥 Tentando obter token FCM...');
        
        try {
            // Verificar se Firebase está disponível
            if (typeof firebase === 'undefined' || !firebase.messaging) {
                console.warn('⚠️ Firebase não está disponível');
                return null;
            }

            const messaging = firebase.messaging();

            // Verificar permissão
            if (this.permission === 'denied') {
                console.warn('❌ Permissão para notificações negada');
                return null;
            }

            if (this.permission === 'default') {
                console.log('🔔 Solicitando permissão...');
                this.permission = await Notification.requestPermission();
                
                if (this.permission !== 'granted') {
                    console.warn('❌ Usuário não concedeu permissão');
                    return null;
                }
            }

            // Registrar Service Worker
            console.log('👷 Registrando Service Worker...');
            const registration = await navigator.serviceWorker.register(
                '/sistema-demandas-escolares/sw-notificacoes.js',
                {
                    scope: '/sistema-demandas-escolares/'
                }
            );

            console.log('✅ Service Worker registrado:', registration.scope);
            await navigator.serviceWorker.ready;

            // Obter token com VAPID key
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

            this.token = token;
            this.isSubscribed = true;

            // Salvar token no servidor
            await this.saveTokenToServer(token);

            return token;

        } catch (error) {
            console.error('❌ Erro ao obter token FCM:', error);
            return null;
        }
    }

    /**
     * Salva token no servidor
     */
    async saveTokenToServer(token) {
        try {
            console.log('💾 Salvando token no servidor...');

            // Obter dados do usuário
            const usuarioSalvo = localStorage.getItem('usuario_demandas');
            let usuario = null;
            
            if (usuarioSalvo) {
                try {
                    usuario = JSON.parse(usuarioSalvo);
                } catch (e) {
                    console.error('❌ Erro ao ler usuário:', e);
                }
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

            // Usar JSONP para enviar
            const resultado = await this.jsonpRequest(
                'https://script.google.com/macros/s/AKfycbwUOIb2a7sVBrHk30HaxgBxyWLIa5T2H5jJcKoQ2EeP373XJCUEBYqioHRza2z3cjdRQA/exec',
                dados
            );

            if (resultado && resultado.sucesso) {
                console.log('✅ Token salvo no servidor!');
                return true;
            } else {
                console.warn('⚠️ Não foi possível salvar token:', resultado?.erro);
                return false;
            }

        } catch (error) {
            console.error('❌ Erro ao salvar token:', error);
            return false;
        }
    }

    /**
     * Requisição JSONP
     */
    jsonpRequest(url, dados) {
        return new Promise((resolve, reject) => {
            const callbackName = 'callback_' + Date.now();
            
            window[callbackName] = function(response) {
                delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                resolve(response);
            };

            const params = new URLSearchParams({
                callback: callbackName,
                dados: JSON.stringify(dados),
                _: Date.now()
            });

            const script = document.createElement('script');
            script.src = url + '?' + params.toString();
            
            script.onerror = function() {
                reject(new Error('Falha ao carregar script'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Solicita permissão
     */
    async requestPermission() {
        try {
            console.log('🔔 Solicitando permissão...');
            
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                await this.getFCMToken();
                return { success: true, permission: permission };
            } else {
                return { success: false, permission: permission };
            }
        } catch (error) {
            console.error('❌ Erro ao solicitar permissão:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtém informações do sistema
     */
    getInfo() {
        return {
            suportado: this.isSupported,
            permissao: this.permission,
            inscrito: this.isSubscribed,
            token: this.token ? this.token.substring(0, 20) + '...' : null
        };
    }

    /**
     * Envia notificação de teste
     */
    async sendTest() {
        try {
            if (!this.token) {
                console.warn('⚠️ Não há token para enviar teste');
                return false;
            }

            const dados = {
                acao: 'enviarNotificacaoTeste',
                token: this.token,
                titulo: 'Teste de Notificação',
                mensagem: 'Esta é uma notificação de teste!'
            };

            const resultado = await this.jsonpRequest(
                'https://script.google.com/macros/s/AKfycbwUOIb2a7sVBrHk30HaxgBxyWLIa5T2H5jJcKoQ2EeP373XJCUEBYqioHRza2z3cjdRQA/exec',
                dados
            );

            if (resultado && resultado.sucesso) {
                console.log('✅ Teste enviado!');
                return true;
            } else {
                console.warn('⚠️ Falha no teste:', resultado?.erro);
                return false;
            }

        } catch (error) {
            console.error('❌ Erro ao enviar teste:', error);
            return false;
        }
    }
}

// Criar instância global
window.PushNotificationSystem = new PushNotificationSystem();

console.log('✅ PushNotificationSystem carregado!');

// Inicializar automaticamente quando Firebase estiver carregado
function inicializarQuandoFirebasePronto() {
    if (typeof firebase !== 'undefined' && firebase.messaging) {
        setTimeout(() => {
            window.PushNotificationSystem.initialize();
        }, 2000);
    } else {
        setTimeout(inicializarQuandoFirebasePronto, 1000);
    }
}

// Iniciar verificação
document.addEventListener('DOMContentLoaded', inicializarQuandoFirebasePronto);
