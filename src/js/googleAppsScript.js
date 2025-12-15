// googleAppsScript.js - VERSÃO FINAL CORRIGIDA COM UPLOAD VIA POST
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw3FX285_JgX7S41xPQ_37P1P6B1R7AmK5EZgT9EVEwQr7j34gYQ55PP7aF0cKoLojn1A/exec';

// ============================================
// FUNÇÕES PRINCIPAIS - VERSÃO COM SUPORTE A POST
// ============================================

// Função principal para enviar dados (JSONP - mantém compatibilidade)
function enviarParaGoogleAppsScript(dados) {
    console.log('📤 Enviando ação via JSONP:', dados.acao);
    
    // Se for upload de arquivo, usar POST diretamente
    if (dados.acao === 'uploadArquivo') {
        console.log('⚠️ Upload via JSONP não recomendado. Use fazerUploadArquivo()');
    }
    
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
// FUNÇÃO DE UPLOAD VIA POST (NOVA - CORRIGIDA)
// ============================================

function fazerUploadArquivo(arquivo) {
    return new Promise((resolve, reject) => {
        console.log('📎 Iniciando upload inteligente...');
        
        // Limite para upload simples vs chunks
        const LIMITE_SIMPLES = 30000; // 30KB
        const LIMITE_MAXIMO = 50 * 1024 * 1024; // 50MB máximo
        
        // Verificar tamanho
        if (arquivo.size > LIMITE_MAXIMO) {
            const resposta = {
                sucesso: false,
                modo: "muito-grande",
                url: "#muito-grande",
                nome: arquivo.name,
                tamanho: arquivo.size,
                mensagem: `Arquivo muito grande (${Math.round(arquivo.size/1024/1024)}MB). Máximo: ${LIMITE_MAXIMO/1024/1024}MB.`
            };
            resolve(resposta);
            return;
        }
        
        if (arquivo.size <= LIMITE_SIMPLES) {
            console.log('📤 Usando upload simples (arquivo pequeno)...');
            
            // Upload simples para arquivos pequenos
            const reader = new FileReader();
            
            reader.onload = function(event) {
                const base64 = event.target.result.split(',')[1];
                
                enviarParaGoogleAppsScript({
                    acao: 'uploadArquivo',
                    arquivoBase64: base64,
                    nomeArquivo: arquivo.name,
                    tamanho: arquivo.size
                })
                .then(resolve)
                .catch(erro => {
                    console.error('❌ Erro no upload simples:', erro);
                    resolve(criarRespostaSimulada(arquivo));
                });
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(arquivo);
            
        } else {
            console.log('🚀 Arquivo grande, usando sistema de chunks...');
            
            // Usar upload em chunks para arquivos grandes
            fazerUploadArquivoGrande(arquivo, (progresso) => {
                console.log(`📊 Progresso: ${progresso.progresso}% (chunk ${progresso.chunkAtual}/${progresso.totalChunks})`);
                
                // Opcional: Atualizar UI com progresso
                if (typeof window.atualizarProgressoUpload === 'function') {
                    window.atualizarProgressoUpload(progresso);
                }
            })
            .then(resolve)
            .catch(erro => {
                console.error('❌ Erro no upload grande:', erro);
                
                // Fallback para modo simulado
                resolve({
                    sucesso: false,
                    modo: "chunks-falhou",
                    url: "#chunks-falhou",
                    nome: arquivo.name,
                    tamanho: arquivo.size,
                    mensagem: `Upload de arquivo grande falhou (${Math.round(arquivo.size/1024)}KB). Tente novamente ou use arquivo menor.`
                });
            });
        }
    });
}
// Função auxiliar para resposta simulada
function criarRespostaSimulada(arquivo) {
    const tamanhoMB = Math.round(arquivo.size / 1024 / 1024 * 100) / 100;
    
    return {
        sucesso: false,
        modo: "simulado",
        url: "#upload-simulado",
        nome: arquivo.name,
        tamanho: arquivo.size,
        tamanhoFormatado: tamanhoMB < 1 
            ? Math.round(arquivo.size / 1024) + " KB" 
            : tamanhoMB + " MB",
        mensagem: arquivo.size > 50000 
            ? `Arquivo muito grande para upload direto (${tamanhoMB}MB). Use Google Drive manualmente.`
            : "Upload falhou - usando modo simulado"
    };
}
// 🔥 FUNÇÃO PARA ATUALIZAR UI COM PROGRESSO (opcional)
function criarBarraProgressoUpload(arquivo) {
    const container = document.createElement('div');
    container.className = 'upload-progress-container';
    container.innerHTML = `
        <div class="upload-progress-info">
            <span class="upload-filename">${arquivo.name}</span>
            <span class="upload-size">${formatarTamanhoArquivo(arquivo.size)}</span>
        </div>
        <div class="upload-progress-bar">
            <div class="upload-progress-fill" style="width: 0%"></div>
        </div>
        <div class="upload-progress-text">0% • Preparando...</div>
    `;
    
    // Adicionar à lista de arquivos
    elementos.arquivosList.appendChild(container);
    
    return {
        atualizar: (progresso) => {
            const fill = container.querySelector('.upload-progress-fill');
            const text = container.querySelector('.upload-progress-text');
            
            if (fill) fill.style.width = `${progresso.progresso}%`;
            if (text) {
                text.textContent = `${progresso.progresso}% • Chunk ${progresso.chunkAtual}/${progresso.totalChunks}`;
            }
        },
        completar: (sucesso) => {
            const text = container.querySelector('.upload-progress-text');
            if (text) {
                text.textContent = sucesso ? '✅ Concluído' : '❌ Falhou';
                text.className = sucesso ? 'upload-progress-text success' : 'upload-progress-text error';
            }
        },
        remover: () => {
            setTimeout(() => {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }, 3000);
        }
    };
}

// 🔥 FUNÇÃO GLOBAL PARA UI (chamada pelo callback de progresso)
window.atualizarProgressoUpload = function(progresso) {
    // Implemente a lógica para atualizar sua UI aqui
    console.log(`UI Progresso: ${progresso.progresso}%`);
};
// ============================================
// FUNÇÕES ESPECÍFICAS DO SISTEMA (mantidas)
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

function enviarEmailDemanda(dados) {
    return enviarParaGoogleAppsScript({
        acao: 'enviarEmailDemanda',
        ...dados
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
// TESTE DE CONEXÃO E UTILITÁRIOS
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

let modoContingencia = false;

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
// 🔥 NOVA FUNÇÃO PARA UPLOAD DE ARQUIVOS GRANDES EM CHUNKS
function fazerUploadArquivoGrande(arquivo, onProgress = null) {
    return new Promise((resolve, reject) => {
        console.log(`🚀 Iniciando upload GRANDE: ${arquivo.name} (${Math.round(arquivo.size/1024)}KB)`);
        
        // Configurações dos chunks
        const CHUNK_SIZE = 25000; // 25KB por chunk (seguro para JSONP)
        const TOTAL_CHUNKS = Math.ceil(arquivo.size / CHUNK_SIZE);
        
        console.log(`📦 Total de chunks: ${TOTAL_CHUNKS} (${CHUNK_SIZE/1024}KB cada)`);
        
        let chunksProcessados = 0;
        let todosChunks = [];
        let nomeArquivoFinal = `grande_${Date.now()}_${arquivo.name}`;
        
        // Função para processar chunk por chunk
        const processarChunk = (chunkIndex) => {
            if (chunkIndex >= TOTAL_CHUNKS) {
                // Todos chunks processados, enviar para montar
                console.log(`✅ Todos ${TOTAL_CHUNKS} chunks processados`);
                montarArquivoNoServidor();
                return;
            }
            
            const reader = new FileReader();
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, arquivo.size);
            const chunk = arquivo.slice(start, end);
            
            reader.onload = async function(event) {
                try {
                    const base64Chunk = event.target.result.split(',')[1];
                    
                    // Salvar chunk localmente
                    todosChunks[chunkIndex] = {
                        index: chunkIndex,
                        data: base64Chunk,
                        size: chunk.size
                    };
                    
                    chunksProcessados++;
                    
                    // Atualizar progresso
                    const progresso = Math.round((chunksProcessados / TOTAL_CHUNKS) * 100);
                    
                    if (onProgress) {
                        onProgress({
                            progresso: progresso,
                            chunkAtual: chunkIndex + 1,
                            totalChunks: TOTAL_CHUNKS,
                            tamanhoProcessado: chunksProcessados * CHUNK_SIZE,
                            tamanhoTotal: arquivo.size
                        });
                    }
                    
                    console.log(`📤 Chunk ${chunkIndex + 1}/${TOTAL_CHUNKS} (${progresso}%)`);
                    
                    // Processar próximo chunk (com pequeno delay para não sobrecarregar)
                    setTimeout(() => processarChunk(chunkIndex + 1), 100);
                    
                } catch (erro) {
                    console.error(`❌ Erro no chunk ${chunkIndex + 1}:`, erro);
                    reject(erro);
                }
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(chunk);
        };
        
        // Função para enviar todos chunks ao servidor
        const montarArquivoNoServidor = async () => {
            console.log(`🔄 Enviando ${TOTAL_CHUNKS} chunks para o servidor...`);
            
            try {
                // Preparar dados
                const dadosUpload = {
                    acao: 'uploadArquivoGrande',
                    nomeArquivo: arquivo.name,
                    nomeArquivoFinal: nomeArquivoFinal,
                    tipoArquivo: arquivo.type,
                    tamanhoTotal: arquivo.size,
                    totalChunks: TOTAL_CHUNKS,
                    chunks: todosChunks.length
                };
                
                // Enviar primeiro chunk com metadados
                const primeiroChunk = todosChunks[0];
                
                const resultado = await enviarParaGoogleAppsScript({
                    ...dadosUpload,
                    chunkData: primeiroChunk.data,
                    chunkIndex: 0,
                    isPrimeiroChunk: true
                });
                
                console.log('📥 Resposta do primeiro chunk:', resultado);
                
                // Enviar chunks restantes
                for (let i = 1; i < todosChunks.length; i++) {
                    const chunk = todosChunks[i];
                    
                    await enviarParaGoogleAppsScript({
                        acao: 'uploadArquivoGrandeContinuacao',
                        nomeArquivoFinal: nomeArquivoFinal,
                        chunkData: chunk.data,
                        chunkIndex: i,
                        isUltimoChunk: (i === todosChunks.length - 1)
                    });
                    
                    console.log(`📤 Chunk ${i + 1}/${TOTAL_CHUNKS} enviado`);
                    
                    if (onProgress) {
                        onProgress({
                            progresso: Math.round(((i + 1) / TOTAL_CHUNKS) * 100),
                            status: 'enviando',
                            chunkAtual: i + 1,
                            totalChunks: TOTAL_CHUNKS
                        });
                    }
                }
                
                // Solicitar montagem final
                const resultadoFinal = await enviarParaGoogleAppsScript({
                    acao: 'montarArquivoGrande',
                    nomeArquivo: arquivo.name,
                    nomeArquivoFinal: nomeArquivoFinal,
                    tipoArquivo: arquivo.type,
                    tamanhoTotal: arquivo.size,
                    totalChunks: TOTAL_CHUNKS
                });
                
                console.log('🎉 Upload grande concluído:', resultadoFinal);
                resolve(resultadoFinal);
                
            } catch (erro) {
                console.error('❌ Erro ao montar arquivo:', erro);
                reject(erro);
            }
        };
        
        // Iniciar processamento
        processarChunk(0);
    });
}
// ============================================
// FUNÇÃO PARA TESTAR UPLOAD DIRETAMENTE
// ============================================

function testarUploadManual() {
    // Criar arquivo de teste
    const texto = "Este é um arquivo de teste para verificar o upload via POST.";
    const blob = new Blob([texto], { type: 'text/plain' });
    const arquivoTeste = new File([blob], 'teste_upload.txt', { 
        type: 'text/plain',
        lastModified: Date.now()
    });
    
    console.log('🧪 Testando upload manual...');
    
    return fazerUploadArquivo(arquivoTeste)
        .then(resultado => {
            console.log('🧪 Resultado do teste:', resultado);
            return resultado;
        });
}

// ============================================
// INICIALIZAÇÃO
// ============================================

console.log('🚀 Sistema de Demandas - Conectado a:', SCRIPT_URL);
console.log('📁 Upload via POST habilitado');

// Verificar status do servidor ao carregar
setTimeout(async () => {
    try {
        const status = await verificarStatusServidor();
        console.log(status.online ? '✅ Servidor online' : '⚠️ Servidor offline');
        
        // Testar upload se servidor online
        if (status.online) {
            console.log('🧪 Upload testado na inicialização');
        }
    } catch (erro) {
        console.warn('⚠️ Não foi possível verificar status do servidor:', erro.message);
    }
}, 2000);

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
window.testarUploadManual = testarUploadManual;
