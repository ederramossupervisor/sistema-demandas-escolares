// Service Worker específico para notificações push
self.addEventListener('push', function(event) {
    console.log('📲 Service Worker: Notificação push recebida');
    
    if (!event.data) return;
    
    try {
        const data = event.data.json();
        
        const options = {
            body: data.body || 'Nova atualização no sistema',
            icon: '/sistema-demandas-escolares/public/icons/192x192.png',
            badge: '/sistema-demandas-escolares/public/icons/96x96.png',
            vibrate: [200, 100, 200],
            data: {
                url: data.url || '/sistema-demandas-escolares/',
                demandaId: data.demandaId,
                timestamp: Date.now()
            },
            actions: [
                {
                    action: 'ver',
                    title: '👁️ Ver Demanda'
                },
                {
                    action: 'fechar',
                    title: '✖️ Fechar'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'Sistema de Demandas', options)
        );
        
    } catch (error) {
        console.error('❌ Erro ao processar notificação push:', error);
    }
});

self.addEventListener('notificationclick', function(event) {
    console.log('🔔 Notificação clicada:', event.notification.data);
    
    event.notification.close();
    
    if (event.action === 'ver') {
        const url = event.notification.data.url;
        
        event.waitUntil(
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then(function(clientList) {
                // Verificar se já existe uma aba aberta
                for (const client of clientList) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Se não existir, abrir nova aba
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
        );
    }
});

self.addEventListener('pushsubscriptionchange', function(event) {
    console.log('🔄 Subscription de push alterada');
    
    event.waitUntil(
        self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('BKFl5Hc4UKk6gNm4t7wcCLnRIzYmW9TF8yOxqM0obajhIG_H0RRetGt2bT1qZoTIerYa4IVQE6Jb0D4hNRIM-Vs')
        })
        .then(function(newSubscription) {
            console.log('✅ Nova subscription criada:', newSubscription);
        })
        .catch(function(error) {
            console.error('❌ Erro ao criar nova subscription:', error);
        })
    );
});

function urlBase64ToUint8Array(base64String) {
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
}

console.log('✅ Service Worker de notificações carregado!');
