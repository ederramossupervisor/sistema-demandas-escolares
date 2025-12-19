// pushNotifications.js - VERSÃO ATUALIZADA PARA FIREBASE FCM
// ============================================

const PushNotificationSystem = {
    // Configurações ATUALIZADAS
    config: {
        // Chave pública VAPID (a mesma que você já tem)
        vapidPublicKey: 'BKYmA5_HGRoYckulvip4sBqmWdTUSyer7LJh4EE1jVajz5WHfN3yWANavQEjuvi0fdbXYGCCZu-ETLYAqUDOR7g',
        
        // URL do seu Google Apps Script
        googleScriptUrl: 'https://script.google.com/macros/s/AKfycbyDIgMxkwXcsOvEy68MblMq9MESAvkAu23u39J04ILefk3E3SuxWtJPOHz-94vhJtrNfA/exec',
        
        // Caminhos para GitHub Pages
        appPath: '/sistema-demandas-escolares/',
        swPath: '/sistema-demandas-escolares/sw-notificacoes.js',
        
        // ID do seu projeto Firebase (você já tem: 655714446030)
        firebaseSenderId: '655714446030'
    },
    
    // Estado do sistema
    state: {
        isSupported: false,
        permission: 'default',
        subscription: null,
        isSubscribed: false,
        fcmToken: null,
        useFirebase: true // Tentar usar Firebase primeiro
    },
    
    // ============================================
    // MÉTODOS PRINCIPAIS
    // ============================================
    
    /**
     * Inicializa o sistema de notificacoes
     */
    initialize: function() {
        console.log('🔔 Inicializando notificações push...');
        
        // Verificar suporte
        this.state.isSupported = this.checkSupport();
        
        if (!this.state.isSupported) {
            console.warn('⚠️ Navegador não suporta notificações push');
            return Promise.resolve(false);
        }
        
        // Verificar se já tem permissão
        this.state.permission = Notification.permission;
        
        // Inicializar async
        return this._initializeAsync();
    },
    
    /**
     * Inicialização assíncrona
     */
    _initializeAsync: function() {
        var self = this;
        return new Promise(function(resolve) {
            (async function() {
                try {
                    // Registrar Service Worker
                    await self.registerServiceWorker();
                    
                    // Tentar obter token FCM se Firebase disponível
                    if (self.state.useFirebase && typeof firebase !== 'undefined') {
                        try {
                            await self.getFCMToken();
                            console.log('✅ Firebase FCM configurado');
                        } catch (firebaseError) {
                            console.warn('⚠️ Firebase falhou, usando Web Push padrão:', firebaseError);
                            self.state.useFirebase = false;
                            await self.getWebPushSubscription();
                        }
                    } else {
                        // Usar Web Push padrão
                        await self.getWebPushSubscription();
                    }
                    
                    // Atualizar interface
                    self.updateUI();
                    
                    console.log('✅ Sistema de notificações inicializado');
                    console.log('📊 Status:', {
                        suportado: self.state.isSupported,
                        permissao: self.state.permission,
                        inscrito: self.state.isSubscribed,
                        usandoFirebase: self.state.useFirebase
                    });
                    
                    resolve(true);
                    
                } catch (error) {
                    console.error('❌ Erro ao inicializar notificações:', error);
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
               'PushManager' in window;
    },
    
    /**
     * Registra o Service Worker
     */
    registerServiceWorker: function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            (async function() {
                try {
                    // Usar caminho absoluto para GitHub Pages
                    const swUrl = self.config.appPath + 'sw-notificacoes.js';
                    
                    const registration = await navigator.serviceWorker.register(swUrl, {
                        scope: self.config.appPath
                    });
                    
                    console.log('✅ Service Worker registrado:', registration.scope);
                    
                    // Aguardar ativação
                    await registration.update();
                    await navigator.serviceWorker.ready;
                    
                    resolve(registration);
                    
                } catch (error) {
                    console.error('❌ Erro ao registrar Service Worker:', error);
                    
                    // Tentar caminho alternativo
                    try {
                        const registration = await navigator.serviceWorker.register('sw-notificacoes.js');
                        console.log('✅ Service Worker registrado (caminho alternativo)');
                        resolve(registration);
                    } catch (fallbackError) {
                        console.error('❌ Fallback também falhou:', fallbackError);
                        reject(fallbackError);
                    }
                }
            })();
        });
    },
    
    /**
     * Obtém token FCM do Firebase
     */
    getFCMToken: function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            (async function() {
                try {
                    if (typeof firebase === 'undefined' || !firebase.messaging) {
                        throw new Error('Firebase não carregado');
                    }
                    
                    // Inicializar Firebase se necessário
                    if (!firebase.apps.length) {
                        console.log('🔥 Firebase não inicializado, usando Web Push');
                        throw new Error('Firebase não inicializado');
                    }
                    
                    const messaging = firebase.messaging();
                    
                    // Solicitar permissão se ainda não tem
                    if (self.state.permission === 'default') {
                        self.state.permission = await Notification.requestPermission();
                    }
                    
                    if (self.state.permission !== 'granted') {
                        throw new Error('Permissão negada: ' + self.state.permission);
                    }
                    
                    // Obter token FCM
                    const token = await messaging.getToken({
                        vapidKey: self.config.vapidPublicKey,
                        serviceWorkerRegistration: await navigator.serviceWorker.ready
                    });
                    
                    if (!token) {
                        throw new Error('Token FCM não gerado');
                    }
                    
                    console.log('✅ Token FCM obtido:', token.substring(0, 50) + '...');
                    
                    // Salvar no servidor
                    await self.saveFCMToken(token);
                    
                    self.state.fcmToken = token;
                    self.state.isSubscribed = true;
                    self.state.subscription = {
                        endpoint: `https://fcm.googleapis.com/fcm/send/${token}`,
                        token: token
                    };
                    
                    resolve(token);
                    
                } catch (error) {
                    console.error('❌ Erro no Firebase FCM:', error);
                    reject(error);
                }
            })();
        });
    },
    
    /**
     * Obtém subscription Web Push padrão
     */
    getWebPushSubscription: function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            (async function() {
                try {
                    const serviceWorker = await navigator.serviceWorker.ready;
                    let subscription = await serviceWorker.pushManager.getSubscription();
                    
                    if (!subscription) {
                        // Criar nova subscription se não existir
                        subscription = await serviceWorker.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: self.urlBase64ToUint8Array(self.config.vapidPublicKey)
                        });
                        
                        // Salvar no servidor
                        await self.saveSubscription(subscription);
                    }
                    
                    self.state.subscription = subscription;
                    self.state.isSubscribed = true;
                    
                    console.log('✅ Web Push subscription:', subscription.endpoint);
                    resolve(subscription);
                    
                } catch (error) {
                    console.error('❌ Erro no Web Push:', error);
                    reject(error);
                }
            })();
        });
    },
    
    /**
     * Solicita permissão para notificações
     */
    requestPermission: function() {
        var self = this;
        return new Promise(function(resolve) {
            (async function() {
                try {
                    console.log('🔔 Solicitando permissão...');
                    
                    const permission = await Notification.requestPermission();
                    self.state.permission = permission;
                    
                    console.log('📋 Permissão:', permission);
                    
                    if (permission === 'granted') {
                        // Inscrever de acordo com o método disponível
                        if (self.state.useFirebase && typeof firebase !== 'undefined') {
                            await self.getFCMToken();
                            self.showMessage('✅ Notificações ativadas com Firebase!', 'success');
                        } else {
                            await self.getWebPushSubscription();
                            self.showMessage('✅ Notificações ativadas!', 'success');
                        }
                    } else if (permission === 'denied') {
                        self.showMessage('❌ Permissão negada. Ative nas configurações do navegador.', 'warning');
                    }
                    
                    self.updateUI();
                    resolve(permission);
                    
                } catch (error) {
                    console.error('❌ Erro na permissão:', error);
                    self.showMessage('❌ Erro ao ativar notificações', 'error');
                    resolve('error');
                }
            })();
        });
    },
    
    /**
     * Desativa notificações
     */
    unsubscribe: function() {
        var self = this;
        return new Promise(function(resolve) {
            (async function() {
                try {
                    console.log('🔕 Desativando notificações...');
                    
                    if (self.state.fcmToken) {
                        // Firebase: deletar token
                        if (firebase && firebase.messaging) {
                            await firebase.messaging().deleteToken();
                        }
                        
                        // Remover do servidor
                        await self.deleteFCMToken(self.state.fcmToken);
                    } else if (self.state.subscription) {
                        // Web Push padrão: cancelar subscription
                        const serviceWorker = await navigator.serviceWorker.ready;
                        const subscription = await serviceWorker.pushManager.getSubscription();
                        
                        if (subscription) {
                            await subscription.unsubscribe();
                            await self.deleteSubscription(subscription);
                        }
                    }
                    
                    // Resetar estado
                    self.state.fcmToken = null;
                    self.state.subscription = null;
                    self.state.isSubscribed = false;
                    
                    self.showMessage('🔕 Notificações desativadas', 'info');
                    self.updateUI();
                    
                    resolve(true);
                    
                } catch (error) {
                    console.error('❌ Erro ao desativar:', error);
                    self.showMessage('❌ Erro ao desativar notificações', 'error');
                    resolve(false);
                }
            })();
        });
    },
    
    /**
     * Salva token FCM no servidor
     */
    saveFCMToken: function(token) {
        var self = this;
        return new Promise(function(resolve) {
            (async function() {
                try {
                    // Obter usuário logado
                    const usuarioSalvo = localStorage.getItem('usuario_demandas');
                    let usuario = null;
                    
                    if (usuarioSalvo) {
                        try {
                            usuario = JSON.parse(usuarioSalvo);
                        } catch (e) {
                            console.error('Erro ao ler usuário:', e);
                        }
                    }
                    
                    // Dados para enviar
                    const dados = {
                        acao: 'salvarSubscription',
                        fcmToken: token,
                        tipo: 'firebase',
                        usuario: usuario ? {
                            email: usuario.email,
                            nome: usuario.nome,
                            tipo: usuario.tipo_usuario
                        } : null,
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent
                    };
                    
                    // Enviar para Google Apps Script
                    const resultado = await self.enviarParaGoogleAppsScript(dados);
                    
                    if (resultado && resultado.sucesso) {
                        console.log('✅ Token FCM salvo no servidor');
                        localStorage.setItem('fcm_token', token);
                        resolve(true);
                    } else {
                        console.warn('⚠️ Token FCM salvo apenas localmente');
                        localStorage.setItem('fcm_token', token);
                        resolve(false);
                    }
                    
                } catch (error) {
                    console.error('❌ Erro ao salvar token FCM:', error);
                    
                    // Fallback: salvar localmente
                    try {
                        localStorage.setItem('fcm_token', token);
                        console.log('✅ Token FCM salvo localmente (fallback)');
                    } catch (e) {
                        console.error('❌ Não foi possível salvar localmente:', e);
                    }
                    
                    resolve(false);
                }
            })();
        });
    },
    
    /**
     * Salva subscription Web Push no servidor
     */
    saveSubscription: function(subscription) {
        var self = this;
        return new Promise(function(resolve) {
            (async function() {
                try {
                    const usuarioSalvo = localStorage.getItem('usuario_demandas');
                    let usuario = null;
                    
                    if (usuarioSalvo) {
                        try {
                            usuario = JSON.parse(usuarioSalvo);
                        } catch (e) {
                            console.error('Erro ao ler usuário:', e);
                        }
                    }
                    
                    const dados = {
                        acao: 'salvarSubscription',
                        subscription: subscription.toJSON(),
                        tipo: 'webpush',
                        usuario: usuario ? {
                            email: usuario.email,
                            nome: usuario.nome,
                            tipo: usuario.tipo_usuario
                        } : null,
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent
                    };
                    
                    const resultado = await self.enviarParaGoogleAppsScript(dados);
                    
                    if (resultado && resultado.sucesso) {
                        console.log('✅ Subscription salva no servidor');
                        localStorage.setItem('push_subscription', JSON.stringify(subscription.toJSON()));
                        resolve(true);
                    } else {
                        console.warn('⚠️ Subscription salva apenas localmente');
                        localStorage.setItem('push_subscription', JSON.stringify(subscription.toJSON()));
                        resolve(false);
                    }
                    
                } catch (error) {
                    console.error('❌ Erro ao salvar subscription:', error);
                    
                    try {
                        localStorage.setItem('push_subscription', JSON.stringify(subscription.toJSON()));
                        console.log('✅ Subscription salva localmente (fallback)');
                    } catch (e) {
                        console.error('❌ Não foi possível salvar localmente:', e);
                    }
                    
                    resolve(false);
                }
            })();
        });
    },
    
    /**
     * Remove token FCM do servidor
     */
    deleteFCMToken: function(token) {
        var self = this;
        return new Promise(function(resolve) {
            (async function() {
                try {
                    const dados = {
                        acao: 'removerSubscription',
                        fcmToken: token,
                        tipo: 'firebase',
                        timestamp: new Date().toISOString()
                    };
                    
                    await self.enviarParaGoogleAppsScript(dados);
                    console.log('✅ Token FCM removido do servidor');
                    
                    localStorage.removeItem('fcm_token');
                    resolve();
                    
                } catch (error) {
                    console.error('❌ Erro ao remover token FCM:', error);
                    
                    // Remover localmente mesmo se falhar no servidor
                    localStorage.removeItem('fcm_token');
                    resolve();
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
                    const dados = {
                        acao: 'removerSubscription',
                        endpoint: subscription.endpoint,
                        tipo: 'webpush',
                        timestamp: new Date().toISOString()
                    };
                    
                    await self.enviarParaGoogleAppsScript(dados);
                    console.log('✅ Subscription removida do servidor');
                    
                    localStorage.removeItem('push_subscription');
                    resolve();
                    
                } catch (error) {
                    console.error('❌ Erro ao remover subscription:', error);
                    
                    localStorage.removeItem('push_subscription');
                    resolve();
                }
            })();
        });
    },
    
    /**
     * Envia notificação de teste
     */
    sendTestNotification: function() {
        var self = this;
        return new Promise(function(resolve) {
            (async function() {
                try {
                    console.log('🧪 Enviando notificação de teste...');
                    
                    const serviceWorker = await navigator.serviceWorker.ready;
                    
                    if (serviceWorker.active) {
                        serviceWorker.active.postMessage({
                            type: 'SEND_TEST_NOTIFICATION'
                        });
                        
                        self.showMessage('✅ Notificação de teste enviada!', 'success');
                        resolve(true);
                    } else {
                        self.showMessage('❌ Service Worker não ativo', 'error');
                        resolve(false);
                    }
                    
                } catch (error) {
                    console.error('❌ Erro no teste:', error);
                    self.showMessage('❌ Erro ao enviar teste', 'error');
                    resolve(false);
                }
            })();
        });
    },
    
    /**
     * Envia dados para Google Apps Script
     */
    enviarParaGoogleAppsScript: function(dados) {
        return new Promise(function(resolve, reject) {
            var callbackName = 'callback_' + Date.now();
            var url = this.config.googleScriptUrl;
            
            // Criar callback
            window[callbackName] = function(resposta) {
                delete window[callbackName];
                
                if (resposta && resposta.sucesso !== false) {
                    resolve(resposta.dados || resposta);
                } else {
                    reject(new Error(resposta.erro || resposta.mensagem || 'Erro no servidor'));
                }
            };
            
            // Criar script para JSONP
            var script = document.createElement('script');
            var parametros = new URLSearchParams({
                callback: callbackName,
                dados: JSON.stringify(dados),
                _: Date.now()
            });
            
            script.src = url + '?' + parametros.toString();
            script.onerror = function() {
                delete window[callbackName];
                reject(new Error('Falha na conexão com o servidor'));
            };
            
            document.head.appendChild(script);
            
        }.bind(this));
    },
    
    /**
     * Converte chave de base64 para Uint8Array
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
     * Obtém informações do sistema
     */
    getInfo: function() {
        return {
            suportado: this.state.isSupported,
            permissao: this.state.permission,
            inscrito: this.state.isSubscribed,
            usandoFirebase: this.state.useFirebase,
            fcmToken: this.state.fcmToken ? this.state.fcmToken.substring(0, 20) + '...' : null,
            subscription: this.state.subscription
        };
    },
    
    /**
     * Mostra mensagem na interface
     */
    showMessage: function(mensagem, tipo) {
        // Usar toast do sistema se disponível
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('Notificações', mensagem, tipo);
        } else {
            // Fallback: console e alert
            console.log(tipo.toUpperCase() + ': ' + mensagem);
            if (tipo === 'error' || tipo === 'warning') {
                alert('Notificações: ' + mensagem);
            }
        }
    },
    
    /**
     * Atualiza a interface
     */
    updateUI: function() {
        // Esta função será chamada pelo app.js para atualizar botões
        if (typeof window.atualizarStatusNotificacoes === 'function') {
            window.atualizarStatusNotificacoes(this.getInfo());
        }
        
        // Verificar se precisa mostrar botão de ativação
        this.checkAndShowActivationButton();
    },
    
    /**
     * Verifica e mostra botão de ativação
     */
    checkAndShowActivationButton: function() {
        var self = this;
        
        // Mostrar botão se não tem permissão e é suportado
        if (self.state.isSupported && self.state.permission === 'default') {
            setTimeout(function() {
                self.mostrarBotaoAtivacao();
            }, 3000);
        }
    },
    /**
 * Salva o token FCM no servidor quando o usuário faz login
 * @param {string} fcmToken - Token FCM gerado
 * @param {Object} usuario - Dados do usuário logado
 */
async function salvarTokenNoServidor(fcmToken, usuario) {
  try {
    console.log("💾 Salvando token FCM no servidor para:", usuario.email);
    
    const dados = {
      acao: "salvarSubscription",
      tipo: "firebase",
      fcmToken: fcmToken,
      usuario: {
        email: usuario.email,
        nome: usuario.nome,
        departamento: usuario.departamento
      }
    };
    
    // Usar a mesma função de chamada ao servidor que você já tem
    const resposta = await fazerRequisicaoServidor(dados);
    
    if (resposta.sucesso) {
      console.log("✅ Token salvo no servidor com sucesso!");
      return true;
    } else {
      console.warn("⚠️ Não foi possível salvar token:", resposta.erro);
      return false;
    }
    
  } catch (erro) {
    console.error("❌ Erro ao salvar token no servidor:", erro);
    return false;
  }
},
    /**
     * Mostra botão para ativar notificações
     */
    mostrarBotaoAtivacao: function() {
        // Verificar se já existe
        if (document.getElementById('btn-ativar-notificacoes')) {
            return;
        }
        
        // Criar botão
        var botao = document.createElement('button');
        botao.id = 'btn-ativar-notificacoes';
        botao.innerHTML = '<i class="fas fa-bell"></i> Ativar Notificações';
        botao.className = 'btn-ativar-notif';
        
        // Estilos
        botao.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
            animation: pulse 2s infinite;
        `;
        
        // Animação
        var style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4); }
                50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(52, 152, 219, 0.6); }
                100% { transform: scale(1); box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4); }
            }
        `;
        document.head.appendChild(style);
        
        // Evento de clique
        botao.onclick = function() {
            botao.style.display = 'none';
            if (window.PushNotificationSystem) {
                window.PushNotificationSystem.requestPermission();
            }
        };
        
        // Adicionar ao corpo
        document.body.appendChild(botao);
        
        // Remover após 30 segundos
        setTimeout(function() {
            if (botao.parentNode) {
                botao.remove();
            }
        }, 30000);
    }
};

// Exportar para uso global
window.PushNotificationSystem = PushNotificationSystem;

console.log('✅ PushNotificationSystem carregado!');
