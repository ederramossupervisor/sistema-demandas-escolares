// Arquivo: src/js/test-endpoints-backend.js
console.log('🔍 VERIFICAÇÃO DE ENDPOINTS - ETAPA 4.2');

async function verificarEndpointsBackend() {
    console.log('='.repeat(60));
    console.log('🔍 VERIFICANDO ENDPOINTS DISPONÍVEIS');
    console.log('='.repeat(60));
    
    const endpointsParaTestar = [
        { nome: 'salvarDemanda', acao: 'salvarDemanda', esperaResposta: true },
        { nome: 'listarDemandas', acao: 'listarDemandas', esperaResposta: true },
        { nome: 'validarLogin', acao: 'validarLogin', esperaResposta: true },
        { nome: 'salvarSubscription', acao: 'salvarSubscription', esperaResposta: true },
        { nome: 'enviarEmailDemanda', acao: 'enviarEmailDemanda', esperaResposta: true },
        { nome: 'enviarEmail', acao: 'enviarEmail', esperaResposta: true },
        { nome: 'enviarNotificacaoTeste', acao: 'enviarNotificacaoTeste', esperaResposta: true },
        { nome: 'uploadArquivo', acao: 'uploadArquivo', esperaResposta: true },
        { nome: 'atualizarDemanda', acao: 'atualizarDemanda', esperaResposta: true }
    ];
    
    const resultados = [];
    
    for (const endpoint of endpointsParaTestar) {
        console.log(`🧪 Testando: ${endpoint.nome}...`);
        const resultado = await testarEndpointEspecifico(endpoint);
        resultados.push(resultado);
        
        // Pequena pausa entre testes
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Análise dos resultados
    console.log('='.repeat(60));
    console.log('📊 ANÁLISE DOS ENDPOINTS:');
    console.log('='.repeat(60));
    
    const endpointsFuncionais = resultados.filter(r => r.funcional);
    const endpointsProblema = resultados.filter(r => !r.funcional);
    
    console.log(`✅ Funcionais: ${endpointsFuncionais.length}/${resultados.length}`);
    endpointsFuncionais.forEach(ep => {
        console.log(`   • ${ep.nome}: ${ep.mensagem}`);
    });
    
    console.log(`\n❌ Com problemas: ${endpointsProblema.length}/${resultados.length}`);
    endpointsProblema.forEach(ep => {
        console.log(`   • ${ep.nome}: ${ep.erro || 'Resposta incorreta'}`);
    });
    
    // Verificar padrão de resposta
    console.log('\n🔍 PADRÃO DAS RESPOSTAS:');
    const respostasUnicas = [...new Set(resultados.map(r => r.tipoResposta))];
    console.log('   Tipos de resposta:', respostasUnicas);
    
    // Mostrar painel com resultados
    mostrarPainelEndpoints(resultados);
    
    return {
        sucesso: endpointsFuncionais.length > resultados.length / 2,
        total: resultados.length,
        funcionais: endpointsFuncionais.length,
        problemas: endpointsProblema.length,
        detalhes: resultados
    };
}

async function testarEndpointEspecifico(endpoint) {
    return new Promise((resolve) => {
        const callbackName = `testeEndpoint_${endpoint.nome}_${Date.now()}`;
        
        window[callbackName] = function(resposta) {
            delete window[callbackName];
            
            console.log(`📨 Resposta ${endpoint.nome}:`, resposta);
            
            // Análise da resposta
            let funcional = false;
            let tipoResposta = 'desconhecido';
            let mensagem = '';
            let erro = null;
            
            if (!resposta) {
                erro = 'Resposta vazia';
            } else if (resposta.status === 'online' && resposta.sistema) {
                // Resposta padrão de teste
                tipoResposta = 'padrao_teste';
                erro = 'Retornando resposta padrão, não específica';
                mensagem = '⚠️ Endpoint pode não estar implementado';
            } else if (resposta.sucesso !== undefined) {
                // Resposta com estrutura de sucesso/erro
                tipoResposta = 'estruturada';
                funcional = resposta.sucesso !== false;
                mensagem = resposta.mensagem || (resposta.sucesso ? 'OK' : 'Falha');
            } else if (Array.isArray(resposta)) {
                // Resposta é array (listarDemandas)
                tipoResposta = 'array';
                funcional = true;
                mensagem = `${resposta.length} itens`;
            } else if (typeof resposta === 'object') {
                // Outro objeto
                tipoResposta = 'objeto';
                funcional = true;
                mensagem = 'Resposta em objeto';
            } else {
                tipoResposta = 'outro';
                erro = 'Tipo de resposta não reconhecido';
            }
            
            resolve({
                nome: endpoint.nome,
                funcional: funcional,
                tipoResposta: tipoResposta,
                mensagem: mensagem,
                erro: erro,
                resposta: resposta
            });
        };
        
        // Criar URL de teste
        const backendUrl = window.SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwpwemYlgy4jCJTaginH21BjPUntVXNDNiy41wGZNWtCZ_ol8f6l046Qe7e7PjzneOe/exec';
        let url = `${backendUrl}?callback=${callbackName}&acao=${endpoint.acao}`;
        
        // Adicionar parâmetros mínimos para alguns endpoints
        if (endpoint.nome === 'validarLogin') {
            url += `&email=teste@exemplo.com&teste=true`;
        } else if (endpoint.nome === 'salvarSubscription') {
            url += `&fcmToken=teste_token&tipo=firebase&email=teste@exemplo.com`;
        }
        
        url += `&_=${Date.now()}`;
        
        console.log(`🔗 URL: ${url.substring(0, 100)}...`);
        
        const script = document.createElement('script');
        script.src = url;
        
        const timeoutId = setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                resolve({
                    nome: endpoint.nome,
                    funcional: false,
                    tipoResposta: 'timeout',
                    mensagem: '',
                    erro: 'Timeout - não respondeu em 10s',
                    resposta: null
                });
            }
        }, 10000);
        
        script.onload = () => clearTimeout(timeoutId);
        script.onerror = () => {
            clearTimeout(timeoutId);
            if (window[callbackName]) delete window[callbackName];
            resolve({
                nome: endpoint.nome,
                funcional: false,
                tipoResposta: 'erro_rede',
                mensagem: '',
                erro: 'Erro de rede/CORS',
                resposta: null
            });
        };
        
        document.body.appendChild(script);
    });
}

function mostrarPainelEndpoints(resultados) {
    const painel = document.createElement('div');
    painel.id = 'painel-endpoints';
    painel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        padding: 25px;
        z-index: 10000;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        animation: slideInRight 0.3s ease;
        border-left: 5px solid #2c3e50;
    `;
    
    const titulo = document.createElement('h3');
    titulo.style.cssText = 'margin: 0 0 20px 0; color: #2c3e50; font-size: 18px; display: flex; align-items: center; gap: 10px;';
    titulo.innerHTML = `<i class="fas fa-network-wired"></i> Endpoints do Backend`;
    
    const subtitulo = document.createElement('div');
    subtitulo.style.cssText = 'margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 14px;';
    
    const total = resultados.length;
    const funcionais = resultados.filter(r => r.funcional).length;
    const percentual = Math.round((funcionais / total) * 100);
    
    subtitulo.innerHTML = `
        <strong>📊 Status Geral:</strong>
        <div style="margin-top: 8px; display: flex; align-items: center; gap: 15px;">
            <div style="font-size: 24px; font-weight: bold; color: ${percentual >= 70 ? '#27ae60' : percentual >= 40 ? '#f39c12' : '#e74c3c'}">
                ${percentual}%
            </div>
            <div>
                <div>✅ ${funcionais} funcionais</div>
                <div>❌ ${total - funcionais} com problemas</div>
            </div>
        </div>
    `;
    
    const lista = document.createElement('div');
    lista.style.cssText = 'margin-bottom: 25px;';
    
    resultados.forEach((ep, index) => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 12px 15px;
            margin-bottom: 10px;
            background: ${ep.funcional ? '#e8f7ef' : '#fdeaea'};
            border-radius: 8px;
            border-left: 4px solid ${ep.funcional ? '#27ae60' : '#e74c3c'};
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        item.innerHTML = `
            <div>
                <div style="font-weight: bold; color: #2c3e50;">${ep.nome}</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    ${ep.mensagem || ep.erro || ep.tipoResposta}
                </div>
            </div>
            <div style="font-size: 20px;">
                ${ep.funcional ? '✅' : '❌'}
            </div>
        `;
        
        lista.appendChild(item);
    });
    
    const alerta = document.createElement('div');
    alerta.style.cssText = 'background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; border-left: 4px solid #ffc107;';
    alerta.innerHTML = `
        <strong>⚠️ OBSERVAÇÃO IMPORTANTE:</strong><br>
        Alguns endpoints podem estar retornando a <strong>resposta padrão de teste</strong> 
        em vez de processar a ação solicitada. Isso pode indicar que:
        <ul style="margin: 10px 0 0 20px;">
            <li>O endpoint não está implementado no backend</li>
            <li>Há erro nos parâmetros enviados</li>
            <li>O backend está em modo de manutenção</li>
        </ul>
    `;
    
    const botoes = document.createElement('div');
    botoes.style.cssText = 'display: flex; gap: 10px;';
    
    const btnFechar = document.createElement('button');
    btnFechar.style.cssText = `
        flex: 1;
        padding: 14px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-size: 15px;
    `;
    btnFechar.innerHTML = `<i class="fas fa-check"></i> Entendi`;
    btnFechar.onclick = () => {
        painel.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => painel.remove(), 300);
    };
    
    const btnTestarNovamente = document.createElement('button');
    btnTestarNovamente.style.cssText = `
        flex: 1;
        padding: 14px;
        background: #95a5a6;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-size: 15px;
    `;
    btnTestarNovamente.innerHTML = `<i class="fas fa-redo"></i> Testar Novamente`;
    btnTesterNovamente.onclick = () => {
        painel.remove();
        verificarEndpointsBackend();
    };
    
    botoes.appendChild(btnFechar);
    botoes.appendChild(btnTestarNovamente);
    
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
    painel.appendChild(titulo);
    painel.appendChild(subtitulo);
    painel.appendChild(lista);
    painel.appendChild(alerta);
    painel.appendChild(botoes);
    
    document.body.appendChild(painel);
    
    // Remover após 90 segundos
    setTimeout(() => {
        if (painel.parentNode) {
            painel.remove();
        }
    }, 90000);
}

// Adicionar ao window
window.verificarEndpointsBackend = verificarEndpointsBackend;

console.log('✅ Script de verificação carregado. Use: verificarEndpointsBackend()');
