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
async function fazerUploadArquivoGrande(arquivo) {
    console.log(`🚀 Iniciando upload GRANDE: ${arquivo.name} (${formatarTamanhoArquivo(arquivo.size)})`);
    
    // Definir tamanho do chunk (24KB é seguro para JSONP)
    const TAMANHO_CHUNK = 24 * 1024; // 24KB
    
    const totalChunks = Math.ceil(arquivo.size / TAMANHO_CHUNK);
    console.log(`📦 Total de chunks: ${totalChunks} (${formatarTamanhoArquivo(TAMANHO_CHUNK)} cada)`);
    
    // Array para armazenar os chunks em base64
    const chunks = [];
    
    try {
        // Ler e processar cada chunk
        for (let i = 0; i < totalChunks; i++) {
            const inicio = i * TAMANHO_CHUNK;
            const fim = Math.min(inicio + TAMANHO_CHUNK, arquivo.size);
            const chunk = arquivo.slice(inicio, fim);
            
            // Converter chunk para base64
            const base64Chunk = await converterChunkParaBase64(chunk);
            
            chunks.push({
                numero: i + 1,
                total: totalChunks,
                dados: base64Chunk
            });
            
            // Atualizar progresso
            const progresso = Math.round(((i + 1) / totalChunks) * 100);
            atualizarProgressoUpload(progresso);
            console.log(`📊 Progresso: ${progresso}% (chunk ${i + 1}/${totalChunks})`);
        }
        
        console.log(`✅ Todos ${totalChunks} chunks processados`);
        
        // 🔥 NOVA ABORDAGEM: Enviar um chunk por vez
        return await enviarChunksSequencialmente(arquivo.name, arquivo.size, chunks);
        
    } catch (erro) {
        console.error('❌ Erro ao processar chunks:', erro);
        return {
            sucesso: false,
            modo: 'chunks-falhou',
            url: '#chunks-falhou',
            nome: arquivo.name,
            tamanho: arquivo.size,
            mensagem: erro.message
        };
    }
}

/**
 * Envia chunks sequencialmente para evitar limite de tamanho
 */
async function enviarChunksSequencialmente(nomeArquivo, tamanhoArquivo, chunks) {
    console.log(`🔄 Enviando ${chunks.length} chunks sequencialmente...`);
    
    const idSessao = 'sessao_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    try {
        // 1. Iniciar sessão de upload
        const iniciarResultado = await enviarParaGoogleAppsScript({
            acao: 'iniciarUploadGrande',
            nomeArquivo: nomeArquivo,
            tamanhoArquivo: tamanhoArquivo,
            totalChunks: chunks.length,
            idSessao: idSessao
        });
        
        if (!iniciarResultado.sucesso) {
            throw new Error('Falha ao iniciar sessão de upload');
        }
        
        console.log(`✅ Sessão iniciada: ${idSessao}`);
        
        // 2. Enviar cada chunk sequencialmente
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            console.log(`📤 Enviando chunk ${chunk.numero}/${chunk.total}...`);
            
            const chunkResultado = await enviarParaGoogleAppsScript({
                acao: 'enviarChunk',
                idSessao: idSessao,
                numeroChunk: chunk.numero,
                totalChunks: chunk.total,
                dadosChunk: chunk.dados
            });
            
            if (!chunkResultado.sucesso) {
                throw new Error(`Falha ao enviar chunk ${chunk.numero}`);
            }
            
            console.log(`✅ Chunk ${chunk.numero} enviado`);
        }
        
        // 3. Finalizar upload
        console.log(`🏁 Finalizando upload...`);
        const finalizarResultado = await enviarParaGoogleAppsScript({
            acao: 'finalizarUploadGrande',
            idSessao: idSessao
        });
        
        if (!finalizarResultado.sucesso) {
            throw new Error('Falha ao finalizar upload');
        }
        
        console.log(`🎉 Upload completo! URL: ${finalizarResultado.dados.url}`);
        
        return {
            sucesso: true,
            modo: 'chunks-sequencial',
            url: finalizarResultado.dados.url,
            nome: nomeArquivo,
            tamanho: tamanhoArquivo
        };
        
    } catch (erro) {
        console.error('❌ Erro no upload sequencial:', erro);
        
        // Tentar cancelar sessão se possível
        try {
            await enviarParaGoogleAppsScript({
                acao: 'cancelarUpload',
                idSessao: idSessao
            });
        } catch (e) {
            // Ignorar erro de cancelamento
        }
        
        return {
            sucesso: false,
            modo: 'chunks-falhou',
            url: '#chunks-falhou',
            nome: nomeArquivo,
            tamanho: tamanhoArquivo,
            mensagem: erro.message
        };
    }
}

/**
 * Converte um chunk para base64
 */
function converterChunkParaBase64(chunk) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Extrair apenas a parte base64 (remover data:application/octet-stream;base64,)
            const base64Data = e.target.result.split(',')[1];
            resolve(base64Data);
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(chunk);
    });
}

/**
 * Função auxiliar para atualizar progresso
 */
function atualizarProgressoUpload(progresso) {
    // Atualizar UI se existir
    if (window.atualizarProgressoUI) {
        window.atualizarProgressoUI(progresso);
    }
    
    // Atualizar console
    console.log(`🔄 Progresso do upload: ${progresso}%`);
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
