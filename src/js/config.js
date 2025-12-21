// src/js/config.js
/**
 * CONFIGURAÇÕES CENTRALIZADAS DO SISTEMA
 * 
 * Todas as URLs, IDs e configurações em um só lugar
 */

const CONFIG = {
    // BACKEND PRINCIPAL (URL QUE JÁ ESTÁ FUNCIONANDO)
    BACKEND_URL: 'https://script.google.com/macros/s/AKfycbwpwemYlgy4jCJTaginH21BjPUntVXNDNiy41wGZNWtCZ_ol8f6l046Qe7e7PjzneOe/exec',
    
    // BACKEND ALTERNATIVO (se houver)
    BACKEND_URL_ALT: 'https://script.google.com/macros/s/AKfycbw1h6yYwK4RR5wK0SkFzDHEl2UwF23WRFyJqJwYHheN7Rlcq9IBSerKgrYOCuC3OXw/exec',
    
    // IDs DAS PLANILHAS (do seu backend)
    PLANILHA_DEMANDAS_ID: "1rIjesk8iw9qTvpUbPcuG_hw9bRjdW_Wq7S5Rabg2Ig",
    PLANILHA_USUARIOS_ID: "1ZOkddMUUDVKxdzmHzyM51qeScRIs194WH9eZu89VQXw",
    PLANILHA_NOTIFICACOES_ID: "1mzqll7J7p6vG6lCLo6NPRw9jzU_4cRVfe0DnVg-xE2A",
    
    // CONFIGURAÇÕES DE ESCOLAS
    ESCOLAS: [
        { 
            nome: "EEEFM Pedra Azul", 
            email: "escolapedreiras@sedu.es.gov.br",
            contato: "eder.ramos@educador.edu.es.gov.br"
        },
        { 
            nome: "EEEFM Fioravante Caliman", 
            email: "escolafioravante@sedu.es.gov.br",
            contato: "teste@testesedu.es.gov.br"
        },
        { 
            nome: "EEEFM Alto Rio Possmoser", 
            email: "escolapossmoser@sedu.es.gov.br",
            contato: "teste@teste1sedu.es.gov.br"
        }
    ],
    
    // CONFIGURAÇÕES DE SISTEMA
    TIMEOUT_REQUISICOES: 15000, // 15 segundos
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas
    MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
    
    // ENDPOINTS DISPONÍVEIS
    ENDPOINTS: {
        // Autenticação
        VALIDAR_LOGIN: 'validarLogin',
        SALVAR_USUARIO: 'salvarUsuario',
        SOLICITAR_ACESSO: 'solicitarAcesso',
        
        // Demandas
        LISTAR_DEMANDAS: 'listarDemandas',
        SALVAR_DEMANDA: 'salvarDemanda',
        ATUALIZAR_DEMANDA: 'atualizarDemanda',
        EXCLUIR_DEMANDA: 'excluirDemanda',
        
        // Notificações
        SALVAR_SUBSCRIPTION: 'salvarSubscription',
        ENVIAR_NOTIFICACAO: 'enviarNotificacao',
        
        // E-mail
        ENVIAR_EMAIL: 'enviarEmailDemanda',
        
        // Upload
        UPLOAD_ARQUIVO: 'uploadArquivo',
        
        // Sistema
        INFO_SISTEMA: 'info',
        TESTAR_CONEXAO: 'testarConexao'
    },
    
    // FIREBASE / NOTIFICAÇÕES
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyAWXeUTgV8IFgATyJc8KbcyaJMWzw3ezwI",
        authDomain: "sistema-demandas-escolares.firebaseapp.com",
        projectId: "sistema-demandas-escolares",
        storageBucket: "sistema-demandas-escolares.firebasestorage.app",
        messagingSenderId: "516206052942",
        appId: "1:516206052942:web:4100fce11625a04c41e57c"
    },
    
    // VERSIONAMENTO
    VERSAO: '4.0',
    DATA_ATUALIZACAO: '2025-12-21',
    
    // LOGGING
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug' // debug, info, warn, error
};

// Exportar configurações para uso global
window.CONFIG = CONFIG;

// Função para verificar configurações
function verificarConfiguracoes() {
    console.log('🔧 VERIFICAÇÃO DE CONFIGURAÇÕES');
    console.log('='.repeat(50));
    
    console.log('📋 Sistema:', CONFIG.VERSAO);
    console.log('📅 Atualização:', CONFIG.DATA_ATUALIZACAO);
    console.log('🔗 URL Backend:', CONFIG.BACKEND_URL.substring(0, 50) + '...');
    console.log('🏫 Escolas:', CONFIG.ESCOLAS.length);
    console.log('⏱️ Timeout:', CONFIG.TIMEOUT_REQUISICOES + 'ms');
    console.log('💾 Upload máximo:', (CONFIG.MAX_UPLOAD_SIZE / (1024*1024)) + 'MB');
    
    // Testar conexão com backend
    console.log('\n🔗 Testando conexão com backend...');
    
    fetch(CONFIG.BACKEND_URL, { mode: 'no-cors' })
        .then(response => {
            console.log('✅ Backend responde!');
            console.log('📊 Status:', response.status);
        })
        .catch(error => {
            console.error('❌ Erro na conexão:', error.message);
        });
    
    console.log('\n✅ Configurações carregadas!');
}

// Executar verificação quando carregar
if (CONFIG.DEBUG_MODE) {
    document.addEventListener('DOMContentLoaded', verificarConfiguracoes);
}

console.log('⚙️ Configurações do sistema carregadas!');
