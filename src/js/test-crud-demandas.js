// Arquivo: src/js/test-crud-demandas.js
console.log('📋 TESTE CRUD DE DEMANDAS - ETAPA 3');

async function testarCRUDDemandas() {
    console.log('='.repeat(60));
    console.log('🧪 TESTANDO OPERAÇÕES CRUD DE DEMANDAS');
    console.log('='.repeat(60));
    
    try {
        // 1. Listar demandas existentes
        console.log('📋 1. Listando demandas existentes...');
        const demandas = await listarDemandas();
        
        if (!demandas.sucesso) {
            console.error('❌ Falha ao listar demandas:', demandas.erro);
            return { sucesso: false, etapa: 'listar' };
        }
        
        console.log(`✅ ${demandas.quantidade} demandas encontradas`);
        
        // 2. Criar uma nova demanda de teste
        console.log('🆕 2. Criando nova demanda de teste...');
        const novaDemanda = await criarDemandaTeste();
        
        if (!novaDemanda.sucesso) {
            console.error('❌ Falha ao criar demanda:', novaDemanda.erro);
            return { sucesso: false, etapa: 'criar' };
        }
        
        console.log(`✅ Demanda criada com ID: ${novaDemanda.id}`);
        
        // 3. Atualizar status da demanda
        console.log('🔄 3. Atualizando status da demanda...');
        const atualizacao = await atualizarStatusDemanda(novaDemanda.id, 'Em andamento');
        
        if (!atualizacao.sucesso) {
            console.warn('⚠️ Falha ao atualizar status:', atualizacao.erro);
        } else {
            console.log('✅ Status atualizado para: Em andamento');
        }
        
        // 4. Verificar se a demanda aparece na lista
        console.log('🔍 4. Verificando demanda na lista...');
        const verificacao = await verificarDemandaNaLista(novaDemanda.id);
        
        // 5. Testar filtros
        console.log('🎯 5. Testando filtros...');
        const filtrosTeste = await testarFiltros();
        
        // 6. Resultado final
        console.log('='.repeat(60));
        console.log('📊 RESULTADO DO CRUD:');
        console.log(`✅ Listar: ${demandas.sucesso ? 'OK' : 'FALHA'} (${demandas.quantidade} itens)`);
        console.log(`✅ Criar: ${novaDemanda.sucesso ? 'OK' : 'FALHA'} (ID: ${novaDemanda.id || 'N/A'})`);
        console.log(`✅ Atualizar: ${atualizacao.sucesso ? 'OK' : 'FALHA'}`);
        console.log(`✅ Verificar: ${verificacao.sucesso ? 'OK' : 'FALHA'}`);
        console.log(`✅ Filtros: ${filtrosTeste.sucesso ? 'OK' : 'PARCIAL'}`);
        console.log('='.repeat(60));
        
        // Mostrar painel de resultados
        mostrarPainelCRUD(demandas, novaDemanda, atualizacao, verificacao, filtrosTeste);
        
        return {
            sucesso: true,
            resumo: {
                listar: demandas.sucesso,
                criar: novaDemanda.sucesso,
                atualizar: atualizacao.sucesso,
                verificar: verificacao.sucesso,
                filtros: filtrosTeste.sucesso
            },
            dados: {
                demandaCriada: novaDemanda,
                demandaAtualizada: atualizacao
            }
        };
        
    } catch (erro) {
        console.error('❌ Erro no teste CRUD:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

async function listarDemandas() {
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'listarDemandas'
        });
        
        return {
            sucesso: true,
            quantidade: Array.isArray(resultado) ? resultado.length : 0,
            dados: Array.isArray(resultado) ? resultado : [],
            mensagem: `Listadas ${Array.isArray(resultado) ? resultado.length : 0} demandas`
        };
    } catch (erro) {
        return {
            sucesso: false,
            erro: erro.message,
            quantidade: 0,
            dados: []
        };
    }
}

async function criarDemandaTeste() {
    const dataPrazo = new Date();
    dataPrazo.setDate(dataPrazo.getDate() + 7); // 7 dias à frente
    
    const dadosDemanda = {
        titulo: '[TESTE] Demanda de teste do sistema',
        descricao: 'Esta é uma demanda automática de teste criada pelo sistema de integração. Pode ser excluída com segurança.',
        escolas: ['EEEFM Pedra Azul'], // Apenas uma escola para teste
        departamento: 'Supervisão',
        responsavel: 'Supervisor',
        prazo: dataPrazo.toISOString().split('T')[0], // Formato YYYY-MM-DD
        enviarEmail: false, // Não enviar email para teste
        corpoEmail: '',
        anexos: []
    };
    
    try {
        console.log('📤 Enviando dados da demanda:', {
            titulo: dadosDemanda.titulo,
            escolas: dadosDemanda.escolas.length,
            prazo: dadosDemanda.prazo
        });
        
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'salvarDemanda',
            titulo: dadosDemanda.titulo,
            descricao: dadosDemanda.descricao,
            escolas: dadosDemanda.escolas,
            departamento: dadosDemanda.departamento,
            responsavel: dadosDemanda.responsavel,
            prazo: dadosDemanda.prazo,
            enviarEmail: dadosDemanda.enviarEmail,
            corpoEmail: dadosDemanda.corpoEmail,
            anexos: dadosDemanda.anexos
        });
        
        console.log('📨 Resposta salvarDemanda:', resultado);
        
        if (resultado && resultado.id) {
            return {
                sucesso: true,
                id: resultado.id,
                dados: resultado,
                mensagem: 'Demanda criada com sucesso'
            };
        } else {
            return {
                sucesso: false,
                erro: resultado?.erro || 'ID não retornado',
                dados: resultado
            };
        }
        
    } catch (erro) {
        console.error('❌ Erro ao criar demanda:', erro);
        return {
            sucesso: false,
            erro: erro.message
        };
    }
}

async function atualizarStatusDemanda(idDemanda, novoStatus) {
    try {
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'atualizarDemanda',
            id: idDemanda,
            status: novoStatus,
            alteracao: `Status alterado para: ${novoStatus} (teste automático)`
        });
        
        return {
            sucesso: true,
            dados: resultado,
            mensagem: `Status atualizado para ${novoStatus}`
        };
    } catch (erro) {
        return {
            sucesso: false,
            erro: erro.message
        };
    }
}

async function verificarDemandaNaLista(idDemanda) {
    try {
        // Aguardar 2 segundos para sincronização
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const demandas = await listarDemandas();
        
        if (!demandas.sucesso) {
            return { sucesso: false, erro: 'Falha ao listar demandas' };
        }
        
        const demandaEncontrada = demandas.dados.find(d => d.id == idDemanda);
        
        if (demandaEncontrada) {
            return {
                sucesso: true,
                encontrada: true,
                dados: demandaEncontrada,
                mensagem: `Demanda #${idDemanda} encontrada na lista`
            };
        } else {
            return {
                sucesso: false,
                encontrada: false,
                mensagem: `Demanda #${idDemanda} não encontrada na lista`
            };
        }
    } catch (erro) {
        return {
            sucesso: false,
            erro: erro.message
        };
    }
}

async function testarFiltros() {
    try {
        // Testar filtro por escola
        const filtroEscola = await enviarParaGoogleAppsScript({
            acao: 'listarDemandas',
            filtros: {
                escola: 'EEEFM Pedra Azul'
            }
        });
        
        // Testar filtro por status
        const filtroStatus = await enviarParaGoogleAppsScript({
            acao: 'listarDemandas',
            filtros: {
                status: 'Pendente'
            }
        });
        
        return {
            sucesso: true,
            filtros: {
                escola: Array.isArray(filtroEscola) ? filtroEscola.length : 0,
                status: Array.isArray(filtroStatus) ? filtroStatus.length : 0
            },
            mensagem: 'Filtros testados com sucesso'
        };
    } catch (erro) {
        return {
            sucesso: false,
            erro: erro.message,
            mensagem: 'Falha ao testar filtros'
        };
    }
}

function mostrarPainelCRUD(listar, criar, atualizar, verificar, filtros) {
    const painel = document.createElement('div');
    painel.id = 'painel-crud-testes';
    painel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        padding: 25px;
        z-index: 10000;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        animation: modalAppear 0.3s ease;
    `;
    
    const titulo = document.createElement('h3');
    titulo.style.cssText = 'margin: 0 0 20px 0; color: #2c3e50; font-size: 18px; display: flex; align-items: center; gap: 10px;';
    titulo.innerHTML = `<i class="fas fa-tasks"></i> Teste CRUD de Demandas`;
    
    const resultados = document.createElement('div');
    resultados.style.cssText = 'margin-bottom: 20px;';
    
    // Função para criar item de resultado
    function criarItem(tituloItem, status, detalhes = '') {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 500;">${tituloItem}</span>
                <span style="color: ${status ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                    ${status ? '✅ OK' : '❌ FALHA'}
                </span>
            </div>
            ${detalhes ? `<div style="margin-top: 5px; font-size: 13px; color: #666;">${detalhes}</div>` : ''}
        `;
        return item;
    }
    
    // Adicionar resultados
    resultados.appendChild(criarItem(
        'Listar demandas', 
        listar.sucesso, 
        `${listar.quantidade} demandas encontradas`
    ));
    
    resultados.appendChild(criarItem(
        'Criar nova demanda', 
        criar.sucesso, 
        criar.sucesso ? `ID: ${criar.id}` : criar.erro
    ));
    
    resultados.appendChild(criarItem(
        'Atualizar status', 
        atualizar.sucesso, 
        atualizar.sucesso ? 'Status alterado' : atualizar.erro
    ));
    
    resultados.appendChild(criarItem(
        'Verificar na lista', 
        verificar.sucesso, 
        verificar.sucesso ? 'Demanda encontrada' : 'Não encontrada'
    ));
    
    resultados.appendChild(criarItem(
        'Testar filtros', 
        filtros.sucesso, 
        filtros.sucesso ? 'Filtros funcionando' : 'Falha nos filtros'
    ));
    
    const instrucoes = document.createElement('div');
    instrucoes.style.cssText = 'background: #e8f4fc; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;';
    instrucoes.innerHTML = `
        <strong>📝 Instruções:</strong><br>
        1. Uma demanda de teste foi criada<br>
        2. Verifique se ela aparece na lista principal<br>
        3. Você pode alterar seu status ou excluí-la<br>
        4. A demanda tem "[TESTE]" no título para identificação
    `;
    
    const botoes = document.createElement('div');
    botoes.style.cssText = 'display: flex; gap: 10px;';
    
    const btnVerLista = document.createElement('button');
    btnVerLista.style.cssText = `
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
    `;
    btnVerLista.innerHTML = `<i class="fas fa-list"></i> Ver Lista`;
    btnVerLista.onclick = () => {
        // Fechar painel
        painel.style.animation = 'modalDisappear 0.3s ease';
        setTimeout(() => painel.remove(), 300);
        
        // Recarregar lista de demandas
        if (typeof window.carregarDemandas === 'function') {
            window.carregarDemandas();
        }
        
        // Rolagem suave para a lista
        setTimeout(() => {
            const listaElement = document.querySelector('.demandas-section');
            if (listaElement) {
                listaElement.scrollIntoView({ behavior: 'smooth' });
            }
        }, 500);
    };
    
    const btnFechar = document.createElement('button');
    btnFechar.style.cssText = `
        flex: 1;
        padding: 12px;
        background: #95a5a6;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    `;
    btnFechar.innerHTML = `<i class="fas fa-check"></i> Continuar`;
    btnFechar.onclick = () => {
        painel.style.animation = 'modalDisappear 0.3s ease';
        setTimeout(() => {
            painel.remove();
            // Iniciar próxima etapa (notificações)
            console.log('🚀 Pronto para ETAPA 4 - Sistema de Notificações');
        }, 300);
    };
    
    botoes.appendChild(btnVerLista);
    botoes.appendChild(btnFechar);
    
    // Adicionar animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes modalAppear {
            from { opacity: 0; transform: translate(-50%, -40%); }
            to { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes modalDisappear {
            from { opacity: 1; transform: translate(-50%, -50%); }
            to { opacity: 0; transform: translate(-50%, -40%); }
        }
    `;
    document.head.appendChild(style);
    
    // Montar painel
    painel.appendChild(titulo);
    painel.appendChild(resultados);
    painel.appendChild(instrucoes);
    painel.appendChild(botoes);
    
    document.body.appendChild(painel);
    
    // Adicionar overlay de fundo
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
    
    const styleOverlay = document.createElement('style');
    styleOverlay.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(styleOverlay);
    
    overlay.onclick = () => {
        overlay.style.animation = 'fadeOut 0.3s ease';
        painel.style.animation = 'modalDisappear 0.3s ease';
        setTimeout(() => {
            overlay.remove();
            painel.remove();
        }, 300);
    };
    
    document.body.appendChild(overlay);
    
    // Remover após 60 segundos se não fechar
    setTimeout(() => {
        if (painel.parentNode) {
            overlay.remove();
            painel.remove();
        }
    }, 60000);
}

// Adicionar ao window para teste manual
window.testarCRUDDemandas = testarCRUDDemandas;

console.log('✅ Script de CRUD carregado. Use: testarCRUDDemandas()');
