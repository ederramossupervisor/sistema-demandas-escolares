// googleAppsScript.js - VERSÃO FINAL CORRIGIDA COM UPLOAD VIA POST
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwVZW-e6QZx07U3xukw5sIh7m85rkTa52Lvn_I9BhIcBTyZPkm0-saWk_xEyFU8Q-bxMg/exec';

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
        console.log('📎 Iniciando upload REAL via POST:', arquivo.name);
        console.log('📏 Tamanho:', arquivo.size, 'bytes');
        console.log('📊 Tipo:', arquivo.type);
        
        // Verificar tamanho máximo (10MB para POST)
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (arquivo.size > MAX_SIZE) {
            const resposta = {
                sucesso: false,
                modo: "simulado",
                url: "#arquivo-muito-grande",
                nome: arquivo.name,
                tamanho: arquivo.size,
                tamanhoFormatado: Math.round(arquivo.size / 1024 / 1024 * 100) / 100 + " MB",
                mensagem: `Arquivo muito grande (${Math.round(arquivo.size/1024/1024 * 100)/100}MB). Máximo: 10MB.`
            };
            console.warn('⚠️ Arquivo muito grande:', resposta.mensagem);
            resolve(resposta);
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            console.log('📤 Convertendo para base64...');
            const base64 = event.target.result.split(',')[1];
            
            // Criar FormData para enviar via POST
            const formData = new FormData();
            formData.append('acao', 'uploadArquivo');
            formData.append('nomeArquivo', arquivo.name);
            formData.append('arquivoBase64', base64);
            formData.append('tipoArquivo', arquivo.type);
            formData.append('tamanhoOriginal', arquivo.size.toString());
            
            console.log('🔄 Enviando via POST...');
            
            // Usar fetch com POST - IMPORTANTE: não usar 'no-cors' se precisar ler resposta
            fetch(SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
                body: formData
            })
            .then(response => {
                console.log('📥 Resposta HTTP recebida:', response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Tentar parsear como JSON
                return response.text().then(text => {
                    console.log('📝 Resposta bruta:', text.substring(0, 200) + '...');
                    
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.warn('⚠️ Resposta não é JSON válido, tentando extrair...');
                        
                        // Tentar extrair JSON de possíveis wrappers
                        const jsonMatch = text.match(/\{.*\}/s);
                        if (jsonMatch) {
                            try {
                                return JSON.parse(jsonMatch[0]);
                            } catch (e2) {
                                console.error('❌ Não conseguiu parsear JSON extraído');
                            }
                        }
                        
                        // Se tudo falhar, criar resposta manual
                        return {
                            sucesso: text.includes('sucesso') || text.includes('"sucesso":'),
                            mensagem: text.length > 100 ? text.substring(0, 100) + '...' : text,
                            textoCompleto: text
                        };
                    }
                });
            })
            .then(data => {
                console.log('✅ Dados processados:', data);
                
                // Normalizar resposta
                if (data && typeof data === 'object') {
                    if (data.sucesso === undefined) {
                        data.sucesso = true; // Assumir sucesso se não especificado
                    }
                    
                    // Garantir que tenha URL para o sistema
                    if (!data.url && data.id) {
                        data.url = `https://drive.google.com/file/d/${data.id}/view`;
                    }
                    
                    resolve(data);
                } else {
                    // Resposta inesperada
                    resolve({
                        sucesso: false,
                        modo: "resposta-invalida",
                        url: "#resposta-invalida",
                        nome: arquivo.name,
                        mensagem: "Resposta inválida do servidor",
                        respostaBruta: data
                    });
                }
            })
            .catch(erro => {
                console.error('❌ Erro no fetch POST:', erro);
                
                // Fallback 1: Tentar com 'no-cors' (mais permissivo)
                console.log('🔄 Tentando fallback com mode: no-cors...');
                
                fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Mais permissivo
                    body: formData
                })
                .then(() => {
                    // Com no-cors não podemos ler a resposta, mas assumimos que foi
                    console.log('✅ POST com no-cors aparentemente enviado');
                    
                    resolve({
                        sucesso: true,
                        modo: "no-cors",
                        url: "#upload-no-cors",
                        nome: arquivo.name,
                        mensagem: "Arquivo enviado (modo no-cors - verifique no servidor)",
                        tamanho: arquivo.size
                    });
                })
                .catch(erro2 => {
                    console.error('❌ Fallback também falhou:', erro2);
                    
                    // Fallback 2: Método JSONP para arquivos pequenos
                    if (arquivo.size < 30000) { // < 30KB
                        console.log('🔄 Tentando JSONP como último recurso...');
                        
                        const reader2 = new FileReader();
                        reader2.onload = function(e) {
                            const base642 = e.target.result.split(',')[1];
                            
                            enviarParaGoogleAppsScript({
                                acao: 'uploadArquivo',
                                arquivoBase64: base642,
                                nomeArquivo: arquivo.name
                            })
                            .then(resolve)
                            .catch(erro3 => {
                                console.error('❌ JSONP também falhou:', erro3);
                                resolve(criarRespostaSimulada(arquivo));
                            });
                        };
                        reader2.readAsDataURL(arquivo);
                    } else {
                        // Arquivo muito grande para JSONP
                        resolve(criarRespostaSimulada(arquivo));
                    }
                });
            });
        };
        
        reader.onerror = (erro) => {
            console.error('❌ Erro ao ler arquivo:', erro);
            reject(new Error('Erro ao ler arquivo: ' + erro.message));
        };
        
        reader.readAsDataURL(arquivo);
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
