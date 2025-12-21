// Arquivo: src/js/test-notificacoes.js
console.log('🔔 TESTE DE NOTIFICAÇÕES - ETAPA 4');

async function testarSistemaNotificacoes() {
    console.log('='.repeat(60));
    console.log('🔔 TESTANDO SISTEMA DE NOTIFICAÇÕES');
    console.log('='.repeat(60));
    
    try {
        // 1. Verificar token FCM atual
        console.log('🔑 1. Verificando token FCM...');
        const tokenStatus = await verificarTokenFCM();
        
        if (!tokenStatus.sucesso) {
            console.warn('⚠️ Token FCM não disponível:', tokenStatus.erro);
        } else {
            console.log('✅ Token FCM ativo');
        }
        
        // 2. Testar salvarSubscription
        console.log('💾 2. Testando salvarSubscription...');
        const subscriptionTest = await testarSalvarSubscription(tokenStatus.token);
        
        if (!subscriptionTest.sucesso) {
            console.warn('⚠️ salvarSubscription falhou:', subscriptionTest.erro);
        } else {
            console.log('✅ Token salvo no servidor');
        }
        
        // 3. Testar envio de notificação para nova demanda
        console.log('📢 3. Testando notificação para nova demanda...');
        const notificacaoTest = await testarNotificacaoNovaDemanda();
        
        if (!notificacaoTest.sucesso) {
            console.warn('⚠️ Notificação não enviada:', notificacaoTest.erro);
        } else {
            console.log('✅ Notificação testada');
        }
        
        // 4. Testar envio de e-mail
        console.log('📧 4. Testando envio de e-mail...');
        const emailTest = await testarEnvioEmail();
        
        if (!emailTest.sucesso) {
            console.warn('⚠️ Envio de e-mail falhou:', emailTest.erro);
        } else {
            console.log('✅ E-mail testado');
        }
        
        // 5. Resultado final
        console.log('='.repeat(60));
        console.log('📊 RESULTADO DAS NOTIFICAÇÕES:');
        console.log(`✅ Token FCM: ${tokenStatus.sucesso ? 'OK' : 'FALHA'}`);
        console.log(`✅ Subscription: ${subscriptionTest.sucesso ? 'OK' : 'FALHA'}`);
        console.log(`✅ Notificação Push: ${notificacaoTest.sucesso ? 'OK' : 'FALHA'}`);
        console.log(`✅ E-mail: ${emailTest.sucesso ? 'OK' : 'FALHA'}`);
        console.log('='.repeat(60));
        
        // Mostrar painel de resultados
        mostrarPainelNotificacoes(tokenStatus, subscriptionTest, notificacaoTest, emailTest);
        
        return {
            sucesso: true,
            resumo: {
                token: tokenStatus.sucesso,
                subscription: subscriptionTest.sucesso,
                notificacao: notificacaoTest.sucesso,
                email: emailTest.sucesso
            }
        };
        
    } catch (erro) {
        console.error('❌ Erro no teste de notificações:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

async function verificarTokenFCM() {
    try {
        // Verificar se há token salvo
        const tokenSalvo = localStorage.getItem('fcm_token') || 
                          localStorage.getItem('fcm_token_simples');
        
        if (tokenSalvo) {
            return {
                sucesso: true,
                token: tokenSalvo,
                origem: 'localStorage',
                mensagem: 'Token FCM encontrado'
            };
        }
        
        // Verificar se Firebase está disponível
        if (typeof firebase !== 'undefined' && typeof firebase.messaging === 'function') {
            try {
                const messaging = firebase.messaging();
                const token = await messaging.getToken({
                    vapidKey: "BMQIERFqdSFhiX319L_Wfa176UU8nzop-9-SB4pPxowM6yBo9gIrnU5-PtsENsc_XWXZJTQHCgMeYtiztUE9C3Q"
                });
                
                if (token) {
                    return {
                        sucesso: true,
                        token: token,
                        origem: 'firebase',
                        mensagem: 'Token obtido do Firebase'
                    };
                }
            } catch (firebaseError) {
                console.warn('Erro ao obter token Firebase:', firebaseError);
            }
        }
        
        return {
            sucesso: false,
            erro: 'Token FCM não disponível',
            origem: null
        };
        
    } catch (erro) {
        return {
            sucesso: false,
            erro: erro.message,
            origem: null
        };
    }
}

async function testarSalvarSubscription(token) {
    if (!token) {
        return {
            sucesso: false,
            erro: 'Token não disponível para teste'
        };
    }
    
    try {
        // Obter usuário atual
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
            acao: 'salvarSubscription',
            fcmToken: token,
            tipo: 'firebase',
            email: usuario ? usuario.email : 'teste@exemplo.com',
            nome: usuario ? usuario.nome : 'Usuário Teste',
            tipo_usuario: usuario ? usuario.tipo_usuario : 'supervisor'
        });
        
        console.log('📨 Resposta salvarSubscription:', resultado);
        
        if (resultado && resultado.sucesso) {
            return {
                sucesso: true,
                dados: resultado,
                mensagem: 'Subscription salva com sucesso'
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

async function testarNotificacaoNovaDemanda() {
    try {
        // Criar uma demanda de teste simples para notificação
        const dadosNotificacao = {
            titulo: '[TESTE NOTIF] Demanda para notificação',
            mensagem: 'Esta é uma demanda de teste para notificação push',
            demandaId: Date.now(), // ID temporário
            departamento: 'Supervisão',
            escolas: ['EEEFM Pedra Azul'],
            importante: false
        };
        
        console.log('📤 Enviando notificação de teste:', dadosNotificacao);
        
        // Método 1: Usar Firebase se disponível
        if (typeof window.enviarNotificacaoFirebase === 'function') {
            const resultado = await window.enviarNotificacaoFirebase(dadosNotificacao);
            return {
                sucesso: resultado.sucesso === true,
                metodo: 'firebase',
                dados: resultado,
                mensagem: resultado.sucesso ? 'Notificação Firebase enviada' : 'Falha no Firebase'
            };
        }
        
        // Método 2: Usar notificação nativa
        if ('Notification' in window && Notification.permission === 'granted') {
            const notificacao = new Notification(dadosNotificacao.titulo, {
                body: dadosNotificacao.mensagem,
                icon: '/sistema-demandas-escolares/public/icons/192x192.png',
                tag: 'teste-notificacao'
            });
            
            return {
                sucesso: true,
                metodo: 'nativa',
                mensagem: 'Notificação nativa exibida'
            };
        }
        
        // Método 3: Usar endpoint do servidor
        const resultadoServidor = await enviarParaGoogleAppsScript({
            acao: 'enviarNotificacaoTeste',
            titulo: dadosNotificacao.titulo,
            mensagem: dadosNotificacao.mensagem,
            tipo: 'teste_sistema'
        });
        
        return {
            sucesso: resultadoServidor && resultadoServidor.sucesso === true,
            metodo: 'servidor',
            dados: resultadoServidor,
            mensagem: 'Notificação enviada via servidor'
        };
        
    } catch (erro) {
        return {
            sucesso: false,
            erro: erro.message,
            metodo: 'nenhum'
        };
    }
}

async function testarEnvioEmail() {
    try {
        // Obter usuário atual para email de teste
        const usuarioSalvo = localStorage.getItem('usuario_demandas');
        let usuario = null;
        
        if (usuarioSalvo) {
            try {
                usuario = JSON.parse(usuarioSalvo);
            } catch (e) {
                console.warn('Erro ao parsear usuário:', e);
            }
        }
        
        const dadosEmail = {
            para: usuario ? usuario.email : 'teste@exemplo.com',
            assunto: '[TESTE] E-mail do Sistema de Demandas',
            corpo: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2 style="color: #2c3e50;">📧 Teste de E-mail Automático</h2>
                    <p>Este é um e-mail de teste do Sistema de Gestão de Demandas Escolares.</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="color: #3498db;">Sistema funcionando corretamente!</h3>
                        <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                        <p><strong>Hora:</strong> ${new Date().toLocaleTimeString('pt-BR')}</p>
                        <p><strong>Usuário:</strong> ${usuario ? usuario.nome : 'Sistema de Teste'}</p>
                    </div>
                    
                    <p style="color: #7f8c8d; font-size: 12px;">
                        Este é um e-mail automático de teste. Não é necessário responder.
                    </p>
                </div>
            `,
            tipo: 'teste_sistema'
        };
        
        console.log('📤 Enviando e-mail de teste para:', dadosEmail.para);
        
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'enviarEmailDemanda',
            para: dadosEmail.para,
            assunto: dadosEmail.assunto,
            corpo: dadosEmail.corpo,
            tipo: dadosEmail.tipo
        });
        
        console.log('📨 Resposta enviarEmailDemanda:', resultado);
        
        if (resultado && resultado.sucesso) {
            return {
                sucesso: true,
                dados: resultado,
                mensagem: 'E-mail enviado com sucesso'
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

function mostrarPainelNotificacoes(token, subscription, notificacao, email) {
    const painel = document.createElement('div');
    painel.id = 'painel-notificacoes-testes';
    painel.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        padding: 25px;
        z-index: 10000;
        width: 90%;
        max-width: 450px;
        max-height: 80vh;
        overflow-y: auto;
        animation: slideInLeft 0.3s ease;
        border-top: 5px solid #9b59b6;
    `;
    
    const titulo = document.createElement('h3');
    titulo.style.cssText = 'margin: 0 0 20px 0; color: #2c3e50; font-size: 18px; display: flex; align-items: center; gap: 10px;';
    titulo.innerHTML = `<i class="fas fa-bell"></i> Teste de Notificações`;
    
    const resultados = document.createElement('div');
    resultados.style.cssText = 'margin-bottom: 20px;';
    
    // Função para criar item de resultado
    function criarItem(tituloItem, status, detalhes = '', icone = 'fas fa-circle') {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;';
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                <i class="${icone}" style="color: ${status ? '#27ae60' : '#e74c3c'}"></i>
                <span style="font-weight: 500; flex: 1;">${tituloItem}</span>
                <span style="color: ${status ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                    ${status ? '✅ OK' : '❌ FALHA'}
                </span>
            </div>
            ${detalhes ? `<div style="margin-left: 26px; font-size: 13px; color: #666;">${detalhes}</div>` : ''}
        `;
        return item;
    }
    
    // Adicionar resultados
    resultados.appendChild(criarItem(
        'Token FCM', 
        token.sucesso, 
        token.origem ? `Origem: ${token.origem}` : token.erro,
        'fas fa-key'
    ));
    
    resultados.appendChild(criarItem(
        'Salvar no Servidor', 
        subscription.sucesso, 
        subscription.mensagem || subscription.erro,
        'fas fa-cloud-upload-alt'
    ));
    
    resultados.appendChild(criarItem(
        'Notificação Push', 
        notificacao.sucesso, 
        notificacao.metodo ? `Método: ${notificacao.metodo}` : notificacao.erro,
        'fas fa-bell'
    ));
    
    resultados.appendChild(criarItem(
        'Envio de E-mail', 
        email.sucesso, 
        email.mensagem || email.erro,
        'fas fa-envelope'
    ));
    
    const resumo = document.createElement('div');
    resumo.style.cssText = 'background: #f0f7ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;';
    
    const totalTestes = 4;
    const testesOk = [token, subscription, notificacao, email].filter(t => t.sucesso).length;
    const percentual = Math.round((testesOk / totalTestes) * 100);
    
    resumo.innerHTML = `
        <strong>📊 Resumo:</strong><br>
        <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Progresso:</span>
                <span>${testesOk}/${totalTestes} (${percentual}%)</span>
            </div>
            <div style="height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; background: ${percentual === 100 ? '#27ae60' : percentual >= 50 ? '#f39c12' : '#e74c3c'}; width: ${percentual}%; transition: width 0.5s;"></div>
            </div>
        </div>
    `;
    
    const instrucoes = document.createElement('div');
    instrucoes.style.cssText = 'background: #f9f5ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;';
    instrucoes.innerHTML = `
        <strong>💡 Informações:</strong><br>
        • Token FCM é necessário para notificações push<br>
        • O e-mail de teste foi enviado para seu email cadastrado<br>
        • Verifique sua caixa de entrada e spam<br>
        • Notificações push aparecem mesmo com o app fechado
    `;
    
    const botoes = document.createElement('div');
    botoes.style.cssText = 'display: flex; gap: 10px;';
    
    const btnVerificarEmail = document.createElement('button');
    btnVerificarEmail.style.cssText = `
        flex: 1;
        padding: 12px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
    `;
    btnVerificarEmail.innerHTML = `<i class="fas fa-envelope-open-text"></i> Verificar E-mail`;
    btnVerificarEmail.onclick = () => {
        window.open('https://mail.google.com', '_blank');
    };
    
    const btnFechar = document.createElement('button');
    btnFechar.style.cssText = `
        flex: 1;
        padding: 12px;
        background: #9b59b6;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
    `;
    btnFechar.innerHTML = `<i class="fas fa-forward"></i> Próxima Etapa`;
    btnFechar.onclick = () => {
        painel.style.animation = 'slideOutLeft 0.3s ease';
        setTimeout(() => {
            painel.remove();
            // Iniciar próxima etapa (upload de arquivos)
            console.log('🚀 Pronto para ETAPA 5 - Upload de Arquivos');
            if (window.testarUploadArquivos) {
                window.testarUploadArquivos();
            }
        }, 300);
    };
    
    botoes.appendChild(btnVerificarEmail);
    botoes.appendChild(btnFechar);
    
    // Adicionar animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInLeft {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutLeft {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(-100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Montar painel
    painel.appendChild(titulo);
    painel.appendChild(resultados);
    painel.appendChild(resumo);
    painel.appendChild(instrucoes);
    painel.appendChild(botoes);
    
    document.body.appendChild(painel);
    
    // Remover após 60 segundos se não fechar
    setTimeout(() => {
        if (painel.parentNode) {
            painel.remove();
        }
    }, 60000);
}

// Adicionar ao window para teste manual
window.testarSistemaNotificacoes = testarSistemaNotificacoes;

console.log('✅ Script de notificações carregado. Use: testarSistemaNotificacoes()');
