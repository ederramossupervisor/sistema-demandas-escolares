// Arquivo: src/js/test-autenticacao.js
console.log('🔐 TESTE DE AUTENTICAÇÃO - ETAPA 2');

async function testarAutenticacao() {
    console.log('='.repeat(60));
    console.log('🔐 TESTANDO SISTEMA DE AUTENTICAÇÃO');
    console.log('='.repeat(60));
    
    try {
        // 1. Verificar usuário atual
        console.log('👤 1. Verificando usuário atual...');
        const usuarioAtual = await obterUsuarioAtual();
        
        if (!usuarioAtual) {
            console.error('❌ Nenhum usuário encontrado no localStorage');
            return { sucesso: false, erro: 'Usuário não autenticado' };
        }
        
        console.log('✅ Usuário atual:', usuarioAtual.email);
        
        // 2. Testar endpoint validarLogin
        console.log('🔐 2. Testando endpoint validarLogin...');
        const testeLogin = await testarEndpointLogin(usuarioAtual.email, 'senha_teste');
        
        if (testeLogin.sucesso) {
            console.log('✅ Endpoint validarLogin funcionando!');
            
            // 3. Verificar permissões
            console.log('🛡️ 3. Verificando permissões...');
            const permissoes = await verificarPermissoes(usuarioAtual);
            
            // 4. Resultado final
            console.log('='.repeat(60));
            console.log('📊 RESULTADO DA AUTENTICAÇÃO:');
            console.log(`✅ Usuário: ${usuarioAtual.nome}`);
            console.log(`✅ Email: ${usuarioAtual.email}`);
            console.log(`✅ Tipo: ${usuarioAtual.tipo_usuario}`);
            console.log(`✅ Escola: ${usuarioAtual.escola_sre}`);
            console.log(`✅ Departamento: ${usuarioAtual.departamento}`);
            console.log(`✅ Permissões: ${permissoes.sucesso ? 'OK' : 'LIMITADAS'}`);
            console.log('='.repeat(60));
            
            // Mostrar painel de autenticação
            mostrarPainelAutenticacao(usuarioAtual, testeLogin, permissoes);
            
            return {
                sucesso: true,
                usuario: usuarioAtual,
                loginTeste: testeLogin,
                permissoes: permissoes
            };
            
        } else {
            console.error('❌ Endpoint validarLogin falhou:', testeLogin.erro);
            return { sucesso: false, erro: 'Falha na autenticação' };
        }
        
    } catch (erro) {
        console.error('❌ Erro no teste de autenticação:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

async function obterUsuarioAtual() {
    try {
        const usuarioSalvo = localStorage.getItem('usuario_demandas');
        if (!usuarioSalvo) return null;
        
        return JSON.parse(usuarioSalvo);
    } catch (e) {
        console.error('Erro ao obter usuário:', e);
        return null;
    }
}

async function testarEndpointLogin(email, senha) {
    return new Promise((resolve) => {
        const callbackName = 'testeLogin_' + Date.now();
        
        window[callbackName] = function(resposta) {
            delete window[callbackName];
            
            console.log('📨 Resposta do validarLogin:', resposta);
            
            if (resposta && resposta.sucesso) {
                resolve({
                    sucesso: true,
                    dados: resposta.dados,
                    mensagem: 'Autenticação funcionando'
                });
            } else {
                resolve({
                    sucesso: false,
                    erro: resposta?.erro || 'Credenciais inválidas',
                    dados: resposta
                });
            }
        };
        
        // URL do backend (usando a mesma do googleAppsScript.js)
        const backendUrl = window.SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwpwemYlgy4jCJTaginH21BjPUntVXNDNiy41wGZNWtCZ_ol8f6l046Qe7e7PjzneOe/exec';
        
        // NOTA: Não enviamos senha real, apenas testamos o endpoint
        const url = `${backendUrl}?callback=${callbackName}&acao=validarLogin&email=${encodeURIComponent(email)}&teste=true&_=${Date.now()}`;
        
        console.log('🔗 URL do teste:', url);
        
        const script = document.createElement('script');
        script.src = url;
        
        const timeoutId = setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                resolve({
                    sucesso: false,
                    erro: 'Timeout - Servidor não respondeu'
                });
            }
        }, 10000);
        
        script.onload = () => clearTimeout(timeoutId);
        script.onerror = () => {
            clearTimeout(timeoutId);
            if (window[callbackName]) delete window[callbackName];
            resolve({
                sucesso: false,
                erro: 'Erro de rede ao testar login'
            });
        };
        
        document.body.appendChild(script);
    });
}

async function verificarPermissoes(usuario) {
    const permissoes = {
        podeCriarDemanda: usuario.tipo_usuario === 'supervisor',
        podeExcluirDemanda: usuario.tipo_usuario === 'supervisor',
        podeVerTodasEscolas: usuario.tipo_usuario === 'supervisor',
        podeVerTodosDepartamentos: usuario.tipo_usuario === 'supervisor',
        departamentosAcessiveis: obterDepartamentosPorTipo(usuario.tipo_usuario, usuario.departamento),
        escolasAcessiveis: obterEscolasPorTipo(usuario.tipo_usuario, usuario.escola_sre)
    };
    
    return {
        sucesso: true,
        permissoes: permissoes,
        mensagem: `Permissões carregadas para ${usuario.tipo_usuario}`
    };
}

function obterDepartamentosPorTipo(tipo, departamentoUsuario) {
    switch(tipo) {
        case 'supervisor':
            return ['Gestão', 'Secretaria', 'Pedagógico', 'Supervisão'];
        case 'gestor':
            return ['Gestão', 'Secretaria', 'Pedagógico']; // Exceto Supervisão
        case 'comum':
            return [departamentoUsuario || 'Pedagógico'];
        default:
            return [departamentoUsuario || 'Não definido'];
    }
}

function obterEscolasPorTipo(tipo, escolaUsuario) {
    switch(tipo) {
        case 'supervisor':
            return ['EEEFM Pedra Azul', 'EEEFM Fioravante Caliman', 'EEEFM Alto Rio Possmoser'];
        default:
            return [escolaUsuario || 'Não definida'];
    }
}

function mostrarPainelAutenticacao(usuario, testeLogin, permissoes) {
    const painel = document.createElement('div');
    painel.id = 'painel-autenticacao';
    painel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        padding: 20px;
        z-index: 10000;
        max-width: 400px;
        border-left: 5px solid #27ae60;
        animation: slideInTop 0.3s ease;
    `;
    
    const titulo = document.createElement('h3');
    titulo.style.cssText = 'margin: 0 0 15px 0; color: #2c3e50; font-size: 16px; display: flex; align-items: center; gap: 10px;';
    titulo.innerHTML = `<i class="fas fa-user-shield"></i> Autenticação Testada`;
    
    const conteudo = document.createElement('div');
    conteudo.style.cssText = 'font-size: 14px; line-height: 1.5;';
    
    conteudo.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>👤 Usuário:</strong> ${usuario.nome}
        </div>
        <div style="margin-bottom: 10px;">
            <strong>📧 Email:</strong> ${usuario.email}
        </div>
        <div style="margin-bottom: 10px;">
            <strong>🎯 Tipo:</strong> <span style="color: ${usuario.tipo_usuario === 'supervisor' ? '#e74c3c' : '#3498db'}">
                ${usuario.tipo_usuario === 'supervisor' ? '👑 Supervisor' : usuario.tipo_usuario === 'gestor' ? '👔 Diretor' : '👤 Usuário'}
            </span>
        </div>
        <div style="margin-bottom: 10px;">
            <strong>🏫 Escola:</strong> ${usuario.escola_sre || 'Não definida'}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>🏢 Departamento:</strong> ${usuario.departamento || 'Não definido'}
        </div>
        
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
            <strong>🔐 Status Login:</strong> 
            <span style="color: #27ae60; font-weight: bold;">✅ ATIVO</span>
        </div>
        
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
            <strong>🛡️ Permissões:</strong><br>
            • Criar demandas: ${permissoes.permissoes.podeCriarDemanda ? '✅ Sim' : '❌ Não'}<br>
            • Excluir demandas: ${permissoes.permissoes.podeExcluirDemanda ? '✅ Sim' : '❌ Não'}<br>
            • Ver todas escolas: ${permissoes.permissoes.podeVerTodasEscolas ? '✅ Sim' : '❌ Não'}<br>
            • Departamentos: ${permissoes.permissoes.departamentosAcessiveis.join(', ')}
        </div>
    `;
    
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
    btnFechar.innerHTML = `<i class="fas fa-check-circle"></i> Continuar para ETAPA 3`;
    btnFechar.onclick = () => {
        painel.style.animation = 'slideOutTop 0.3s ease';
        setTimeout(() => {
            painel.remove();
            // Iniciar próxima etapa (CRUD de demandas)
            console.log('🚀 Pronto para ETAPA 3 - CRUD de Demandas');
            if (window.testarCRUDDemandas) {
                window.testarCRUDDemandas();
            }
        }, 300);
    };
    
    // Adicionar animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInTop {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideOutTop {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(-100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    painel.appendChild(titulo);
    painel.appendChild(conteudo);
    painel.appendChild(btnFechar);
    
    document.body.appendChild(painel);
    
    // Remover após 45 segundos se não fechar
    setTimeout(() => {
        if (painel.parentNode) {
            painel.remove();
        }
    }, 45000);
}

// Adicionar ao window para teste manual
window.testarAutenticacao = testarAutenticacao;

console.log('✅ Script de autenticação carregado. Use: testarAutenticacao()');
