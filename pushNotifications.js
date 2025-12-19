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
 * 🔥 OBTÉM TOKEN FCM DO FIREBASE MESSAGING
 * Tenta obter o token FCM do Firebase com fallback para Web Push
 * @returns {Promise<string|null>} Token FCM ou null se falhar
 */
async function getFCMToken() {
  console.log("🔥 Iniciando obtenção de token FCM...");
  
  try {
    // 1. VERIFICAR SE O FIREBASE ESTÁ DISPONÍVEL
    if (typeof firebase === 'undefined' || !firebase.messaging) {
      console.warn("⚠️ Firebase Messaging não disponível no navegador");
      throw new Error("Firebase não carregado");
    }
    
    // 2. OBTER INSTÂNCIA DO MESSAGING
    const messaging = firebase.messaging();
    
    // 3. VERIFICAR/OBTER PERMISSÃO PARA NOTIFICAÇÕES
    const permissaoAtual = Notification.permission;
    
    if (permissaoAtual === 'denied') {
      console.warn("❌ Permissão para notificações foi negada pelo usuário");
      throw new Error("Permissão para notificações negada");
    }
    
    if (permissaoAtual === 'default') {
      console.log("🔔 Solicitando permissão para notificações...");
      const novaPermissao = await Notification.requestPermission();
      
      if (novaPermissao !== 'granted') {
        console.warn("❌ Usuário não concedeu permissão para notificações");
        throw new Error("Permissão não concedida");
      }
      
      console.log("✅ Permissão para notificações concedida!");
    }
    
    // 4. REGISTRAR SERVICE WORKER ESPECÍFICO DO FIREBASE
    console.log("👷 Registrando Service Worker do Firebase...");
    
    // Certifique-se de que o caminho do service worker está correto
    const serviceWorkerPath = '/sistema-demandas-escolares/sw-notificacoes.js';
    
    let registration;
    try {
      registration = await navigator.serviceWorker.register(serviceWorkerPath, {
        scope: '/sistema-demandas-escolares/'
      });
      
      console.log("✅ Service Worker registrado com sucesso:", registration.scope);
      
      // Aguardar o service worker estar ativo
      await navigator.serviceWorker.ready;
      console.log("✅ Service Worker está pronto!");
      
    } catch (swError) {
      console.error("❌ Erro ao registrar Service Worker:", swError);
      throw new Error(`Falha no Service Worker: ${swError.message}`);
    }
    
    // 5. OBTER TOKEN FCM COM VAPID KEY
    console.log("🔐 Gerando token FCM...");
    
    // VAPID KEY do seu projeto Firebase (VERIFIQUE SE ESTÁ CORRETA!)
    const vapidKey = "BEOHDwWjTbmMFmT8RQl6T6CF4GPC9EjrEVuVkSaCgfgWg4cI68s6LRlIL196LCRjEWr6AEMMHhrjW4OXtrKwUsw";
    
    if (!vapidKey || vapidKey.length < 10) {
      throw new Error("VAPID Key inválida ou não configurada");
    }
    
    const fcmToken = await messaging.getToken({
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration
    });
    
    if (!fcmToken) {
      throw new Error("Firebase não retornou token FCM");
    }
    
    console.log("✅ TOKEN FCM OBTIDO COM SUCESSO!");
    console.log("📋 Token (primeiros 50 chars):", fcmToken.substring(0, 50) + "...");
    console.log("📏 Comprimento total:", fcmToken.length, "caracteres");
    
    // 6. ✅ SALVAR TOKEN NO SERVIDOR (APÓS OBTENÇÃO BEM-SUCEDIDA)
    await salvarTokenFCMNoServidor(fcmToken);
    
    // 7. CONFIGURAR LISTENERS PARA ATUALIZAÇÕES DO TOKEN
    configurarListenersFCM(messaging, fcmToken);
    
    return fcmToken;
    
  } catch (erro) {
    console.error("❌ FALHA AO OBTER TOKEN FCM:", erro);
    
    // 8. 🔄 FALLBACK: TENTAR WEB PUSH PADRÃO
    console.log("🔄 Tentando fallback para Web Push padrão...");
    
    try {
      const webPushToken = await getWebPushToken();
      if (webPushToken) {
        console.log("✅ Token Web Push obtido como fallback");
        return webPushToken;
      }
    } catch (webPushError) {
      console.error("❌ Fallback Web Push também falhou:", webPushError);
    }
    
    return null;
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * 💾 SALVA TOKEN FCM NO SERVIDOR
 * @param {string} fcmToken - Token FCM a ser salvo
 */
async function salvarTokenFCMNoServidor(fcmToken) {
  try {
    console.log("💾 Salvando token FCM no servidor...");
    
    // Obter dados do usuário logado (você precisa implementar esta função)
    const usuarioLogado = obterUsuarioLogado();
    
    if (!usuarioLogado || !usuarioLogado.email) {
      console.warn("⚠️ Usuário não logado, token não será salvo no servidor");
      return false;
    }
    
    const dados = {
      acao: "salvarSubscription",
      tipo: "firebase",
      fcmToken: fcmToken,
      usuario: {
        email: usuarioLogado.email,
        nome: usuarioLogado.nome || "Usuário",
        departamento: usuarioLogado.departamento || "Não definido"
      },
      timestamp: new Date().toISOString()
    };
    
    // Usar sua função existente para chamar o servidor
    const resposta = await fazerRequisicaoServidor(dados);
    
    if (resposta && resposta.sucesso) {
      console.log("✅ Token FCM salvo no servidor com sucesso!");
      return true;
    } else {
      console.warn("⚠️ Não foi possível salvar token no servidor:", resposta?.erro || "Erro desconhecido");
      return false;
    }
    
  } catch (erro) {
    console.error("❌ Erro ao salvar token no servidor:", erro);
    return false;
  }
}

/**
 * 🔄 OBTÉM TOKEN WEB PUSH (FALLBACK)
 * @returns {Promise<string|null>} Endpoint Web Push ou null
 */
async function getWebPushToken() {
  try {
    console.log("🌐 Tentando Web Push padrão...");
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error("Web Push não suportado pelo navegador");
    }
    
    // Registrar service worker
    const registration = await navigator.serviceWorker.register('/sistema-demandas-escolares/sw-notificacoes.js', {
      scope: '/sistema-demandas-escolares/'
    });
    
    // Obter subscription existente
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log("🔔 Criando nova subscription Web Push...");
      
      // VAPID Key pública (mesma do Firebase)
      const vapidKey = "BEOHDwWjTbmMFmT8RQl6T6CF4GPC9EjrEVuVkSaCgfgWg4cI68s6LRlIL196LCRjEWr6AEMMHhrjW4OXtrKwUsw";
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      
      console.log("✅ Nova subscription Web Push criada");
    }
    
    const endpoint = subscription.endpoint;
    console.log("✅ Endpoint Web Push:", endpoint);
    
    // Salvar no servidor como Web Push
    await salvarWebPushNoServidor(subscription);
    
    return endpoint;
    
  } catch (erro) {
    console.error("❌ Erro no Web Push:", erro);
    throw erro;
  }
}

/**
 * 🔧 CONFIGURA LISTENERS PARA ATUALIZAÇÕES DO TOKEN FCM
 * @param {Object} messaging - Instância do Firebase Messaging
 * @param {string} currentToken - Token FCM atual
 */
function configurarListenersFCM(messaging, currentToken) {
  try {
    // Listener para quando o token for atualizado (ex: refresh)
    messaging.onTokenRefresh(async () => {
      console.log("🔄 Token FCM está sendo atualizado...");
      
      try {
        const newToken = await messaging.getToken();
        console.log("✅ Novo token FCM gerado:", newToken.substring(0, 50) + "...");
        
        // Salvar novo token no servidor
        await salvarTokenFCMNoServidor(newToken);
        
        console.log("🔄 Token atualizado com sucesso no servidor");
      } catch (refreshError) {
        console.error("❌ Erro ao atualizar token FCM:", refreshError);
      }
    });
    
    // Listener para mensagens em foreground
    messaging.onMessage((payload) => {
      console.log("📨 Mensagem FCM recebida em foreground:", payload);
      
      // Mostrar notificação mesmo estando na aplicação
      if (payload.notification) {
        const { title, body } = payload.notification;
        
        // Você pode mostrar uma notificação customizada no seu app
        mostrarNotificacaoApp(title, body, payload.data);
      }
    });
    
    console.log("✅ Listeners FCM configurados com sucesso");
    
  } catch (listenerError) {
    console.error("❌ Erro ao configurar listeners FCM:", listenerError);
  }
}

/**
 * 🔧 CONVERTE CHAVE VAPID BASE64 PARA UINT8ARRAY
 * @param {string} base64String - Chave pública VAPID em base64
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  if (!base64String) {
    throw new Error("String base64 vazia");
  }
  
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * 👤 OBTÉM USUÁRIO LOGADO (VOCÊ PRECISA IMPLEMENTAR)
 * @returns {Object|null} Dados do usuário logado
 */
function obterUsuarioLogado() {
  // Esta função deve retornar os dados do usuário logado
  // Exemplo de implementação:
  
  // 1. Verificar localStorage/sessionStorage
  try {
    const usuarioSalvo = localStorage.getItem('usuario_demandas');
    if (usuarioSalvo) {
      return JSON.parse(usuarioSalvo);
    }
  } catch (e) {
    console.warn("Não foi possível ler usuário do localStorage:", e);
  }
  
  // 2. Verificar variável global do seu app
  if (window.usuarioAtual && window.usuarioAtual.email) {
    return window.usuarioAtual;
  }
  
  // 3. Retornar dados padrão se não encontrar
  return {
    email: "usuario@exemplo.com",
    nome: "Usuário Convidado",
    departamento: "Não definido"
  };
}

/**
 * 📨 FUNÇÃO PARA MOSTRAR NOTIFICAÇÃO NO APP
 * @param {string} title - Título da notificação
 * @param {string} body - Corpo da notificação
 * @param {Object} data - Dados adicionais
 */
function mostrarNotificacaoApp(title, body, data) {
  // Implemente esta função para mostrar notificações dentro do seu app
  // Pode ser um toast, modal, ou atualização de interface
  
  console.log("📢 Mostrar notificação no app:", { title, body, data });
  
  // Exemplo simples com alerta (substitua por sua UI)
  if (window.showAppNotification) {
    window.showAppNotification(title, body, data);
  }
}

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================

/**
 * 🚀 INICIALIZA O SISTEMA DE NOTIFICAÇÕES
 * Esta função deve ser chamada quando o app carregar
 */
async function inicializarSistemaNotificacoes() {
  console.log("🚀 Inicializando sistema de notificações...");
  
  try {
    // Verificar se o navegador suporta notificações
    if (!('Notification' in window)) {
      console.warn("⚠️ Este navegador não suporta notificações");
      return null;
    }
    
    // Aguardar um pouco para o app carregar completamente
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se o usuário já está logado
    const usuario = obterUsuarioLogado();
    if (!usuario || !usuario.email) {
      console.log("⏳ Aguardando login do usuário para notificações...");
      return null;
    }
    
    // Tentar obter token FCM
    const token = await getFCMToken();
    
    if (token) {
      console.log("🎉 Sistema de notificações inicializado com sucesso!");
      console.log("📊 Token ativo:", token.substring(0, 30) + "...");
      
      // Armazenar token globalmente se necessário
      window.fcmTokenAtual = token;
      
      return token;
    } else {
      console.warn("⚠️ Sistema de notificações não pôde ser inicializado");
      return null;
    }
    
  } catch (erro) {
    console.error("❌ Erro na inicialização do sistema de notificações:", erro);
    return null;
  }
}

// ============================================
// FUNÇÃO PARA CHAMAR O SERVIDOR (ADAPTE À SUA IMPLEMENTAÇÃO)
// ============================================

/**
 * 📡 FAZ REQUISIÇÃO AO SERVIDOR GOOGLE APPS SCRIPT
 * @param {Object} dados - Dados a serem enviados
 * @returns {Promise<Object>} Resposta do servidor
 */
async function fazerRequisicaoServidor(dados) {
  // Esta é a função que você já usa para chamar seu backend
  // Mantenha sua implementação atual
  
  const url = "https://script.google.com/macros/s/AKfycbyDIgMxkwXcsOvEy68MblMq9MESAvkAu23u39J04ILefk3E3SuxWtJPOHz-94vhJtrNfA/exec";
  
  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados)
    });
    
    return await resposta.json();
  } catch (erro) {
    console.error("❌ Erro na requisição ao servidor:", erro);
    return { sucesso: false, erro: erro.message };
  }
}

/**
 * 💾 SALVA SUBSCRIPTION WEB PUSH NO SERVIDOR
 * @param {PushSubscription} subscription - Subscription Web Push
 */
async function salvarWebPushNoServidor(subscription) {
  try {
    const usuarioLogado = obterUsuarioLogado();
    
    const dados = {
      acao: "salvarSubscription",
      tipo: "webpush",
      subscription: subscription.toJSON(),
      usuario: usuarioLogado
    };
    
    const resposta = await fazerRequisicaoServidor(dados);
    
    if (resposta.sucesso) {
      console.log("✅ Web Push salvo no servidor");
    } else {
      console.warn("⚠️ Web Push não foi salvo:", resposta.erro);
    }
  } catch (erro) {
    console.error("❌ Erro ao salvar Web Push:", erro);
  }
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
