// ============================================
// SISTEMA DE GESTÃO DE DEMANDAS
// COM JSONP PARA CONTOURNAR CORS
// ============================================

const URL_DO_SEU_SCRIPT = 'https://script.google.com/macros/s/AKfycbxoE4-7VuWQPS2EgXPiyeg1ojT4uCLJaJcX8iGh9jVEwH4esSRF_fFFWH32uOTnItpl1g/exec';

// ============================================
// FUNÇÃO PRINCIPAL JSONP
// ============================================

function enviarParaGoogleAppsScript(dados) {
    return new Promise((resolve, reject) => {
        const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2);
        
        // Criar script
        const script = document.createElement('script');
        
        // Função de callback
        window[callbackName] = function(response) {
            // Limpar
            delete window[callbackName];
            document.body.removeChild(script);
            
            if (response && response.sucesso) {
                resolve(response.dados || response);
            } else {
                reject(new Error(response.erro || 'Erro no servidor'));
            }
        };
        
        // Preparar URL JSONP
        let url = URL_DO_SEU_SCRIPT;
        url += '?callback=' + encodeURIComponent(callbackName);
        url += '&dados=' + encodeURIComponent(JSON.stringify(dados));
        url += '&t=' + Date.now(); // Evitar cache
        
        script.src = url;
        script.onerror = () => {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Falha ao carregar script'));
        };
        
        // Timeout
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (script.parentNode) document.body.removeChild(script);
                reject(new Error('Timeout JSONP'));
            }
        }, 10000);
        
        // Adicionar script
        document.body.appendChild(script);
    });
}

// ============================================
// FUNÇÕES ESPECÍFICAS
// ============================================

function listarDemandasDoServidor(filtros = {}) {
    return enviarParaGoogleAppsScript({
        acao: 'listarDemandas',
        filtros: filtros
    });
}

function salvarDemandaNoServidor(dados) {
    return enviarParaGoogleAppsScript({
        acao: 'salvarDemanda',
        ...dados
    });
}

function enviarEmailDemanda(dados) {
    return enviarParaGoogleAppsScript({
        acao: 'enviarEmailDemanda',
        ...dados
    });
}

function fazerUploadArquivo(arquivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const base64 = e.target.result.split(',')[1];
            
            enviarParaGoogleAppsScript({
                acao: 'uploadArquivo',
                arquivoBase64: base64,
                nomeArquivo: arquivo.name
            })
            .then(resolve)
            .catch(reject);
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(arquivo);
    });
}

function atualizarStatusDemanda(id, novoStatus) {
    return enviarParaGoogleAppsScript({
        acao: 'atualizarDemanda',
        id: id,
        status: novoStatus,
        alteracao: `Status alterado para: ${novoStatus}`
    });
}

// ============================================
// TESTE DE CONEXÃO
// ============================================

function testarConexao() {
    return new Promise((resolve, reject) => {
        const callbackName = 'test_callback_' + Date.now();
        const script = document.createElement('script');
        
        window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };
        
        script.src = URL_DO_SEU_SCRIPT + '?callback=' + callbackName + '&t=' + Date.now();
        script.onerror = () => {
            delete window[callbackName];
            if (script.parentNode) document.body.removeChild(script);
            reject(new Error('Falha na conexão'));
        };
        
        document.body.appendChild(script);
    });
}

// ============================================
// INICIALIZAÇÃO
// ============================================

async function inicializarSistema() {
    console.log('Inicializando sistema...');
    
    try {
        const resultado = await testarConexao();
        console.log('✅ Conexão estabelecida:', resultado);
        return { sucesso: true, dados: resultado };
    } catch (erro) {
        console.warn('⚠️ Conexão falhou, usando modo local:', erro.message);
        return { sucesso: false, erro: erro.message };
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', async function() {
    setTimeout(async () => {
        await inicializarSistema();
    }, 1000);
});

// Exportar
window.listarDemandasDoServidor = listarDemandasDoServidor;
window.salvarDemandaNoServidor = salvarDemandaNoServidor;
window.enviarEmailDemanda = enviarEmailDemanda;
window.fazerUploadArquivo = fazerUploadArquivo;
window.atualizarStatusDemanda = atualizarStatusDemanda;
window.testarConexao = testarConexao;
