// Arquivo: src/js/test-conexao.js
console.log('🚀 TESTE DE CONEXÃO - SISTEMA DE DEMANDAS ESCOLARES');

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Sistema carregado, iniciando testes...');
    
    // Aguardar 3 segundos para tudo carregar
    setTimeout(async () => {
        console.log('='.repeat(60));
        console.log('🔍 INICIANDO TESTES DE INTEGRAÇÃO COM BACKEND');
        console.log('='.repeat(60));
        
        await executarTestesCompletos();
    }, 3000);
});

async function executarTestesCompletos() {
    try {
        // Teste 1: Conexão básica
        const conexao = await testarConexaoBasica();
        
        if (!conexao.sucesso) {
            console.error('❌ TESTE 1 FALHOU: Servidor não responde');
            mostrarResultadoTeste('Conexão básica', '❌ FALHA', 'error');
            return;
        }
        
        console.log('✅ TESTE 1: Conexão básica - OK');
        mostrarResultadoTeste('Conexão básica', '✅ OK', 'success');
        
        // Teste 2: Verificar endpoints disponíveis
        const endpoints = await testarEndpoints();
        
        if (endpoints.sucesso) {
            console.log('✅ TESTE 2: Endpoints - OK');
            mostrarResultadoTeste('Endpoints ativos', '✅ OK', 'success');
        } else {
            console.warn('⚠️ TESTE 2: Alguns endpoints podem não funcionar');
            mostrarResultadoTeste('Endpoints', '⚠️ PARCIAL', 'warning');
        }
        
        // Teste 3: Testar listarDemandas
        const demandaTeste = await testarListarDemandas();
        
        if (demandaTeste.sucesso) {
            console.log('✅ TESTE 3: Listar demandas - OK');
            mostrarResultadoTeste('Listar demandas', '✅ OK', 'success');
        } else {
            console.warn('⚠️ TESTE 3: listarDemandas não funcionou');
            mostrarResultadoTeste('Listar demandas', '⚠️ FALHA', 'warning');
        }
        
        // Resumo final
        console.log('='.repeat(60));
        console.log('📊 RESUMO DOS TESTES:');
        console.log(`✅ Conexão: ${conexao.sucesso ? 'OK' : 'FALHA'}`);
        console.log(`✅ Endpoints: ${endpoints.sucesso ? 'OK' : 'PARCIAL'}`);
        console.log(`✅ Demandas: ${demandaTeste.sucesso ? 'OK' : 'FALHA'}`);
        console.log('='.repeat(60));
        
        // Mostrar painel de resultados
        mostrarPainelResultados(conexao, endpoints, demandaTeste);
        
    } catch (erro) {
        console.error('❌ ERRO CRÍTICO NOS TESTES:', erro);
        mostrarResultadoTeste('Sistema', '❌ ERRO CRÍTICO', 'error');
    }
}

async function testarConexaoBasica() {
    console.log('📡 Testando conexão básica...');
    
    return new Promise((resolve) => {
        const callbackName = 'testeConexaoBasica_' + Date.now();
        
        window[callbackName] = function(resposta) {
            delete window[callbackName];
            
            console.log('📨 Resposta do servidor:', resposta);
            
            if (resposta && typeof resposta === 'object') {
                resolve({
                    sucesso: true,
                    dados: resposta,
                    mensagem: 'Servidor respondendo corretamente',
                    timestamp: new Date().toISOString()
                });
            } else {
                resolve({
                    sucesso: false,
                    erro: 'Resposta inválida do servidor',
                    dados: resposta
                });
            }
        };
        
        // Usar a URL do googleAppsScript.js (que você já atualizou)
        const urlTeste = `${window.SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwpwemYlgy4jCJTaginH21BjPUntVXNDNiy41wGZNWtCZ_ol8f6l046Qe7e7PjzneOe/exec'}?callback=${callbackName}&acao=testarConexao&_=${Date.now()}`;
        
        console.log('🔗 URL do teste:', urlTeste);
        
        const script = document.createElement('script');
        script.src = urlTeste;
        
        // Timeout de 10 segundos
        const timeoutId = setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                resolve({
                    sucesso: false,
                    erro: 'Timeout - Servidor não respondeu em 10 segundos'
                });
            }
        }, 10000);
        
        script.onload = () => clearTimeout(timeoutId);
        script.onerror = () => {
            clearTimeout(timeoutId);
            if (window[callbackName]) delete window[callbackName];
            resolve({
                sucesso: false,
                erro: 'Erro de rede/CORS ao carregar script'
            });
        };
        
        document.body.appendChild(script);
    });
}

async function testarEndpoints() {
    console.log('🔌 Testando endpoints disponíveis...');
    
    const endpointsParaTestar = [
        'listarDemandas',
        'salvarDemanda',
        'validarLogin',
        'salvarSubscription',
        'enviarEmailDemanda',
        'uploadArquivo'
    ];
    
    try {
        // Testar apenas listarDemandas por enquanto (os outros precisam de parâmetros)
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'listarDemandas'
        });
        
        return {
            sucesso: true,
            endpointsAtivos: ['listarDemandas'],
            mensagem: 'Endpoint listarDemandas está ativo'
        };
        
    } catch (erro) {
        return {
            sucesso: false,
            erro: erro.message,
            endpointsAtivos: []
        };
    }
}

async function testarListarDemandas() {
    console.log('📋 Testando listarDemandas...');
    
    try {
        // Usar a função já existente
        if (typeof window.enviarParaGoogleAppsScript === 'function') {
            const resultado = await window.enviarParaGoogleAppsScript({
                acao: 'listarDemandas'
            });
            
            console.log('📊 Resultado listarDemandas:', resultado);
            
            return {
                sucesso: true,
                quantidade: Array.isArray(resultado) ? resultado.length : 0,
                dados: Array.isArray(resultado) ? resultado.slice(0, 3) : [], // Primeiras 3
                mensagem: `Recebidas ${Array.isArray(resultado) ? resultado.length : 0} demandas`
            };
        } else {
            return {
                sucesso: false,
                erro: 'Função enviarParaGoogleAppsScript não encontrada'
            };
        }
    } catch (erro) {
        console.error('❌ Erro no listarDemandas:', erro);
        return {
            sucesso: false,
            erro: erro.message
        };
    }
}

function mostrarResultadoTeste(titulo, status, tipo) {
    console.log(`📝 ${titulo}: ${status}`);
    
    // Usar toast existente ou criar um simples
    if (typeof window.mostrarToast === 'function') {
        window.mostrarToast(`Teste: ${titulo}`, status, tipo);
    }
}

function mostrarPainelResultados(conexao, endpoints, demandaTeste) {
    console.log('🎨 Criando painel de resultados...');
    
    // Criar elemento para mostrar resultados
    const painel = document.createElement('div');
    painel.id = 'painel-testes-backend';
    painel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        padding: 20px;
        z-index: 10000;
        max-width: 400px;
        border-left: 5px solid ${conexao.sucesso ? '#27ae60' : '#e74c3c'};
        animation: slideInRight 0.3s ease;
    `;
    
    const titulo = document.createElement('h3');
    titulo.style.cssText = 'margin: 0 0 15px 0; color: #2c3e50; font-size: 16px; display: flex; align-items: center; gap: 10px;';
    titulo.innerHTML = `<i class="fas fa-server"></i> Testes de Backend`;
    
    const lista = document.createElement('ul');
    lista.style.cssText = 'list-style: none; margin: 0; padding: 0;';
    
    // Item 1: Conexão
    const item1 = document.createElement('li');
    item1.style.cssText = 'padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;';
    item1.innerHTML = `
        <span>Conexão básica</span>
        <span style="color: ${conexao.sucesso ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
            ${conexao.sucesso ? '✅ OK' : '❌ FALHA'}
        </span>
    `;
    
    // Item 2: Endpoints
    const item2 = document.createElement('li');
    item2.style.cssText = 'padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;';
    item2.innerHTML = `
        <span>Endpoints ativos</span>
        <span style="color: ${endpoints.sucesso ? '#27ae60' : '#f39c12'}; font-weight: bold;">
            ${endpoints.sucesso ? '✅ OK' : '⚠️ PARCIAL'}
        </span>
    `;
    
    // Item 3: Demandas
    const item3 = document.createElement('li');
    item3.style.cssText = 'padding: 8px 0; display: flex; justify-content: space-between; align-items: center;';
    item3.innerHTML = `
        <span>Listar demandas</span>
        <span style="color: ${demandaTeste.sucesso ? '#27ae60' : '#f39c12'}; font-weight: bold;">
            ${demandaTeste.sucesso ? `✅ ${demandaTeste.quantidade || 0} itens` : '❌ FALHA'}
        </span>
    `;
    
    // Botão de fechar
    const btnFechar = document.createElement('button');
    btnFechar.style.cssText = `
        width: 100%;
        margin-top: 15px;
        padding: 10px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    `;
    btnFechar.innerHTML = `<i class="fas fa-check"></i> Entendido`;
    btnFechar.onclick = () => {
        painel.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => painel.remove(), 300);
    };
    
    // Adicionar animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Montar painel
    lista.appendChild(item1);
    lista.appendChild(item2);
    lista.appendChild(item3);
    
    painel.appendChild(titulo);
    painel.appendChild(lista);
    painel.appendChild(btnFechar);
    
    document.body.appendChild(painel);
    
    // Remover automaticamente após 30 segundos
    setTimeout(() => {
        if (painel.parentNode) {
            painel.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => painel.remove(), 300);
        }
    }, 30000);
}

// Adicionar ao window para teste manual
window.testarBackend = executarTestesCompletos;
window.testarConexao = testarConexaoBasica;

console.log('✅ Script de teste carregado. Use: testarBackend() ou testarConexao()');
