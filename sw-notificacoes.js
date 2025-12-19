// ============================================
// SERVICE WORKER DE NOTIFICACOES PUSH
// sw-notificacoes.js - VERSAO SEM CARACTERES ESPECIAIS
// ============================================

const APP_PATH = '/sistema-demandas-escolares/';
const VAPID_PUBLIC_KEY = 'BKFl5Hc4UKk6gNm4t7wcCLnRIzYmW9TF8yOxqM0obajhIG_H0RRetGt2bT1qZoTIerYa4IVQE6Jb0D4hNRIM-Vs';

// ============================================
// 1. INSTALACAO DO SERVICE WORKER
// ============================================
self.addEventListener('install', function(event) {
    console.log('[SW] Service Worker de notificacoes: Instalando...');
    self.skipWaiting(); // Ativar imediatamente
});

// ============================================
// 2. ATIVACAO DO SERVICE WORKER
// ============================================
self.addEventListener('activate', function(event) {
    console.log('[SW] Service Worker de notificacoes: Ativado!');
    event.waitUntil(self.clients.claim());
});

// ============================================
// 3. RECEBIMENTO DE NOTIFICACOES PUSH
// ============================================
self.addEventListener('push', function(event) {
    console.log('[SW] Recebida notificacao push');
    
    let notificationData = {
        title: 'Sistema de Demandas Escolares',
        body: 'Nova atualizacao disponivel',
        icon: APP_PATH + 'public/icons/192x192.png',
        badge: APP_PATH + 'public/icons/96x96.png',
        data: {
            url: APP_PATH + 'index.html',
            timestamp: Date.now()
        }
    };
    
    try {
        // Tentar obter dados da notificacao
        if (event.data) {
            const data = event.data.json();
            console.log('[SW] Dados da notificacao:', data);
            
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
                        title: 'Abrir Sistema'
                    },
                    {
                        action: 'dismiss',
                        title: 'Fechar'
                    }
                ]
            };
        }
    } catch (error) {
        console.warn('[SW] Nao foi possivel parsear dados da notificacao, usando padrao:', error);
    }
    
    console.log('[SW] Mostrando notificacao:', notificationData);
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// ============================================
// 4. CLIQUE EM NOTIFICACAO
// ============================================
self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notificacao clicada:', event.notification.data);
    
    event.notification.close();
    
    const notificationData = event.notification.data || {};
    const urlToOpen = notificationData.url || APP_PATH + 'index.html';
    
    // Verificar qual acao foi clicada
    if (event.action === 'open' || event.action === 'ver') {
        event.waitUntil(
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then(function(clientList) {
                // Procurar por uma aba/janela aberta
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    if (client.url.includes(APP_PATH) && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Se nao encontrou, abrir nova janela
                if (clients.openWindow) {
                    // Adicionar parametros especificos se houver
                    var finalUrl = urlToOpen;
                    if (notificationData.demandaId) {
                        finalUrl += '?demanda=' + notificationData.demandaId;
                    }
                    
                    console.log('[SW] Abrindo URL:', finalUrl);
                    return clients.openWindow(finalUrl);
                }
            })
        );
    } 
    
    // Para outras acoes
    else if (event.action === 'dismiss' || event.action === 'fechar') {
        console.log('[SW] Notificacao descartada');
        event.notification.close();
    }
    
    // Se clicou na notificacao (sem acao especifica)
    else {
        event.waitUntil(
            clients.openWindow(urlToOpen).catch(function(err) {
                console.error('[SW] Erro ao abrir janela:', err);
            })
        );
    }
});

// ============================================
// 5. FECHAMENTO DE NOTIFICACAO
// ============================================
self.addEventListener('notificationclose', function(event) {
    console.log('[SW] Notificacao fechada:', event.notification.data);
    
    // Aqui voce pode enviar metricas para o servidor
    // sobre notificacoes fechadas
    var notificationData = event.notification.data || {};
    
    // Exemplo: Enviar para Google Apps Script
    self.registration.pushManager.getSubscription().then(function(subscription) {
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
            }).catch(function(err) {
                console.log('[SW] Nao foi possivel logar fechamento:', err);
            });
        }
    });
});

// ============================================
// 6. RENOVACAO DE SUBSCRIPTION
// ============================================
self.addEventListener('pushsubscriptionchange', function(event) {
    console.log('[SW] Subscription alterada:', event);
    
    event.waitUntil(
        self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
        .then(function(newSubscription) {
            console.log('[SW] Nova subscription criada:', newSubscription);
            
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
        .catch(function(error) {
            console.error('[SW] Erro ao renovar subscription:', error);
        })
    );
});

// ============================================
// 7. FUNCOES AUXILIARES
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
        console.error('[SW] Erro ao converter chave VAPID:', error);
        return new Uint8Array([]);
    }
}

// ============================================
// 8. SINCRONIZACAO EM BACKGROUND (SIMPLIFICADA)
// ============================================
self.addEventListener('sync', function(event) {
    console.log('[SW] Evento de sync:', event.tag);
    
    if (event.tag === 'sync-notificacoes') {
        event.waitUntil(syncNotificacoesPendentes());
    }
});

async function syncNotificacoesPendentes() {
    console.log('[SW] Sincronizando notificacoes pendentes...');
    
    try {
        // Tentar buscar do servidor
        const response = await fetch(APP_PATH + 'api/check-updates');
        if (response.ok) {
            const data = await response.json();
            if (data.notifications && data.notifications.length > 0) {
                console.log('[SW] ' + data.notifications.length + ' notificacoes recebidas');
                // Processar notificacoes...
            }
        }
    } catch (error) {
        console.log('[SW] Offline ou erro na sincronizacao:', error);
    }
}

// ============================================
// 9. MENSAGENS DO APP
// ============================================
self.addEventListener('message', function(event) {
    console.log('[SW] Mensagem recebida no Service Worker:', event.data);
    
    switch(event.data.type) {
        case 'GET_SUBSCRIPTION':
            self.registration.pushManager.getSubscription()
                .then(function(subscription) {
                    event.ports[0].postMessage({
                        type: 'SUBSCRIPTION_INFO',
                        subscription: subscription ? subscription.toJSON() : null
                    });
                });
            break;
            
        case 'SEND_TEST_NOTIFICATION':
            self.registration.showNotification('Teste de Notificacao', {
                body: 'Esta e uma notificacao de teste do sistema',
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
                    body: event.data.data.body || 'Nova atualizacao',
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

console.log('[SW] Service Worker de notificacoes carregado com sucesso!');
