// pushNotifications.js - Sistema completo de notificações push para frontend
const PushNotificationSystem = {
    // Configurações
    config: {
        vapidPublicKey: 'BKFl5Hc4UKk6gNm4t7wcCLnRIzYmW9TF8yOxqM0obajhIG_H0RRetGt2bT1qZoTIerYa4IVQE6Jb0D4hNRIM-Vs',
        googleScriptUrl: 'https://script.google.com/macros/s/AKfycbxQScM5c4i4xbVxrYBjlpG-s8wPWM9nx3JCOi4t3jVhmhPnpbO2yOvS1hPQXb1ZVlUuwg/exec',
        appPath: '/sistema-demandas-escolares/',
        swPath: '/sistema-demandas-escolares/public/sw-notificacoes.js'
    },
    
    // Estado do sistema
    state: {
        isSupported: false,
        permission: 'default',
        subscription: null,
        isSubscribed: false
    },
    
    /**
     * Inicializa o sistema de notificações push
     */
    async initialize() {
        console.log('🔔 Inicializando sistema de notificações push...');
        
        // Verificar suporte do navegador
        this.state.isSupported = this.checkSupport();
        
        if (!this.state.isSupported) {
            console.warn('⚠️ Navegador não suporta notificações push');
            return false;
        }
        
        try {
            // Registrar Service Worker
            await this.registerServiceWorker();
            
            // Verificar permissão atual
            this.state.permission = Notification.permission;
            
            // Obter subscription atual
            await this.getSubscription();
            
            // Configurar listeners
            this.setupEventListeners();
            
            // Atualizar interface
            this.updateUI();
            
            console.log('✅ Sistema de notificações inicializado');
            console.log('📊 Status:', {
                supported: this.state.isSupported,
                permission: this.state.permission,
                subscribed: this.state.isSubscribed
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar notificações:', error);
            return false;
        }
    },
    
    /**
     * Verifica suporte do navegador
     */
    checkSupport() {
        return 'Notification' in window &&
               'serviceWorker' in navigator &&
               'PushManager' in window &&
               'showNotification' in ServiceWorkerRegistration.prototype;
    },
    
    /**
     * Registra o Service Worker de notificações
     */
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register(this.config.swPath, {
                scope: this.config.appPath
            });
            
            console.log('✅ Service Worker registrado:', registration.scope);
            
            // Aguardar ativação
            await navigator.serviceWorker.ready;
            
            return registration;
            
        } catch (error) {
            console.error('❌ Erro ao registrar Service Worker:', error);
            throw error;
        }
    },
    
    /**
     * Solicita permissão para notificações
     */
    async requestPermission() {
        console.log('🔐 Solicitando permissão para notificações...');
        
        try {
            const permission = await Notification.requestPermission();
            this.state.permission = permission;
            
            console.log(`✅ Permissão: ${permission}`);
            
            if (permission === 'granted') {
                // Se permitido, inscrever para push
                await this.subscribeToPush();
                this.showToast('Permissão concedida!', 'success');
            } else if (permission === 'denied') {
                this.showToast('Permissão negada. Você pode alterar nas configurações do navegador.', 'warning');
            }
            
            this.updateUI();
            return permission;
            
        } catch (error) {
            console.error('❌ Erro ao solicitar permissão:', error);
            this.showToast('Erro ao solicitar permissão', 'error');
            throw error;
        }
    },
    
    /**
     * Inscreve usuário para notificações push
     */
    async subscribeToPush() {
        console.log('📝 Inscrevendo para notificações push...');
        
        try {
            const serviceWorker = await navigator.serviceWorker.ready;
            
            const subscription = await serviceWorker.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidPublicKey)
            });
            
            console.log('✅ Inscrito para push:', subscription);
            
            // Salvar subscription no servidor
            await this.saveSubscription(subscription);
            
            this.state.subscription = subscription;
            this.state.isSubscribed = true;
            
            console.log('📋 Subscription salva no servidor');
            this.showToast('Notificações ativadas com sucesso!', 'success');
            
            this.updateUI();
            return subscription;
            
        } catch (error) {
            console.error('❌ Erro ao inscrever para push:', error);
            
            if (error.name === 'NotAllowedError') {
                this.showToast('Permissão necessária para notificações push', 'warning');
            } else {
                this.showToast('Erro ao ativar notificações', 'error');
            }
            
            throw error;
        }
    },
    
    /**
     * Cancela inscrição nas notificações push
     */
    async unsubscribeFromPush() {
        console.log('🔕 Cancelando inscrição...');
        
        try {
            const serviceWorker = await navigator.serviceWorker.ready;
            const subscription = await serviceWorker.pushManager.getSubscription();
            
            if (subscription) {
                await subscription.unsubscribe();
                await this.deleteSubscription(subscription);
                
                this.state.subscription = null;
                this.state.isSubscribed = false;
                
                console.log('✅ Inscrição cancelada');
                this.showToast('Notificações desativadas', 'info');
                
                this.updateUI();
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao cancelar inscrição:', error);
            this.showToast('Erro ao desativar notificações', 'error');
            throw error;
        }
    },
    
    /**
     * Obtém a subscription atual
     */
    async getSubscription() {
        try {
            const serviceWorker = await navigator.serviceWorker.ready;
            const subscription = await serviceWorker.pushManager.getSubscription();
            
            if (subscription) {
                this.state.subscription = subscription;
                this.state.isSubscribed = true;
                console.log('📋 Subscription atual encontrada');
            } else {
                this.state.isSubscribed = false;
                console.log('📭 Nenhuma subscription ativa');
            }
            
            return subscription;
            
        } catch (error) {
            console.error('❌ Erro ao obter subscription:', error);
            return null;
        }
    },
    
    /**
     * Salva subscription no servidor (Google Apps Script)
     */
    async saveSubscription(subscription) {
        try {
            // Obter dados do usuário logado
            const usuarioSalvo = localStorage.getItem('usuario_demandas');
            let usuario = null;
            
            if (usuarioSalvo) {
                try {
                    usuario = JSON.parse(usuarioSalvo);
                } catch (e) {
                    console.error('Erro ao ler usuário:', e);
                }
            }
            
            const subscriptionData = subscription.toJSON();
            const dados = {
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
            const resultado = await this.enviarParaGoogleAppsScript(dados);
            
            if (resultado && resultado.sucesso) {
                console.log('💾 Subscription salva no servidor');
                return true;
            } else {
                throw new Error(resultado?.erro || 'Erro ao salvar subscription');
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar subscription:', error);
            
            // Fallback: salvar localmente
            try {
                localStorage.setItem('push_subscription', JSON.stringify(subscription.toJSON()));
                console.log('💾 Subscription salva localmente (fallback)');
            } catch (e) {
                console.error('❌ Não foi possível salvar localmente:', e);
            }
            
            return false;
        }
    },
    
    /**
     * Remove subscription do servidor
     */
    async deleteSubscription(subscription) {
        try {
            const subscriptionData = subscription.toJSON();
            const dados = {
                acao: 'removerSubscription',
                endpoint: subscriptionData.endpoint,
                timestamp: new Date().toISOString()
            };
            
            await this.enviarParaGoogleAppsScript(dados);
            console.log('🗑️ Subscription removida do servidor');
            
            // Remover localmente
            localStorage.removeItem('push_subscription');
            
        } catch (error) {
            console.error('❌ Erro ao remover subscription:', error);
        }
    },
    
    /**
     * Envia notificação de teste
     */
    async sendTestNotification() {
        console.log('🧪 Enviando notificação de teste...');
        
        try {
            const serviceWorker = await navigator.serviceWorker.ready;
            
            // Enviar mensagem para o Service Worker
            if (serviceWorker.active) {
                serviceWorker.active.postMessage({
                    type: 'SEND_TEST_NOTIFICATION',
                    data: {
                        title: '🔔 Teste de Notificação',
                        body: 'Esta é uma notificação de teste do sistema de demandas',
                        timestamp: Date.now()
                    }
                });
                
                this.showToast('Notificação de teste enviada!', 'success');
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao enviar teste:', error);
            this.showToast('Erro ao enviar teste', 'error');
            return false;
        }
    },
    
    /**
     * Envia notificação personalizada
     */
    async sendCustomNotification(dados) {
        try {
            const serviceWorker = await navigator.serviceWorker.ready;
            
            if (serviceWorker.active) {
                serviceWorker.active.postMessage({
                    type: 'SEND_CUSTOM_NOTIFICATION',
                    data: {
                        title: dados.titulo || 'Sistema de Demandas',
                        body: dados.mensagem || 'Nova atualização',
                        icon: dados.icone || this.config.appPath + 'public/icons/192x192.png',
                        url: dados.url || this.config.appPath + 'index.html',
                        demandaId: dados.demandaId,
                        userId: dados.userId,
                        important: dados.importante || false,
                        actions: dados.acoes || [],
                        vibrate: [200, 100, 200],
                        tag: dados.tag || 'custom-notification'
                    }
                });
                
                console.log('📤 Notificação personalizada enviada:', dados);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao enviar notificação personalizada:', error);
            return false;
        }
    },
    
    /**
     * Configura listeners de eventos
     */
    setupEventListeners() {
        // Listener para mudanças de permissão
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'notifications' })
                .then(permissionStatus => {
                    permissionStatus.onchange = () => {
                        this.state.permission = Notification.permission;
                        this.updateUI();
                        console.log('🔄 Permissão alterada:', this.state.permission);
                    };
                });
        }
        
        // Listener para clique em notificação (quando app já está aberto)
        window.addEventListener('focus', () => {
            this.checkForPendingNotifications();
        });
    },
    
    /**
     * Verifica notificações pendentes
     */
    async checkForPendingNotifications() {
        try {
            // Implementar lógica para verificar notificações pendentes
            // quando o usuário volta ao app
            console.log('🔍 Verificando notificações pendentes...');
            
        } catch (error) {
            console.error('❌ Erro ao verificar notificações:', error);
        }
    },
    
    /**
     * Atualiza a interface com o status atual
     */
    updateUI() {
        // Atualizar botões/toggles na interface
        const toggleElement = document.getElementById('toggle-push');
        const statusElement = document.getElementById('push-status');
        const buttonElement = document.getElementById('btn-activate-push');
        
        if (toggleElement) {
            toggleElement.checked = this.state.isSubscribed && this.state.permission === 'granted';
            toggleElement.disabled = this.state.permission === 'denied';
        }
        
        if (statusElement) {
            let statusText = '';
            let statusClass = '';
            
            if (!this.state.isSupported) {
                statusText = 'Navegador não suporta notificações';
                statusClass = 'error';
            } else if (this.state.permission === 'granted' && this.state.isSubscribed) {
                statusText = '✅ Notificações ativas';
                statusClass = 'success';
            } else if (this.state.permission === 'granted' && !this.state.isSubscribed) {
                statusText = '⚠️ Permissão concedida, mas não inscrito';
                statusClass = 'warning';
            } else if (this.state.permission === 'denied') {
                statusText = '❌ Permissão negada. Ative nas configurações do navegador.';
                statusClass = 'error';
            } else {
                statusText = '⏳ Aguardando permissão...';
                statusClass = 'info';
            }
            
            statusElement.textContent = statusText;
            statusElement.className = `notification-status ${statusClass}`;
        }
        
        if (buttonElement) {
            if (this.state.permission === 'default') {
                buttonElement.textContent = 'Ativar Notificações';
                buttonElement.disabled = false;
            } else if (this.state.permission === 'granted' && !this.state.isSubscribed) {
                buttonElement.textContent = 'Completar Ativação';
                buttonElement.disabled = false;
            } else if (this.state.permission === 'granted' && this.state.isSubscribed) {
                buttonElement.textContent = 'Notificações Ativas';
                buttonElement.disabled = true;
                buttonElement.classList.add('active');
            } else {
                buttonElement.textContent = 'Permissão Negada';
                buttonElement.disabled = true;
            }
        }
    },
    
    /**
     * Obtém informações do sistema
     */
    getInfo() {
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
    async enviarParaGoogleAppsScript(dados) {
        return new Promise((resolve, reject) => {
            const callbackName = 'callback_' + Date.now();
            
            window[callbackName] = function(resposta) {
                delete window[callbackName];
                
                if (resposta && resposta.sucesso !== false) {
                    resolve(resposta.dados || resposta);
                } else {
                    reject(new Error(resposta.erro || resposta.mensagem || 'Erro no servidor'));
                }
            };
            
            const script = document.createElement('script');
            let url = this.config.googleScriptUrl;
            url += '?callback=' + encodeURIComponent(callbackName);
            url += '&dados=' + encodeURIComponent(JSON.stringify(dados));
            url += '&_=' + Date.now();
            
            script.src = url;
            script.onerror = () => {
                delete window[callbackName];
                reject(new Error('Falha na conexão com o servidor'));
            };
            
            document.body.appendChild(script);
        });
    },
    
    /**
     * Converte chave VAPID de base64 para Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    },
    
    /**
     * Mostra toast message
     */
    showToast(mensagem, tipo = 'info') {
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('Notificações', mensagem, tipo);
        } else {
            console.log(`📢 ${tipo.toUpperCase()}: ${mensagem}`);
        }
    }
};

// Exportar para uso global
window.PushNotificationSystem = PushNotificationSystem;

// Inicializar automaticamente quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        PushNotificationSystem.initialize().then(success => {
            if (success) {
                console.log('🚀 Sistema de notificações push pronto!');
            }
        });
    }, 2000);
});

console.log('✅ PushNotificationSystem carregado!');
