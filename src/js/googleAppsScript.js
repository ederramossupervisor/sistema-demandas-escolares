// ============================================
// SISTEMA DE GESTÃO DE DEMANDAS - SUPERVIÃO ESCOLAR
// Arquivo: googleAppsScript.js
// Comunicação com o backend Google Apps Script
// ============================================

// ⚠️⚠️⚠️ URL DO SEU GOOGLE APPS SCRIPT ⚠️⚠️⚠️
// COLE AQUI A URL QUE VOCÊ ME ENVIOU:
const URL_DO_SEU_SCRIPT = 'https://script.google.com/macros/s/AKfycbzi9v245GkVbRcav6a-_VehDx9F94ig8_OhKCdq3e50uUAOLCxCzApL7pdWSug6ni_haQ/exec';

// ============================================
// FUNÇÕES PRINCIPAIS DE COMUNICAÇÃO
// ============================================

/**
 * Envia uma requisição para o Google Apps Script
 */
async function enviarParaGoogleAppsScript(dados) {
    try {
        console.log('Enviando para Google Apps Script:', dados.acao);
        
        const resposta = await fetch(URL_DO_SEU_SCRIPT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados)
        });
        
        const resultado = await resposta.json();
        console.log('Resposta do servidor:', resultado);
        
        if (!resultado.sucesso) {
            throw new Error(resultado.erro || 'Erro desconhecido no servidor');
        }
        
        return resultado.dados;
        
    } catch (erro) {
        console.error('Erro na comunicação com Google Apps Script:', erro);
        throw new Error(`Falha na comunicação: ${erro.message}`);
    }
}

/**
 * Testa a conexão com o servidor
 */
async function testarConexao() {
    try {
        console.log('Testando conexão com servidor...');
        
        const resposta = await fetch(URL_DO_SEU_SCRIPT, {
            method: 'GET'
        });
        
        const resultado = await resposta.json();
        console.log('Conexão OK:', resultado);
        
        return {
            sucesso: true,
            mensagem: 'Conexão estabelecida com sucesso!',
            dados: resultado
        };
        
    } catch (erro) {
        console.error('Erro ao testar conexão:', erro);
        return {
            sucesso: false,
            mensagem: 'Não foi possível conectar ao servidor',
            erro: erro.message
        };
    }
}

// ============================================
// FUNÇÕES ESPECÍFICAS DO SISTEMA
// ============================================

/**
 * Lista todas as demandas do servidor
 */
async function listarDemandasDoServidor(filtros = {}) {
    return await enviarParaGoogleAppsScript({
        acao: 'listarDemandas',
        filtros: filtros
    });
}

/**
 * Salva uma nova demanda no servidor
 */
async function salvarDemandaNoServidor(dados) {
    return await enviarParaGoogleAppsScript({
        acao: 'salvarDemanda',
        ...dados
    });
}

/**
 * Envia e-mail sobre uma demanda
 */
async function enviarEmailDemanda(dados) {
    return await enviarParaGoogleAppsScript({
        acao: 'enviarEmailDemanda',
        ...dados
    });
}

/**
 * Faz upload de um arquivo para o Google Drive
 */
async function fazerUploadArquivo(arquivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                // Converter para base64
                const base64Data = e.target.result.split(',')[1];
                
                const resultado = await enviarParaGoogleAppsScript({
                    acao: 'uploadArquivo',
                    arquivoBase64: base64Data,
                    nomeArquivo: arquivo.name
                });
                
                resolve(resultado);
            } catch (erro) {
                reject(erro);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Erro ao ler arquivo'));
        };
        
        reader.readAsDataURL(arquivo);
    });
}

/**
 * Atualiza o status de uma demanda
 */
async function atualizarStatusDemanda(id, novoStatus) {
    return await enviarParaGoogleAppsScript({
        acao: 'atualizarDemanda',
        id: id,
        status: novoStatus,
        alteracao: `Status alterado para: ${novoStatus}`
    });
}

// ============================================
// INICIALIZAÇÃO E CONFIGURAÇÃO
// ============================================

/**
 * Inicializa o sistema testando a conexão
 */
async function inicializarSistema() {
    console.log('Inicializando sistema...');
    
    // Testar conexão
    const testeConexao = await testarConexao();
    
    if (!testeConexao.sucesso) {
        console.warn('Aviso: Conexão com servidor falhou. Algumas funcionalidades podem não funcionar.');
        console.warn('Detalhes:', testeConexao.erro);
        
        // Mostrar aviso ao usuário
        if (typeof mostrarToast === 'function') {
            mostrarToast('Aviso de Conexão', 
                'O sistema está funcionando localmente, mas não conseguiu conectar ao servidor. Verifique sua conexão com a internet.',
                'warning');
        }
    } else {
        console.log('✅ Sistema inicializado com sucesso!');
        console.log('📡 Servidor:', testeConexao.dados);
    }
    
    return testeConexao;
}

// Inicializar automaticamente quando o script carregar
document.addEventListener('DOMContentLoaded', async function() {
    // Pequeno delay para evitar conflitos com outros scripts
    setTimeout(async () => {
        await inicializarSistema();
    }, 1000);
});

// Exportar funções para uso global
window.listarDemandasDoServidor = listarDemandasDoServidor;
window.salvarDemandaNoServidor = salvarDemandaNoServidor;
window.enviarEmailDemanda = enviarEmailDemanda;
window.fazerUploadArquivo = fazerUploadArquivo;
window.atualizarStatusDemanda = atualizarStatusDemanda;
window.testarConexao = testarConexao;
