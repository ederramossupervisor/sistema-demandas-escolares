// ============================================
// SERVICE WORKER DE NOTIFICACOES PUSH - FIREBASE FCM V1
// sw-notificacoes.js - VERSÃO FIREBASE
// ============================================

const APP_PATH = '/sistema-demandas-escolares/';

// ============================================
// 1. IMPORTAR FIREBASE NO SERVICE WORKER
// ============================================

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuração do Firebase (USE SEUS DADOS REAIS)
// Configuração do Firebase
// Passe o objeto diretamente sem atribuir a uma variável
firebase.initializeApp({
    apiKey: "AIzaSyA4FdLA3O1EDDpVtvlr9OTW1_D0J1zDV_g",
    authDomain: "sistema-de-demandas-escolares.firebaseapp.com",
    projectId: "sistema-de-demandas-escolares",
    storageBucket: "sistema-de-demandas-escolares.firebasestorage.app",
    messagingSenderId: "655714446030",
    appId: "1:655714446030:web:5e7ecb83df5d7c21c2fe9f"
});

const messaging = firebase.messaging();

// ============================================
// 2. HANDLER DO FIREBASE PARA BACKGROUND MESSAGES
// ============================================

messaging.onBackgroundMessage(function(payload) {
    console.log('[SW] Firebase: Mensagem recebida em background:', payload);
    
    const notificationTitle = payload.notification?.title || 'Nova Demanda';
    const notificationOptions = {
        body: payload.notification?.body || 'Você tem uma nova demanda',
        icon: APP_PATH + 'public/icons/192x192.png',
        badge: APP_PATH + 'public/icons/96x96.png',
        data: payload.data || {},
        vibrate: [200, 100, 200],
        tag: payload.data?.tag || 'firebase-notification',
        requireInteraction: payload.data?.important || false,
        actions: [
            {
                action: 'open',
                title: '📋 Abrir Sistema'
            }
        ]
    };
    
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ============================================
// 3. INSTALACAO E ATIVACAO
// ============================================

self.addEventListener('install', function(event) {
    console.log('[SW] Service Worker: Instalando...');
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('[SW] Service Worker: Ativado!');
    event.waitUntil(self.clients.claim());
});

// ============================================
// 4. NOTIFICACOES PUSH (FALLBACK)
// ============================================

self.addEventListener('push', function(event) {
    console.log('[SW] Push recebido');
    
    let notificationData = {
        title: 'Sistema de Demandas',
        body: 'Nova atualizacao disponivel',
        icon: APP_PATH + 'public/icons/192x192.png',
        badge: APP_PATH + 'public/icons/96x96.png',
        data: {
            url: APP_PATH + 'index.html',
            timestamp: Date.now()
        }
    };
    
    try {
        if (event.data) {
            const data = event.data.json();
            console.log('[SW] Dados do push:', data);
            
            // Se for do Firebase, já foi tratado pelo onBackgroundMessage
            if (data.from === 'Firebase') {
                console.log('[SW] Push do Firebase, ignorando duplicata');
                return;
            }
            
            notificationData = {
                title: data.title || 'Sistema de Demandas',
                body: data.body || 'Nova demanda',
                icon: data.icon || APP_PATH + 'public/icons/192x192.png',
                badge: APP_PATH + 'public/icons/96x96.png',
                vibrate: [200, 100, 200],
                data: {
                    url: data.url || APP_PATH + 'index.html',
                    demandaId: data.demandaId,
                    type: data.type || 'push',
                    timestamp: Date.now()
                },
                actions: [
                    {
                        action: 'open',
                        title: 'Abrir'
                    },
                    {
                        action: 'dismiss',
                        title: 'Fechar'
                    }
                ]
            };
        }
    } catch (error) {
        console.warn('[SW] Erro ao parsear dados:', error);
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// ============================================
// 5. CLIQUE EM NOTIFICACAO
// ============================================

self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notificacao clicada');
    
    event.notification.close();
    
    const data = event.notification.data || {};
    let url = data.url || APP_PATH + 'index.html';
    
    // Adicionar parametros se houver
    if (data.demandaId) {
        url += '?demanda=' + encodeURIComponent(data.demandaId);
    }
    
    // Verificar acao clicada
    if (event.action === 'open' || event.action === 'ver') {
        event.waitUntil(
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then(function(clientList) {
                // Procurar janela aberta
                for (let client of clientList) {
                    if (client.url.includes(APP_PATH) && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Abrir nova janela
                return clients.openWindow(url);
            })
        );
    } else {
        // Clicou na notificacao
        event.waitUntil(clients.openWindow(url));
    }
});

// ============================================
// 6. MENSAGENS DO APP
// ============================================

self.addEventListener('message', function(event) {
    console.log('[SW] Mensagem do app:', event.data);
    
    switch(event.data.type) {
        case 'GET_FCM_TOKEN':
            // Obter token FCM atual
            messaging.getToken({
                vapidKey: 'BMQIERFqdSFhiX319L_Wfa176UU8nzop-9-SB4pPxowM6yBo9gIrnU5-PtsENsc_XWXZJTQHCgMeYtiztUE9C3Q',
                serviceWorkerRegistration: self.registration
            }).then(function(currentToken) {
                event.ports[0].postMessage({
                    type: 'FCM_TOKEN',
                    token: currentToken
                });
            }).catch(function(err) {
                console.error('[SW] Erro ao obter token:', err);
                event.ports[0].postMessage({
                    type: 'FCM_TOKEN_ERROR',
                    error: err.message
                });
            });
            break;
            
        case 'TEST_NOTIFICATION':
            self.registration.showNotification('Teste do Sistema', {
                body: 'Notificação de teste funcionando!',
                icon: APP_PATH + 'public/icons/192x192.png',
                badge: APP_PATH + 'public/icons/96x96.png',
                vibrate: [200, 100, 200],
                data: {
                    url: APP_PATH + 'index.html',
                    type: 'teste'
                }
            });
            break;
    }
});

console.log('[SW] Service Worker com Firebase carregado!');
