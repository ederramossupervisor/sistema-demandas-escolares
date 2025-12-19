// pushNotifications.js - VERSÃO FINAL CORRIGIDA
// ============================================

const PushNotificationSystem = {
    // Configurações ATUALIZADAS
    config: {
        // COLE AQUI SUA CHAVE PÚBLICA DO FIREBASE
        vapidPublicKey: 'BKYmA5_HGRoYckulvip4sBqmWdTUSyer7LJh4EE1jVajz5WHfN3yWANavQEjuvi0fdbXYGCCZu-ETLYAqUDOR7g',
        
        // URL do seu Google Apps Script
        googleScriptUrl: 'https://script.google.com/macros/s/AKfycbzipAeNlapZ3ks_YkU4nT5dRtMBbMhvDqZbuQIMefrJpz0lswmaOhehBsz4YKEfGYs90A/exec',
        
        // Caminhos atualizados
        appPath: '/sistema-demandas-escolares/',
        swPath: '/sistema-demandas-escolares/sw-notificacoes.js',
        
        // Configurações do Firebase
        firebaseConfig: {
            projectId: 'sistema-de-demandas-escolares', // Seu ID do projeto
            messagingSenderId: '655714446030' // ID do remetente que você viu
        }
    },    
    // ============================================
    // MÉTODOS PRINCIPAIS
    // ============================================
    
    /**
     * Inicializa o sistema de notificacoes push
     */
    initialize: function() {
        console.log('Inicializando sistema de notificacoes push...');
        
        // Verificar suporte do navegador
        this.state.isSupported = this.checkSupport();
        
        if (!this.state.isSupported) {
            console.warn('Navegador nao suporta notificacoes push');
            return Promise.resolve(false);
        }
        
        return this._initializeAsync();
    },
    
    /**
     * Funcao async interna para inicializacao
     */
    _initializeAsync: function() {
        var self = this;
        return new Promise(function(resolve) {
            (async function() {
                try {
                    // Registrar Service Worker
                    await self.registerServiceWorker();
                    
                    // Verificar permissao atual
                    self.state.permission = Notification.permission;
                    
                    // Obter subscription atual
                    await self.getSubscription();
                    
                    // Configurar listeners
                    self.setupEventListeners();
                    
                    // Atualizar interface
                    self.updateUI();
                    
                    console.log('Sistema de notificacoes inicializado');
                    console.log('Status:', {
                        supported: self.state.isSupported,
                        permission: self.state.permission,
                        subscribed: self.state.isSubscribed
                    });
                    
                    resolve(true);
                    
                } catch (error) {
                    console.error('Erro ao inicializar notificacoes:', error);
                    resolve(false);
                }
            })();
        });
    },
    
    /**
     * Verifica suporte do navegador
     */
    checkSupport: function() {
        return 'Notification' in window &&
               'serviceWorker' in navigator &&
               'PushManager' in window &&
               'showNotification' in ServiceWorkerRegistration.prototype;
    },
    
    /**
     * Registra o Service Worker de notificacoes
     */
    registerServiceWorker: function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            (async function() {
                try {
                    var registration = await navigator.serviceWorker.register(self.config.swPath, {
                        scope: self.config.appPath
                    });
                    
                    console.log('Service Worker registrado:', registration.scope);
                    
                    // Aguardar ativacao
                    await navigator.serviceWorker.ready;
                    
                    resolve(registration);
                    
                } catch (error) {
                    console.error('Erro ao registrar Service Worker:', error);
                    reject(error);
                }
            })();
        });
    },
    
    /**
     * Solicita permissao para notificacoes
     */
    requestPermission: function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            (async function() {
                try {
                    console.log('Solicitando permissao para notificacoes...');
                    
                    var permission = await Notification.requestPermission();
                    self.state.permission = permission;
                    
                    console.log('Permissao:', permission);
                    
                    if (permission === 'granted') {
                        // Se permitido, inscrever para push
                        await self.subscribeToPush();
                        self.showToast('Permissao concedida!', 'success');
                    } else if (permission === 'denied') {
                        self.showToast('Permissao negada. Altere nas configuracoes do navegador.', 'warning');
                    }
                    
                    self.updateUI();
                    resolve(permission);
                    
                } catch (error) {
                    console.error('Erro ao solicitar permissao:', error);
                    self.showToast('Erro ao solicitar permissao', 'error');
                    reject(error);
                }
            })();
        });
    },
    
    /**
 * Inscreve usuario para notificacoes push usando Firebase
 */
subscribeToPush: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        (async function() {
            try {
                console.log('Registrando no Firebase FCM...');
                
                // Verificar se Firebase está disponível
                if (!window.firebase || !window.firebase.messaging) {
                    throw new Error('Firebase não carregado. Verifique os scripts.');
                }
                
                // Inicializar Firebase no frontend também
                if (!firebase.apps.length) {
                    firebase.initializeApp({
                        projectId: 'sistema-de-demandas-escolares',
                        messagingSenderId: '655714446030',
                        appId: '1:655714446030:web:seu_app_id_aqui'
                    });
                }
                
                const messaging = firebase.messaging();
                
                // Solicitar permissão
                await Notification.requestPermission();
                
                // Obter token FCM
                const token = await messaging.getToken({
                    vapidKey: self.config.vapidPublicKey,
                    serviceWorkerRegistration: await navigator.serviceWorker.ready
                });
                
                if (!token) {
                    throw new Error('Não foi possível obter token FCM');
                }
                
                console.log('Token FCM obtido:', token);
                
                // Criar objeto subscription simulado para compatibilidade
                const subscriptionData = {
                    endpoint: `https://fcm.googleapis.com/fcm/send/${token}`,
                    keys: {
                        p256dh: self.config.vapidPublicKey,
                        auth: 'firebase_auth_' + Date.now()
                    }
                };
                
                // Salvar no servidor
                await self.saveSubscription({
                    endpoint: subscriptionData.endpoint,
                    keys: subscriptionData.keys,
                    token: token  // Token real do Firebase
                });
                
                self.state.subscription = subscriptionData;
                self.state.isSubscribed = true;
                self.state.fcmToken = token;
                
                console.log('Registrado no Firebase FCM com sucesso!');
                self.showToast('Notificacoes ativadas com Firebase!', 'success');
                
                self.updateUI();
                resolve(subscriptionData);
                
            } catch (error) {
                console.error('Erro ao registrar no Firebase:', error);
                
                // Fallback para Web Push padrão
                console.log('Tentando fallback para Web Push padrão...');
                try {
                    var serviceWorker = await navigator.serviceWorker.ready;
                    
                    var subscription = await serviceWorker.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: self.urlBase64ToUint8Array(self.config.vapidPublicKey)
                    });
                    
                    await self.saveSubscription(subscription);
                    
                    self.state.subscription = subscription;
                    self.state.isSubscribed = true;
                    
                    console.log('Fallback Web Push bem-sucedido');
                    self.showToast('Notificacoes ativadas (modo fallback)', 'success');
                    
                    self.updateUI();
                    resolve(subscription);
                    
                } catch (fallbackError) {
                    console.error('Fallback também falhou:', fallbackError);
                    self.showToast('Erro ao ativar notificacoes', 'error');
                    reject(fallbackError);
                }
            }
        })();
    });
},
    
    /**
     * Cancela inscricao nas notificacoes push
     */
    unsubscribeFromPush: function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            (async function() {
                try {
                    console.log('Cancelando inscricao...');
                    
                    var serviceWorker = await navigator.serviceWorker.ready;
                    var subscription = await serviceWorker.pushManager.getSubscription();
                    
                    if (subscription) {
                        await subscription.unsubscribe();
                        await self.deleteSubscription(subscription);
                        
                        self.state.subscription = null;
                        self.state.isSubscribed = false;
                        
                        console.log('Inscricao cancelada');
                        self.showToast('Notificacoes desativadas', 'info');
                        
                        self.updateUI();
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                    
                } catch (error) {
                    console.error('Erro ao cancelar inscricao:', error);
                    self.showToast('Erro ao desativar notificacoes', 'error');
                    reject(error);
                }
            })();
        });
    },
    
    /**
     * Obtem a subscription atual
     */
    getSubscription: function() {
        var self = this;
        return new Promise(function(resolve) {
            (async function() {
                try {
                    var serviceWorker = await navigator.serviceWorker.ready;
                    var subscription = await serviceWorker.pushManager.getSubscription();
                    
                    if (subscription) {
                        self.state.subscription = subscription;
                        self.state.isSubscribed = true;
                        console.log('Subscription atual encontrada');
                    } else {
                        self.state.isSubscribed = false;
                        console.log('Nenhuma subscription ativa');
                    }
                    
                    resolve(subscription);
                    
                } catch (error) {
                    console.error('Erro ao obter subscription:', error);
                    resolve(null);
                }
            })();
        });
    },
    
    /**
     * Salva subscription no servidor (Google Apps Script)
     */
    saveSubscription: function(subscription) {
        var self = this;
        return new Promise(function(resolve, reject) {
            (async function() {
                try {
                    // Obter dados do usuario logado
                    var usuarioSalvo = localStorage.getItem('usuario_demandas');
                    var usuario = null;
                    
                    if (usuarioSalvo) {
                        try {
                            usuario = JSON.parse(usuarioSalvo);
                        } catch (e) {
                            console.error('Erro ao ler usuario:', e);
                        }
                    }
                    
                    var subscriptionData = subscription.toJSON();
                    var dados = {
                        acao: 'salvarSubscription',
                        subscription: subscriptionData,
                        usuario: usuario ? {
                            email: usuario.email,
                            nome: usuario.nome,
                            tipo: usuario.tipo_usuario,
                            escola: usuario.escola_sre,
                            departamento: usuario.departamento
                        } : null,
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        endpoint: subscriptionData.endpoint
                    };
                    
                    // Enviar para Google Apps Script
                    var resultado = await self.enviarParaGoogleAppsScript(dados);
                    
                    if (resultado && resultado.sucesso) {
                        console.log('Subscription salva no servidor');
                        resolve(true);
                    } else {
                        throw new Error(resultado?.erro || 'Erro ao salvar subscription');
                    }
                    
                } catch (error) {
                    console.error('Erro ao salvar subscription:', error);
                    
                    // Fallback: salvar localmente
                    try {
                        localStorage.setItem('push_subscription', JSON.stringify(subscription.toJSON()));
                        console.log('Subscription salva localmente (fallback)');
                    } catch (e) {
                        console.error('Nao foi possivel salvar localmente:', e);
                    }
                    
                    resolve(false);
                }
            })();
        });
    },
    
    /**
     * Remove subscription do servidor
     */
    deleteSubscription: function(subscription) {
        var self = this;
        return new Promise(function(resolve) {
            (async function() {
                try {
                    var subscriptionData = subscription.toJSON();
                    var dados = {
                        acao: 'removerSubscription',
                        endpoint: subscriptionData.endpoint,
                        timestamp: new Date().toISOString()
                    };
                    
                    await self.enviarParaGoogleAppsScript(dados);
                    console.log('Subscription removida do servidor');
                    
                    // Remover localmente
                    localStorage.removeItem('push_subscription');
                    
                    resolve();
                    
                } catch (error) {
                    console.error('Erro ao remover subscription:', error);
                    resolve();
                }
            })();
        });
    },
    
    /**
     * Envia notificacao de teste
     */
    sendTestNotification: function() {
        var self = this;
        return new Promise(function(resolve) {
            (async function() {
                try {
                    console.log('Enviando notificacao de teste...');
                    
                    var serviceWorker = await navigator.serviceWorker.ready;
                    
                    // Enviar mensagem para o Service Worker
                    if (serviceWorker.active) {
                        serviceWorker.active.postMessage({
                            type: 'SEND_TEST_NOTIFICATION',
                            data: {
                                title: 'Teste de Notificacao',
                                body: 'Esta e uma notificacao de teste do sistema',
                                timestamp: Date.now()
                            }
                        });
                        
                        self.showToast('Notificacao de teste enviada!', 'success');
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                    
                } catch (error) {
                    console.error('Erro ao enviar teste:', error);
                    self.showToast('Erro ao enviar teste', 'error');
                    resolve(false);
                }
            })();
        });
    },
    
    /**
     * Envia notificacao personalizada
     */
    sendCustomNotification: function(dados) {
        var self = this;
        return new Promise(function(resolve) {
            (async function() {
                try {
                    var serviceWorker = await navigator.serviceWorker.ready;
                    
                    if (serviceWorker.active) {
                        serviceWorker.active.postMessage({
                            type: 'SEND_CUSTOM_NOTIFICATION',
                            data: {
                                title: dados.titulo || 'Sistema de Demandas',
                                body: dados.mensagem || 'Nova atualizacao',
                                icon: dados.icone || self.config.appPath + 'public/icons/192x192.png',
                                url: dados.url || self.config.appPath + 'index.html',
                                demandaId: dados.demandaId,
                                userId: dados.userId,
                                important: dados.importante || false,
                                actions: dados.acoes || [],
                                vibrate: [200, 100, 200],
                                tag: dados.tag || 'custom-notification'
                            }
                        });
                        
                        console.log('Notificacao personalizada enviada:', dados);
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                    
                } catch (error) {
                    console.error('Erro ao enviar notificacao personalizada:', error);
                    resolve(false);
                }
            })();
        });
    },
    
    /**
     * Configura listeners de eventos
     */
    setupEventListeners: function() {
        var self = this;
        
        // Listener para mudancas de permissao
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'notifications' })
                .then(function(permissionStatus) {
                    permissionStatus.onchange = function() {
                        self.state.permission = Notification.permission;
                        self.updateUI();
                        console.log('Permissao alterada:', self.state.permission);
                    };
                });
        }
    },
    
    /**
     * Atualiza a interface com o status atual
     */
    updateUI: function() {
        // Esta funcao sera implementada pelo app.js
        if (typeof window.atualizarStatusNotificacoes === 'function') {
            var info = this.getInfo();
            window.atualizarStatusNotificacoes(info);
        }
    },
    
    /**
     * Obtem informacoes do sistema
     */
    getInfo: function() {
        return {
            supported: this.state.isSupported,
            permission: this.state.permission,
            subscribed: this.state.isSubscribed,
            subscription: this.state.subscription ? this.state.subscription.toJSON() : null,
            vapidKey: this.config.vapidPublicKey
        };
    },
    
    /**
     * Envia dados para Google Apps Script
     */
    enviarParaGoogleAppsScript: function(dados) {
        return new Promise(function(resolve, reject) {
            var callbackName = 'callback_' + Date.now();
            
            window[callbackName] = function(resposta) {
                delete window[callbackName];
                
                if (resposta && resposta.sucesso !== false) {
                    resolve(resposta.dados || resposta);
                } else {
                    reject(new Error(resposta.erro || resposta.mensagem || 'Erro no servidor'));
                }
            };
            
            var script = document.createElement('script');
            var url = this.config.googleScriptUrl;
            url += '?callback=' + encodeURIComponent(callbackName);
            url += '&dados=' + encodeURIComponent(JSON.stringify(dados));
            url += '&_=' + Date.now();
            
            script.src = url;
            script.onerror = function() {
                delete window[callbackName];
                reject(new Error('Falha na conexao com o servidor'));
            };
            
            document.body.appendChild(script);
        }.bind(this));
    },
    
    /**
     * Converte chave VAPID de base64 para Uint8Array
     */
    urlBase64ToUint8Array: function(base64String) {
        var padding = '='.repeat((4 - base64String.length % 4) % 4);
        var base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        var rawData = atob(base64);
        var outputArray = new Uint8Array(rawData.length);
        
        for (var i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    },
    
    /**
     * Mostra toast message
     */
    showToast: function(mensagem, tipo) {
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('Notificacoes', mensagem, tipo);
        } else {
            console.log(tipo.toUpperCase() + ': ' + mensagem);
        }
    }
};

// Exportar para uso global
window.PushNotificationSystem = PushNotificationSystem;

console.log('PushNotificationSystem carregado!');
