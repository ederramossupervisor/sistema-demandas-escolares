// googleAppsScript.js - VERSÃO DEFINITIVA CORRIGIDA
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw3FX285_JgX7S41xPQ_37P1P6B1R7AmK5EZgT9EVEwQr7j34gYQ55PP7aF0cKoLojn1A/exec';

// ============================================
// CONFIGURAÇÕES DE UPLOAD
// ============================================

const UPLOAD_CONFIG = {
    // Tamanhos
    TAMANHO_MAX_SIMPLES: 30000, // 30KB para upload simples
    TAMANHO_CHUNK: 24 * 1024,   // 24KB por chunk
    LIMITE_MAXIMO: 50 * 1024 * 1024, // 50MB máximo
    
    // Timeouts
    TIMEOUT_JSONP: 15000,
    TIMEOUT_POST: 30000
};

// ============================================
// FUNÇÃO PRINCIPAL JSONP (COMPATIBILIDADE)
// ============================================

function enviarParaGoogleAppsScript(dados) {
    console.log('📤 Enviando ação via JSONP:', dados.acao);
    
    return new Promise((resolve, reject) => {
        const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        window[callbackName] = function(resposta) {
            console.log('📥 Resposta recebida:', resposta);
            
            // Limpar callback
            delete window[callbackName];
            
            // Processar resposta
            if (resposta && resposta.sucesso !== false) {
                resolve(resposta.dados || resposta);
            } else {
                reject(new Error(resposta.erro || resposta.mensagem || 'Erro no servidor'));
            }
        };
        
        // Criar elemento script
        const script = document.createElement('script');
        
        // Montar URL
        let url = SCRIPT_URL;
        url += '?callback=' + encodeURIComponent(callbackName);
        url += '&dados=' + encodeURIComponent(JSON.stringify(dados));
        url += '&_=' + Date.now();
        
        console.log('🔗 URL chamada:', url.substring(0, 80) + '...');
        
        script.src = url;
        
        // Timeout
        const timeoutId = setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                reject(new Error('Timeout: Servidor não respondeu em 15s'));
            }
        }, UPLOAD_CONFIG.TIMEOUT_JSONP);
        
        // Eventos
        script.onload = () => clearTimeout(timeoutId);
        script.onerror = () => {
            clearTimeout(timeoutId);
            if (window[callbackName]) {
                delete window[callbackName];
            }
            reject(new Error('Falha ao conectar com o servidor'));
        };
        
        // Adicionar ao DOM
        document.body.appendChild(script);
    });
}

// ============================================
// FUNÇÃO DE UPLOAD - VERSÃO SIMPLIFICADA
// ============================================

async function fazerUploadArquivo(arquivo) {
    console.log(`📎 Iniciando upload: ${arquivo.name} (${formatarTamanho(arquivo.size)})`);
    
    // Verificar tamanho máximo
    if (arquivo.size > UPLOAD_CONFIG.LIMITE_MAXIMO) {
        return {
            sucesso: false,
            modo: 'muito-grande',
            url: '#muito-grande',
            nome: arquivo.name,
            tamanho: arquivo.size,
            mensagem: `Arquivo muito grande (${formatarTamanho(arquivo.size)}). Máximo: ${formatarTamanho(UPLOAD_CONFIG.LIMITE_MAXIMO)}`
        };
    }
    
    // Decidir estratégia baseada no tamanho
    if (arquivo.size <= UPLOAD_CONFIG.TAMANHO_MAX_SIMPLES) {
        // Upload simples via JSONP
        console.log('📤 Usando upload simples...');
        return await fazerUploadSimples(arquivo);
    } else {
        // Upload via POST
        console.log('🚀 Usando upload via POST...');
        return await fazerUploadViaPOST(arquivo);
    }
}

/**
 * Upload simples para arquivos pequenos (até 30KB)
 */
async function fazerUploadSimples(arquivo) {
    try {
        // Converter para base64
        const base64Data = await arquivoParaBase64(arquivo);
        
        console.log(`📊 Base64 tamanho: ${Math.round(base64Data.length / 1024)}KB`);
        
        // Enviar via JSONP
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'uploadArquivo',
            arquivoBase64: base64Data,
            nomeArquivo: arquivo.name,
            tamanho: arquivo.size,
            tipo: arquivo.type
        });
        
        return {
            sucesso: true,
            modo: 'simples',
            url: resultado.url || '#upload-simples',
            nome: arquivo.name,
            tamanho: arquivo.size,
            dados: resultado
        };
        
    } catch (erro) {
        console.error('❌ Erro no upload simples:', erro);
        
        return {
            sucesso: false,
            modo: 'simples-falhou',
            url: '#upload-falhou',
            nome: arquivo.name,
            tamanho: arquivo.size,
            mensagem: erro.message
        };
    }
}

/**
 * Upload via POST para arquivos maiores
 */
async function fazerUploadViaPOST(arquivo) {
    try {
        console.log(`📤 Preparando upload POST: ${arquivo.name}`);
        
        // Mostrar progresso
        if (typeof window.atualizarProgressoUpload === 'function') {
            window.atualizarProgressoUpload({
                progresso: 10,
                mensagem: 'Preparando upload...',
                arquivo: arquivo.name
            });
        }
        
        // Criar FormData
        const formData = new FormData();
        formData.append('acao', 'uploadArquivo');
        formData.append('nomeArquivo', arquivo.name);
        formData.append('tamanho', arquivo.size.toString());
        formData.append('tipo', arquivo.type);
        formData.append('arquivo', arquivo);
        
        // Mostrar progresso de envio
        if (typeof window.atualizarProgressoUpload === 'function') {
            window.atualizarProgressoUpload({
                progresso: 30,
                mensagem: 'Enviando dados...',
                arquivo: arquivo.name
            });
        }
        
        // Fazer requisição POST
        const resposta = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData,
            mode: 'cors'
        });
        
        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}: ${resposta.statusText}`);
        }
        
        const resultado = await resposta.json();
        
        if (resultado.sucesso && resultado.dados) {
            console.log('✅ Upload via POST bem-sucedido!');
            
            // Progresso completo
            if (typeof window.atualizarProgressoUpload === 'function') {
                window.atualizarProgressoUpload({
                    progresso: 100,
                    mensagem: 'Upload completo!',
                    arquivo: arquivo.name
                });
            }
            
            return {
                sucesso: true,
                modo: 'post',
                url: resultado.dados.url,
                nome: arquivo.name,
                tamanho: arquivo.size,
                dados: resultado.dados
            };
            
        } else {
            throw new Error(resultado.erro || 'Erro no upload');
        }
        
    } catch (erro) {
        console.error('❌ Erro no upload POST:', erro);
        
        // Fallback para modo simulado
        return criarRespostaSimulada(arquivo);
    }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function arquivoParaBase64(arquivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const base64Data = e.target.result.split(',')[1];
            resolve(base64Data);
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(arquivo);
    });
}

function formatarTamanho(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function criarRespostaSimulada(arquivo) {
    const tamanhoFormatado = formatarTamanho(arquivo.size);
    
    return {
        sucesso: false,
        modo: "simulado",
        url: "#upload-simulado",
        nome: arquivo.name,
        tamanho: arquivo.size,
        tamanhoFormatado: tamanhoFormatado,
        mensagem: arquivo.size > 50000 
            ? `Arquivo grande (${tamanhoFormatado}). Use Google Drive manualmente.`
            : "Upload falhou - usando modo simulado"
    };
}

// ============================================
// FUNÇÕES DO SISTEMA (mantidas)
// ============================================

async function listarDemandasDoServidor(filtros = {}) {
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'listarDemandas',
            filtros: filtros
        });
        
        console.log(`✅ ${Array.isArray(resultado) ? resultado.length : 0} demandas recebidas`);
        return Array.isArray(resultado) ? resultado : [];
        
    } catch (erro) {
        console.error('❌ Erro ao listar demandas:', erro);
        throw erro;
    }
}

async function salvarDemandaNoServidor(dados) {
    try {
        const resultado = await enviarParaGoogleAppsScript({
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
        
        console.log('✅ Demanda salva:', resultado);
        return resultado;
        
    } catch (erro) {
        console.error('❌ Erro ao salvar demanda:', erro);
        throw erro;
    }
}

async function enviarEmailDemanda(dados) {
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'enviarEmailDemanda',
            ...dados
        });
        
        console.log('✅ E-mail enviado:', resultado);
        return resultado;
        
    } catch (erro) {
        console.error('❌ Erro ao enviar e-mail:', erro);
        throw erro;
    }
}

async function atualizarStatusDemanda(id, novoStatus) {
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'atualizarDemanda',
            id: id,
            status: novoStatus,
            alteracao: `Status alterado para: ${novoStatus}`
        });
        
        console.log('✅ Status atualizado:', resultado);
        return resultado;
        
    } catch (erro) {
        console.error('❌ Erro ao atualizar status:', erro);
        throw erro;
    }
}

// ============================================
// TESTES E UTILITÁRIOS
// ============================================

async function testarConexao() {
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'testarConexao'
        });
        
        return {
            online: true,
            dados: resultado,
            mensagem: 'Servidor conectado com sucesso!'
        };
        
    } catch (erro) {
        console.warn('⚠️ Servidor offline:', erro.message);
        return {
            online: false,
            erro: erro.message,
            mensagem: 'Não foi possível conectar ao servidor'
        };
    }
}

async function testarUpload() {
    // Criar arquivo de teste pequeno
    const texto = 'Arquivo de teste - ' + new Date().toISOString();
    const blob = new Blob([texto], { type: 'text/plain' });
    const arquivoTeste = new File([blob], 'teste_upload.txt', {
        type: 'text/plain',
        lastModified: Date.now()
    });
    
    console.log('🧪 Testando upload...');
    
    try {
        const resultado = await fazerUploadArquivo(arquivoTeste);
        console.log('🧪 Resultado do teste:', resultado);
        return resultado;
        
    } catch (erro) {
        console.error('❌ Teste falhou:', erro);
        return {
            sucesso: false,
            erro: erro.message
        };
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

console.log('🚀 Sistema de Demandas - Conectado a:', SCRIPT_URL);
console.log('📁 Upload via POST habilitado para arquivos > 30KB');

// Testar conexão ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        try {
            const status = await testarConexao();
            if (status.online) {
                console.log('✅ Servidor online');
                
                // Testar upload POST se suportado
                const resultado = await enviarParaGoogleAppsScript({
                    acao: 'testarConexao'
                });
                
                if (resultado && resultado.suportaPOST !== false) {
                    console.log('✅ Suporte a POST confirmado');
                }
            }
        } catch (erro) {
            console.warn('⚠️ Não foi possível verificar status do servidor');
        }
    }, 1000);
});

// ============================================
// EXPORTAÇÃO PARA USO GLOBAL
// ============================================

window.fazerUploadArquivo = fazerUploadArquivo;
window.listarDemandasDoServidor = listarDemandasDoServidor;
window.salvarDemandaNoServidor = salvarDemandaNoServidor;
window.enviarEmailDemanda = enviarEmailDemanda;
window.atualizarStatusDemanda = atualizarStatusDemanda;
window.enviarParaGoogleAppsScript = enviarParaGoogleAppsScript;
window.testarConexao = testarConexao;
window.testarUpload = testarUpload;

console.log('✅ googleAppsScript.js carregado com sucesso!');
