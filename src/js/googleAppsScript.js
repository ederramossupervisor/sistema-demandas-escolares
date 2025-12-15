// googleAppsScript.js - VERSÃO FINAL CORRIGIDA
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzFGeKOLm0xpppPMOA2EQOzl8HJ3PnqoGPn2mF7rhAmXq7imPcdxNmS5xFzHKBV4cduQ/exec';

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
        // Para simplificar neste momento, retornar sucesso fake
        // Em produção, implementar upload real
        
        console.log('📎 Arquivo selecionado para upload:', arquivo.name);
        
        // Simular upload bem-sucedido
        setTimeout(() => {
            resolve({
                sucesso: true,
                url: '#upload-simulado',
                nome: arquivo.name,
                tamanho: arquivo.size,
                mensagem: 'Arquivo pronto para envio'
            });
        }, 500);
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
