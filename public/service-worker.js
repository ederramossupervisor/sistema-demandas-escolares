// ============================================
// SERVICE WORKER DO SISTEMA DE DEMANDAS
// VERSÃO CORRIGIDA PARA GITHUB PAGES
// ============================================

const APP_PATH = '/sistema-demandas-escolares/'; // 🔥 ADICIONE ESTA LINHA
const CACHE_NAME = 'sistema-demandas-v2.0';
const CACHE_URLS = [
  APP_PATH, // 🔥 CORRIGIDO
  APP_PATH + 'index.html', // 🔥 CORRIGIDO
  APP_PATH + 'src/css/style.css',
  APP_PATH + 'src/js/app.js',
  APP_PATH + 'src/js/googleSheets.js',
  APP_PATH + 'src/js/googleAppsScript.js',
  APP_PATH + 'public/manifest.json',
  APP_PATH + 'public/icons/192x192.png',
  APP_PATH + 'public/icons/512x512.png',
  
  // Recursos externos
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
];

// ============================================
// 1. INSTALAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando para', APP_PATH);
  
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
      
      // Tomar controle de todas as abas abertas
      return self.clients.claim();
    })
    .then(() => {
      // Notificar todos os clients (abas) que o SW está ativo
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            message: 'Service Worker ativado com sucesso!',
            path: APP_PATH
          });
        });
      });
    })
  );
});

// ============================================
// 3. INTERCEPTAÇÃO DE REQUISIÇÕES
// ============================================
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // 🔥 CORREÇÃO: Só processa requisições do nosso app
  if (!requestUrl.href.includes('ederramossupervisor.github.io/sistema-demandas-escolares')) {
    return;
  }
  
  // Ignorar requisições para o Google Apps Script (sempre online)
  if (event.request.url.includes('script.google.com')) {
    return fetch(event.request);
  }
  
  // Ignorar requisições POST (sempre online)
  if (event.request.method !== 'GET') {
    return fetch(event.request);
  }
  
  console.log('Service Worker: Processando requisição:', event.request.url);
  
  // Para outras requisições: estratégia Network First
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Se a requisição foi bem-sucedida, adiciona ao cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
              console.log('Service Worker: Adicionado ao cache:', event.request.url);
            });
        }
        return networkResponse;
      })
      .catch(error => {
        // Se offline, tenta do cache
        console.log('Service Worker: Offline, buscando do cache...');
        
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('Service Worker: Retornando do cache:', event.request.url);
              return cachedResponse;
            }
            
            // Se é uma página HTML e não tem no cache
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(APP_PATH + 'index.html')
                .then(indexPage => {
                  if (indexPage) {
                    console.log('Service Worker: Retornando página principal');
                    return indexPage;
                  }
                  return new Response(
                    '<h1>Sistema de Demandas</h1><p>Você está offline. Conecte-se à internet para usar o sistema.</p>',
                    {
                      headers: { 'Content-Type': 'text/html' }
                    }
                  );
                });
            }
            
            // Fallback para outros recursos
            return new Response('Recurso não disponível offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// ============================================
// 4. COMUNICAÇÃO COM A APLICAÇÃO
// ============================================
self.addEventListener('message', event => {
  console.log('Service Worker: Mensagem recebida', event.data);
  
  if (event.data.type === 'GET_CACHE_STATUS') {
    event.ports[0].postMessage({
      cacheName: CACHE_NAME,
      appPath: APP_PATH,
      status: 'active'
    });
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME)
      .then(() => {
        event.ports[0].postMessage({ success: true });
      });
  }
});

// ============================================
// 5. SINCRONIZAÇÃO EM BACKGROUND
// ============================================
self.addEventListener('sync', event => {
  console.log('Service Worker: Sincronização -', event.tag);
  
  if (event.tag === 'sync-demandas') {
    event.waitUntil(sincronizarDemandas());
  }
});

function sincronizarDemandas() {
  console.log('Sincronizando demandas pendentes...');
  return Promise.resolve();
}

// ============================================
// 6. NOTIFICAÇÕES PUSH (OPCIONAL)
// ============================================
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Nova atualização no sistema de demandas',
    icon: APP_PATH + 'public/icons/192x192.png',
    badge: APP_PATH + 'public/icons/96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || APP_PATH,
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir Sistema'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Sistema de Demandas', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || APP_PATH)
    );
  }
});

console.log('Service Worker carregado para:', APP_PATH);
