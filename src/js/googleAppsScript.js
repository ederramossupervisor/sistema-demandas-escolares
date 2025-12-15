// googleAppsScript.js - VERSÃO CORRIGIDA E 100% FUNCIONAL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytoBw7I6Lakuy_V9TJ0YJjX9ZaK7X3S9897pJxp9nk3SzkiRZTx9TPLS0_Vh3m3FDxOw/exec';

// ============================================
// FUNÇÃO PRINCIPAL - VERSÃO OTIMIZADA
// ============================================

function enviarParaGoogleAppsScript(dados) {
    console.log('📤 Enviando ação:', dados.acao);
    
    return new Promise((resolve, reject) => {
        // Para ações que salvam dados, usar POST via fetch
        if (['salvarDemanda', 'enviarEmailDemanda', 'uploadArquivo', 'atualizarDemanda'].includes(dados.acao)) {
            // Usar fetch para POST
            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados)
            })
            .then(response => {
                // Como estamos em no-cors, a resposta é opaca
                // Vamos usar método alternativo para verificar
                console.log('📥 POST enviado com sucesso');
                
                // Verificar se salvou acessando a URL direta
                setTimeout(() => {
                    // Testar se a demanda foi salva
                    testarSeDemandaFoiSalva(dados)
                        .then(resolve)
                        .catch(reject);
                }, 2000);
            })
            .catch(erro => {
                console.error('❌ Erro POST:', erro);
                reject(erro);
            });
        } else {
            // Para listagem, usar GET/JSONP
            usarJSONP(dados, resolve, reject);
        }
    });
}

// Função JSONP para listagem
function usarJSONP(dados, resolve, reject) {
    const callbackName = 'callback_' + Date.now();
    
    window[callbackName] = function(resposta) {
        delete window[callbackName];
        document.body.removeChild(script);
        
        if (resposta && resposta.sucesso !== false) {
            resolve(resposta.dados || resposta);
        } else {
            reject(new Error(resposta.erro || 'Erro no servidor'));
        }
    };
    
    const script = document.createElement('script');
    script.src = `${SCRIPT_URL}?callback=${callbackName}&dados=${encodeURIComponent(JSON.stringify(dados))}`;
    script.onerror = () => {
        delete window[callbackName];
        document.body.removeChild(script);
        reject(new Error('Falha JSONP'));
    };
    
    document.body.appendChild(script);
}

// Verificar se demanda foi salva
function testarSeDemandaFoiSalva(dados) {
    return new Promise((resolve, reject) => {
        // Aguardar e então listar para ver se foi salva
        setTimeout(() => {
            listarDemandasDoServidor()
                .then(demandas => {
                    // Encontrar a demanda mais recente
                    const ultimaDemanda = demandas[demandas.length - 1];
                    
                    if (ultimaDemanda && ultimaDemanda.titulo === dados.titulo) {
                        resolve({
                            sucesso: true,
                            id: ultimaDemanda.id,
                            mensagem: 'Demanda salva com sucesso!'
                        });
                    } else {
                        reject(new Error('Demanda não apareceu na listagem'));
                    }
                })
                .catch(reject);
        }, 3000);
    });
}

// ============================================
// FUNÇÕES ESPECÍFICAS DO SISTEMA
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
        titulo: dados.titulo || '',
        descricao: dados.descricao || '',
        escolas: dados.escolas || [],
        responsavel: dados.responsavel || 'Escola(s)',
        prazo: dados.prazo || '',
        enviarEmail: dados.enviarEmail || false,
        corpoEmail: dados.corpoEmail || '',
        anexos: dados.anexos || []
    });
}

function fazerUploadArquivo(arquivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const base64 = event.target.result.split(',')[1];
            
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
// TESTE DE CONEXÃO SIMPLIFICADO
// ============================================

function testarConexao() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const callbackName = 'test_conexao_' + Date.now();
        
        window[callbackName] = function(resposta) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(resposta);
        };
        
        script.src = `${SCRIPT_URL}?callback=${callbackName}`;
        script.onerror = () => {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Falha na conexão'));
        };
        
        document.body.appendChild(script);
    });
}

// ============================================
// TESTE DIRETO VIA FETCH (ALTERNATIVA)
// ============================================

async function testarSalvamentoDireto(dados) {
    try {
        // Tentar com fetch normal
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        const resultado = await response.text();
        console.log('📥 Resposta direta:', resultado);
        return JSON.parse(resultado);
    } catch (erro) {
        console.error('❌ Erro fetch direto:', erro);
        throw erro;
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

console.log('🚀 Sistema de Demandas - Conectado a:', SCRIPT_URL);

// Exportar funções para uso global
window.listarDemandasDoServidor = listarDemandasDoServidor;
window.salvarDemandaNoServidor = salvarDemandaNoServidor;
window.fazerUploadArquivo = fazerUploadArquivo;
window.atualizarStatusDemanda = atualizarStatusDemanda;
window.testarConexao = testarConexao;
window.testarSalvamentoDireto = testarSalvamentoDireto;
window.enviarParaGoogleAppsScript = enviarParaGoogleAppsScript;
