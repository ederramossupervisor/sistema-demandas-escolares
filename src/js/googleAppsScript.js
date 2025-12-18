// googleAppsScript.js - VERSÃO FINAL OTIMIZADA
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx-21QjZUAsjim2ffOleI6oBD95w_tpqRzPZO8UQ52TQGp-RmCzNVpoox7KFeGLPZrpCg/exec';

// ============================================
// CONFIGURAÇÕES INTELIGENTES
// ============================================

const CONFIG = {
    // Limites de upload (otimizados para GAS)
    LIMITE_SIMPLES: 30000,           // 30KB - seguro para JSONP
    LIMITE_ALERTA: 1024 * 1024,      // 1MB - arquivos médios
    LIMITE_MAXIMO: 10 * 1024 * 1024, // 10MB - máximo recomendado
    
    // Timeouts
    TIMEOUT: 20000,                  // 20 segundos
    
    // Modos de operação
    MODOS: {
        DIRETO: 'direto',           // JSONP para arquivos pequenos
        POST: 'post',               // POST para arquivos médios
        LINK_EXTERNO: 'link'        // Link do Drive para arquivos grandes
    }
};

// ============================================
// FUNÇÃO PRINCIPAL DE COMUNICAÇÃO (JSONP)
// ============================================

function enviarParaGoogleAppsScript(dados) {
    console.log('📤 Enviando ação:', dados.acao);
    
    return new Promise((resolve, reject) => {
        const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        window[callbackName] = function(resposta) {
            console.log('📥 Resposta recebida:', resposta);
            
            // Limpar callback
            delete window[callbackName];
            
            if (resposta && resposta.sucesso !== false) {
                resolve(resposta.dados || resposta);
            } else {
                reject(new Error(resposta.erro || resposta.mensagem || 'Erro no servidor'));
            }
        };
        
        // Criar script
        const script = document.createElement('script');
        
        // Montar URL JSONP (compatível com seu GAS)
        let url = SCRIPT_URL;
        url += '?callback=' + encodeURIComponent(callbackName);
        url += '&dados=' + encodeURIComponent(JSON.stringify(dados));
        url += '&_=' + Date.now();
        
        console.log('🔗 URL JSONP:', url.substring(0, 120) + '...');
        
        script.src = url;
        
        // Timeout
        const timeoutId = setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                reject(new Error('Timeout: Servidor não respondeu em 20 segundos'));
            }
        }, CONFIG.TIMEOUT);
        
        // Eventos
        script.onload = () => clearTimeout(timeoutId);
        script.onerror = () => {
            clearTimeout(timeoutId);
            if (window[callbackName]) delete window[callbackName];
            reject(new Error('Falha na conexão com o servidor'));
        };
        
        // Adicionar ao DOM
        document.body.appendChild(script);
    });
}

// ============================================
// FUNÇÃO DE UPLOAD INTELIGENTE
// ============================================

async function fazerUploadArquivo(arquivo) {
    console.log(`📎 Iniciando upload: ${arquivo.name} (${formatarTamanho(arquivo.size)})`);
    
    // Mostrar progresso inicial
    if (typeof window.atualizarProgressoUpload === 'function') {
        window.atualizarProgressoUpload({
            progresso: 5,
            mensagem: 'Analisando arquivo...',
            arquivo: arquivo.name
        });
    }
    
    try {
        // Verificar tamanho
        if (arquivo.size > CONFIG.LIMITE_MAXIMO) {
            return criarRespostaArquivoGrande(arquivo, 'muito_grande');
        }
        
        // Decidir estratégia baseada no tamanho
        if (arquivo.size <= CONFIG.LIMITE_SIMPLES) {
            console.log('📤 Usando upload direto (até 30KB)...');
            return await fazerUploadDireto(arquivo);
            
        } else if (arquivo.size <= CONFIG.LIMITE_ALERTA) {
            console.log('🚀 Tentando upload via POST (até 1MB)...');
            return await tentarUploadViaPOST(arquivo);
            
        } else {
            console.log('🔗 Arquivo grande, sugerindo link externo...');
            return criarRespostaArquivoGrande(arquivo, 'sugerir_link');
        }
        
    } catch (erro) {
        console.error('❌ Erro no upload:', erro);
        
        // Fallback seguro
        return criarRespostaFallback(arquivo, erro);
    }
}

// ============================================
// ESTRATÉGIAS DE UPLOAD
// ============================================

/**
 * Upload direto para arquivos pequenos (até 30KB)
 */
async function fazerUploadDireto(arquivo) {
    try {
        // Atualizar progresso
        if (typeof window.atualizarProgressoUpload === 'function') {
            window.atualizarProgressoUpload({
                progresso: 20,
                mensagem: 'Convertendo para base64...',
                arquivo: arquivo.name
            });
        }
        
        // Converter para base64
        const base64Data = await arquivoParaBase64(arquivo);
        
        console.log(`📊 Tamanho base64: ${Math.round(base64Data.length / 1024)}KB`);
        
        // Atualizar progresso
        if (typeof window.atualizarProgressoUpload === 'function') {
            window.atualizarProgressoUpload({
                progresso: 50,
                mensagem: 'Enviando para o servidor...',
                arquivo: arquivo.name
            });
        }
        
        // Enviar via JSONP
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'uploadArquivo',
            arquivoBase64: base64Data,
            nomeArquivo: arquivo.name,
            tamanho: arquivo.size,
            tipo: arquivo.type,
            metodo: 'direto'
        });
        
        // Atualizar progresso
        if (typeof window.atualizarProgressoUpload === 'function') {
            window.atualizarProgressoUpload({
                progresso: 100,
                mensagem: 'Upload concluído!',
                arquivo: arquivo.name
            });
        }
        
        console.log('✅ Upload direto bem-sucedido:', resultado);
        
        return {
            sucesso: true,
            modo: CONFIG.MODOS.DIRETO,
            url: resultado.url || resultado.linkDireto || '#upload-sucesso',
            nome: arquivo.name,
            tamanho: arquivo.size,
            dados: resultado,
            mensagem: 'Arquivo enviado com sucesso!'
        };
        
    } catch (erro) {
        console.error('❌ Erro no upload direto:', erro);
        throw erro;
    }
}

/**
 * Tentar upload via POST (experimental para arquivos médios)
 */
async function tentarUploadViaPOST(arquivo) {
    try {
        // Primeiro tentar via POST
        if (typeof window.atualizarProgressoUpload === 'function') {
            window.atualizarProgressoUpload({
                progresso: 30,
                mensagem: 'Tentando upload via POST...',
                arquivo: arquivo.name
            });
        }
        
        // Tentar fazer upload via POST (método experimental)
        const resultadoPOST = await tentarPOSTExperimental(arquivo);
        
        if (resultadoPOST.sucesso) {
            return resultadoPOST;
        }
        
        // Se POST falhar, tentar via JSONP (pode ser lento)
        console.log('🔄 POST falhou, tentando via JSONP...');
        
        if (typeof window.atualizarProgressoUpload === 'function') {
            window.atualizarProgressoUpload({
                progresso: 40,
                mensagem: 'Usando método alternativo...',
                arquivo: arquivo.name
            });
        }
        
        return await fazerUploadDireto(arquivo);
        
    } catch (erro) {
        console.error('❌ Erro no upload via POST:', erro);
        throw erro;
    }
}

/**
 * Tentativa experimental de POST
 */
async function tentarPOSTExperimental(arquivo) {
    return new Promise((resolve) => {
        // Para arquivos médios, converter para base64 e usar POST com JSON
        setTimeout(async () => {
            try {
                const base64Data = await arquivoParaBase64(arquivo);
                
                // Criar requisição POST com JSON
                const resposta = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        'acao': 'uploadArquivo',
                        'nomeArquivo': arquivo.name,
                        'arquivoBase64': base64Data,
                        'tamanho': arquivo.size.toString(),
                        'tipo': arquivo.type
                    })
                });
                
                if (resposta.ok) {
                    const resultado = await resposta.json();
                    
                    if (resultado.sucesso && resultado.dados) {
                        resolve({
                            sucesso: true,
                            modo: CONFIG.MODOS.POST,
                            url: resultado.dados.url || '#upload-post',
                            nome: arquivo.name,
                            tamanho: arquivo.size,
                            dados: resultado.dados,
                            mensagem: 'Upload via POST realizado!'
                        });
                        return;
                    }
                }
                
                // Se falhar, resolver como falso
                resolve({
                    sucesso: false,
                    modo: 'post-falhou',
                    mensagem: 'Método POST não disponível'
                });
                
            } catch (erro) {
                console.warn('⚠️ POST experimental falhou:', erro.message);
                resolve({
                    sucesso: false,
                    modo: 'post-falhou',
                    mensagem: erro.message
                });
            }
        }, 100);
    });
}

// ============================================
// RESPOSTAS INTELIGENTES
// ============================================

function criarRespostaArquivoGrande(arquivo, motivo) {
    const tamanhoFormatado = formatarTamanho(arquivo.size);
    const tamanhoMB = (arquivo.size / (1024 * 1024)).toFixed(1);
    
    let mensagem, acaoRecomendada;
    
    switch(motivo) {
        case 'muito_grande':
            mensagem = `Arquivo muito grande (${tamanhoFormatado}).`;
            acaoRecomendada = `O limite é ${formatarTamanho(CONFIG.LIMITE_MAXIMO)}.`;
            break;
            
        case 'sugerir_link':
            mensagem = `Para arquivos acima de 1MB (${tamanhoFormatado}), recomendamos:`;
            acaoRecomendada = '1. Enviar para seu Google Drive\n2. Compartilhar como "Qualquer pessoa com o link"\n3. Colar o link abaixo';
            break;
            
        default:
            mensagem = `Arquivo grande detectado (${tamanhoFormatado}).`;
            acaoRecomendada = 'Use o método alternativo.';
    }
    
    return {
        sucesso: false,
        modo: CONFIG.MODOS.LINK_EXTERNO,
        url: '#aguardando-link',
        nome: arquivo.name,
        tamanho: arquivo.size,
        tamanhoFormatado: tamanhoFormatado,
        mensagem: mensagem,
        acaoRecomendada: acaoRecomendada,
        permiteLinkManual: true,
        instrucoes: [
            '📁 Envie o arquivo para seu Google Drive',
            '🔗 Compartilhe como "Qualquer pessoa com o link"',
            '📋 Cole o link na caixa abaixo'
        ]
    };
}

function criarRespostaFallback(arquivo, erro) {
    const tamanhoFormatado = formatarTamanho(arquivo.size);
    
    return {
        sucesso: false,
        modo: 'fallback',
        url: '#upload-falhou',
        nome: arquivo.name,
        tamanho: arquivo.size,
        tamanhoFormatado: tamanhoFormatado,
        mensagem: `Não foi possível enviar "${arquivo.name}"`,
        erro: erro.message,
        solucao: arquivo.size > CONFIG.LIMITE_SIMPLES 
            ? `Arquivo muito grande para envio direto (${tamanhoFormatado}). Use o método alternativo.`
            : 'Tente novamente ou use um arquivo menor.',
        permiteLinkManual: arquivo.size > CONFIG.LIMITE_SIMPLES
    };
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
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ============================================
// FUNÇÕES DO SISTEMA (100% COMPATÍVEIS)
// ============================================

async function listarDemandasDoServidor(filtros = {}) {
    console.log('📋 Listando demandas...');
    
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
    console.log('💾 Salvando demanda...');
    
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'salvarDemanda',
            titulo: dados.titulo || '',
            descricao: dados.descricao || '',
            escolas: dados.escolas || [],
            departamento: dados.departamento || '',
            responsavel: dados.responsavel || 'Escola(s)',
            prazo: dados.prazo || '',
            enviarEmail: dados.enviarEmail || false,
            corpoEmail: dados.corpoEmail || '',
            anexos: dados.anexos || []
        });
        
        console.log('✅ Demanda salva com sucesso!');
        return resultado;
        
    } catch (erro) {
        console.error('❌ Erro ao salvar demanda:', erro);
        throw erro;
    }
}

async function enviarEmailDemanda(dados) {
    console.log('📧 Enviando e-mail...');
    
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'enviarEmailDemanda',
            ...dados
        });
        
        console.log('✅ E-mail enviado com sucesso!');
        return resultado;
        
    } catch (erro) {
        console.error('❌ Erro ao enviar e-mail:', erro);
        throw erro;
    }
}

async function atualizarStatusDemanda(id, novoStatus) {
    console.log(`🔄 Atualizando demanda #${id} para "${novoStatus}"`);
    
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'atualizarDemanda',
            id: id,
            status: novoStatus,
            alteracao: `Status alterado para: ${novoStatus}`
        });
        
        console.log('✅ Status atualizado!');
        return resultado;
        
    } catch (erro) {
        console.error('❌ Erro ao atualizar status:', erro);
        throw erro;
    }
}

// ============================================
// TESTES E DIAGNÓSTICO
// ============================================

async function testarConexao() {
    console.log('🔍 Testando conexão com o servidor...');
    
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'testarConexao'
        });
        
        console.log('✅ Conexão OK:', resultado);
        return {
            online: true,
            dados: resultado,
            mensagem: 'Servidor conectado e funcionando!'
        };
        
    } catch (erro) {
        console.warn('⚠️ Problema de conexão:', erro.message);
        return {
            online: false,
            erro: erro.message,
            mensagem: 'Não foi possível conectar ao servidor'
        };
    }
}

async function testarUploadRapido() {
    console.log('🧪 Teste rápido de upload...');
    
    // Criar arquivo de teste minúsculo
    const texto = 'Teste';
    const blob = new Blob([texto], { type: 'text/plain' });
    const arquivoTeste = new File([blob], 'teste.txt', {
        type: 'text/plain',
        lastModified: Date.now()
    });
    
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
// INICIALIZAÇÃO INTELIGENTE
// ============================================

console.log('🚀 Sistema de Demandas - Conectado');
console.log('📊 Configuração:', {
    limiteSimples: formatarTamanho(CONFIG.LIMITE_SIMPLES),
    limiteAlerta: formatarTamanho(CONFIG.LIMITE_ALERTA),
    limiteMaximo: formatarTamanho(CONFIG.LIMITE_MAXIMO)
});

// Verificar conexão ao carregar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        try {
            const status = await testarConexao();
            
            if (status.online) {
                console.log('✅ Sistema pronto para uso!');
                
                // Teste rápido opcional
                if (window.location.hostname === 'localhost' || window.location.hostname.includes('github')) {
                    setTimeout(testarUploadRapido, 3000);
                }
            } else {
                console.warn('⚠️ Sistema em modo limitado - servidor offline');
                // Mostrar aviso amigável
                if (typeof window.mostrarAvisoConexao === 'function') {
                    window.mostrarAvisoConexao('Servidor temporariamente indisponível. Algumas funções podem estar limitadas.');
                }
            }
        } catch (erro) {
            console.warn('⚠️ Não foi possível verificar status:', erro.message);
        }
    }, 1500);
});
// ============================================
// SISTEMA DE NOTIFICAÇÕES INTELIGENTES - FASE 7
// ============================================

// ID da planilha de configurações de notificações (criar nova)
const NOTIFICACOES_SHEET_ID = '1mE4VtKsZR_gL3ZQrWq7XqYd9JkLpOqRsT'; // Substituir pelo seu ID

/**
 * Configuração de notificações por tipo de usuário
 */
const NOTIFICATION_CONFIG = {
    supervisor: {
        email: true,
        push: true,
        departamentos: ['TODOS'],
        escolas: ['TODAS']
    },
    diretor: {
        email: true,
        push: true,
        departamentos: ['PEDAGÓGICO', 'ADMINISTRATIVO', 'FINANCEIRO'],
        escolas: ['PRÓPRIA'] // Veremos dinamicamente
    },
    comum: {
        email: true,
        push: false,
        departamentos: ['ESPECÍFICO'],
        escolas: ['PRÓPRIA']
    }
};

/**
 * Envia notificações segmentadas quando nova demanda é criada
 */
async function enviarNotificacoesNovaDemanda(demanda) {
    console.log('🔔 Enviando notificações inteligentes para nova demanda:', demanda.id);
    
    try {
        // Buscar usuários que devem receber notificação
        const usuarios = await buscarUsuariosPorPerfil(demanda);
        
        // Contadores
        let emailsEnviados = 0;
        let notificacoesPush = 0;
        
        // Enviar notificações para cada grupo
        for (const usuario of usuarios) {
            if (deveNotificarUsuario(usuario, demanda)) {
                // Enviar email se configurado
                if (usuario.notificacoesEmail) {
                    const emailEnviado = await enviarEmailNotificacao(usuario, demanda);
                    if (emailEnviado) emailsEnviados++;
                }
                
                // Enviar notificação push se configurado e suportado
                if (usuario.notificacoesPush && usuario.pushToken) {
                    const pushEnviada = await enviarNotificacaoPush(usuario, demanda);
                    if (pushEnviada) notificacoesPush++;
                }
            }
        }
        
        // Registrar no log
        await registrarLogNotificacao(demanda, usuarios.length, emailsEnviados, notificacoesPush);
        
        return {
            sucesso: true,
            mensagem: `Notificações enviadas: ${emailsEnviados} emails, ${notificacoesPush} push`,
            totalUsuarios: usuarios.length,
            emailsEnviados: emailsEnviados,
            notificacoesPush: notificacoesPush
        };
        
    } catch (error) {
        console.error('❌ Erro ao enviar notificações:', error);
        return {
            sucesso: false,
            erro: error.message
        };
    }
}

/**
 * Busca usuários com base no perfil da demanda
 */
async function buscarUsuariosPorPerfil(demanda) {
    console.log('🔍 Buscando usuários para notificação...');
    
    try {
        // Buscar todos os usuários autorizados
        const usuarios = await listarUsuariosAutorizados();
        
        // Filtrar usuários que devem receber notificação
        const usuariosFiltrados = usuarios.filter(usuario => {
            // Supervisor vê tudo
            if (usuario.tipo === 'supervisor') {
                return true;
            }
            
            // Diretor: vê apenas sua escola
            if (usuario.tipo === 'diretor') {
                const escolasDemanda = demanda.escolas || [];
                return escolasDemanda.includes(usuario.escola);
            }
            
            // Usuário comum: vê apenas seu departamento+escola
            if (usuario.tipo === 'comum') {
                const departamentosUsuario = usuario.departamento ? 
                    usuario.departamento.split(',') : [];
                const escolasDemanda = demanda.escolas || [];
                
                const matchDept = departamentosUsuario.includes(demanda.departamento);
                const matchEscola = escolasDemanda.includes(usuario.escola);
                
                return matchDept && matchEscola;
            }
            
            return false;
        });
        
        console.log(`✅ ${usuariosFiltrados.length} usuários serão notificados`);
        return usuariosFiltrados;
        
    } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        return [];
    }
}

/**
 * Verifica se usuário deve receber notificação
 */
function deveNotificarUsuario(usuario, demanda) {
    // Verificar se usuário tem notificações ativas
    if (usuario.notificacoesAtivas === false) {
        return false;
    }
    
    // Verificar se demanda é urgente (notificar sempre)
    const prazo = new Date(demanda.prazo);
    const hoje = new Date();
    const diasRestantes = Math.floor((prazo - hoje) / (1000 * 60 * 60 * 24));
    
    // Demandas urgentes (menos de 3 dias) notificam todos
    if (diasRestantes <= 3) {
        return true;
    }
    
    // Para demandas normais, verificar preferências
    return true;
}

/**
 * Envia email de notificação personalizado
 */
async function enviarEmailNotificacao(usuario, demanda) {
    try {
        const assunto = `📋 Nova Demanda: ${demanda.titulo}`;
        
        let corpoEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Nova Demanda Criada</h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #3498db;">${demanda.titulo}</h3>
                    <p><strong>Departamento:</strong> ${demanda.departamento}</p>
                    <p><strong>Escola(s):</strong> ${Array.isArray(demanda.escolas) ? demanda.escolas.join(', ') : demanda.escolas}</p>
                    <p><strong>Prazo:</strong> ${formatarData(demanda.prazo)}</p>
                    <p><strong>Status:</strong> <span style="color: #e67e22;">${demanda.status || 'PENDENTE'}</span></p>
                    
                    <hr style="margin: 20px 0;">
                    
                    <h4>Descrição:</h4>
                    <p>${demanda.descricao || 'Sem descrição'}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${window.location.origin}/sistema-demandas-escolares/?demanda=${demanda.id}" 
                       style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                       👁️ Ver Demanda
                    </a>
                </div>
                
                <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
                    Esta é uma notificação automática do Sistema de Demandas Escolares.<br>
                    Para ajustar suas configurações de notificação, acesse seu perfil.
                </p>
            </div>
        `;
        
        // Enviar email via Google Apps Script
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'enviarEmail',
            para: usuario.email,
            assunto: assunto,
            corpo: corpoEmail,
            tipo: 'notificacao_nova_demanda'
        });
        
        return resultado.sucesso === true;
        
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        return false;
    }
}

/**
 * Envia notificação push via PWA
 */
async function enviarNotificacaoPush(usuario, demanda) {
    try {
        // Verificar se o navegador suporta notificações
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            console.log('⚠️ Navegador não suporta notificações push');
            return false;
        }
        
        // Verificar permissão
        const permissao = await Notification.requestPermission();
        if (permissao !== 'granted') {
            console.log('⚠️ Permissão para notificações não concedida');
            return false;
        }
        
        // Registrar service worker se necessário
        const registro = await navigator.serviceWorker.register('/sistema-demandas-escolares/public/sw-notificacoes.js');
        
        // Enviar notificação
        await registro.showNotification('Nova Demanda Escolar', {
            body: `${demanda.titulo} - ${demanda.departamento}`,
            icon: '/sistema-demandas-escolares/public/icons/192x192.png',
            badge: '/sistema-demandas-escolares/public/icons/96x96.png',
            vibrate: [200, 100, 200],
            tag: 'nova-demanda-' + demanda.id,
            data: {
                url: window.location.origin + '/sistema-demandas-escolares/?demanda=' + demanda.id,
                demandaId: demanda.id
            },
            actions: [
                {
                    action: 'ver',
                    title: 'Ver Demanda'
                },
                {
                    action: 'adiar',
                    title: 'Lembrar depois'
                }
            ]
        });
        
        console.log('✅ Notificação push enviada para:', usuario.nome);
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao enviar notificação push:', error);
        return false;
    }
}

/**
 * Registra log de notificações enviadas
 */
async function registrarLogNotificacao(demanda, totalUsuarios, emails, pushes) {
    try {
        const log = {
            data: new Date().toISOString(),
            demandaId: demanda.id,
            demandaTitulo: demanda.titulo,
            departamento: demanda.departamento,
            escolas: Array.isArray(demanda.escolas) ? demanda.escolas.join(', ') : demanda.escolas,
            totalUsuarios: totalUsuarios,
            emailsEnviados: emails,
            pushesEnviados: pushes,
            status: 'enviada'
        };
        
        await enviarParaGoogleAppsScript({
            acao: 'registrarLogNotificacao',
            log: log
        });
        
    } catch (error) {
        console.error('❌ Erro ao registrar log:', error);
    }
}

/**
 * Configura notificações do usuário
 */
async function configurarNotificacoesUsuario(usuarioId, configuracoes) {
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'configurarNotificacoes',
            usuarioId: usuarioId,
            configuracoes: configuracoes
        });
        
        return resultado;
        
    } catch (error) {
        console.error('❌ Erro ao configurar notificações:', error);
        throw error;
    }
}

/**
 * Verifica se há notificações pendentes para o usuário
 */
async function verificarNotificacoesPendentes(usuario) {
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'verificarNotificacoes',
            usuarioId: usuario.id,
            tipo: usuario.tipo,
            departamento: usuario.departamento,
            escola: usuario.escola
        });
        
        return resultado.dados || [];
        
    } catch (error) {
        console.error('❌ Erro ao verificar notificações:', error);
        return [];
    }
}

/**
 * Marca notificação como lida
 */
async function marcarNotificacaoComoLida(notificacaoId) {
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'marcarNotificacaoLida',
            notificacaoId: notificacaoId
        });
        
        return resultado;
        
    } catch (error) {
        console.error('❌ Erro ao marcar notificação como lida:', error);
        throw error;
    }
}

// ============================================
// FUNÇÕES AUXILIARES DE DATA
// ============================================

function formatarData(dataString) {
    if (!dataString) return 'Não definido';
    
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ============================================
// INTEGRAÇÃO COM O SISTEMA EXISTENTE
// ============================================

// Função que deve ser chamada após salvar uma nova demanda
async function notificarAposSalvarDemanda(demandaSalva) {
    if (!demandaSalva || !demandaSalva.id) {
        console.error('❌ Dados da demanda inválidos para notificação');
        return;
    }
    
    try {
        // Adicionar delay para garantir que a demanda foi salva
        setTimeout(async () => {
            console.log('🔔 Disparando notificações para nova demanda...');
            
            const resultado = await enviarNotificacoesNovaDemanda(demandaSalva);
            
            if (resultado.sucesso) {
                console.log(`✅ Notificações enviadas: ${resultado.emailsEnviados} emails, ${resultado.notificacoesPush} push`);
                
                // Mostrar feedback para o supervisor
                if (typeof window.mostrarToast === 'function') {
                    window.mostrarToast({
                        mensagem: `Demanda criada! Notificações enviadas para ${resultado.totalUsuarios} usuários`,
                        tipo: 'sucesso'
                    });
                }
            } else {
                console.error('❌ Falha ao enviar notificações:', resultado.erro);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro no processo de notificação:', error);
    }
}

// ============================================
// SERVICE WORKER PARA NOTIFICAÇÕES PUSH
// ============================================

// Adicionar novo arquivo: public/sw-notificacoes.js

// ============================================
// EXPORTAÇÃO DAS FUNÇÕES DE NOTIFICAÇÃO
// ============================================

window.enviarNotificacoesNovaDemanda = enviarNotificacoesNovaDemanda;
window.notificarAposSalvarDemanda = notificarAposSalvarDemanda;
window.configurarNotificacoesUsuario = configurarNotificacoesUsuario;
window.verificarNotificacoesPendentes = verificarNotificacoesPendentes;
window.marcarNotificacaoComoLida = marcarNotificacaoComoLida;

console.log('✅ Sistema de notificações inteligentes carregado!');
// ============================================
// EXPORTAÇÃO PARA USO GLOBAL
// ============================================

// Funções principais (usadas pelo app.js)
window.fazerUploadArquivo = fazerUploadArquivo;
window.listarDemandasDoServidor = listarDemandasDoServidor;
window.salvarDemandaNoServidor = salvarDemandaNoServidor;
window.enviarEmailDemanda = enviarEmailDemanda;
window.atualizarStatusDemanda = atualizarStatusDemanda;

// Funções auxiliares
window.enviarParaGoogleAppsScript = enviarParaGoogleAppsScript;
window.testarConexao = testarConexao;
window.testarUploadRapido = testarUploadRapido;

// Funções utilitárias
window.formatarTamanhoArquivo = formatarTamanho;
window.arquivoParaBase64 = arquivoParaBase64;

console.log('✅ googleAppsScript.js carregado com sucesso!');
console.log('📋 Funções disponíveis:', Object.keys(window).filter(k => k.includes('Upload') || k.includes('Demanda')));
