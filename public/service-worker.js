// ============================================
// SERVICE WORKER DO SISTEMA DE DEMANDAS
// Permite funcionamento offline e instalação como PWA
// ============================================

const CACHE_NAME = 'sistema-demandas-v1.0';
const CACHE_URLS = [
  '/',
  '/index.html',
  '/src/css/style.css',
  '/src/js/app.js',
  '/src/js/googleSheets.js',
  '/src/js/googleAppsScript.js',
  '/public/manifest.json',
  '/public/icons/192x192.png',
  '/public/icons/512x512.png'
];

// ============================================
// 1. INSTALAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  
  // Forçar atualização imediata
  self.skipWaiting();
  
  // Criar cache com arquivos essenciais
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando arquivos...');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Instalação completa!');
      })
      .catch(error => {
        console.error('Service Worker: Erro na instalação:', error);
      })
  );
});

// ============================================
// 2. ATIVAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  
  // Limpar caches antigos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Ativação completa!');
      return self.clients.claim();
    })
  );
});

// ============================================
// 3. INTERCEPTAÇÃO DE REQUISIÇÕES
// ============================================
self.addEventListener('fetch', event => {
  // Ignorar requisições para o Google Apps Script (sempre online)
  if (event.request.url.includes('script.google.com')) {
    return fetch(event.request);
  }
  
  // Ignorar requisições POST (sempre online)
  if (event.request.method !== 'GET') {
    return fetch(event.request);
  }
  
  // Para outras requisições: estratégia Cache First
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Se tem no cache, retorna do cache
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Se não tem, busca na rede
        return fetch(event.request)
          .then(networkResponse => {
            // Se a requisição foi bem-sucedida, adiciona ao cache
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(error => {
            // Se offline e não tem no cache, retorna página offline
            console.log('Service Worker: Offline -', event.request.url);
            
            // Se é uma página HTML, retorna a página principal do cache
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Para outros recursos, pode retornar um fallback
            return new Response('Conteúdo não disponível offline', {
              status: 503,
              statusText: 'Serviço Indisponível',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// ============================================
// 4. SINCRONIZAÇÃO EM BACKGROUND
// ============================================
self.addEventListener('sync', event => {
  console.log('Service Worker: Sincronização -', event.tag);
  
  if (event.tag === 'sync-demandas') {
    event.waitUntil(sincronizarDemandas());
  }
});

// Função para sincronizar demandas offline
function sincronizarDemandas() {
  console.log('Sincronizando demandas pendentes...');
  
  // Aqui você implementaria a lógica para sincronizar
  // dados salvos localmente quando offline
  
  return Promise.resolve();
}

// ============================================
// 5. NOTIFICAÇÕES PUSH
// ============================================
self.addEventListener('push', event => {
  console.log('Service Worker: Notificação push recebida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização no sistema',
    icon: '/public/icons/192x192.png',
    badge: '/public/icons/96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'abrir',
        title: 'Abrir Sistema',
        icon: '/public/icons/96x96.png'
      },
      {
        action: 'fechar',
        title: 'Fechar',
        icon: '/public/icons/96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sistema de Demandas', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notificação clicada');
  
  event.notification.close();
  
  if (event.action === 'abrir') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
