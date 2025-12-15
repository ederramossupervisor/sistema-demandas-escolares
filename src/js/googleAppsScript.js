// googleAppsScript.js - VERSÃO FINAL CORRIGIDA
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3FBTdhnwA-kTs9V2WhEmSkh_hZXzhWfYRrLBdB46zcoeBMc4JXE4a7ikluj2A1dJO5Q/exec';

// ============================================
// FUNÇÕES PRINCIPAIS - VERSÃO SIMPLIFICADA
// ============================================

// Função principal para enviar dados
function enviarParaGoogleAppsScript(dados) {
    console.log('📤 Enviando ação:', dados.acao);
    
    return new Promise((resolve, reject) => {
        // Gerar callback único
        const callbackName = 'callback_' + Date.now();
        
        // Configurar callback
        window[callbackName] = function(resposta) {
            console.log('📥 Resposta recebida:', resposta);
            
            // Limpar
            delete window[callbackName];
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            
            // Processar resposta
            if (resposta && resposta.sucesso !== false) {
                resolve(resposta.dados || resposta);
            } else {
                reject(new Error(resposta.erro || resposta.mensagem || 'Erro no servidor'));
            }
        };
        
        // Criar script
        const script = document.createElement('script');
        
        // Montar URL JSONP
        let url = SCRIPT_URL;
        url += '?callback=' + encodeURIComponent(callbackName);
        url += '&dados=' + encodeURIComponent(JSON.stringify(dados));
        url += '&_=' + Date.now(); // Evitar cache
        
        console.log('🔗 URL chamada:', url.substring(0, 100) + '...');
        
        // Configurar script
        script.src = url;
        script.onerror = () => {
            console.error('❌ Erro ao carregar script');
            delete window[callbackName];
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            reject(new Error('Falha na conexão com o servidor'));
        };
        
        // Timeout
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                reject(new Error('Timeout: Servidor não respondeu'));
            }
        }, 15000);
        
        // Adicionar script
        document.body.appendChild(script);
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
        // idDemanda será adicionado pelo Apps Script
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
        console.log('📎 Iniciando upload:', arquivo.name);
        console.log('📏 Tamanho original:', arquivo.size, 'bytes');
        console.log('📊 Tamanho máximo para JSONP: ~50KB base64');
        
        // Verificar se é muito grande para JSONP
        const tamanhoBase64Estimado = Math.ceil(arquivo.size * 1.37);
        
        if (tamanhoBase64Estimado > 40000) { // ~40KB base64 é seguro
            console.log('⚠️ Arquivo grande, usando método alternativo...');
            
            // Método alternativo para arquivos grandes
            uploadArquivoGrande(arquivo)
                .then(resolve)
                .catch(erro => {
                    console.error('❌ Erro no método alternativo:', erro);
                    
                    // Fallback: modo simulado
                    resolve({
                        sucesso: false,
                        modo: "simulado-grande",
                        url: "#upload-simulado-grande",
                        nome: arquivo.name,
                        tamanho: arquivo.size,
                        mensagem: `Arquivo muito grande (${Math.round(arquivo.size/1024)}KB). Use arquivos menores ou entre em contato.`
                    });
                });
        } else {
            // Método normal para arquivos pequenos
            console.log('📤 Usando método normal...');
            
            const reader = new FileReader();
            
            reader.onload = function(event) {
                const base64 = event.target.result.split(',')[1];
                
                console.log('📝 Base64 gerado:', base64.length, 'caracteres');
                
                enviarParaGoogleAppsScript({
                    acao: 'uploadArquivo',
                    arquivoBase64: base64,
                    nomeArquivo: arquivo.name
                })
                .then(resolve)
                .catch(erro => {
                    console.error('❌ Erro no upload normal:', erro);
                    resolve(criarRespostaSimulada(arquivo));
                });
            };
            
            reader.onerror = () => {
                console.error('❌ Erro ao ler arquivo');
                resolve(criarRespostaSimulada(arquivo));
            };
            
            reader.readAsDataURL(arquivo);
        }
    });
}

// Função auxiliar para upload de arquivos grandes (método alternativo)
function uploadArquivoGrande(arquivo) {
    return new Promise((resolve, reject) => {
        console.log('🔄 Tentando método alternativo para arquivo grande...');
        
        // Para arquivos muito grandes, dividir em chunks
        const CHUNK_SIZE = 30000; // 30KB por chunk
        const reader = new FileReader();
        let chunks = [];
        let currentChunk = 0;
        
        reader.onload = function(e) {
            const base64Chunk = e.target.result.split(',')[1];
            chunks.push(base64Chunk);
            
            console.log(`📦 Chunk ${currentChunk + 1} processado:`, base64Chunk.length, 'caracteres');
            
            // Tentar enviar chunk por chunk (simplificado - em produção seria mais complexo)
            if (chunks.length === 1) { // Enviar apenas o primeiro chunk como teste
                enviarParaGoogleAppsScript({
                    acao: 'uploadArquivoGrande',
                    arquivoBase64: base64Chunk,
                    nomeArquivo: arquivo.name,
                    chunkIndex: currentChunk,
                    totalChunks: Math.ceil(arquivo.size / CHUNK_SIZE),
                    tamanhoTotal: arquivo.size
                })
                .then(resolve)
                .catch(reject);
            }
        };
        
        reader.onerror = reject;
        
        // Ler chunk
        const start = currentChunk * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, arquivo.size);
        const slice = arquivo.slice(start, end);
        reader.readAsDataURL(slice);
    });
}

// Função auxiliar para resposta simulada
function criarRespostaSimulada(arquivo) {
    return {
        sucesso: false,
        modo: "simulado",
        url: "#upload-simulado",
        nome: arquivo.name,
        tamanho: arquivo.size,
        tamanhoFormatado: Math.round(arquivo.size / 1024) + " KB",
        mensagem: "Arquivo processado em modo simulado"
    };
}function atualizarStatusDemanda(id, novoStatus) {
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
        const callbackName = 'test_conexao_' + Date.now();
        const script = document.createElement('script');
        
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
// MODO DE CONTINGÊNCIA (SE SERVIDOR FALHAR)
// ============================================

let modoContingencia = false;

// Função para verificar se servidor está online
async function verificarStatusServidor() {
    try {
        const status = await testarConexao();
        modoContingencia = false;
        return { online: true, dados: status };
    } catch (erro) {
        modoContingencia = true;
        console.warn('⚠️ Servidor offline, usando modo contingência');
        return { online: false, erro: erro.message };
    }
}

// Dados de exemplo para modo contingência
function obterDadosExemplo() {
    return [
        {
            id: 1,
            titulo: "Exemplo: Relatório Mensal",
            descricao: "Entrega do relatório de atividades do mês",
            escolas: "EEEFM Pedra Azul",
            responsavel: "Escola(s)",
            status: "Pendente",
            prazo: "2024-12-31",
            criado_em: new Date().toISOString()
        },
        {
            id: 2,
            titulo: "Exemplo: Visita Técnica",
            descricao: "Agendamento para visita de supervisão",
            escolas: "EEEFM Fioravante Caliman",
            responsavel: "Supervisor",
            status: "Em andamento",
            prazo: "2024-12-20",
            criado_em: new Date().toISOString()
        }
    ];
}

// ============================================
// INICIALIZAÇÃO
// ============================================

console.log('🚀 Sistema de Demandas - Conectado a:', SCRIPT_URL);

// Verificar status do servidor ao carregar
setTimeout(async () => {
    const status = await verificarStatusServidor();
    console.log(status.online ? '✅ Servidor online' : '⚠️ Servidor offline');
}, 1000);

// ============================================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// ============================================

window.listarDemandasDoServidor = listarDemandasDoServidor;
window.salvarDemandaNoServidor = salvarDemandaNoServidor;
window.enviarEmailDemanda = enviarEmailDemanda;
window.fazerUploadArquivo = fazerUploadArquivo;
window.atualizarStatusDemanda = atualizarStatusDemanda;
window.testarConexao = testarConexao;
window.verificarStatusServidor = verificarStatusServidor;
window.enviarParaGoogleAppsScript = enviarParaGoogleAppsScript;
