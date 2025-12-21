// Arquivo: src/js/test-notificacoes-corrigido.js
console.log('🔔 TESTE CORRIGIDO DE NOTIFICAÇÕES - ETAPA 4.1');

async function testarNotificacoesCorrigido() {
    console.log('='.repeat(60));
    console.log('🔔 TESTES CORRIGIDOS DE NOTIFICAÇÕES');
    console.log('='.repeat(60));
    
    try {
        // TESTE A: Notificações Nativas (Fallback)
        console.log('📱 A. Testando notificações nativas...');
        const notificacaoNative = await testarNotificacaoNativa();
        
        // TESTE B: E-mail Direto (sem escola)
        console.log('📧 B. Testando e-mail direto...');
        const emailDireto = await testarEmailDireto();
        
        // TESTE C: Notificação via Servidor (alternativa)
        console.log('🌐 C. Testando notificação via servidor...');
        const notificacaoServidor = await testarNotificacaoServidor();
        
        // Resultados
        console.log('='.repeat(60));
        console.log('📊 RESULTADOS CORRIGIDOS:');
        console.log(`📱 Notificação Nativa: ${notificacaoNative.sucesso ? '✅ OK' : '❌ FALHA'}`);
        console.log(`📧 E-mail Direto: ${emailDireto.sucesso ? '✅ OK' : '❌ FALHA'}`);
        console.log(`🌐 Notificação Servidor: ${notificacaoServidor.sucesso ? '✅ OK' : '❌ FALHA'}`);
        console.log('='.repeat(60));
        
        mostrarPainelCorrigido(notificacaoNative, emailDireto, notificacaoServidor);
        
        return {
            sucesso: true,
            resultados: {
                nativa: notificacaoNative,
                email: emailDireto,
                servidor: notificacaoServidor
            }
        };
        
    } catch (erro) {
        console.error('❌ Erro nos testes corrigidos:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

async function testarNotificacaoNativa() {
    try {
        // Verificar suporte a notificações
        if (!('Notification' in window)) {
            return {
                sucesso: false,
                erro: 'Navegador não suporta notificações',
                metodo: 'não suportado'
            };
        }
        
        // Verificar permissão
        let permissao = Notification.permission;
        
        if (permissao === 'default') {
            console.log('🔔 Solicitando permissão...');
            permissao = await Notification.requestPermission();
        }
        
        if (permissao === 'granted') {
            // Criar notificação nativa
            const notificacao = new Notification('🔔 Sistema de Demandas', {
                body: 'Teste de notificação nativa funcionando!',
                icon: '/sistema-demandas-escolares/public/icons/192x192.png',
                badge: '/sistema-demandas-escolares/public/icons/96x96.png',
                tag: 'teste-nativo',
                requireInteraction: false,
                silent: false,
                vibrate: [200, 100, 200]
            });
            
            // Adicionar evento de clique
            notificacao.onclick = function() {
                console.log('👆 Notificação clicada!');
                window.focus();
                this.close();
            };
            
            return {
                sucesso: true,
                metodo: 'nativa',
                mensagem: 'Notificação nativa exibida com sucesso'
            };
        } else {
            return {
                sucesso: false,
                erro: `Permissão negada: ${permissao}`,
                metodo: 'nativa'
            };
        }
        
    } catch (erro) {
        return {
            sucesso: false,
            erro: erro.message,
            metodo: 'nativa'
        };
    }
}

async function testarEmailDireto() {
    try {
        // Usar o endpoint de e-mail geral (não específico de demanda)
        const usuarioSalvo = localStorage.getItem('usuario_demandas');
        let usuario = null;
        
        if (usuarioSalvo) {
            try {
                usuario = JSON.parse(usuarioSalvo);
            } catch (e) {
                console.warn('Erro ao parsear usuário:', e);
            }
        }
        
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'enviarEmail',
            para: usuario ? usuario.email : 'ecramos@sedu.es.gov.br',
            assunto: '[TESTE DIRETO] E-mail do Sistema',
            corpo: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2 style="color: #2c3e50;">📧 Teste de E-mail Direto</h2>
                    <p>Este é um teste direto do sistema de e-mail.</p>
                    <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                    <p><strong>Status:</strong> Sistema funcionando!</p>
                </div>
            `,
            tipo: 'teste_direto'
        });
        
        console.log('📨 Resposta enviarEmail:', resultado);
        
        if (resultado && resultado.sucesso) {
            return {
                sucesso: true,
                dados: resultado,
                mensagem: 'E-mail direto enviado com sucesso'
            };
        } else {
            return {
                sucesso: false,
                erro: resultado?.erro || 'Erro desconhecido',
                dados: resultado
            };
        }
        
    } catch (erro) {
        return {
            sucesso: false,
            erro: erro.message
        };
    }
}

async function testarNotificacaoServidor() {
    try {
        // Usar o endpoint específico para teste
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'enviarNotificacaoTeste',
            titulo: '🔔 Teste do Servidor',
            mensagem: 'Notificação de teste enviada pelo servidor',
            tipo: 'teste_manual',
            timestamp: new Date().toISOString()
        });
        
        console.log('📨 Resposta enviarNotificacaoTeste:', resultado);
        
        if (resultado && resultado.sucesso) {
            return {
                sucesso: true,
                dados: resultado,
                mensagem: 'Notificação via servidor testada'
            };
        } else {
            return {
                sucesso: false,
                erro: resultado?.erro || 'Erro desconhecido',
                dados: resultado
            };
        }
        
    } catch (erro) {
        return {
            sucesso: false,
            erro: erro.message
        };
    }
}

function mostrarPainelCorrigido(nativa, email, servidor) {
    const painel = document.createElement('div');
    painel.id = 'painel-corrigido';
    painel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 15px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        padding: 30px;
        z-index: 10000;
        width: 90%;
        max-width: 500px;
        animation: modalAppear 0.4s ease;
        border-top: 5px solid #3498db;
    `;
    
    const titulo = document.createElement('h3');
    titulo.style.cssText = 'margin: 0 0 25px 0; color: #2c3e50; font-size: 20px; display: flex; align-items: center; gap: 12px;';
    titulo.innerHTML = `<i class="fas fa-wrench"></i> Correções Aplicadas`;
    
    const conteudo = document.createElement('div');
    conteudo.style.cssText = 'margin-bottom: 25px;';
    
    // Status dos testes
    const statusHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: ${nativa.sucesso ? '#d4edda' : '#f8d7da'}; padding: 15px; border-radius: 10px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 8px;">
                    ${nativa.sucesso ? '✅' : '❌'}
                </div>
                <div style="font-weight: bold; color: ${nativa.sucesso ? '#155724' : '#721c24'};">
                    Notificação Nativa
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    ${nativa.metodo || 'N/A'}
                </div>
            </div>
            
            <div style="background: ${email.sucesso ? '#d4edda' : '#f8d7da'}; padding: 15px; border-radius: 10px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 8px;">
                    ${email.sucesso ? '✅' : '❌'}
                </div>
                <div style="font-weight: bold; color: ${email.sucesso ? '#155724' : '#721c24'};">
                    E-mail Direto
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    ${email.sucesso ? 'Enviado' : 'Falhou'}
                </div>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <strong>🔍 Detalhes:</strong><br>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Notificação nativa usa API do navegador</li>
                <li>E-mail direto evita validação de escola</li>
                <li>Servidor respondeu: ${servidor.sucesso ? 'OK' : 'Falha'}</li>
            </ul>
        </div>
        
        <div style="background: #e8f4fc; padding: 15px; border-radius: 10px; font-size: 14px;">
            <strong>💡 Próximos passos:</strong><br>
            1. Verifique se recebeu notificação nativa<br>
            2. Confira seu e-mail (inclusive spam)<br>
            3. Firebase será configurado posteriormente
        </div>
    `;
    
    conteudo.innerHTML = statusHTML;
    
    const botoes = document.createElement('div');
    botoes.style.cssText = 'display: flex; gap: 12px;';
    
    const btnTestarNovamente = document.createElement('button');
    btnTestarNovamente.style.cssText = `
        flex: 1;
        padding: 14px;
        background: #f39c12;
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
        transition: all 0.3s;
    `;
    btnTestarNovamente.innerHTML = `<i class="fas fa-redo"></i> Testar Novamente`;
    btnTestarNovamente.onclick = () => {
        painel.style.animation = 'modalDisappear 0.3s ease';
        setTimeout(() => {
            painel.remove();
            testarNotificacoesCorrigido();
        }, 300);
    };
    btnTestarNovamente.onmouseenter = () => btnTestarNovamente.style.transform = 'translateY(-2px)';
    btnTestarNovamente.onmouseleave = () => btnTestarNovamente.style.transform = 'translateY(0)';
    
    const btnContinuar = document.createElement('button');
    btnContinuar.style.cssText = `
        flex: 1;
        padding: 14px;
        background: #27ae60;
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
        transition: all 0.3s;
    `;
    btnContinuar.innerHTML = `<i class="fas fa-forward"></i> Continuar`;
    btnContinuar.onclick = () => {
        painel.style.animation = 'modalDisappear 0.3s ease';
        setTimeout(() => {
            painel.remove();
            console.log('🚀 Pronto para ETAPA 5 - Upload de Arquivos');
        }, 300);
    };
    btnContinuar.onmouseenter = () => btnContinuar.style.transform = 'translateY(-2px)';
    btnContinuar.onmouseleave = () => btnContinuar.style.transform = 'translateY(0)';
    
    botoes.appendChild(btnTestarNovamente);
    botoes.appendChild(btnContinuar);
    
    // Adicionar animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes modalAppear {
            from { opacity: 0; transform: translate(-50%, -60%) scale(0.9); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes modalDisappear {
            from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            to { opacity: 0; transform: translate(-50%, -60%) scale(0.9); }
        }
    `;
    document.head.appendChild(style);
    
    // Overlay de fundo
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    
    overlay.onclick = () => {
        overlay.style.animation = 'fadeOut 0.3s ease';
        painel.style.animation = 'modalDisappear 0.3s ease';
        setTimeout(() => {
            overlay.remove();
            painel.remove();
        }, 300);
    };
    
    document.body.appendChild(overlay);
    
    // Montar painel
    painel.appendChild(titulo);
    painel.appendChild(conteudo);
    painel.appendChild(botoes);
    
    document.body.appendChild(painel);
    
    // Remover após 60 segundos
    setTimeout(() => {
        if (painel.parentNode) {
            overlay.remove();
            painel.remove();
        }
    }, 60000);
}

// Adicionar ao window
window.testarNotificacoesCorrigido = testarNotificacoesCorrigido;

console.log('✅ Script corrigido carregado. Use: testarNotificacoesCorrigido()');
