// Arquivo: src/js/test-endpoints-final.js
console.log('🎯 TESTE FINAL DE ENDPOINTS - ETAPA 4.3');

async function testarEndpointsFinal() {
    console.log('='.repeat(60));
    console.log('🎯 TESTANDO ENDPOINTS COM PARÂMETROS CORRETOS');
    console.log('='.repeat(60));
    
    const testes = [
        {
            nome: 'salvarDemanda',
            testar: async () => {
                const dataPrazo = new Date();
                dataPrazo.setDate(dataPrazo.getDate() + 7);
                
                return await enviarParaGoogleAppsScript({
                    acao: 'salvarDemanda',
                    titulo: 'Teste corrigido do sistema',
                    descricao: 'Descrição de teste para validação do endpoint',
                    escolas: ['EEEFM Pedra Azul'],
                    departamento: 'Supervisão',
                    responsavel: 'Supervisor',
                    prazo: dataPrazo.toISOString().split('T')[0],
                    enviarEmail: false
                });
            }
        },
        {
            nome: 'enviarEmailDemanda',
            testar: async () => {
                return await enviarParaGoogleAppsScript({
                    acao: 'enviarEmailDemanda',
                    titulo: 'Teste de e-mail com escola válida',
                    escolas: ['EEEFM Pedra Azul'],
                    emails: ['ecramos@sedu.es.gov.br'], // Email válido
                    departamento: 'Supervisão',
                    corpo: 'Corpo de teste do e-mail'
                });
            }
        },
        {
            nome: 'atualizarDemanda',
            testar: async () => {
                // Primeiro, obter uma demanda existente
                const demandas = await enviarParaGoogleAppsScript({
                    acao: 'listarDemandas'
                });
                
                if (Array.isArray(demandas) && demandas.length > 0) {
                    const primeiraDemanda = demandas[0];
                    return await enviarParaGoogleAppsScript({
                        acao: 'atualizarDemanda',
                        id: primeiraDemanda.id,
                        status: 'Em andamento',
                        alteracao: 'Teste de atualização'
                    });
                } else {
                    throw new Error('Nenhuma demanda encontrada para teste');
                }
            }
        },
        {
            nome: 'enviarEmail (simples)',
            testar: async () => {
                const usuario = JSON.parse(localStorage.getItem('usuario_demandas') || '{}');
                return await enviarParaGoogleAppsScript({
                    acao: 'enviarEmail',
                    para: usuario.email || 'ecramos@sedu.es.gov.br',
                    assunto: '✅ Teste FINAL de e-mail',
                    corpo: '<p>Este é um teste final do sistema de e-mail!</p>',
                    tipo: 'teste_final'
                });
            }
        }
    ];
    
    const resultados = [];
    
    for (const teste of testes) {
        console.log(`🧪 Testando: ${teste.nome}...`);
        
        try {
            const resultado = await teste.testar();
            console.log(`📨 Resposta ${teste.nome}:`, resultado);
            
            resultados.push({
                nome: teste.nome,
                sucesso: resultado && resultado.sucesso !== false,
                mensagem: resultado?.mensagem || (resultado?.sucesso ? 'OK' : 'Falha'),
                dados: resultado
            });
            
        } catch (erro) {
            console.error(`❌ Erro em ${teste.nome}:`, erro.message);
            resultados.push({
                nome: teste.nome,
                sucesso: false,
                mensagem: erro.message,
                erro: erro
            });
        }
        
        // Pequena pausa
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Resultado final
    console.log('='.repeat(60));
    console.log('🎊 RESULTADO FINAL DOS ENDPOINTS:');
    console.log('='.repeat(60));
    
    resultados.forEach(r => {
        console.log(`${r.sucesso ? '✅' : '❌'} ${r.nome}: ${r.mensagem}`);
    });
    
    const totalSucessos = resultados.filter(r => r.sucesso).length;
    console.log(`\n📊 TOTAL: ${totalSucessos}/${resultados.length} endpoints funcionando`);
    
    // Mostrar resumo visual
    mostrarResumoFinal(resultados);
    
    return {
        sucesso: totalSucessos === resultados.length,
        total: resultados.length,
        sucessos: totalSucessos,
        detalhes: resultados
    };
}

function mostrarResumoFinal(resultados) {
    const painel = document.createElement('div');
    painel.id = 'resumo-final-endpoints';
    painel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        padding: 25px;
        z-index: 10000;
        width: 90%;
        max-width: 500px;
        animation: slideInUp 0.4s ease;
        border-top: 5px solid #27ae60;
    `;
    
    const titulo = document.createElement('h3');
    titulo.style.cssText = 'margin: 0 0 20px 0; color: #2c3e50; font-size: 18px; display: flex; align-items: center; gap: 10px;';
    titulo.innerHTML = `<i class="fas fa-flag-checkered"></i> Teste Final Concluído`;
    
    const lista = document.createElement('div');
    lista.style.cssText = 'margin-bottom: 20px;';
    
    resultados.forEach(r => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 12px 15px;
            margin-bottom: 10px;
            background: ${r.sucesso ? '#e8f7ef' : '#fdeaea'};
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        
        item.innerHTML = `
            <div style="font-size: 20px;">
                ${r.sucesso ? '✅' : '❌'}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: bold; color: #2c3e50;">${r.nome}</div>
                <div style="font-size: 13px; color: #666; margin-top: 4px;">
                    ${r.mensagem}
                </div>
            </div>
        `;
        
        lista.appendChild(item);
    });
    
    const totalSucessos = resultados.filter(r => r.sucesso).length;
    const percentual = Math.round((totalSucessos / resultados.length) * 100);
    
    const resumo = document.createElement('div');
    resumo.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;';
    resumo.innerHTML = `
        <div style="font-size: 32px; font-weight: bold; color: ${percentual === 100 ? '#27ae60' : percentual >= 75 ? '#f39c12' : '#e74c3c'};">
            ${percentual}%
        </div>
        <div style="font-size: 14px; color: #666;">
            ${totalSucessos} de ${resultados.length} endpoints funcionando
        </div>
    `;
    
    const conclusao = document.createElement('div');
    conclusao.style.cssText = 'margin-bottom: 20px; padding: 15px; background: #e8f4fc; border-radius: 8px; font-size: 14px;';
    
    if (percentual === 100) {
        conclusao.innerHTML = `
            <strong>🎉 PARABÉNS!</strong><br>
            Todos os endpoints principais estão funcionando perfeitamente!
            O sistema está pronto para uso em produção.
        `;
    } else if (percentual >= 75) {
        conclusao.innerHTML = `
            <strong>👍 BOM RESULTADO!</strong><br>
            A maioria dos endpoints funciona. Alguns ajustes podem ser necessários,
            mas o sistema está operacional.
        `;
    } else {
        conclusao.innerHTML = `
            <strong>⚠️ ATENÇÃO</strong><br>
            Alguns endpoints importantes não estão funcionando.
            Verifique a configuração do backend.
        `;
    }
    
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
    btnFechar.innerHTML = `<i class="fas fa-check"></i> Concluir Testes`;
    btnFechar.onclick = () => {
        painel.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => painel.remove(), 300);
        
        // Iniciar ETAPA 5 se tudo ok
        if (percentual >= 75) {
            console.log('🚀 Pronto para ETAPA 5 - Upload de Arquivos');
            // Aqui pode iniciar a próxima etapa automaticamente
        }
    };
    
    botoes.appendChild(btnFechar);
    
    // Animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideOutDown {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Montar
    painel.appendChild(titulo);
    painel.appendChild(lista);
    painel.appendChild(resumo);
    painel.appendChild(conclusao);
    painel.appendChild(botoes);
    
    document.body.appendChild(painel);
    
    // Remover após 60s
    setTimeout(() => {
        if (painel.parentNode) {
            painel.remove();
        }
    }, 60000);
}

// Adicionar ao window
window.testarEndpointsFinal = testarEndpointsFinal;

console.log('✅ Script final carregado. Use: testarEndpointsFinal()');
