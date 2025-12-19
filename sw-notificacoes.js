// ============================================
// SERVICE WORKER DE NOTIFICAÇÕES PUSH CORRIGIDO
// sw-notificacoes.js
// Compatível com GitHub Pages
// ============================================

const APP_PATH = '/sistema-demandas-escolares/';
const VAPID_PUBLIC_KEY = 'BKFl5Hc4UKk6gNm4t7wcCLnRIzYmW9TF8yOxqM0obajhIG_H0RRetGt2bT1qZoTIerYa4IVQE6Jb0D4hNRIM-Vs';

// ============================================
// 1. INSTALAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker de notificações: Instalando...');
    self.skipWaiting(); // Ativar imediatamente
});

// ============================================
// 2. ATIVAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker de notificações: Ativado!');
    event.waitUntil(self.clients.claim());
});

// ============================================
// 3. RECEBIMENTO DE NOTIFICAÇÕES PUSH
// ============================================
self.addEventListener('push', (event) => {
    console.log('📲 Recebida notificação push:', event);
    
    let notificationData = {
        title: 'Sistema de Demandas Escolares',
        body: 'Nova atualização disponível',
        icon: APP_PATH + 'public/icons/192x192.png',
        badge: APP_PATH + 'public/icons/96x96.png',
        data: {
            url: APP_PATH + 'index.html',
            timestamp: Date.now()
        }
    };
    
    try {
        // Tentar obter dados da notificação
        if (event.data) {
            const data = event.data.json();
            console.log('📋 Dados da notificação:', data);
            
            notificationData = {
                title: data.title || 'Sistema de Demandas',
                body: data.body || 'Nova demanda criada',
                icon: data.icon || APP_PATH + 'public/icons/192x192.png',
                badge: APP_PATH + 'public/icons/96x96.png',
                image: data.image,
                vibrate: [200, 100, 200, 100, 200],
                tag: data.tag || 'nova-notificacao',
                renotify: true,
                requireInteraction: data.important || false,
                silent: false,
                timestamp: Date.now(),
                data: {
                    url: data.url || APP_PATH + 'index.html',
                    demandaId: data.demandaId,
                    userId: data.userId,
                    type: data.type || 'demanda',
                    timestamp: Date.now()
                },
                actions: data.actions || [
                    {
                        action: 'open',
                        title: '👁️ Abrir Sistema'
                    },
                    {
                        action: 'dismiss',
                        title: '✖️ Fechar'
                    }
                ]
            };
        }
    } catch (error) {
        console.warn('⚠️ Não foi possível parsear dados da notificação, usando padrão:', error);
    }
    
    console.log('📤 Mostrando notificação:', notificationData);
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// ============================================
// 4. CLIQUE EM NOTIFICAÇÃO
// ============================================
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notificação clicada:', event.notification.data);
    
    event.notification.close();
    
    const notificationData = event.notification.data || {};
    const urlToOpen = notificationData.url || APP_PATH + 'index.html';
    
    // Verificar qual ação foi clicada
    if (event.action === 'open' || event.action === 'ver') {
        event.waitUntil(
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then((clientList) => {
                // Procurar por uma aba/janela aberta
                for (const client of clientList) {
                    if (client.url.includes(APP_PATH) && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Se não encontrou, abrir nova janela
                if (clients.openWindow) {
                    // Adicionar parâmetros específicos se houver
                    let finalUrl = urlToOpen;
                    if (notificationData.demandaId) {
                        finalUrl += '?demanda=' + notificationData.demandaId;
                    }
                    
                    console.log('🌐 Abrindo URL:', finalUrl);
                    return clients.openWindow(finalUrl);
                }
            })
        );
    } 
    
    // Para outras ações
    else if (event.action === 'dismiss' || event.action === 'fechar') {
        console.log('❌ Notificação descartada');
        event.notification.close();
    }
    
    // Se clicou na notificação (sem ação específica)
    else {
        event.waitUntil(
            clients.openWindow(urlToOpen).catch(err => {
                console.error('Erro ao abrir janela:', err);
            })
        );
    }
});

// ============================================
// 5. FECHAMENTO DE NOTIFICAÇÃO
// ============================================
self.addEventListener('notificationclose', (event) => {
    console.log('📭 Notificação fechada:', event.notification.data);
    
    // Aqui você pode enviar métricas para o servidor
    // sobre notificações fechadas
    const notificationData = event.notification.data || {};
    
    // Exemplo: Enviar para Google Apps Script
    self.registration.pushManager.getSubscription().then(subscription => {
        if (subscription) {
            fetch('https://script.google.com/macros/s/AKfycbzipAeNlapZ3ks_YkU4nT5dRtMBbMhvDqZbuQIMefrJpz0lswmaOhehBsz4YKEfGYs90A/exec', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    acao: 'logNotificacaoFechada',
                    subscription: subscription.toJSON(),
                    notificationData: notificationData,
                    timestamp: Date.now()
                })
            }).catch(err => console.log('Não foi possível logar fechamento'));
        }
    });
});

// ============================================
// 6. RENOVAÇÃO DE SUBSCRIPTION
// ============================================
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('🔄 Subscription alterada:', event);
    
    event.waitUntil(
        self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
        .then((newSubscription) => {
            console.log('✅ Nova subscription criada:', newSubscription);
            
            // Enviar nova subscription para o servidor
            return fetch('https://script.google.com/macros/s/AKfycbxQScM5c4i4xbVxrYBjlpG-s8wPWM9nx3JCOi4t3jVhmhPnpbO2yOvS1hPQXb1ZVlUuwg/exec', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    acao: 'atualizarSubscription',
                    oldSubscription: event.oldSubscription ? event.oldSubscription.toJSON() : null,
                    newSubscription: newSubscription.toJSON()
                })
            });
        })
        .catch((error) => {
            console.error('❌ Erro ao renovar subscription:', error);
        })
    );
});

// ============================================
// 7. FUNÇÕES AUXILIARES
// ============================================

function urlBase64ToUint8Array(base64String) {
    try {
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
    } catch (error) {
        console.error('❌ Erro ao converter chave VAPID:', error);
        return new Uint8Array([]);
    }
}

// ============================================
// 8. SINCRONIZAÇÃO EM BACKGROUND (SIMPLIFICADA)
// ============================================
self.addEventListener('sync', (event) => {
    console.log('🔄 Evento de sync:', event.tag);
    
    if (event.tag === 'sync-notificacoes') {
        event.waitUntil(syncNotificacoesPendentes());
    }
});

async function syncNotificacoesPendentes() {
    console.log('📡 Sincronizando notificações pendentes...');
    
    try {
        // Tentar buscar do servidor
        const response = await fetch(APP_PATH + 'api/check-updates');
        if (response.ok) {
            const data = await response.json();
            if (data.notifications && data.notifications.length > 0) {
                console.log(`📨 ${data.notifications.length} notificações recebidas`);
                // Processar notificações...
            }
        }
    } catch (error) {
        console.log('📴 Offline ou erro na sincronização:', error);
    }
}

// ============================================
// 9. MENSAGENS DO APP
// ============================================
self.addEventListener('message', (event) => {
    console.log('📨 Mensagem recebida no Service Worker:', event.data);
    
    switch(event.data.type) {
        case 'GET_SUBSCRIPTION':
            self.registration.pushManager.getSubscription()
                .then(subscription => {
                    event.ports[0].postMessage({
                        type: 'SUBSCRIPTION_INFO',
                        subscription: subscription ? subscription.toJSON() : null
                    });
                });
            break;
            
        case 'SEND_TEST_NOTIFICATION':
            self.registration.showNotification('🔔 Teste de Notificação', {
                body: 'Esta é uma notificação de teste do sistema',
                icon: APP_PATH + 'public/icons/192x192.png',
                badge: APP_PATH + 'public/icons/96x96.png',
                vibrate: [200, 100, 200],
                data: {
                    url: APP_PATH + 'index.html',
                    type: 'teste'
                }
            });
            break;
            
        case 'SEND_CUSTOM_NOTIFICATION':
            if (event.data.data) {
                self.registration.showNotification(event.data.data.title || 'Sistema de Demandas', {
                    body: event.data.data.body || 'Nova atualização',
                    icon: event.data.data.icon || APP_PATH + 'public/icons/192x192.png',
                    badge: APP_PATH + 'public/icons/96x96.png',
                    data: {
                        url: event.data.data.url || APP_PATH + 'index.html',
                        demandaId: event.data.data.demandaId,
                        userId: event.data.data.userId,
                        type: event.data.data.type || 'custom'
                    }
                });
            }
            break;
    }
});

console.log('✅ Service Worker de notificações carregado com sucesso!');
