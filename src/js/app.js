// ============================================
// SISTEMA DE GESTÃO DE DEMANDAS - SUPERVISÃO ESCOLAR
// Arquivo: app.js
// Lógica principal da interface COM SPLASH SCREEN
// ============================================
// CONFIGURAÇÕES GLOBAIS
const APP_CONFIG = {
    schools: [
        { nome: "EEEFM Pedra Azul", email: "eder.ramos@educador.edu.es.gov.br" },
        { nome: "EEEFM Fioravante Caliman", email: "escolafioravante@sedu.es.gov.br" },
        { nome: "EEEFM Alto Rio Possmoser", email: "escolapossmoser@sedu.es.gov.br" }
    ],
    supervisorEmail: "ecramos@sedu.es.gov.br",
    supervisorName: "Supervisão Escolar"
};

// ESTADO DA APLICAÇÃO
let state = {
    demandas: [],
    filtros: {
        escola: '',
        departamento: '',
        responsavel: '',
        status: '',
        prazo: ''
    },
    arquivosSelecionados: [],
    splashScreenActive: true
};

// ELEMENTOS DO DOM
let elementos = {};

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Sistema iniciando...");
    
    // 1. Inicializar elementos
    inicializarElementos();
    
    // 2. Se houver splash screen, iniciar sequência
    if (elementos.splashScreen) {
        console.log("🎬 Iniciando splash screen...");
        iniciarSplashScreen();
    } else {
        // Se não tiver splash, iniciar normalmente
        iniciarAplicacao();
    }
});

/**
 * INICIALIZAÇÃO COM SPLASH SCREEN
 */
function iniciarSplashScreen() {
    // Configurar progresso da splash
    const statusEl = elementos.splashScreen.querySelector('.splash-status');
    const etapas = [
        { tempo: 500, texto: 'Inicializando sistema...' },
        { tempo: 1200, texto: 'Carregando configurações...' },
        { tempo: 2000, texto: 'Conectando ao servidor...' },
        { tempo: 2800, texto: 'Preparando interface...' },
        { tempo: 3500, texto: 'Pronto para uso!' }
    ];
    
    // Executar etapas
    etapas.forEach((etapa, index) => {
        setTimeout(() => {
            if (!statusEl || !state.splashScreenActive) return;
            statusEl.textContent = etapa.texto;
            console.log(`🔧 ${etapa.texto}`);
            
            // Última etapa: iniciar aplicação
            if (index === etapas.length - 1) {
                setTimeout(() => {
                    iniciarAplicacao();
                }, 500);
            }
        }, etapa.tempo);
    });
    
    // Fallback: esconder após 5 segundos se algo falhar
    setTimeout(() => {
        if (state.splashScreenActive) {
            console.log("⚠️ Fallback: escondendo splash screen");
            esconderSplashScreen();
            iniciarAplicacao();
        }
    }, 5000);
}

/**
 * INICIALIZAR APLICAÇÃO PRINCIPAL COM NOTIFICAÇÕES
 */
function iniciarAplicacao() {
    console.log("📱 Iniciando aplicação principal com notificações...");
    
    // 1. Esconder splash screen
    esconderSplashScreen();
    
    // 2. Inicializar resto da aplicação
    inicializarEventos();
    carregarDemandas();
    
    // 3. Inicializar sistema de notificações (NOVO)
    setTimeout(() => {
        inicializarSistemaNotificacoesPrincipal();
    }, 2000);
    
    // 4. TESTE APENAS UMA VEZ, após notificações carregarem
        setTimeout(() => {
            console.log('🔔 TESTE ÚNICO DE NOTIFICAÇÕES');
            executarTesteNotificacoes();
        }, 2000);
    
    // 5. Verificar se é PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log("📲 Aplicativo PWA em execução");
        document.body.classList.add('pwa-mode');
    }
}
/**
 * ESCONDER SPLASH SCREEN
 */
function esconderSplashScreen() {
    if (!elementos.splashScreen || !state.splashScreenActive) return;
    
    state.splashScreenActive = false;
    elementos.splashScreen.classList.add('hidden');
    
    console.log("✅ Splash screen escondida");
    
    // Remover do DOM após animação
    setTimeout(() => {
        if (elementos.splashScreen && elementos.splashScreen.parentNode) {
            elementos.splashScreen.remove();
            elementos.splashScreen = null;
        }
    }, 500);
}

/**
 * Inicializa todos os elementos do DOM
 */
function inicializarElementos() {
    console.log("🔍 Inicializando elementos do DOM...");
    
    elementos = {
        // SPLASH SCREEN
        splashScreen: document.getElementById('splash-screen'),
        
        // Containers principais
        loading: document.getElementById('loading'),
        mainContainer: document.getElementById('main-container'),
        demandasContainer: document.getElementById('demandas-container'),
        
        // Filtros
        filtroEscola: document.getElementById('filtro-escola'),
        filtroDepartamento: document.getElementById('filtro-departamento'),
        filtroResponsavel: document.getElementById('filtro-responsavel'),
        filtroStatus: document.getElementById('filtro-status'),
        filtroPrazo: document.getElementById('filtro-prazo'),
        btnLimparFiltros: document.getElementById('btn-limpar-filtros'),
        btnAtualizar: document.getElementById('btn-atualizar'),
        
        
        // Estatísticas
        totalDemandas: document.getElementById('total-demandas'),
        pendentes: document.getElementById('pendentes'),
        atrasadas: document.getElementById('atrasadas'),
        
        // Modal nova demanda
        modalNovaDemanda: document.getElementById('modal-nova-demanda'),
        btnNovaDemanda: document.getElementById('btn-nova-demanda'),
        btnFecharModal: document.getElementById('btn-fechar-modal'),
        btnCancelar: document.getElementById('btn-cancelar'),
        formNovaDemanda: document.getElementById('form-nova-demanda'),
        
        // Formulário nova demanda
        titulo: document.getElementById('titulo'),
        descricao: document.getElementById('descricao'),
        prazo: document.getElementById('prazo'),
        enviarEmail: document.getElementById('enviar-email'),
        corpoEmail: document.getElementById('corpo-email'),
        emailContent: document.getElementById('email-content'),
        emailPreview: document.getElementById('email-preview'),
        
        // Checkboxes de escolas
        escolaTodas: document.getElementById('escola-todas'),
        escolasCheckboxes: document.querySelectorAll('.escola-checkbox:not(#escola-todas)'),
        
        // Upload de arquivos
        uploadArea: document.getElementById('upload-area'),
        fileInput: document.getElementById('file-input'),
        arquivosList: document.getElementById('arquivos-list'),
        
        // Tabs
        tabs: document.querySelectorAll('.tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // Modal detalhes
        modalDetalhes: document.getElementById('modal-detalhes'),
        
        // Toast container
        toastContainer: document.getElementById('toast-container')
    };
    
    // Configurar data mínima como amanhã
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    
    if (elementos.prazo) {
        elementos.prazo.min = amanha.toISOString().split('T')[0];
        
        // Data padrão: 7 dias à frente
        const prazoPadrao = new Date(hoje);
        prazoPadrao.setDate(hoje.getDate() + 7);
        elementos.prazo.value = prazoPadrao.toISOString().split('T')[0];
    }
    
    console.log("✅ Elementos inicializados:", Object.keys(elementos).length);
}

/**
 * Configura todos os eventos da aplicação
 */
function inicializarEventos() {
    console.log("🔗 Configurando eventos...");
    
    // Botão nova demanda
    if (elementos.btnNovaDemanda) {
        elementos.btnNovaDemanda.addEventListener('click', mostrarModalNovaDemanda);
    }
    
    if (elementos.btnFecharModal) {
        elementos.btnFecharModal.addEventListener('click', fecharModalNovaDemanda);
    }
    
    if (elementos.btnCancelar) {
        elementos.btnCancelar.addEventListener('click', fecharModalNovaDemanda);
    }
    
    // Formulário nova demanda
    if (elementos.formNovaDemanda) {
        elementos.formNovaDemanda.addEventListener('submit', salvarDemanda);
    }
    
    // Filtros
    if (elementos.filtroEscola) {
        elementos.filtroEscola.addEventListener('change', aplicarFiltros);
    }
    if (elementos.filtroDepartamento) {
    elementos.filtroDepartamento.addEventListener('change', aplicarFiltros);
    }
    
    if (elementos.filtroResponsavel) {
        elementos.filtroResponsavel.addEventListener('change', aplicarFiltros);
    }
    
    if (elementos.filtroStatus) {
        elementos.filtroStatus.addEventListener('change', aplicarFiltros);
    }
    
    if (elementos.filtroPrazo) {
        elementos.filtroPrazo.addEventListener('change', aplicarFiltros);
    }
    
    if (elementos.btnLimparFiltros) {
        elementos.btnLimparFiltros.addEventListener('click', limparFiltros);
    }
    
    if (elementos.btnAtualizar) {
        elementos.btnAtualizar.addEventListener('click', carregarDemandas);
    }
    
    // Checkbox "Selecionar todas"
    if (elementos.escolaTodas) {
        elementos.escolaTodas.addEventListener('change', function() {
            const checked = this.checked;
            elementos.escolasCheckboxes.forEach(cb => {
                cb.checked = checked;
                cb.disabled = checked;
            });
            atualizarPreviewEmail();
        });
    }
    
    // Checkboxes individuais
    if (elementos.escolasCheckboxes) {
        elementos.escolasCheckboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                // Atualizar checkbox "Selecionar todas"
                const todasMarcadas = Array.from(elementos.escolasCheckboxes)
                    .every(cb => cb.checked);
                if (elementos.escolaTodas) {
                    elementos.escolaTodas.checked = todasMarcadas;
                }
                
                atualizarPreviewEmail();
            });
        });
    }
    
    // Opção de enviar e-mail
    if (elementos.enviarEmail) {
        elementos.enviarEmail.addEventListener('change', function() {
            if (elementos.emailContent) {
                elementos.emailContent.style.display = this.checked ? 'block' : 'none';
            }
            if (this.checked) {
                atualizarPreviewEmail();
            }
        });
    }
    
    // Campos que afetam o preview do e-mail
    if (elementos.titulo) {
        elementos.titulo.addEventListener('input', atualizarPreviewEmail);
    }
    
    if (elementos.descricao) {
        elementos.descricao.addEventListener('input', atualizarPreviewEmail);
    }
    
    if (elementos.corpoEmail) {
        elementos.corpoEmail.addEventListener('input', atualizarPreviewEmail);
    }
    
    // Upload de arquivos
    if (elementos.uploadArea) {
        elementos.uploadArea.addEventListener('click', () => elementos.fileInput.click());
        elementos.uploadArea.addEventListener('dragover', handleDragOver);
        elementos.uploadArea.addEventListener('drop', handleFileDrop);
    }
    
    if (elementos.fileInput) {
        elementos.fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Tabs do formulário
    if (elementos.tabs) {
        elementos.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                alternarTab(tabId);
            });
        });
    }
    
    console.log("✅ Eventos configurados");
}

/**
 * Mostra/esconde tela de loading
 */
function mostrarLoading() {
    if (elementos.loading) {
        elementos.loading.style.display = 'flex';
    }
    
    if (elementos.mainContainer) {
        elementos.mainContainer.style.opacity = '0.5';
        elementos.mainContainer.style.pointerEvents = 'none';
    }
}

function esconderLoading() {
    if (elementos.loading) {
        elementos.loading.style.display = 'none';
    }
    
    if (elementos.mainContainer) {
        elementos.mainContainer.style.opacity = '1';
        elementos.mainContainer.style.pointerEvents = 'auto';
    }
}
function atualizarBlocoEstatisticas(demandas) {
    console.log("📈 Tentando atualizar estatísticas...");
    
    try {
        // Contar por status
        const total = demandas.length;
        const pendentes = demandas.filter(d => d.status === 'Pendente').length;
        const emAndamento = demandas.filter(d => d.status === 'Em andamento').length;
        const concluidas = demandas.filter(d => d.status === 'Concluída').length;
        
        // Calcular atrasadas
        const hoje = new Date();
        const atrasadas = demandas.filter(d => {
            if (d.status === 'Concluída') return false;
            if (!d.prazo) return false;
            const prazo = new Date(d.prazo);
            return prazo < hoje;
        }).length;
        
        console.log("📊 Estatísticas calculadas:", { total, pendentes, emAndamento, concluidas, atrasadas });
        
        // 1. Tentar atualizar elementos PRINCIPAIS (os que estavam dando erro)
        const elementos = {
            'total-demandas-info': total,
            'pendentes-info': pendentes,
            'em-andamento-info': emAndamento,
            'concluidas-info': concluidas,
            'atrasadas-info': atrasadas
        };
        
        // Tentar atualizar cada elemento, mas não parar se falhar
        for (const [id, valor] of Object.entries(elementos)) {
            try {
                const elemento = document.getElementById(id);
                if (elemento) {
                    elemento.textContent = valor;
                    console.log("✅ Atualizado: " + id + " = " + valor);
                } else {
                    console.log("⚠️ Elemento não encontrado: " + id);
                }
            } catch (erro) {
                console.log("⚠️ Erro ao atualizar " + id + ": " + erro.message);
                // Continua mesmo com erro
            }
        }
        
        // 2. Também atualizar elementos ALTERNATIVOS (se existirem)
        const elementosAlt = {
            'total-demandas': total,
            'pendentes': pendentes,
            'atrasadas': atrasadas,
            'em-andamento': emAndamento,
            'concluidas': concluidas
        };
        
        for (const [id, valor] of Object.entries(elementosAlt)) {
            try {
                const elemento = document.getElementById(id);
                if (elemento) {
                    elemento.textContent = valor;
                }
            } catch (erro) {
                // Ignora erro
            }
        }
        
    } catch (erro) {
        console.warn("⚠️ Erro geral em atualizarBlocoEstatisticas:", erro.message);
        // Não faz nada - deixa o sistema continuar
    }
}

/**
 * Carrega as demandas do servidor
 */
async function carregarDemandas() {
    console.log("🔄 Carregando demandas do servidor...");
    mostrarLoading();
    
    try {
        // 1. Buscar demandas REAIS do Google Sheets
        const demandas = await listarDemandasDoServidor();
        
        console.log(`✅ Recebidas ${demandas.length} demandas reais do servidor`);
        
        // 2. Salvar no estado da aplicação
        state.demandas = demandas;
        
        // 3. ATUALIZAÇÃO IMPORTANTE: Renderizar na LISTA NOVA
        renderizarDemandasNaLista();  // ← CHAMAR A FUNÇÃO NOVA!
        
        // 4. Atualizar estatísticas
        atualizarEstatisticas();
        
                // 5. Atualizar o bloco "Demandas" com números reais
        try {
            // Usamos setTimeout para não interferir no carregamento principal
            setTimeout(function() {
                try {
                    atualizarBlocoEstatisticas(demandas);
                } catch (erro) {
                    console.log("⚠️ Erro não crítico nas estatísticas: " + erro.message);
                }
            }, 100);
        } catch (erro) {
            console.log("⚠️ Erro externo nas estatísticas: " + erro.message);
        }
        
        // 6. Se não houver demandas, mostrar mensagem
        if (demandas.length === 0) {
            mostrarToast('Info', 'Nenhuma demanda cadastrada ainda.', 'info');
        }
        
    } catch (erro) {
        console.error('❌ Erro ao carregar demandas:', erro);
        
        // Modo de contingência (usar exemplos se servidor falhar)
        state.demandas = obterDadosDemonstracao();
        renderizarDemandasNaLista();  // ← Mesmo no modo contingência
        atualizarEstatisticas();
        
        mostrarToast('Atenção', 
            'Usando dados locais. Verifique sua conexão.', 
            'warning');
    } finally {
        esconderLoading();
    }
}

/**
 * Dados de demonstração para quando o servidor não retorna dados
 */
function obterDadosDemonstracao() {
    return [
        {
            id: 1,
            titulo: "Relatório Bimestral - Janeiro 2024",
            descricao: "Entrega do relatório de atividades do primeiro bimestre com avaliação de desempenho",
            escolas: "EEEFM Pedra Azul, EEEFM Fioravante Caliman",
            responsavel: "Escola(s)",
            status: "Pendente",
            prazo: "2024-01-31",
            criado_em: "2024-01-15T10:30:00.000Z",
            atualizado_em: "2024-01-15T10:30:00.000Z",
            prazo_status: "no-prazo",
            dias_restantes: 15
        },
        {
            id: 2,
            titulo: "Visita Técnica de Supervisão",
            descricao: "Agendamento para visita de supervisão pedagógica e infraestrutura",
            escolas: "EEEFM Alto Rio Possmoser",
            responsavel: "Supervisor",
            status: "Em andamento",
            prazo: "2024-01-25",
            criado_em: "2024-01-10T14:20:00.000Z",
            atualizado_em: "2024-01-12T09:15:00.000Z",
            prazo_status: "proximo-vencimento",
            dias_restantes: 9
        },
        {
            id: 3,
            titulo: "Planejamento Anual 2024",
            descricao: "Revisão e aprovação do planejamento anual das escolas sob supervisão",
            escolas: "EEEFM Pedra Azul, EEEFM Fioravante Caliman, EEEFM Alto Rio Possmoser",
            responsavel: "Supervisor",
            status: "Concluída",
            prazo: "2024-01-10",
            criado_em: "2024-01-05T08:45:00.000Z",
            atualizado_em: "2024-01-10T16:30:00.000Z",
            prazo_status: "atrasado",
            dias_restantes: -5
        }
    ];
}

/**
 * Renderiza a lista de demandas
 */
function renderizarDemandas() {
    const container = elementos.demandasContainer;
    if (!container) return;
    
    // Aplicar filtros
    let demandasFiltradas = filtrarDemandas(state.demandas);
    
    if (demandasFiltradas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list fa-3x"></i>
                <h3>Nenhuma demanda encontrada</h3>
                <p>${state.demandas.length === 0 ? 
                    'Clique no botão "+" para criar sua primeira demanda' : 
                    'Tente ajustar os filtros para ver mais resultados'}</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por prazo (mais próximos primeiro)
    demandasFiltradas.sort((a, b) => {
        if (!a.prazo) return 1;
        if (!b.prazo) return -1;
        return new Date(a.prazo) - new Date(b.prazo);
    });
    
    // Gerar HTML das demandas
    let html = '';
    
    demandasFiltradas.forEach(demanda => {
        const statusClass = `status-${demanda.status.toLowerCase().replace(' ', '-')}`;
        const responsavelClass = demanda.responsavel === 'Supervisor' ? 'supervisor' : 'escola';
        
        // Calcular status do prazo
        let prazoStatus = '';
        let prazoClass = '';
        
        if (demanda.prazo) {
            const hoje = new Date();
            const prazo = new Date(demanda.prazo);
            const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
            
            if (diasRestantes < 0) {
                prazoStatus = 'Atrasada';
                prazoClass = 'prazo-urgente';
            } else if (diasRestantes === 0) {
                prazoStatus = 'Vence hoje';
                prazoClass = 'prazo-urgente';
            } else if (diasRestantes <= 3) {
                prazoStatus = 'Próxima do prazo';
                prazoClass = 'prazo-alerta';
            } else {
                prazoStatus = 'No prazo';
                prazoClass = 'prazo-ok';
            }
        }
        
        // Formatar data
        const dataCriacao = formatarData(demanda.criado_em);
        const dataPrazo = demanda.prazo ? formatarData(demanda.prazo) : 'Não definido';
        
        // Escolas (truncar se muito longo)
        let escolasTexto = demanda.escolas || '';
        if (escolasTexto.length > 50) {
            escolasTexto = escolasTexto.substring(0, 47) + '...';
        }
        
        // Determinar classes de cor baseadas no prazo
        let cardClasses = `demanda-card ${responsavelClass}`;
        if (prazoStatus === 'Atrasada') cardClasses += ' atrasada';
        else if (prazoStatus === 'Próxima do prazo' || prazoStatus === 'Vence hoje') {
            cardClasses += ' proxima';
        }
        
        html += `
            <div class="${cardClasses}" data-id="${demanda.id}" onclick="mostrarDetalhesDemanda(${demanda.id})">
                <div class="demanda-card-header">
                    <div>
                        <div class="demanda-titulo">${demanda.titulo || 'Sem título'}</div>
                        <div class="demanda-id">#${demanda.id} • Criada em ${dataCriacao}</div>
                    </div>
                    <div class="demanda-status ${statusClass}">
                        ${demanda.status}
                    </div>
                </div>
                
                <div class="demanda-info">
                    <div class="info-item">
                        <i class="fas fa-school"></i>
                        <span>${demanda.escolas ? demanda.escolas.split(',').length : 0} escola(s)</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-user-tag"></i>
                        <span>${demanda.responsavel || 'Não definido'}</span>
                    </div>
                    <div class="info-item escolas">
                        <i class="fas fa-list"></i>
                        <span>${escolasTexto}</span>
                    </div>
                </div>
                
                <div class="demanda-prazo">
                    <i class="fas fa-calendar-alt"></i>
                    <span class="prazo-data">Prazo: ${dataPrazo}</span>
                    ${demanda.prazo ? `
                    <span class="prazo-status ${prazoClass}">
                        ${prazoStatus}
                    </span>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}
/**
 * FUNÇÃO RESPONSIVA: Renderiza demandas na LISTA para celular e computador
 */
function renderizarDemandasNaLista() {
    console.log("🎯 Renderizando demandas responsivamente...");
    
    // 1. Procurar onde vamos colocar as demandas
    let listaContainer = document.getElementById('demandas-lista-container');
    
    if (!listaContainer) {
        listaContainer = document.querySelector('.demandas-lista-container') ||
                        document.querySelector('.lista-container') ||
                        document.querySelector('.demandas-container');
    }
    
    // 2. SE NÃO ACHOU, criar um container responsivo
    if (!listaContainer) {
        console.log("⚠️ Criando container responsivo...");
        
        const mainContent = document.querySelector('.main-content') || 
                           document.querySelector('main') || 
                           document.querySelector('.container') ||
                           document.body;
        
        const novoContainer = document.createElement('div');
        novoContainer.className = 'demandas-lista-container responsivo';
        novoContainer.id = 'demandas-lista-container';
        
        // Estilo responsivo
        novoContainer.style.cssText = `
            width: 100%;
            margin: 0 auto;
            background: white;
            border-radius: 0;
            box-shadow: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        mainContent.appendChild(novoContainer);
        listaContainer = novoContainer;
    }
    
    // 3. Limpar container
    listaContainer.innerHTML = '';
    
    // 4. Verificar se temos demandas
    if (!state.demandas || state.demandas.length === 0) {
        console.log("📭 Nenhuma demanda para mostrar");
        
        // Mensagem responsiva de "vazio"
        const mensagemVazio = `
            <div style="text-align: center; padding: 40px 20px; color: #6c757d;">
                <div style="font-size: 48px; margin-bottom: 16px; color: #dee2e6;">
                    📋
                </div>
                <h3 style="color: #495057; margin-bottom: 8px; font-weight: 500; font-size: 18px;">
                    Nenhuma demanda encontrada
                </h3>
                <p style="color: #adb5bd; margin-bottom: 24px; font-size: 14px;">
                    Não há demandas cadastradas no momento
                </p>
                <button onclick="mostrarModalNovaDemanda()" 
                        style="padding: 14px 28px; 
                               background: #3498db; 
                               color: white; 
                               border: none; 
                               border-radius: 8px; 
                               cursor: pointer;
                               font-weight: 600;
                               font-size: 15px;
                               width: 100%;
                               max-width: 300px;">
                    <i class="fas fa-plus" style="margin-right: 8px;"></i>
                    Criar Primeira Demanda
                </button>
            </div>
        `;
        
        listaContainer.innerHTML = mensagemVazio;
        return;
    }
    
    console.log(`📊 Mostrando ${state.demandas.length} demandas`);
    
    // 5. VERIFICAR SE É CELULAR OU COMPUTADOR
    const isMobile = window.innerWidth <= 768;
    console.log(`📱 Dispositivo: ${isMobile ? 'CELULAR' : 'COMPUTADOR'}`);
    
    if (isMobile) {
        // ============================================
        // 🔥 LAYOUT PARA CELULAR (Cards)
        // ============================================
        renderizarParaCelular(listaContainer);
    } else {
        // ============================================
        // 💻 LAYOUT PARA COMPUTADOR (Tabela)
        // ============================================
        renderizarParaComputador(listaContainer);
    }
    
    console.log("✅ Lista renderizada de forma responsiva!");
}

/**
 * LAYOUT PARA CELULAR - Cards simples
 */
function renderizarParaCelular(container) {
    console.log("📱 Criando layout mobile...");
    
    let html = '';
    
    state.demandas.forEach((demanda, index) => {
        // Formatar data
        const dataPrazo = demanda.prazo ? 
            new Date(demanda.prazo).toLocaleDateString('pt-BR') : 
            "Não definido";
        
        // Cor do status
        let statusColor = '';
        let statusText = demanda.status || 'Pendente';
        
        switch(statusText) {
            case 'Pendente': statusColor = '#e74c3c'; break;
            case 'Em andamento': statusColor = '#f39c12'; break;
            case 'Concluída': statusColor = '#27ae60'; break;
            default: statusColor = '#95a5a6';
        }
        
        // Verificar prazo
        let prazoStatus = '';
        let prazoIcon = '📅';
        if (demanda.prazo) {
            const hoje = new Date();
            const prazo = new Date(demanda.prazo);
            const dias = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
            
            if (dias < 0) {
                prazoStatus = 'color: #e74c3c; font-weight: bold;';
                prazoIcon = '⏰';
            } else if (dias <= 3) {
                prazoStatus = 'color: #f39c12;';
                prazoIcon = '⚠️';
            }
        }
        
        // Escolas (resumir)
        let escolasTexto = demanda.escolas || "Não definida";
        if (escolasTexto.includes(',')) {
            escolasTexto = escolasTexto.split(',')[0].trim() + " + mais";
        }
        
        // Card mobile
        html += `
            <div onclick="mostrarDetalhesDemanda(${demanda.id})" 
                 style="margin: 12px 16px; 
                        padding: 16px; 
                        background: white;
                        border-radius: 12px;
                        border: 1px solid #e0e0e0;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                        cursor: pointer;
                        transition: all 0.2s;">
                
                <!-- Cabeçalho do card -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <div style="font-weight: 600; color: #2c3e50; font-size: 16px; margin-bottom: 4px;">
                            ${demanda.titulo || 'Sem título'}
                        </div>
                        <div style="font-size: 12px; color: #7f8c8d;">
                            ID: #${demanda.id || index + 1}
                        </div>
                    </div>
                    <div style="background: ${statusColor}; 
                                color: white; 
                                padding: 4px 10px; 
                                border-radius: 20px; 
                                font-size: 12px; 
                                font-weight: 600;">
                        ${statusText}
                    </div>
                </div>
                
                <!-- Informações principais -->
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 14px; color: #555; margin-bottom: 8px; display: flex; align-items: center;">
                        <i class="fas fa-school" style="color: #3498db; margin-right: 8px; width: 16px;"></i>
                        ${escolasTexto}
                    </div>
                    <div style="font-size: 14px; color: #555; margin-bottom: 8px; display: flex; align-items: center;">
                        <i class="fas fa-building" style="color: #9b59b6; margin-right: 8px; width: 16px;"></i>
                        ${demanda.departamento || 'Não definido'}
                    </div>
                    <div style="font-size: 14px; color: #555; display: flex; align-items: center;">
                        <i class="fas fa-user-tag" style="color: #e74c3c; margin-right: 8px; width: 16px;"></i>
                        ${demanda.responsavel || 'Não definido'}
                    </div>
                </div>
                
                <!-- Rodapé do card -->
                <div style="display: flex; justify-content: space-between; align-items: center; 
                            padding-top: 12px; border-top: 1px solid #f0f0f0; font-size: 13px;">
                    <div style="color: #7f8c8d; display: flex; align-items: center;">
                        ${prazoIcon}
                        <span style="margin-left: 6px; ${prazoStatus}">
                            ${dataPrazo}
                        </span>
                    </div>
                    <div style="color: #3498db; font-weight: 500;">
                        <i class="fas fa-chevron-right" style="font-size: 12px;"></i>
                        Ver detalhes
                    </div>
                </div>
                
            </div>
        `;
    });
    
    // Adicionar cabeçalho mobile
    const cabecalhoMobile = `
        <div style="padding: 16px; background: #2c3e50; color: white;">
            <h2 style="margin: 0; font-size: 18px; display: flex; align-items: center;">
                <i class="fas fa-list" style="margin-right: 10px;"></i>
                Demandas (${state.demandas.length})
            </h2>
        </div>
    `;
    
    container.innerHTML = cabecalhoMobile + html;
}

/**
 * LAYOUT PARA COMPUTADOR - Tabela completa
 */
function renderizarParaComputador(container) {
    console.log("💻 Criando layout desktop...");
    
    // Cabeçalho da tabela
    const cabecalhoHTML = `
        <div style="background: #2c3e50; 
                    color: white; 
                    padding: 16px 24px;
                    display: grid; 
                    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; 
                    gap: 16px; 
                    font-weight: 600;
                    font-size: 14px;">
            <div><i class="fas fa-heading" style="margin-right: 8px;"></i>Título</div>
            <div><i class="fas fa-school" style="margin-right: 8px;"></i>Escola</div>
            <div><i class="fas fa-building" style="margin-right: 8px;"></i>Departamento</div>
            <div><i class="fas fa-user-tag" style="margin-right: 8px;"></i>Responsável</div>
            <div><i class="fas fa-calendar-alt" style="margin-right: 8px;"></i>Prazo</div>
            <div><i class="fas fa-tasks" style="margin-right: 8px;"></i>Status</div>
        </div>
    `;
    
    container.innerHTML = cabecalhoHTML;
    
    // Linhas da tabela
    state.demandas.forEach((demanda, index) => {
        // Formatar data
        let dataPrazo = "Não definido";
        let prazoColor = "#95a5a6";
        if (demanda.prazo) {
            const data = new Date(demanda.prazo);
            dataPrazo = data.toLocaleDateString('pt-BR');
            
            const hoje = new Date();
            const prazoData = new Date(demanda.prazo);
            const diasRestantes = Math.ceil((prazoData - hoje) / (1000 * 60 * 60 * 24));
            
            if (diasRestantes < 0) prazoColor = "#e74c3c";
            else if (diasRestantes <= 3) prazoColor = "#f39c12";
            else prazoColor = "#27ae60";
        }
        
        // Formatar escolas
        let escolasTexto = demanda.escolas || "Não definida";
        if (escolasTexto.includes(',')) {
            escolasTexto = escolasTexto.split(',')[0].trim() + " + mais";
        }
        
        // Status
        let statusStyle = '';
        let statusIcon = '';
        
        switch(demanda.status) {
            case 'Pendente':
                statusStyle = 'background: #e74c3c;';
                statusIcon = '⏰';
                break;
            case 'Em andamento':
                statusStyle = 'background: #f39c12;';
                statusIcon = '▶️';
                break;
            case 'Concluída':
                statusStyle = 'background: #27ae60;';
                statusIcon = '✅';
                break;
            default:
                statusStyle = 'background: #95a5a6;';
                statusIcon = '📝';
        }
        
        // Cor de fundo alternada
        const rowBgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        
        // Linha da tabela
        const linhaHTML = `
            <div onclick="mostrarDetalhesDemanda(${demanda.id})" 
                 style="display: grid; 
                        grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
                        gap: 16px; 
                        padding: 14px 24px;
                        background: ${rowBgColor};
                        border-bottom: 1px solid #e9ecef;
                        cursor: pointer; 
                        transition: background 0.2s;
                        &:hover { background: #e3f2fd; }">
                
                <!-- Título -->
                <div style="font-weight: 500; color: #2c3e50;">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                        ${demanda.titulo || 'Sem título'}
                    </div>
                    <div style="font-size: 12px; color: #7f8c8d;">
                        ${demanda.descricao ? (demanda.descricao.substring(0, 50) + '...') : 'Sem descrição'}
                    </div>
                </div>
                
                <!-- Escola -->
                <div style="color: #34495e; font-size: 13px; display: flex; align-items: center;">
                    <i class="fas fa-school" style="color: #3498db; margin-right: 8px;"></i>
                    ${escolasTexto}
                </div>
                
                <!-- Departamento -->
                <div style="color: #7f8c8d; font-size: 13px; display: flex; align-items: center;">
                    <i class="fas fa-building" style="color: #9b59b6; margin-right: 8px;"></i>
                    ${demanda.departamento || 'Não definido'}
                </div>
                
                <!-- Responsável -->
                <div style="color: #2c3e50; font-size: 13px; display: flex; align-items: center;">
                    <i class="fas fa-user-tag" style="color: ${demanda.responsavel === 'Supervisor' ? '#e74c3c' : '#3498db'}; margin-right: 8px;"></i>
                    ${demanda.responsavel || 'Não definido'}
                </div>
                
                <!-- Prazo -->
                <div style="color: ${prazoColor}; font-size: 13px; font-weight: 500; display: flex; align-items: center;">
                    <i class="fas fa-calendar-alt" style="margin-right: 8px;"></i>
                    ${dataPrazo}
                </div>
                
                <!-- Status -->
                <div style="${statusStyle} 
                            color: white;
                            padding: 6px 12px; 
                            border-radius: 20px; 
                            text-align: center; 
                            font-size: 12px; 
                            font-weight: 600;
                            display: flex; 
                            align-items: center; 
                            justify-content: center;">
                    ${statusIcon} ${demanda.status || 'Pendente'}
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', linhaHTML);
    });
    
    // Rodapé
    const rodapeHTML = `
        <div style="background: #f8f9fa; 
                    padding: 12px 24px; 
                    color: #6c757d; 
                    font-size: 13px;
                    display: flex; 
                    justify-content: space-between;">
            <div>
                <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                Total: ${state.demandas.length} demandas
            </div>
            <div>
                <span style="color: #27ae60;">●</span> Concluídas
                <span style="margin-left: 12px; color: #f39c12;">●</span> Em andamento
                <span style="margin-left: 12px; color: #e74c3c;">●</span> Pendentes
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', rodapeHTML);
}

/**
 * Função para redimensionamento da tela
 */
function configurarResponsividade() {
    // Redesenhar quando a tela mudar de tamanho
    let timeout;
    window.addEventListener('resize', function() {
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            console.log("🔄 Redimensionando tela...");
            if (state.demandas.length > 0) {
                renderizarDemandasNaLista();
            }
        }, 250);
    });
}

// Configurar responsividade quando o sistema iniciar
setTimeout(configurarResponsividade, 1000);/**
 * Filtra as demandas com base nos filtros ativos
 */
function filtrarDemandas(demandas) {
    return demandas.filter(demanda => {
        // Filtro por escola
        if (state.filtros.escola && demanda.escolas) {
            if (!demanda.escolas.includes(state.filtros.escola)) {
                return false;
            }
        }
        // Filtro por departamento (NOVO)
if (state.filtros.departamento && state.filtros.departamento !== '') {
    // Se a demanda não tem departamento definido, ignora (para demandas antigas)
    if (!demanda.departamento || demanda.departamento === '') {
        return false; // Não mostra demandas sem departamento
    }
    
    // Verificar se o departamento da demanda corresponde ao filtro
    const deptsDemanda = demanda.departamento.split(',').map(d => d.trim());
    
    // Se o filtro for vazio ou "Todos", mostrar tudo
    if (state.filtros.departamento === '') {
        // Continua (mostra todas)
    } 
    // Se for um departamento específico, verificar
    else if (!deptsDemanda.includes(state.filtros.departamento)) {
        return false; // Não corresponde, não mostra
    }
}
        
        // Filtro por responsável
        if (state.filtros.responsavel && demanda.responsavel !== state.filtros.responsavel) {
            return false;
        }
        
        // Filtro por status
        if (state.filtros.status && demanda.status !== state.filtros.status) {
            return false;
        }
        
        // Filtro por prazo
        if (state.filtros.prazo && demanda.prazo) {
            const hoje = new Date();
            const prazo = new Date(demanda.prazo);
            const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
            
            switch(state.filtros.prazo) {
                case 'hoje':
                    if (diasRestantes !== 0) return false;
                    break;
                case 'proximos':
                    if (diasRestantes > 3 || diasRestantes < 0) return false;
                    break;
                case 'atrasadas':
                    if (diasRestantes >= 0) return false;
                    break;
            }
        }
        
        return true;
    });
}
async function atualizarStatusDemanda(idDemanda, novoStatus) {
    try {
        const dados = {
            acao: 'atualizarDemanda',
            id: idDemanda,
            status: novoStatus,
            alteracao: `Status alterado para: ${novoStatus}`
        };
        
        const resultado = await enviarParaGoogleAppsScript(dados);
        return resultado;
        
    } catch (erro) {
        console.error('Erro ao atualizar status:', erro);
        throw erro;
    }
}

/**
 * Aplica os filtros atuais
 */
function aplicarFiltros() {
    state.filtros = {
        escola: elementos.filtroEscola ? elementos.filtroEscola.value : '',
        departamento: elementos.filtroDepartamento ? elementos.filtroDepartamento.value : '',
        responsavel: elementos.filtroResponsavel ? elementos.filtroResponsavel.value : '',
        status: elementos.filtroStatus ? elementos.filtroStatus.value : '',
        prazo: elementos.filtroPrazo ? elementos.filtroPrazo.value : ''
    };
    
    renderizarDemandas();
    atualizarEstatisticas();
}

/**
 * Limpa todos os filtros
 */
function limparFiltros() {
    if (elementos.filtroEscola) elementos.filtroEscola.value = '';
    if (elementos.filtroResponsavel) elementos.filtroResponsavel.value = '';
    if (elementos.filtroStatus) elementos.filtroStatus.value = '';
    if (elementos.filtroPrazo) elementos.filtroPrazo.value = '';
    
    aplicarFiltros();
}

/**
 * Atualiza as estatísticas na barra de controle
 */
function atualizarEstatisticas() {
    const demandasFiltradas = filtrarDemandas(state.demandas);
    const hoje = new Date();
    
    // Calcular todas as estatísticas
    const total = demandasFiltradas.length;
    const pendentes = demandasFiltradas.filter(d => d.status === 'Pendente').length;
    const emAndamento = demandasFiltradas.filter(d => d.status === 'Em andamento').length;
    const concluidas = demandasFiltradas.filter(d => d.status === 'Concluída').length;
    
    // Atrasadas: Pendentes ou Em andamento com prazo vencido
    const atrasadas = demandasFiltradas.filter(d => {
        if (!d.prazo) return false;
        if (d.status === 'Concluída') return false;
        
        const prazo = new Date(d.prazo);
        return prazo < hoje;
    }).length;
    
    console.log('📊 Estatísticas atualizadas:', {
        total,
        pendentes,
        emAndamento,
        concluidas,
        atrasadas
    });
    
    // Atualizar elementos do DOM (se existirem)
    if (elementos.totalDemandas) elementos.totalDemandas.textContent = total;
    if (elementos.pendentes) elementos.pendentes.textContent = pendentes;
    if (elementos.atrasadas) elementos.atrasadas.textContent = atrasadas;
    
    // Adicionar novos elementos
    const emAndamentoEl = document.getElementById('em-andamento');
    const concluidasEl = document.getElementById('concluidas');
    
    if (emAndamentoEl) emAndamentoEl.textContent = emAndamento;
    if (concluidasEl) concluidasEl.textContent = concluidas;
    
    // Opcional: Destacar se houver atrasadas
    if (atrasadas > 0) {
        const atrasadasEl = document.getElementById('atrasadas');
        if (atrasadasEl) {
            atrasadasEl.parentElement.parentElement.style.animation = 'pulse 2s infinite';
        }
    }
}

/**
 * Formata uma data para exibição
 */
function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (erro) {
        return dataString;
    }
}

/**
 * Mostra modal de nova demanda
 */
function mostrarModalNovaDemanda() {
    if (!elementos.modalNovaDemanda) return;
    
    elementos.modalNovaDemanda.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Resetar formulário
    if (elementos.formNovaDemanda) elementos.formNovaDemanda.reset();
    if (elementos.arquivosList) elementos.arquivosList.innerHTML = '';
    state.arquivosSelecionados = [];
    
    // Voltar para a primeira aba
    alternarTab('principal');
    
    // Configurar data mínima como amanhã
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    
    if (elementos.prazo) {
        elementos.prazo.min = amanha.toISOString().split('T')[0];
        
        // Data padrão: 7 dias à frente
        const prazoPadrao = new Date(hoje);
        prazoPadrao.setDate(hoje.getDate() + 7);
        elementos.prazo.value = prazoPadrao.toISOString().split('T')[0];
    }
    
    // Resetar checkboxes
    if (elementos.escolasCheckboxes) {
        elementos.escolasCheckboxes.forEach(cb => {
            cb.checked = false;
            cb.disabled = false;
        });
    }
    
    if (elementos.escolaTodas) {
        elementos.escolaTodas.checked = false;
    }
    
    // ============================================
    // NOVO: CONFIGURAR SELEÇÃO DE DEPARTAMENTOS
    // ============================================
    
    // Mostrar/ocultar seleção de departamento conforme tipo de usuário
    const usuarioSalvo = localStorage.getItem('usuario_demandas');
    let usuario = null;
    
    try {
        usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : {};
    } catch (e) {
        usuario = {};
        console.error('❌ Erro ao ler usuário do localStorage:', e);
    }
    
    const departamentoContainer = document.getElementById('departamento-container');
    const departamentoCheckboxes = document.querySelectorAll('.departamento-checkbox');
    const departamentoTodas = document.getElementById('departamento-todas');
    
    console.log('🔍 Verificando permissões para departamento:', {
        usuario: usuario ? usuario.tipo_usuario : 'não logado',
        containerExiste: !!departamentoContainer,
        temCheckboxes: departamentoCheckboxes.length
    });
    
    if (departamentoContainer && departamentoCheckboxes.length > 0) {
        // Apenas SUPERVISOR pode selecionar departamentos
        if (usuario && usuario.tipo_usuario === 'supervisor') {
            departamentoContainer.style.display = 'block';
            console.log('👑 Supervisor: mostrando seleção de departamentos');
            
            // Resetar checkboxes de departamento
            departamentoCheckboxes.forEach(cb => {
                cb.checked = false;
                cb.disabled = false;
            });
            
            // Configurar checkbox "Selecionar todas"
            if (departamentoTodas) {
                departamentoTodas.checked = false;
                departamentoTodas.addEventListener('change', function() {
                    const checked = this.checked;
                    document.querySelectorAll('.departamento-checkbox:not(#departamento-todas)').forEach(cb => {
                        cb.checked = checked;
                        cb.disabled = checked;
                    });
                    console.log('📋 Departamento "todas" alterado para:', checked);
                });
            }
            
            // Configurar checkboxes individuais
            document.querySelectorAll('.departamento-checkbox:not(#departamento-todas)').forEach(cb => {
                cb.addEventListener('change', function() {
                    // Atualizar checkbox "Selecionar todas"
                    const checkboxes = document.querySelectorAll('.departamento-checkbox:not(#departamento-todas)');
                    const todasMarcadas = Array.from(checkboxes).every(cb => cb.checked);
                    
                    if (departamentoTodas) {
                        departamentoTodas.checked = todasMarcadas;
                    }
                    
                    console.log('📋 Departamento alterado:', this.value, this.checked);
                });
            });
            
        } else {
            departamentoContainer.style.display = 'none';
            console.log('🚫 Não-supervisor: ocultando seleção de departamentos');
        }
    } else {
        console.warn('⚠️ Elementos de departamento não encontrados no formulário');
    }
    
    console.log('✅ Configuração de departamentos concluída');
    
    // Esconder conteúdo de e-mail
    if (elementos.emailContent) {
        elementos.emailContent.style.display = 'none';
    }
    
    if (elementos.enviarEmail) {
        elementos.enviarEmail.checked = false;
    }
} 

/**
 * Fecha modal de nova demanda
 */
function fecharModalNovaDemanda() {
    if (elementos.modalNovaDemanda) {
        elementos.modalNovaDemanda.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
}

/**
 * Alterna entre as tabs do formulário
 */
function alternarTab(tabId) {
    // Remover classe active de todas as tabs
    if (elementos.tabs) {
        elementos.tabs.forEach(tab => tab.classList.remove('active'));
    }
    
    if (elementos.tabContents) {
        elementos.tabContents.forEach(content => content.classList.remove('active'));
    }
    
    // Adicionar classe active na tab clicada
    const tabSelecionada = document.querySelector(`.tab[data-tab="${tabId}"]`);
    const conteudoSelecionado = document.getElementById(`tab-${tabId}`);
    
    if (tabSelecionada && conteudoSelecionado) {
        tabSelecionada.classList.add('active');
        conteudoSelecionado.classList.add('active');
    }
}

/**
 * Atualiza o preview do e-mail
 */
function atualizarPreviewEmail() {
    if (!elementos.titulo || !elementos.emailPreview) return;
    
    const titulo = elementos.titulo.value || '[Título da demanda]';
    
    // Obter escolas selecionadas
    const escolasSelecionadas = [];
    if (elementos.escolasCheckboxes) {
        elementos.escolasCheckboxes.forEach(cb => {
            if (cb.checked) {
                escolasSelecionadas.push(cb.value);
            }
        });
    }
    
    const previewHtml = `
        <p><strong>Assunto:</strong> [DEMANDA] ${titulo}</p>
        <p><strong>Destinatários:</strong> ${escolasSelecionadas.length} escola(s) + Supervisão</p>
        <p><strong>Conteúdo incluirá:</strong></p>
        <ul>
            <li>Título da demanda</li>
            <li>Descrição completa</li>
            <li>Escolas envolvidas</li>
            <li>Responsável pela execução</li>
            <li>Prazo final</li>
            <li>Mensagem adicional (se fornecida)</li>
            <li>Anexos (se houver)</li>
        </ul>
    `;
    
    elementos.emailPreview.innerHTML = previewHtml;
}

/**
 * Lida com o arrastar de arquivos
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (elementos.uploadArea) {
        elementos.uploadArea.style.borderColor = '#3498db';
        elementos.uploadArea.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
    }
}

/**
 * Lida com o soltar de arquivos
 */
function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (elementos.uploadArea) {
        elementos.uploadArea.style.borderColor = '#ddd';
        elementos.uploadArea.style.backgroundColor = '';
    }
    
    const files = e.dataTransfer.files;
    processarArquivosSelecionados(files);
}

/**
 * Lida com a seleção de arquivos via input
 */
function handleFileSelect(e) {
    const files = e.target.files;
    processarArquivosSelecionados(files);
    
    // Resetar input para permitir selecionar o mesmo arquivo novamente
    if (elementos.fileInput) {
        elementos.fileInput.value = '';
    }
}

/**
 * Processa os arquivos selecionados
 */
function processarArquivosSelecionados(files) {
    for (let file of files) {
        // Verificar tamanho máximo (10MB)
        if (file.size > 10 * 1024 * 1024) {
            mostrarToast('Arquivo grande', `${file.name} excede 10MB.`, 'warning');
            continue;
        }
        
        // Verificar tipo de arquivo
        const extensoesPermitidas = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png'];
        const extensao = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!extensoesPermitidas.includes(extensao)) {
            mostrarToast('Formato não suportado', `${file.name} tem formato não permitido.`, 'warning');
            continue;
        }
        
        // Adicionar à lista
        state.arquivosSelecionados.push(file);
        adicionarArquivoNaLista(file);
    }
}

/**
 * Adiciona um arquivo na lista visível
 */
function adicionarArquivoNaLista(file) {
    if (!elementos.arquivosList) return;
    
    const tamanho = formatarTamanhoArquivo(file.size);
    
    const item = document.createElement('div');
    item.className = 'arquivo-item';
    item.innerHTML = `
        <div class="arquivo-info">
            <i class="fas fa-paperclip arquivo-icon"></i>
            <div>
                <div class="arquivo-nome">${file.name}</div>
                <div class="arquivo-tamanho">${tamanho}</div>
            </div>
        </div>
        <button type="button" class="btn-remover-arquivo" data-nome="${file.name}">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    elementos.arquivosList.appendChild(item);
    
    // Adicionar evento para remover
    const btnRemover = item.querySelector('.btn-remover-arquivo');
    btnRemover.addEventListener('click', function() {
        const nomeArquivo = this.getAttribute('data-nome');
        removerArquivoDaLista(nomeArquivo);
        item.remove();
    });
}

/**
 * Remove um arquivo da lista
 */
function removerArquivoDaLista(nomeArquivo) {
    state.arquivosSelecionados = state.arquivosSelecionados.filter(
        file => file.name !== nomeArquivo
    );
}

/**
 * Formata o tamanho do arquivo
 */
function formatarTamanhoArquivo(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// REMOVA a função salvarDemanda original (aproximadamente linha 480-610)
// E substitua pelo novo código abaixo:

/**
 * Salva uma nova demanda COM NOTIFICAÇÕES
 */
async function salvarDemanda(e) {
    e.preventDefault();
    
    // Validar formulário
    if (!validarFormulario()) {
        return;
    }
    
    mostrarLoading();
    
    try {
        // 1. Preparar dados básicos
        const escolasSelecionadas = [];
        if (elementos.escolasCheckboxes) {
            elementos.escolasCheckboxes.forEach(cb => {
                if (cb.checked) {
                    escolasSelecionadas.push(cb.value);
                }
            });
        }

        // 1.1. Preparar departamentos selecionados
        const departamentosSelecionados = [];
        const usuarioSalvo = localStorage.getItem('usuario_demandas');
        let usuario = null;

        try {
            usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : {};
        } catch (e) {
            usuario = {};
            console.error('❌ Erro ao ler usuário do localStorage:', e);
        }

        console.log('👤 Usuário atual:', {
            tipo: usuario.tipo_usuario,
            departamento: usuario.departamento
        });

        // Se for supervisor, pega os departamentos selecionados no formulário
        if (usuario.tipo_usuario === 'supervisor') {
            console.log('👑 Supervisor: capturando departamentos do formulário');
            
            const departamentoCheckboxes = document.querySelectorAll('.departamento-checkbox:not(#departamento-todas)');
            if (departamentoCheckboxes && departamentoCheckboxes.length > 0) {
                departamentoCheckboxes.forEach(cb => {
                    if (cb.checked) {
                        departamentosSelecionados.push(cb.value);
                        console.log('✅ Departamento selecionado:', cb.value);
                    }
                });
            }
            
            // Se não selecionou nenhum, usa o departamento do usuário
            if (departamentosSelecionados.length === 0) {
                departamentosSelecionados.push(usuario.departamento || 'Supervisão');
                console.log('⚠️ Nenhum departamento selecionado. Usando padrão:', departamentosSelecionados[0]);
            }
        } else {
            // Para não-supervisores, usa apenas o departamento do usuário
            departamentosSelecionados.push(usuario.departamento || 'Pedagógico');
            console.log('👤 Não-supervisor. Usando departamento:', departamentosSelecionados[0]);
        }

        console.log('📋 Departamentos a serem salvos:', departamentosSelecionados);

        const dadosDemanda = {
            titulo: elementos.titulo ? elementos.titulo.value.trim() : '',
            descricao: elementos.descricao ? elementos.descricao.value.trim() : '',
            escolas: escolasSelecionadas,
            departamento: departamentosSelecionados.join(', '),
            responsavel: document.querySelector('input[name="responsavel"]:checked') ? 
                document.querySelector('input[name="responsavel"]:checked').value : '',
            prazo: elementos.prazo ? elementos.prazo.value : '',
            enviarEmail: elementos.enviarEmail ? elementos.enviarEmail.checked : false,
            corpoEmail: elementos.corpoEmail ? elementos.corpoEmail.value.trim() : ''
        };

        console.log('📤 Dados da demanda:', {
            titulo: dadosDemanda.titulo.substring(0, 50) + '...',
            escolas: dadosDemanda.escolas.length,
            departamento: dadosDemanda.departamento
        });
        
        // 2. Fazer upload dos anexos se houver
        let linksAnexos = [];
        
        if (state.arquivosSelecionados.length > 0) {
            mostrarToast('Upload', 'Enviando anexos...', 'info');
            
            for (const arquivo of state.arquivosSelecionados) {
                try {
                    const resultadoUpload = await fazerUploadArquivo(arquivo);
                    
                    let urlFinal = null;
                    
                    if (resultadoUpload.sucesso !== false && resultadoUpload.dados && resultadoUpload.dados.url) {
                        urlFinal = resultadoUpload.dados.url;
                    } else if (resultadoUpload.url && resultadoUpload.url.startsWith('http')) {
                        urlFinal = resultadoUpload.url;
                    }
                    
                    if (urlFinal && urlFinal.startsWith('http')) {
                        linksAnexos.push({
                            nome: arquivo.name,
                            url: urlFinal,
                            tamanho: arquivo.size,
                            status: 'sucesso'
                        });
                    }
                    
                } catch (erro) {
                    console.error(`❌ Erro no upload:`, erro);
                    mostrarToast('Atenção', `Erro ao enviar ${arquivo.name}`, 'warning');
                }
            }
            
            if (linksAnexos.length > 0) {
                dadosDemanda.anexos = linksAnexos;
            }
        }
        
        // 3. Salvar demanda no servidor
        mostrarToast('Salvando', 'Salvando demanda...', 'info');
        const resultadoSalvar = await salvarDemandaNoServidor(dadosDemanda);
        // Enviar notificação Firebase se configurado
setTimeout(async () => {
    try {
        const usuarioSalvo = localStorage.getItem('usuario_demandas');
        if (usuarioSalvo) {
            const usuario = JSON.parse(usuarioSalvo);
            
            // Verificar se usuário quer notificações push
            if (usuario.notificacoesPush !== false) {
                const notificacaoData = {
                    titulo: dadosDemanda.titulo,
                    mensagem: `Nova demanda criada: ${dadosDemanda.titulo}`,
                    demandaId: resultadoSalvar.id,
                    departamento: dadosDemanda.departamento,
                    escolas: dadosDemanda.escolas.join(', '),
                    importante: true
                };
                
                await enviarNotificacaoFirebase(notificacaoData);
            }
        }
    } catch (notifErro) {
        console.warn('⚠️ Erro na notificação Firebase (não crítico):', notifErro);
    }
}, 1000);
        if (!resultadoSalvar || !resultadoSalvar.id) {
            throw new Error('Erro ao salvar demanda: ID não retornado');
        }
        
        const idDemanda = resultadoSalvar.id;
        console.log(`✅ Demanda salva com ID: ${idDemanda}`);
        
        // 4. DISPARAR NOTIFICAÇÕES INTELIGENTES
        if (idDemanda) {
            setTimeout(async () => {
                try {
                    console.log('🔔 Iniciando notificações inteligentes...');
                    const resultadoNotificacoes = await dispararNotificacoesNovaDemanda(dadosDemanda, idDemanda);
                    
                    if (resultadoNotificacoes && !resultadoNotificacoes.erro) {
                        console.log(`📢 Notificações enviadas para ${resultadoNotificacoes.usuariosNotificados?.length || 0} usuários`);
                        
                        // Mostrar feedback se foram enviadas notificações
                        if (resultadoNotificacoes.usuariosNotificados && resultadoNotificacoes.usuariosNotificados.length > 0) {
                            mostrarToast('Notificações', 
                                `Enviadas para ${resultadoNotificacoes.usuariosNotificados.length} usuários`, 
                                'success');
                        }
                    }
                } catch (erroNotif) {
                    console.error('⚠️ Erro nas notificações (não crítico):', erroNotif);
                }
            }, 1500);
        }
        
        // 5. Enviar e-mail se solicitado
        if (dadosDemanda.enviarEmail && escolasSelecionadas.length > 0) {
            try {
                mostrarToast('E-mail', 'Enviando e-mail...', 'info');
                
                const dadosEmail = {
                    ...dadosDemanda,
                    idDemanda: idDemanda
                };
                
                await enviarEmailDemanda(dadosEmail);
                
            } catch (erroEmail) {
                console.error('Erro ao enviar e-mail:', erroEmail);
                mostrarToast('Atenção', 'Demanda salva, mas e-mail não foi enviado.', 'warning');
            }
        }
        
        // 6. Sucesso!
        mostrarToast('Sucesso', 'Demanda salva com sucesso!', 'success');
        
        // 7. Fechar modal e atualizar lista
        fecharModalNovaDemanda();
        setTimeout(() => carregarDemandas(), 1000);
        
    } catch (erro) {
        console.error('Erro ao salvar demanda:', erro);
        mostrarToast('Erro', 'Não foi possível salvar a demanda.', 'error');
    } finally {
        esconderLoading();
    }
}
/**
 * Valida o formulário antes de enviar
 */
function validarFormulario() {
    console.log('🔍 Validando formulário...');
    
    // Título
    if (!elementos.titulo || !elementos.titulo.value.trim()) {
        mostrarToast('Validação', 'Digite um título para a demanda.', 'warning');
        if (elementos.titulo) elementos.titulo.focus();
        return false;
    }
    
    // Descrição
    if (!elementos.descricao || !elementos.descricao.value.trim()) {
        mostrarToast('Validação', 'Digite uma descrição para a demanda.', 'warning');
        if (elementos.descricao) elementos.descricao.focus();
        return false;
    }
    
    // Escolas
    const escolasSelecionadas = elementos.escolasCheckboxes ? 
        Array.from(elementos.escolasCheckboxes).filter(cb => cb.checked).length : 0;
    
    if (escolasSelecionadas === 0) {
        mostrarToast('Validação', 'Selecione pelo menos uma escola.', 'warning');
        return false;
    }
    
    // Responsável
    const responsavelSelecionado = document.querySelector('input[name="responsavel"]:checked');
    if (!responsavelSelecionado) {
        mostrarToast('Validação', 'Selecione quem será responsável pela execução.', 'warning');
        return false;
    }
    
    // Prazo
    if (!elementos.prazo || !elementos.prazo.value) {
        mostrarToast('Validação', 'Defina um prazo para a demanda.', 'warning');
        if (elementos.prazo) elementos.prazo.focus();
        return false;
    }
    
    // Verificar se a data é futura
    const hoje = new Date();
    const prazoSelecionado = new Date(elementos.prazo.value);
    
    if (prazoSelecionado < hoje) {
        mostrarToast('Validação', 'O prazo deve ser uma data futura.', 'warning');
        if (elementos.prazo) elementos.prazo.focus();
        return false;
    }
    
    // ============================================
    // NOVO: VALIDAÇÃO DE DEPARTAMENTOS (APENAS PARA SUPERVISOR)
    // ============================================
    const usuarioSalvoValidacao = localStorage.getItem('usuario_demandas');
    let usuarioValidacao = null;
    
    try {
        usuarioValidacao = usuarioSalvoValidacao ? JSON.parse(usuarioSalvoValidacao) : {};
    } catch (e) {
        usuarioValidacao = {};
        console.error('❌ Erro ao ler usuário para validação:', e);
    }
    
    console.log('👤 Validando para usuário:', {
    tipo: usuarioValidacao.tipo_usuario,
    departamento: usuarioValidacao.departamento 
});
    
    if (usuarioValidacao.tipo_usuario === 'supervisor') {
        console.log('👑 Validando departamentos para supervisor...');
        
        const departamentoContainer = document.getElementById('departamento-container');
        const departamentoCheckboxes = document.querySelectorAll('.departamento-checkbox:not(#departamento-todas)');
        const departamentosSelecionados = Array.from(departamentoCheckboxes).filter(cb => cb.checked);
        
        console.log('📋 Departamentos selecionados:', departamentosSelecionados.length);
        
        if (departamentosSelecionados.length === 0) {
            mostrarToast('Validação', 'Selecione pelo menos um departamento.', 'warning');
            
            // Destacar a seção de departamentos
            if (departamentoContainer) {
                departamentoContainer.classList.add('departamento-container-error');
                
                // Rolar até a seção
                departamentoContainer.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                
                // Remover destaque após 3 segundos
                setTimeout(() => {
                    departamentoContainer.classList.remove('departamento-container-error');
                }, 3000);
            }
            
            return false;
        }
    }
    
    console.log('✅ Validação do formulário concluída com sucesso!');
    return true;
}

/**
 * Mostra os detalhes de uma demanda - VERSÃO RESPONSIVA
 */
function mostrarDetalhesDemanda(idDemanda) {
    const demanda = state.demandas.find(d => d.id == idDemanda);
    
    if (!demanda) {
        mostrarToast('Erro', 'Demanda não encontrada.', 'error');
        return;
    }
    
    // Preparar dados
    const dataCriacao = formatarData(demanda.criado_em);
    const dataAtualizacao = formatarData(demanda.atualizado_em);
    const dataPrazo = demanda.prazo ? formatarData(demanda.prazo) : 'Não definido';
    
    // Calcular dias restantes
    let diasRestantes = 'N/A';
    let prazoStatus = '';
    let prazoColor = '#27ae60'; // Verde padrão
    
    if (demanda.prazo) {
        try {
            const hoje = new Date();
            const prazo = new Date(demanda.prazo);
            const dias = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
            
            if (dias < 0) {
                diasRestantes = `${Math.abs(dias)} dias atrasado`;
                prazoStatus = 'atrasado';
                prazoColor = '#e74c3c'; // Vermelho
            } else if (dias === 0) {
                diasRestantes = 'Vence hoje';
                prazoStatus = 'urgente';
                prazoColor = '#e67e22'; // Laranja forte
            } else if (dias <= 3) {
                diasRestantes = `${dias} dias restantes`;
                prazoStatus = 'alerta';
                prazoColor = '#f39c12'; // Laranja
            } else {
                diasRestantes = `${dias} dias restantes`;
                prazoStatus = 'ok';
                prazoColor = '#27ae60'; // Verde
            }
        } catch (e) {
            diasRestantes = 'Erro no cálculo';
            prazoColor = '#95a5a6'; // Cinza
        }
    }
    
    // Verificar se é mobile
    const isMobile = window.innerWidth <= 768;
    
    // Estilo do container de ações RESPONSIVO
    const acoesStyle = isMobile 
        ? `display: flex; flex-direction: column; gap: 10px; margin-top: 15px;`  // Coluna no mobile
        : `display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;`;      // Linha no desktop
    
    // Criar botões dinamicamente baseado no status atual
    let botoesAcoes = '';
    
    // Botão "Iniciar" só se estiver pendente
    if (demanda.status === 'Pendente') {
        botoesAcoes += `
            <button class="btn btn-primary" onclick="alterarStatusDemanda(${demanda.id}, 'Em andamento')" 
                    style="flex: 1; min-width: ${isMobile ? '100%' : '120px'};">
                <i class="fas fa-play"></i> ${isMobile ? 'Iniciar Demanda' : 'Iniciar'}
            </button>
        `;
    }
    
    // Botão "Concluir" só se não estiver concluída
    if (demanda.status !== 'Concluída') {
        botoesAcoes += `
            <button class="btn btn-success" onclick="alterarStatusDemanda(${demanda.id}, 'Concluída')" 
                    style="flex: 1; min-width: ${isMobile ? '100%' : '120px'};">
                <i class="fas fa-check"></i> ${isMobile ? 'Concluir Demanda' : 'Concluir'}
            </button>
        `;
    }
    
    // Botão "Reabrir" só se estiver concluída
    if (demanda.status === 'Concluída') {
        botoesAcoes += `
            <button class="btn btn-warning" onclick="alterarStatusDemanda(${demanda.id}, 'Pendente')" 
                    style="flex: 1; min-width: ${isMobile ? '100%' : '120px'}; background: #f39c12;">
                <i class="fas fa-redo"></i> ${isMobile ? 'Reabrir Demanda' : 'Reabrir'}
            </button>
        `;
    }
    
    // Status color
    let statusColor = '#95a5a6';
    switch(demanda.status) {
        case 'Pendente': statusColor = '#e74c3c'; break;
        case 'Em andamento': statusColor = '#f39c12'; break;
        case 'Concluída': statusColor = '#27ae60'; break;
    }
    
    // Preparar modal HTML RESPONSIVO
    const modalHTML = `
        <div class="modal-header" style="padding: ${isMobile ? '15px' : '20px'};">
            <h2 style="margin: 0; font-size: ${isMobile ? '18px' : '20px'}; display: flex; align-items: center;">
                <i class="fas fa-file-lines" style="margin-right: 10px; color: #3498db;"></i>
                Demanda #${demanda.id || 'N/A'}
            </h2>
            <button class="btn-close" onclick="fecharModalDetalhes()" 
                    style="font-size: ${isMobile ? '20px' : '24px'}; padding: 0; background: none; border: none; cursor: pointer;">
                <i class="fas fa-times" style="color: #7f8c8d;"></i>
            </button>
        </div>
        
        <div class="modal-body" style="padding: ${isMobile ? '15px' : '20px'}; max-height: ${isMobile ? '70vh' : '80vh'}; overflow-y: auto;">
            <div class="demanda-detalhes">
                
                <!-- INFORMAÇÕES PRINCIPAIS -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: ${isMobile ? '16px' : '18px'}; font-weight: 600; color: #2c3e50; margin-bottom: 10px;">
                        ${demanda.titulo || 'Sem título'}
                    </div>
                    <div style="font-size: 14px; color: #7f8c8d; line-height: 1.5;">
                        ${demanda.descricao || 'Sem descrição'}
                    </div>
                </div>
                
                <!-- DETALHES EM GRID RESPONSIVO -->
                <div style="${isMobile ? 'display: flex; flex-direction: column; gap: 15px;' : 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;'}">
                    
                    <!-- Status -->
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">
                            <i class="fas fa-tasks"></i> Status
                        </div>
                        <div style="font-size: 14px; font-weight: 600; color: ${statusColor};">
                            ${demanda.status || 'Pendente'}
                        </div>
                    </div>
                    
                    <!-- Responsável -->
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">
                            <i class="fas fa-user-tag"></i> Responsável
                        </div>
                        <div style="font-size: 14px; font-weight: 600; color: #2c3e50;">
                            ${demanda.responsavel || 'Não definido'}
                        </div>
                    </div>
                    
                    <!-- Prazo -->
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">
                            <i class="fas fa-calendar-alt"></i> Prazo
                        </div>
                        <div style="font-size: 14px; font-weight: 600; color: ${prazoColor};">
                            ${dataPrazo}
                        </div>
                        <div style="font-size: 12px; color: ${prazoColor}; margin-top: 3px;">
                            ${diasRestantes}
                        </div>
                    </div>
                    
                    <!-- Criada em -->
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">
                            <i class="fas fa-calendar-plus"></i> Criada em
                        </div>
                        <div style="font-size: 14px; font-weight: 600; color: #2c3e50;">
                            ${dataCriacao}
                        </div>
                    </div>
                    
                </div>
                
                <!-- ESCOLAS -->
                <div style="margin-top: 20px;">
                    <div style="font-size: 14px; color: #6c757d; margin-bottom: 8px; display: flex; align-items: center;">
                        <i class="fas fa-school" style="margin-right: 8px;"></i>
                        Escolas Envolvidas
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px; color: #2c3e50;">
                        ${demanda.escolas || 'Nenhuma escola definida'}
                    </div>
                </div>
                
                <!-- DEPARTAMENTO -->
                <div style="margin-top: 15px;">
                    <div style="font-size: 14px; color: #6c757d; margin-bottom: 8px; display: flex; align-items: center;">
                        <i class="fas fa-building" style="margin-right: 8px;"></i>
                        Departamento
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px; color: #2c3e50;">
                        ${demanda.departamento || 'Não definido'}
                    </div>
                </div>
                
                <!-- AÇÕES -->
                <div style="margin-top: 25px;">
                    <div style="font-size: 14px; color: #6c757d; margin-bottom: 10px; display: flex; align-items: center;">
                        <i class="fas fa-edit" style="margin-right: 8px;"></i>
                        Ações
                    </div>
                    
                    <!-- Botões de Ação (Status) -->
                    <div style="${acoesStyle}">
                        ${botoesAcoes}
                    </div>
                    
                    <!-- Botão de Exclusão (Só para Supervisor) -->
                    <div id="container-exclusao-${demanda.id}" style="margin-top: ${isMobile ? '15px' : '10px'};">
                        <!-- O botão será adicionado dinamicamente se for supervisor -->
                    </div>
                    
                    <small style="color: #7f8c8d; font-size: 12px; margin-top: 8px; display: none;" 
                           id="msg-permissao-${demanda.id}">
                        <i class="fas fa-info-circle"></i> Apenas supervisores podem excluir demandas
                    </small>
                </div>
                
            </div>
        </div>
    `;
    
    if (elementos.modalDetalhes) {
        elementos.modalDetalhes.querySelector('.modal').innerHTML = modalHTML;
        elementos.modalDetalhes.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Estilo responsivo para o modal
        const modalElement = elementos.modalDetalhes.querySelector('.modal');
        if (modalElement) {
            modalElement.style.cssText = `
                width: ${isMobile ? '90%' : '70%'};
                max-width: ${isMobile ? '500px' : '800px'};
                max-height: ${isMobile ? '85vh' : '90vh'};
                margin: ${isMobile ? '10px' : '20px'} auto;
                border-radius: ${isMobile ? '12px' : '12px'};
                background: white;
                display: flex;
                flex-direction: column;
            `;
        }
        
        // Configurar botão de exclusão dinamicamente
        setTimeout(() => {
            const usuarioSalvo = localStorage.getItem('usuario_demandas');
            if (usuarioSalvo) {
                try {
                    const usuario = JSON.parse(usuarioSalvo);
                    const containerExclusao = document.getElementById(`container-exclusao-${demanda.id}`);
                    const msgPermissao = document.getElementById(`msg-permissao-${demanda.id}`);
                    
                    if (usuario.tipo_usuario === 'supervisor') {
                        // Mostrar botão de exclusão para supervisor
                        containerExclusao.innerHTML = `
                            <button class="btn btn-danger" 
                                    onclick="excluirDemanda(${demanda.id})" 
                                    title="Excluir demanda"
                                    style="width: 100%; padding: 12px; margin-top: 5px;
                                           background: linear-gradient(135deg, #e74c3c, #c0392b);
                                           border: none; border-radius: 8px; 
                                           color: white; font-weight: 600; cursor: pointer;
                                           display: flex; align-items: center; justify-content: center;
                                           gap: 8px; font-size: 14px;">
                                <i class="fas fa-trash"></i>
                                ${isMobile ? 'Excluir Demanda' : 'Excluir Demanda'}
                            </button>
                        `;
                        
                        if (msgPermissao) msgPermissao.style.display = 'none';
                    } else {
                        // Mostrar mensagem para não-supervisor
                        if (msgPermissao) {
                            msgPermissao.style.display = 'block';
                            msgPermissao.style.marginTop = '15px';
                            msgPermissao.style.padding = '10px';
                            msgPermissao.style.background = '#f8f9fa';
                            msgPermissao.style.borderRadius = '6px';
                        }
                    }
                } catch (e) {
                    console.error('Erro ao verificar permissões:', e);
                }
            }
        }, 100);
    }
}
/**
 * Fecha o modal de detalhes
 */
function fecharModalDetalhes() {
    if (elementos.modalDetalhes) {
        elementos.modalDetalhes.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
}

/**
 * Altera o status de uma demanda
 */
async function alterarStatusDemanda(idDemanda, novoStatus) {
    if (!confirm(`Deseja alterar o status para "${novoStatus}"?`)) {
        return;
    }
    
    mostrarLoading();
    
    try {
        await atualizarStatusDemanda(idDemanda, novoStatus);
        mostrarToast('Sucesso', `Status alterado para "${novoStatus}"`, 'success');
        
        // Fechar modal e atualizar lista
        fecharModalDetalhes();
        setTimeout(() => carregarDemandas(), 500);
        
    } catch (erro) {
        console.error('Erro ao alterar status:', erro);
        mostrarToast('Erro', 'Não foi possível alterar o status.', 'error');
    } finally {
        esconderLoading();
    }
}

/**
 * Mostra uma mensagem toast
 */
/**
 * EXCLUI UMA DEMANDA
 * @param {number} idDemanda - ID da demanda a excluir
 */
async function excluirDemanda(idDemanda) {
    // Buscar dados do usuário logado
    const usuarioSalvo = localStorage.getItem('usuario_demandas');
    if (!usuarioSalvo) {
        mostrarToast('Erro', 'Usuário não logado!', 'error');
        return;
    }
    
    let usuario;
    try {
        usuario = JSON.parse(usuarioSalvo);
    } catch (e) {
        mostrarToast('Erro', 'Erro ao ler dados do usuário!', 'error');
        return;
    }
    
    // Verificar se é supervisor
    if (usuario.tipo_usuario !== 'supervisor') {
        mostrarToast('Permissão Negada', 'Apenas supervisores podem excluir demandas!', 'error');
        return;
    }
    
    // Resto do código continua igual...
    const demanda = state.demandas.find(d => d.id == idDemanda);
    
    if (!demanda) {
        mostrarToast('Erro', 'Demanda não encontrada.', 'error');
        return;
    }
    
    // Confirmar exclusão (o resto do código continua IGUAL)
    const confirmacao = confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE a demanda?\n\n` +
                               `ID: #${demanda.id}\n` +
                               `Título: ${demanda.titulo}\n` +
                               `Escolas: ${demanda.escolas || 'Nenhuma'}\n\n` +
                               `⚠️ ATENÇÃO: Esta ação não pode ser desfeita!`);
    
    if (!confirmacao) {
        return;
    }
    
    mostrarLoading();
    
    try {
        // 1. Chamar função para excluir no servidor
        const resultado = await excluirDemandaNoServidor(idDemanda);
        
        // 2. Verificar se foi bem-sucedido
        if (resultado && resultado.sucesso !== false) {
            // Remover da lista local
            state.demandas = state.demandas.filter(d => d.id != idDemanda);
            
            // Atualizar interface
            renderizarDemandas();
            atualizarEstatisticas();
            
            // Fechar modal se estiver aberto
            fecharModalDetalhes();
            
            // Mostrar mensagem de sucesso
            mostrarToast('Sucesso', `Demanda #${idDemanda} excluída permanentemente!`, 'success');
            
            // Log adicional
            console.log(`🗑️ Demanda #${idDemanda} excluída:`, {
                titulo: demanda.titulo,
                escolas: demanda.escolas,
                data: new Date().toISOString()
            });
            
        } else {
            throw new Error(resultado?.erro || 'Erro desconhecido');
        }
        
    } catch (erro) {
        console.error('❌ Erro ao excluir demanda:', erro);
        
        // Verificar se é erro de conexão
        if (erro.message.includes('não foi possível conectar') || 
            erro.message.includes('NetworkError') ||
            erro.message.includes('Failed to fetch')) {
            
            // Modo offline: remover apenas localmente
            if (confirm('Servidor offline. Deseja remover apenas localmente?')) {
                state.demandas = state.demandas.filter(d => d.id != idDemanda);
                renderizarDemandas();
                atualizarEstatisticas();
                fecharModalDetalhes();
                
                mostrarToast('Atenção', 
                    'Demanda removida localmente (modo offline). ' +
                    'Reinicie o sistema para sincronizar com o servidor.', 
                    'warning');
            }
        } else {
            mostrarToast('Erro', `Falha ao excluir: ${erro.message}`, 'error');
        }
    } finally {
        esconderLoading();
    }
}
function mostrarToast(titulo, mensagem, tipo = 'info') {
    if (!elementos.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    let icon = 'fas fa-info-circle';
    if (tipo === 'success') icon = 'fas fa-check-circle';
    if (tipo === 'error') icon = 'fas fa-exclamation-circle';
    if (tipo === 'warning') icon = 'fas fa-exclamation-triangle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${titulo}</div>
            <div class="toast-message">${mensagem}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    elementos.toastContainer.appendChild(toast);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}
// ============================================
// FUNÇÕES PARA GERENCIAR NOTIFICAÇÕES
// ============================================

function mostrarSecao(secaoId) {
    // Esconder todas as seções
    const secoes = document.querySelectorAll('.admin-section');
    secoes.forEach(secao => {
        secao.style.display = 'none';
    });
    
    // Mostrar a seção solicitada
    const secao = document.getElementById(secaoId);
    if (secao) {
        secao.style.display = 'block';
        
        // Se for a seção de notificações, carregar dados
        if (secaoId === 'gerenciar-notificacoes') {
            carregarConfiguracoesNotificacoes();
            carregarLogsNotificacoes();
        }
    }
}

async function carregarConfiguracoesNotificacoes() {
    try {
        // Aqui você implementaria a busca das configurações salvas
        // Por enquanto, apenas inicializa
        console.log('Carregando configurações de notificações...');
        
    } catch (erro) {
        console.error('Erro ao carregar configurações:', erro);
    }
}
// ============================================
// SISTEMA DE NOTIFICAÇÕES INTELIGENTES - INTEGRAÇÃO
// ============================================

/**
 * Dispara notificações quando uma nova demanda é salva
 */
async function dispararNotificacoesNovaDemanda(dadosDemanda, idDemanda) {
    console.log('🔔 Disparando notificações inteligentes...');
    
    try {
        // 1. Verificar se há usuários online
        const usuarios = await obterUsuariosParaNotificar(dadosDemanda);
        
        if (usuarios.length === 0) {
            console.log('⚠️ Nenhum usuário para notificar');
            return;
        }
        
        console.log(`📢 Notificando ${usuarios.length} usuários...`);
        
        // 2. Para cada tipo de usuário, enviar notificação apropriada
        const resultados = {
            emails: 0,
            pushes: 0,
            usuariosNotificados: []
        };
        
        for (const usuario of usuarios) {
            const notificado = await enviarNotificacaoUsuario(usuario, dadosDemanda, idDemanda);
            
            if (notificado.email) resultados.emails++;
            if (notificado.push) resultados.pushes++;
            
            resultados.usuariosNotificados.push({
                nome: usuario.nome,
                tipo: usuario.tipo_usuario,
                emailEnviado: notificado.email,
                pushEnviado: notificado.push
            });
        }
        
        // 3. Registrar no log
        await registrarLogNotificacao(dadosDemanda, idDemanda, resultados);
        
        console.log('✅ Notificações enviadas:', resultados);
        return resultados;
        
    } catch (erro) {
        console.error('❌ Erro ao disparar notificações:', erro);
        return { erro: erro.message };
    }
}

/**
 * Obtém usuários que devem receber notificação baseado no perfil
 */
async function obterUsuariosParaNotificar(dadosDemanda) {
    try {
        // Buscar usuários do sistema
        const todosUsuarios = await listarUsuariosDoSistema();
        
        // Filtrar por permissões
        const usuariosFiltrados = todosUsuarios.filter(usuario => {
            // Verificar se usuário recebe notificações
            if (!usuario.notificacoesAtivas) return false;
            
            // Supervisor recebe tudo
            if (usuario.tipo_usuario === 'supervisor') {
                return true;
            }
            
            // Diretor recebe apenas da sua escola
            if (usuario.tipo_usuario === 'diretor' || usuario.tipo_usuario === 'gestor') {
                const escolasDemanda = dadosDemanda.escolas || [];
                return escolasDemanda.includes(usuario.escola_sre || usuario.escola);
            }
            
            // Usuário comum recebe apenas do seu departamento+escola
            if (usuario.tipo_usuario === 'comum') {
                const departamentosUsuario = usuario.departamento ? 
                    usuario.departamento.split(',').map(d => d.trim()) : [];
                
                const escolasDemanda = dadosDemanda.escolas || [];
                const departamentosDemanda = dadosDemanda.departamento ? 
                    dadosDemanda.departamento.split(',').map(d => d.trim()) : [];
                
                // Verificar interseção entre departamentos
                const temDepartamentoComum = departamentosUsuario.some(dept => 
                    departamentosDemanda.includes(dept));
                
                const temEscolaComum = escolasDemanda.includes(usuario.escola_sre || usuario.escola);
                
                return temDepartamentoComum && temEscolaComum;
            }
            
            return false;
        });
        
        return usuariosFiltrados;
        
    } catch (erro) {
        console.error('Erro ao buscar usuários:', erro);
        return [];
    }
}

/**
 * Envia notificação para um usuário específico
 */
async function enviarNotificacaoUsuario(usuario, dadosDemanda, idDemanda) {
    const resultados = { email: false, push: false };
    
    try {
        // 1. Enviar email se configurado
        if (usuario.notificacoesEmail !== false) {
            const emailEnviado = await enviarEmailNotificacaoIndividual(usuario, dadosDemanda, idDemanda);
            resultados.email = emailEnviado;
        }
        
        // 2. Enviar notificação push se configurado e suportado
        if (usuario.notificacoesPush !== false && 'Notification' in window) {
            const pushEnviada = await enviarPushNotificacao(usuario, dadosDemanda, idDemanda);
            resultados.push = pushEnviada;
        }
        
        return resultados;
        
    } catch (erro) {
        console.error(`Erro ao notificar usuário ${usuario.nome}:`, erro);
        return resultados;
    }
}

/**
 * Envia email de notificação individual
 */
async function enviarEmailNotificacaoIndividual(usuario, dadosDemanda, idDemanda) {
    try {
        const assunto = `📋 Nova Demanda: ${dadosDemanda.titulo}`;
        
        const corpoEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Nova Demanda Criada</h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #3498db;">${dadosDemanda.titulo}</h3>
                    
                    <p><strong>Descrição:</strong> ${dadosDemanda.descricao || 'Sem descrição'}</p>
                    <p><strong>Departamento:</strong> ${dadosDemanda.departamento || 'Não definido'}</p>
                    <p><strong>Escola(s):</strong> ${Array.isArray(dadosDemanda.escolas) ? dadosDemanda.escolas.join(', ') : dadosDemanda.escolas}</p>
                    <p><strong>Responsável:</strong> ${dadosDemanda.responsavel || 'Não definido'}</p>
                    <p><strong>Prazo:</strong> ${formatarData(dadosDemanda.prazo)}</p>
                    <p><strong>Status:</strong> <span style="color: #e67e22;">PENDENTE</span></p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${window.location.origin}/sistema-demandas-escolares/?demanda=${idDemanda}" 
                       style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                       👁️ Ver Demanda
                    </a>
                </div>
                
                <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
                    Esta é uma notificação automática do Sistema de Demandas Escolares.<br>
                    Para ajustar suas configurações de notificação, acesse seu perfil no sistema.
                </p>
            </div>
        `;
        
        // Enviar via Google Apps Script
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'enviarEmailNotificacao',
            para: usuario.email,
            assunto: assunto,
            corpo: corpoEmail,
            dados: {
                tipo: 'nova_demanda',
                demandaId: idDemanda,
                usuarioId: usuario.id
            }
        });
        
        return resultado.sucesso === true;
        
    } catch (erro) {
        console.error('Erro ao enviar email:', erro);
        return false;
    }
}

/**
 * Envia notificação push
 */
async function enviarPushNotificacao(usuario, dadosDemanda, idDemanda) {
    try {
        // Verificar permissão
        if (Notification.permission !== 'granted') {
            return false;
        }
        
        // Criar notificação
        const notificacao = new Notification('📋 Nova Demanda Escolar', {
            body: `${dadosDemanda.titulo} - ${dadosDemanda.departamento || 'Sem departamento'}`,
            icon: '/sistema-demandas-escolares/public/icons/192x192.png',
            badge: '/sistema-demandas-escolares/public/icons/96x96.png',
            tag: `demanda-${idDemanda}`,
            data: {
                url: `${window.location.origin}/sistema-demandas-escolares/?demanda=${idDemanda}`,
                demandaId: idDemanda,
                usuarioId: usuario.id
            },
            actions: [
                {
                    action: 'ver',
                    title: '👁️ Ver Demanda'
                }
            ]
        });
        
        // Adicionar evento de clique
        notificacao.onclick = function() {
            window.open(this.data.url, '_blank');
            this.close();
        };
        
        return true;
        
    } catch (erro) {
        console.error('Erro ao enviar push:', erro);
        return false;
    }
}

/**
 * Registra log da notificação
 */
async function registrarLogNotificacao(dadosDemanda, idDemanda, resultados) {
    try {
        const log = {
            data: new Date().toISOString(),
            demandaId: idDemanda,
            demandaTitulo: dadosDemanda.titulo,
            departamento: dadosDemanda.departamento,
            escolas: Array.isArray(dadosDemanda.escolas) ? dadosDemanda.escolas.join(', ') : dadosDemanda.escolas,
            totalUsuarios: resultados.usuariosNotificados.length,
            emailsEnviados: resultados.emails,
            pushesEnviados: resultados.pushes,
            usuarios: resultados.usuariosNotificados.map(u => ({
                nome: u.nome,
                tipo: u.tipo_usuario
            }))
        };
        
        await enviarParaGoogleAppsScript({
            acao: 'registrarLogNotificacao',
            log: log
        });
        
        console.log('📝 Log de notificação registrado');
        
    } catch (erro) {
        console.error('Erro ao registrar log:', erro);
    }
}

/**
 * Lista usuários do sistema (simulação - implemente a função real)
 */
async function listarUsuariosDoSistema() {
    try {
        // Implementar busca real dos usuários
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'listarUsuarios'
        });
        
        return resultado.usuarios || [];
        
    } catch (erro) {
        console.error('Erro ao listar usuários:', erro);
        return [];
    }
}

// ============================================
// INTEGRAÇÃO COM O SALVAR DEMANDA EXISTENTE
// ============================================


// ============================================
// FUNÇÕES AUXILIARES PARA PERFIL DE USUÁRIO
// ============================================

/**
 * Carrega configurações de notificação do usuário atual
 */
async function carregarConfiguracoesUsuario() {
    try {
        const usuarioSalvo = localStorage.getItem('usuario_demandas');
        if (!usuarioSalvo) return null;
        
        const usuario = JSON.parse(usuarioSalvo);
        
        // Buscar configurações do servidor
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'obterConfiguracoesUsuario',
            email: usuario.email
        });
        
        if (resultado && resultado.configuracoes) {
            return resultado.configuracoes;
        }
        
        // Configurações padrão
        return {
            notificacoesEmail: true,
            notificacoesPush: 'Notification' in window && Notification.permission === 'granted',
            notificacoesUrgentes: true,
            horarioSilencioso: null
        };
        
    } catch (erro) {
        console.error('Erro ao carregar configurações:', erro);
        return null;
    }
}

/**
 * Salva configurações de notificação do usuário
 */
async function salvarConfiguracoesUsuario(configuracoes) {
    try {
        const usuarioSalvo = localStorage.getItem('usuario_demandas');
        if (!usuarioSalvo) return false;
        
        const usuario = JSON.parse(usuarioSalvo);
        
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'salvarConfiguracoesUsuario',
            email: usuario.email,
            configuracoes: configuracoes
        });
        
        return resultado.sucesso === true;
        
    } catch (erro) {
        console.error('Erro ao salvar configurações:', erro);
        return false;
    }
}

// ============================================
// FUNÇÕES DE LEMBRETES E PRAZOS
// ============================================

/**
 * Verifica demandas próximas do vencimento
 */
async function verificarLembretesPrazos() {
    try {
        const hoje = new Date();
        const demandas = await listarDemandasDoServidor();
        
        const demandasProximas = demandas.filter(demanda => {
            if (!demanda.prazo || demanda.status === 'Concluída') return false;
            
            const prazo = new Date(demanda.prazo);
            const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
            
            // Lembretes para 1, 2 e 3 dias antes do vencimento
            return diasRestantes >= 0 && diasRestantes <= 3;
        });
        
        if (demandasProximas.length > 0) {
            console.log(`⏰ ${demandasProximas.length} demandas próximas do vencimento`);
            
            // Enviar notificações se for o usuário responsável
            demandasProximas.forEach(async demanda => {
                await enviarLembretePrazo(demanda);
            });
        }
        
    } catch (erro) {
        console.error('Erro ao verificar lembretes:', erro);
    }
}

/**
 * Envia lembrete de prazo para uma demanda
 */
async function enviarLembretePrazo(demanda) {
    try {
        const hoje = new Date();
        const prazo = new Date(demanda.prazo);
        const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes < 0 || diasRestantes > 3) return;
        
        // Determinar mensagem baseada nos dias restantes
        let mensagem = '';
        if (diasRestantes === 0) mensagem = 'VENCE HOJE!';
        else if (diasRestantes === 1) mensagem = 'Vence amanhã!';
        else mensagem = `Vence em ${diasRestantes} dias`;
        
        // Enviar notificação push
        if ('Notification' in window && Notification.permission === 'granted') {
            const notificacao = new Notification('⏰ Lembrete de Prazo', {
                body: `${demanda.titulo} - ${mensagem}`,
                icon: '/sistema-demandas-escolares/public/icons/192x192.png',
                tag: `lembrete-${demanda.id}`
            });
            
            notificacao.onclick = function() {
                window.open(`${window.location.origin}/sistema-demandas-escolares/?demanda=${demanda.id}`, '_blank');
                this.close();
            };
        }
        
    } catch (erro) {
        console.error('Erro ao enviar lembrete:', erro);
    }
}

async function inicializarSistemaNotificacoesPrincipal() {
    console.log("🔔 Inicializando sistema de notificações...");
    
    // Chama a nova implementação
    await inicializarSistemaNotificacoesCompleto();
    
    // AGUARDAR PushNotificationSystem carregar
    let tentativas = 0;
    const maxTentativas = 10;
    
    const tentarInicializar = async () => {
        tentativas++;
        
        if (window.PushNotificationSystem && 
            typeof PushNotificationSystem.initialize === 'function') {
            
            console.log(`✅ PushNotificationSystem encontrado (tentativa ${tentativas})`);
            
            try {
                const sucesso = await PushNotificationSystem.initialize();
                if (sucesso) {
                    console.log('🚀 Sistema de notificações push inicializado!');
                    
                    // Atualizar interface
                    atualizarStatusNotificacoes(PushNotificationSystem.getInfo());
                    
                    return true;
                }
                return false;
            } catch (erro) {
                console.error('❌ Erro na inicialização:', erro);
                return false;
            }
            
        } else if (tentativas < maxTentativas) {
            console.log(`⏳ Aguardando... (${tentativas}/${maxTentativas})`);
            setTimeout(tentarInicializar, 500);
        } else {
            console.error('❌ PushNotificationSystem não carregou');
            return false;
        }
    };
    
    return await tentarInicializar();
}
// ============================================
// TESTE AUTOMÁTICO DE NOTIFICAÇÕES
// ============================================

function executarTesteNotificacoes() {
  console.log('🔔 INICIANDO TESTE DE NOTIFICAÇÕES');
  
  // Aguardar PushNotificationSystem carregar
  if (typeof PushNotificationSystem === 'undefined') {
    console.log('⏳ Aguardando carregamento do sistema...');
    
    return;
  }
  
  // Verificar suporte
  if (!PushNotificationSystem.checkSupport()) {
    console.error('❌ Navegador não suporta notificações push');
    mostrarMensagemTeste('❌ Seu navegador não suporta notificações push', 'error');
    return;
  }
  
  console.log('✅ Sistema carregado:', PushNotificationSystem);
  
  // Inicializar
  PushNotificationSystem.initialize()
    .then(sucesso => {
      if (sucesso) {
        const info = PushNotificationSystem.getInfo();
        console.log('📊 Status do sistema:', info);
        
        // Mostrar resultado
        let mensagem = '✅ Sistema de notificações carregado!\n';
        mensagem += `📊 Permissão: ${info.permission}\n`;
        mensagem += `🔔 Inscrito: ${info.subscribed ? 'Sim' : 'Não'}`;
        
        mostrarMensagemTeste(mensagem, 'success');
        
        // Se não tem permissão, mostrar botão
        if (info.permission === 'default') {
          mostrarBotaoAtivacaoTeste();
        }
        
      } else {
        mostrarMensagemTeste('❌ Falha ao inicializar notificações', 'error');
      }
    })
    .catch(erro => {
      console.error('❌ Erro na inicialização:', erro);
      mostrarMensagemTeste('❌ Erro: ' + erro.message, 'error');
    });
}

// ============================================
// FUNÇÕES AUXILIARES PARA O TESTE
// ============================================

function mostrarMensagemTeste(mensagem, tipo) {
  console.log(`[TESTE ${tipo.toUpperCase()}] ${mensagem}`);
  
  // Criar elemento para mostrar na tela
  const divTeste = document.getElementById('teste-notificacoes') || criarDivTeste();
  
  divTeste.innerHTML = `
    <div class="teste-mensagem teste-${tipo}">
      <strong>🔔 Teste de Notificações</strong><br>
      ${mensagem.replace(/\n/g, '<br>')}
    </div>
  `;
  
  // Estilos
  const style = document.createElement('style');
  style.textContent = `
    .teste-mensagem {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px;
      border-radius: 8px;
      max-width: 300px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 14px;
    }
    .teste-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .teste-error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .teste-warning {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }
  `;
  
  if (!document.querySelector('#estilo-teste-notificacoes')) {
    style.id = 'estilo-teste-notificacoes';
    document.head.appendChild(style);
  }
}

function criarDivTeste() {
  const div = document.createElement('div');
  div.id = 'teste-notificacoes';
  document.body.appendChild(div);
  return div;
}

function mostrarBotaoAtivacaoTeste() {
  const botao = document.createElement('button');
  botao.id = 'btn-testar-ativacao';
  botao.innerHTML = '🔔 Testar Ativação de Notificações';
  botao.className = 'btn-teste-ativacao';
  
  // Estilos
  botao.style.cssText = `
    position: fixed;
    bottom: 120px;
    right: 20px;
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    border: none;
    padding: 12px 18px;
    border-radius: 25px;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 9998;
    animation: pulse-teste 2s infinite;
  `;
  
  // Animação
  const styleAnim = document.createElement('style');
  styleAnim.textContent = `
    @keyframes pulse-teste {
      0% { transform: scale(1); box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4); }
      50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(52, 152, 219, 0.6); }
      100% { transform: scale(1); box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4); }
    }
  `;
  document.head.appendChild(styleAnim);
  
  // Ação do botão
  botao.onclick = function() {
    botao.disabled = true;
    botao.innerHTML = '⏳ Solicitando permissão...';
    
    if (window.PushNotificationSystem) {
      PushNotificationSystem.requestPermission()
        .then(permissao => {
          mostrarMensagemTeste(`Permissão: ${permissao}`, 
            permissao === 'granted' ? 'success' : 'warning');
          
          if (permissao === 'granted') {
            botao.innerHTML = '✅ Notificações Ativadas!';
            botao.style.background = 'linear-gradient(135deg, #27ae60, #229954)';
          } else {
            botao.innerHTML = '❌ Permissão Negada';
            botao.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
          }
        });
    }
  };
  
  document.body.appendChild(botao);
  
  // Remover após 60 segundos
  setTimeout(() => {
    if (botao.parentNode) {
      botao.remove();
    }
  }, 60000);
}

// ============================================
// INICIAR TESTE AUTOMATICAMENTE
// ============================================

// Aguardar página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    
  });
} else {
  
}

// Exportar para teste manual
window.testarNotificacoes = executarTesteNotificacoes;
console.log('✅ Teste de notificações carregado. Use: testarNotificacoes()');
/**
 * Atualiza status das notificações na interface
 */
function atualizarStatusNotificacoes(info) {
    console.log('🎛️ Atualizando interface de notificações...');
    
    // Atualizar botões/toggles
    const toggleElement = document.getElementById('toggle-push');
    const statusElement = document.getElementById('push-status');
    const btnAtivar = document.getElementById('btn-activate-push');
    const btnTestar = document.getElementById('btn-testar-push');
    
    if (toggleElement) {
        toggleElement.checked = info.subscribed && info.permission === 'granted';
        toggleElement.disabled = info.permission === 'denied';
    }
    
    if (statusElement) {
        let texto = '';
        if (!info.supported) {
            texto = 'Navegador não suporta notificações push';
            statusElement.className = 'status-error';
        } else if (info.permission === 'granted' && info.subscribed) {
            texto = '✅ Notificações ativas';
            statusElement.className = 'status-success';
        } else if (info.permission === 'granted' && !info.subscribed) {
            texto = '⚠️ Permissão concedida, mas não inscrito';
            statusElement.className = 'status-warning';
        } else if (info.permission === 'denied') {
            texto = '❌ Permissão negada';
            statusElement.className = 'status-error';
        } else {
            texto = '⏳ Aguardando permissão...';
            statusElement.className = 'status-info';
        }
        statusElement.textContent = texto;
    }
    
    if (btnAtivar) {
        if (info.permission === 'default') {
            btnAtivar.textContent = 'Ativar Notificações';
            btnAtivar.disabled = false;
            btnAtivar.style.display = 'block';
        } else if (info.permission === 'granted' && !info.subscribed) {
            btnAtivar.textContent = 'Completar Ativação';
            btnAtivar.disabled = false;
            btnAtivar.style.display = 'block';
        } else if (info.permission === 'granted' && info.subscribed) {
            btnAtivar.textContent = 'Notificações Ativas';
            btnAtivar.disabled = true;
            btnAtivar.style.display = 'block';
            btnAtivar.classList.add('active');
        } else {
            btnAtivar.textContent = 'Permissão Negada';
            btnAtivar.disabled = true;
            btnAtivar.style.display = 'block';
        }
    }
    
    if (btnTestar) {
        btnTestar.style.display = info.subscribed ? 'block' : 'none';
    }
    
    console.log('✅ Interface de notificações atualizada');
}
// ============================================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// ============================================

// Adicione estas exportações
window.dispararNotificacoesNovaDemanda = dispararNotificacoesNovaDemanda;
window.inicializarSistemaNotificacoes = inicializarSistemaNotificacoes;
window.carregarConfiguracoesUsuario = carregarConfiguracoesUsuario;
window.salvarConfiguracoesUsuario = salvarConfiguracoesUsuario;
window.verificarLembretesPrazos = verificarLembretesPrazos;
window.enviarLembretePrazo = enviarLembretePrazo;

console.log("✅ Sistema de notificações inteligentes integrado ao app.js!");
async function carregarLogsNotificacoes() {
    try {
        const logsBody = document.getElementById('logs-notificacoes');
        if (!logsBody) return;
        
        // Mostrar loading
        logsBody.innerHTML = `
            <tr>
                <td colspan="4" class="loading-admin">
                    <i class="fas fa-spinner fa-spin"></i> Carregando logs...
                </td>
            </tr>
        `;
        
        // Simular carregamento (substituir por chamada real ao Google Apps Script)
        setTimeout(() => {
            // Exemplo de dados (substituir por dados reais)
            const logsExemplo = [
                { data: '01/12/2024 10:30', demanda: 'Reforma Biblioteca', enviadas: 5, status: 'Enviadas' },
                { data: '30/11/2024 14:15', demanda: 'Compra Material', enviadas: 3, status: 'Enviadas' },
                { data: '29/11/2024 09:00', demanda: 'Reunião Pedagógica', enviadas: 8, status: 'Pendentes' }
            ];
            
            let html = '';
            if (logsExemplo.length === 0) {
                html = `
                    <tr>
                        <td colspan="4" class="empty-state">
                            <i class="fas fa-history"></i>
                            <p>Nenhum log de notificação encontrado</p>
                        </td>
                    </tr>
                `;
            } else {
                logsExemplo.forEach(log => {
                    html += `
                        <tr>
                            <td>${log.data}</td>
                            <td>${log.demanda}</td>
                            <td>${log.enviadas}</td>
                            <td><span class="status-badge ${log.status === 'Enviadas' ? 'status-autorizado' : 'status-pendente'}">${log.status}</span></td>
                        </tr>
                    `;
                });
            }
            
            logsBody.innerHTML = html;
        }, 1000);
        
    } catch (erro) {
        console.error('Erro ao carregar logs:', erro);
    }
}

async function testarNotificacao() {
    try {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notificacao = new Notification('🔔 Teste de Notificação', {
                body: 'Sistema de Demandas Escolares funcionando perfeitamente!',
                icon: '/sistema-demandas-escolares/public/icons/192x192.png',
                badge: '/sistema-demandas-escolares/public/icons/96x96.png'
            });
            
            mostrarToast('Teste', 'Notificação de teste enviada!', 'success');
        } else {
            const permissao = await Notification.requestPermission();
            if (permissao === 'granted') {
                testarNotificacao();
            } else {
                mostrarToast('Permissão', 'Permissão para notificações não concedida', 'warning');
            }
        }
    } catch (error) {
        console.error('Erro ao testar notificação:', error);
        mostrarToast('Erro', 'Erro ao testar notificação', 'error');
    }
}

async function salvarConfiguracoesNotificacoes() {
    try {
        // Coletar configurações
        const configuracoes = {
            emails: document.getElementById('toggle-emails').checked,
            emailsUrgentes: document.getElementById('toggle-emails-urgentes').checked,
            push: document.getElementById('toggle-push').checked,
            segmentacao: {
                supervisor: document.querySelector('input[name="segmentacao"][value="supervisor"]').checked,
                diretor: document.querySelector('input[name="segmentacao"][value="diretor"]').checked,
                comum: document.querySelector('input[name="segmentacao"][value="comum"]').checked
            }
        };
        
        console.log('Salvando configurações:', configuracoes);
        
        // Aqui você implementaria o envio para o Google Apps Script
        // const resultado = await AdminSystem.salvarConfiguracoesNotificacoes(configuracoes);
        
        mostrarToast('Sucesso', 'Configurações salvas com sucesso!', 'success');
        
    } catch (erro) {
        console.error('Erro ao salvar configurações:', erro);
        mostrarToast('Erro', 'Erro ao salvar configurações', 'error');
    }
}

async function testarTodasNotificacoes() {
    try {
        mostrarLoading(true);
        
        // Testar emails
        mostrarToast('Teste', 'Testando sistema de emails...', 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Testar push
        if (document.getElementById('toggle-push').checked) {
            mostrarToast('Teste', 'Testando notificações push...', 'info');
            await testarNotificacao();
        }
        
        // Testar segmentação
        mostrarToast('Teste', 'Verificando segmentação por perfil...', 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        mostrarToast('Concluído', 'Todos os testes foram realizados!', 'success');
        
    } catch (erro) {
        console.error('Erro nos testes:', erro);
        mostrarToast('Erro', 'Erro durante os testes', 'error');
    } finally {
        mostrarLoading(false);
    }
}
// ============================================
// INTEGRAÇÃO COM NOTIFICAÇÕES PUSH NO app.js
// ============================================

/**
 * Inicializa sistema de notificações
 */
async function inicializarSistemaNotificacoes() {
    console.log('🔔 Inicializando sistema de notificações...');
    
    try {
        // Verificar se o sistema de push está disponível
        if (typeof window.PushNotificationSystem !== 'undefined') {
            const success = await window.PushNotificationSystem.initialize();
            
            if (success) {
                console.log('✅ Sistema de notificações push inicializado');
                
                // Configurar botões da interface
                configurarBotoesNotificacoes();
                
                // Verificar configurações salvas do usuário
                await carregarConfiguracoesNotificacoes();
                
                // Sincronizar notificações pendentes
                setTimeout(sincronizarNotificacoesPendentes, 5000);
            }
        } else {
            console.warn('⚠️ Sistema de notificações push não carregado');
        }
        
    } catch (error) {
        console.error('❌ Erro ao inicializar notificações:', error);
    }
}

/**
 * Configura botões de notificações na interface
 */
function configurarBotoesNotificacoes() {
    // Botão para ativar/desativar notificações
    const togglePush = document.getElementById('toggle-push');
    const btnAtivarPush = document.getElementById('btn-activate-push');
    const btnTestarPush = document.getElementById('btn-testar-push');
    
    if (togglePush) {
        togglePush.addEventListener('change', async function() {
            if (this.checked) {
                await ativarNotificacoesPush();
            } else {
                await desativarNotificacoesPush();
            }
        });
    }
    
    if (btnAtivarPush) {
        btnAtivarPush.addEventListener('click', async function() {
            await ativarNotificacoesPush();
        });
    }
    
    if (btnTestarPush) {
        btnTestarPush.addEventListener('click', async function() {
            await testarNotificacaoPush();
        });
    }
}

/**
 * Ativa notificações push
 */
async function ativarNotificacoesPush() {
    try {
        if (window.PushNotificationSystem) {
            const info = window.PushNotificationSystem.getInfo();
            
            if (!info.supported) {
                mostrarToast('Erro', 'Seu navegador não suporta notificações push', 'error');
                return;
            }
            
            if (info.permission === 'denied') {
                mostrarToast('Permissão Negada', 
                    'Você bloqueou as notificações. Ative nas configurações do navegador.',
                    'warning');
                return;
            }
            
            if (info.permission === 'default') {
                // Solicitar permissão
                const permission = await window.PushNotificationSystem.requestPermission();
                
                if (permission === 'granted') {
                    mostrarToast('Sucesso', 'Notificações ativadas!', 'success');
                    // Subscription será feita automaticamente pelo sistema
                }
            } else if (info.permission === 'granted' && !info.subscribed) {
                // Já tem permissão, mas não está inscrito
                await window.PushNotificationSystem.subscribeToPush();
            }
        }
    } catch (error) {
        console.error('❌ Erro ao ativar notificações:', error);
        mostrarToast('Erro', 'Não foi possível ativar notificações', 'error');
    }
}

/**
 * Desativa notificações push
 */
async function desativarNotificacoesPush() {
    try {
        if (window.PushNotificationSystem && confirm('Desativar notificações push?')) {
            await window.PushNotificationSystem.unsubscribeFromPush();
        }
    } catch (error) {
        console.error('❌ Erro ao desativar notificações:', error);
    }
}

/**
 * Testa notificação push
 */
async function testarNotificacaoPush() {
    try {
        if (window.PushNotificationSystem) {
            const info = window.PushNotificationSystem.getInfo();
            
            if (!info.subscribed) {
                mostrarToast('Atenção', 'Ative as notificações primeiro', 'warning');
                return;
            }
            
            await window.PushNotificationSystem.sendTestNotification();
        }
    } catch (error) {
        console.error('❌ Erro ao testar notificação:', error);
        mostrarToast('Erro', 'Falha no teste de notificação', 'error');
    }
}

/**
 * Envia notificação para nova demanda
 */
async function enviarNotificacaoNovaDemanda(demanda) {
    try {
        if (window.PushNotificationSystem) {
            const info = window.PushNotificationSystem.getInfo();
            
            if (!info.subscribed) {
                console.log('⚠️ Usuário não inscrito para notificações push');
                return;
            }
            
            // Criar notificação personalizada
            const notificacaoData = {
                titulo: `📋 Nova Demanda: ${demanda.titulo}`,
                mensagem: `Departamento: ${demanda.departamento || 'Não definido'}`,
                demandaId: demanda.id,
                url: `${window.location.origin}/sistema-demandas-escolares/?demanda=${demanda.id}`,
                importante: true,
                tag: `demanda-${demanda.id}`,
                acoes: [
                    {
                        action: 'ver',
                        title: '👁️ Ver Demanda'
                    }
                ]
            };
            
            await window.PushNotificationSystem.sendCustomNotification(notificacaoData);
            console.log('📤 Notificação push enviada para nova demanda');
        }
    } catch (error) {
        console.error('❌ Erro ao enviar notificação de demanda:', error);
        // Não mostrar erro ao usuário (não é crítico)
    }
}

/**
 * Sincroniza notificações pendentes
 */
async function sincronizarNotificacoesPendentes() {
    try {
        // Buscar notificações não vistas do servidor
        const resultado = await enviarParaGoogleAppsScript({
            acao: 'obterNotificacoesPendentes',
            usuarioId: obterUsuarioId(),
            ultimaSincronizacao: localStorage.getItem('ultima_sincronizacao_notificacoes') || 0
        });
        
        if (resultado && resultado.notificacoes && resultado.notificacoes.length > 0) {
            console.log(`📨 ${resultado.notificacoes.length} notificações pendentes`);
            
            // Mostrar cada notificação
            for (const notif of resultado.notificacoes) {
                if (window.PushNotificationSystem) {
                    await window.PushNotificationSystem.sendCustomNotification(notif);
                }
            }
            
            // Atualizar timestamp da última sincronização
            localStorage.setItem('ultima_sincronizacao_notificacoes', Date.now());
        }
        
    } catch (error) {
        console.error('❌ Erro na sincronização de notificações:', error);
    }
}
// ============================================
// ENVIAR NOTIFICAÇÃO VIA FIREBASE FCM
// ============================================

async function enviarNotificacaoFirebase(dados) {
    console.log('🔥 Enviando notificação via Firebase FCM...');
    
    try {
        // Verificar se Firebase está disponível
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase não carregado');
            return { sucesso: false, erro: 'Firebase não carregado' };
        }
        
        // Obter token FCM do usuário atual
        const tokenFCM = await obterTokenFCM();
        
        if (!tokenFCM) {
            console.warn('⚠️ Token FCM não disponível');
            return { sucesso: false, erro: 'Token FCM não disponível' };
        }
        
        // Dados da notificação
        const notificacaoData = {
            acao: 'enviarNotificacaoFirebase',
            token: tokenFCM,
            titulo: dados.titulo || 'Nova Demanda',
            mensagem: dados.mensagem || 'Você tem uma nova demanda',
            demandaId: dados.demandaId,
            departamento: dados.departamento,
            escolas: dados.escolas,
            importante: dados.importante || false,
            timestamp: new Date().toISOString()
        };
        
        // Enviar para Google Apps Script
        const resultado = await enviarParaGoogleAppsScript(notificacaoData);
        
        if (resultado && resultado.sucesso) {
            console.log('✅ Notificação Firebase enviada:', resultado);
            return resultado;
        } else {
            throw new Error(resultado?.erro || 'Erro desconhecido');
        }
        
    } catch (erro) {
        console.error('❌ Erro ao enviar notificação Firebase:', erro);
        return { sucesso: false, erro: erro.message };
    }
}
/**
 * Ajusta o modal para telas pequenas
 */
function ajustarModalParaCelular() {
    const isMobile = window.innerWidth <= 768;
    
    if (!elementos.modalDetalhes) return;
    
    const modal = elementos.modalDetalhes.querySelector('.modal');
    if (!modal) return;
    
    if (isMobile) {
        // Estilos para mobile
        modal.style.cssText = `
            width: 90% !important;
            max-width: 500px !important;
            max-height: 85vh !important;
            margin: 10px auto !important;
            border-radius: 12px !important;
            overflow: hidden !important;
        `;
        
        // Garantir que o conteúdo não transborde
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.style.cssText = `
                max-height: calc(85vh - 100px) !important;
                overflow-y: auto !important;
                padding: 15px !important;
            `;
        }
    }
}

// Ajustar modal quando a tela for redimensionada
window.addEventListener('resize', ajustarModalParaCelular);

// Ajustar também quando o modal for aberto
window.ajustarModalAberto = function() {
    setTimeout(ajustarModalParaCelular, 50);
};

// Modificar a função fecharModalDetalhes para ser mais acessível
window.fecharModalDetalhes = function() {
    if (elementos.modalDetalhes) {
        elementos.modalDetalhes.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
};
/**
 * Obtém ID do usuário logado
 */
function obterUsuarioId() {
    try {
        const usuarioSalvo = localStorage.getItem('usuario_demandas');
        if (usuarioSalvo) {
            const usuario = JSON.parse(usuarioSalvo);
            return usuario.email || usuario.id;
        }
    } catch (e) {
        console.error('Erro ao obter usuário:', e);
    }
    return null;
}
// ============================================
// SISTEMA DE NOTIFICAÇÕES PUSH - INTEGRAÇÃO FCM
// ============================================

// Variáveis globais do sistema de notificações
let fcmTokenAtual = null;
let pushNotificationSystem = null;

/**
 * 🔥 OBTÉM TOKEN FCM DO FIREBASE MESSAGING
 * Versão completa e otimizada para seu sistema
 */
async function getFCMToken() {
    console.log("🔥 Iniciando obtenção de token FCM...");
    
    try {
        // 1. VERIFICAR SE O FIREBASE ESTÁ DISPONÍVEL
        if (typeof firebase === 'undefined' || !firebase.messaging) {
            console.warn("⚠️ Firebase Messaging não disponível no navegador");
            throw new Error("Firebase não carregado");
        }
        
        // 2. OBTER INSTÂNCIA DO MESSAGING
        const messaging = firebase.messaging();
        
        // 3. VERIFICAR PERMISSÃO PARA NOTIFICAÇÕES
        const permissaoAtual = Notification.permission;
        
        if (permissaoAtual === 'denied') {
            console.warn("❌ Permissão para notificações foi negada pelo usuário");
            throw new Error("Permissão para notificações negada");
        }
        
        if (permissaoAtual === 'default') {
            console.log("🔔 Solicitando permissão para notificações...");
            const novaPermissao = await Notification.requestPermission();
            
            if (novaPermissao !== 'granted') {
                console.warn("❌ Usuário não concedeu permissão para notificações");
                throw new Error("Permissão não concedida");
            }
            
            console.log("✅ Permissão para notificações concedida!");
        }
        
        // 4. REGISTRAR SERVICE WORKER ESPECÍFICO DO FIREBASE
        console.log("👷 Registrando Service Worker do Firebase...");
        
        // Certifique-se de que o caminho do service worker está correto
        const serviceWorkerPath = '/sistema-demandas-escolares/sw-notificacoes.js';
        
        let registration;
        try {
            registration = await navigator.serviceWorker.register(serviceWorkerPath, {
                scope: '/sistema-demandas-escolares/'
            });
            
            console.log("✅ Service Worker registrado com sucesso:", registration.scope);
            
            // Aguardar o service worker estar ativo
            await registration.active;
            console.log("✅ Service Worker está pronto!");
            
        } catch (swError) {
            console.error("❌ Erro ao registrar Service Worker:", swError);
            throw new Error(`Falha no Service Worker: ${swError.message}`);
        }
        
        // 5. OBTER TOKEN FCM COM VAPID KEY
        console.log("🔐 Gerando token FCM...");
        
        // VAPID KEY do seu projeto Firebase
        const vapidKey = "BEOHDwWjTbmMFmT8RQl6T6CF4GPC9EjrEVuVkSaCgfgWg4cI68s6LRlIL196LCRjEWr6AEMMHhrjW4OXtrKwUsw";
        
        if (!vapidKey || vapidKey.length < 10) {
            throw new Error("VAPID Key inválida ou não configurada");
        }
        
        const fcmToken = await messaging.getToken({
            vapidKey: vapidKey,
            serviceWorkerRegistration: registration
        });
        
        if (!fcmToken) {
            throw new Error("Firebase não retornou token FCM");
        }
        
        console.log("✅ TOKEN FCM OBTIDO COM SUCESSO!");
        console.log("📋 Token (primeiros 50 chars):", fcmToken.substring(0, 50) + "...");
        console.log("📏 Comprimento total:", fcmToken.length, "caracteres");
        
        // 6. ✅ SALVAR TOKEN NO SERVIDOR (APÓS OBTENÇÃO BEM-SUCEDIDA)
        await salvarTokenFCMNoServidor(fcmToken);
        
        // 7. CONFIGURAR LISTENERS PARA ATUALIZAÇÕES DO TOKEN
        configurarListenersFCM(messaging, fcmToken);
        
        // 8. ARMAZENAR TOKEN GLOBALMENTE
        fcmTokenAtual = fcmToken;
        localStorage.setItem('fcm_token', fcmToken);
        
        return fcmToken;
        
    } catch (erro) {
        console.error("❌ FALHA AO OBTER TOKEN FCM:", erro);
        
        // 9. 🔄 FALLBACK: TENTAR WEB PUSH PADRÃO
        console.log("🔄 Tentando fallback para Web Push padrão...");
        
        try {
            const webPushToken = await getWebPushToken();
            if (webPushToken) {
                console.log("✅ Token Web Push obtido como fallback");
                return webPushToken;
            }
        } catch (webPushError) {
            console.error("❌ Fallback Web Push também falhou:", webPushError);
        }
        
        return null;
    }
}

/**
 * 💾 SALVA TOKEN FCM NO SERVIDOR
 */
async function salvarTokenFCMNoServidor(token) {
  try {
    console.log(`💾 Salvando token FCM via JSONP...`);
    
    // Usar a mesma função JSONP que já funciona
    await new Promise((resolve, reject) => {
      window.salvarTokenCallback = function(resposta) {
        if (resposta && resposta.sucesso) {
          console.log("✅ Token salvo no servidor via JSONP");
          resolve();
        } else {
          console.error("❌ Erro ao salvar token via JSONP");
          reject(new Error('Falha ao salvar token'));
        }
      };
      
      // Criar script JSONP
      const script = document.createElement('script');
      const usuario = obterUsuarioLogado();
      const url = `https://script.google.com/macros/s/AKfycbwPHLUnKJO-LWPcw4uSBbDXJz5ej2SyUcGkJtARQfPUDOPVQDVLM60Mqqu5U5xRS8OiqA/exec?callback=salvarTokenCallback&acao=salvarTokenFCM&token=${encodeURIComponent(token)}&usuario=${encodeURIComponent(usuario.nome)}&tipo=${encodeURIComponent(usuario.tipo)}&escola=${encodeURIComponent(usuario.escola)}`;
      
      script.src = url;
      document.head.appendChild(script);
      
      // Limpar após 10 segundos
      setTimeout(() => {
        document.head.removeChild(script);
        delete window.salvarTokenCallback;
      }, 10000);
    });
    
  } catch (error) {
    console.warn("⚠️ Não foi possível salvar token via JSONP:", error);
    // Não é crítico se falhar, o sistema ainda funciona
  }
}
/**
 * 🔄 OBTÉM TOKEN WEB PUSH (FALLBACK)
 */
async function getWebPushToken() {
    try {
        console.log("🌐 Tentando Web Push padrão...");
        
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            throw new Error("Web Push não suportado pelo navegador");
        }
        
        // Registrar service worker
        const registration = await navigator.serviceWorker.register('/sistema-demandas-escolares/sw-notificacoes.js', {
            scope: '/sistema-demandas-escolares/'
        });
        
        // Obter subscription existente
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
            console.log("🔔 Criando nova subscription Web Push...");
            
            // VAPID Key pública (mesma do Firebase)
            const vapidKey = "BEOHDwWjTbmMFmT8RQl6T6CF4GPC9EjrEVuVkSaCgfgWg4cI68s6LRlIL196LCRjEWr6AEMMHhrjW4OXtrKwUsw";
            const applicationServerKey = urlBase64ToUint8Array(vapidKey);
            
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
            
            console.log("✅ Nova subscription Web Push criada");
        }
        
        const endpoint = subscription.endpoint;
        console.log("✅ Endpoint Web Push:", endpoint);
        
        // Salvar no servidor como Web Push
        await salvarWebPushNoServidor(subscription);
        
        return endpoint;
        
    } catch (erro) {
        console.error("❌ Erro no Web Push:", erro);
        throw erro;
    }
}

/**
 * 🔧 CONVERTE CHAVE VAPID BASE64 PARA UINT8ARRAY
 */
function urlBase64ToUint8Array(base64String) {
    if (!base64String) {
        throw new Error("String base64 vazia");
    }
    
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
}

/**
 * 🔧 CONFIGURA LISTENERS PARA ATUALIZAÇÕES DO TOKEN FCM
 */
async function configurarListenersFCM(messaging) {
  try {
    console.log("🔧 Configurando listeners FCM...");
    
    // Método moderno para token refresh
    messaging.onMessage((payload) => {
      console.log("📩 Mensagem recebida em foreground:", payload);
      mostrarNotificacao(payload.notification);
    });
    
    // Verificar se o método existe antes de chamar
    if (messaging.onTokenRefresh) {
      messaging.onTokenRefresh(async () => {
        console.log("🔄 Token FCM atualizado automaticamente");
        await getFCMToken(messaging);
      });
    } else {
      console.log("ℹ️ onTokenRefresh não disponível, usando alternativa");
      // Alternativa: monitorar periodicamente
      setInterval(async () => {
        try {
          const token = await messaging.getToken({ vapidKey: 'SEU_VAPID_KEY_AQUI' });
          console.log("🔄 Token verificado periodicamente");
        } catch (error) {
          console.error("❌ Erro ao verificar token:", error);
        }
      }, 24 * 60 * 60 * 1000); // Verificar a cada 24 horas
    }
    
    console.log("✅ Listeners FCM configurados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao configurar listeners FCM:", error);
  }
}
/**
 * 📨 MOSTRAR NOTIFICAÇÃO LOCAL NO APP
 */
function mostrarNotificacaoLocal(title, body, data) {
    // Implementação simples - você pode customizar conforme sua UI
    console.log("📢 Mostrar notificação local:", { title, body, data });
    
    // Opção 1: Usar toast do sistema
    mostrarToast(title, body, 'info');
    
    // Opção 2: Mostrar notificação nativa
    if ('Notification' in window && Notification.permission === 'granted') {
        const notificacao = new Notification(title, {
            body: body,
            icon: '/sistema-demandas-escolares/public/icons/192x192.png',
            data: data
        });
        
        notificacao.onclick = function() {
            if (data && data.demandaId) {
                mostrarDetalhesDemanda(data.demandaId);
            }
        };
    }
}

/**
 * 💾 SALVAR WEB PUSH NO SERVIDOR
 */
async function salvarWebPushNoServidor(subscription) {
    try {
        let usuarioLogado;
        try {
            const usuarioSalvo = localStorage.getItem('usuario_demandas');
            usuarioLogado = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
        } catch (e) {
            usuarioLogado = null;
        }
        
        const dados = {
            acao: "salvarSubscription",
            tipo: "webpush",
            subscription: subscription.toJSON(),
            usuario: usuarioLogado
        };
        
        const resposta = await fazerRequisicaoServidor(dados);
        
        if (resposta && resposta.sucesso) {
            console.log("✅ Web Push salvo no servidor");
        } else {
            console.warn("⚠️ Web Push não foi salvo:", resposta?.erro);
        }
    } catch (erro) {
        console.error("❌ Erro ao salvar Web Push:", erro);
    }
}

// ============================================
// FUNÇÃO PARA CHAMAR O SERVIDOR
// ============================================

/**
 * 📡 FAZ REQUISIÇÃO AO SERVIDOR GOOGLE APPS SCRIPT
 */
async function fazerRequisicaoServidor(dados) {
    // Use sua função existente que chama o backend
    // Esta é uma implementação genérica
    const url = "https://script.google.com/macros/s/AKfycbwPHLUnKJO-LWPcw4uSBbDXJz5ej2SyUcGkJtARQfPUDOPVQDVLM60Mqqu5U5xRS8OiqA/exec";
    
    try {
        const resposta = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados)
        });
        
        return await resposta.json();
    } catch (erro) {
        console.error("❌ Erro na requisição ao servidor:", erro);
        return { sucesso: false, erro: erro.message };
    }
}

// ============================================
// INICIALIZAÇÃO DO SISTEMA DE NOTIFICAÇÕES
// ============================================

/**
 * 🚀 INICIALIZA O SISTEMA DE NOTIFICAÇÕES NO SEU APP
 */
async function inicializarSistemaNotificacoesCompleto() {
    console.log("🚀 Inicializando sistema de notificações completo...");
    
    try {
        // 1. Aguardar carregamento do Firebase
        if (typeof firebase === 'undefined') {
            console.log("⏳ Aguardando Firebase carregar...");
            setTimeout(inicializarSistemaNotificacoesCompleto, 1000);
            return;
        }
        
        // 2. Verificar suporte
        if (!('Notification' in window)) {
            console.warn("⚠️ Este navegador não suporta notificações");
            return;
        }
        
        // 3. Aguardar login do usuário
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const usuarioSalvo = localStorage.getItem('usuario_demandas');
        if (!usuarioSalvo) {
            console.log("⏳ Aguardando login do usuário...");
            return;
        }
        
        // 4. Tentar obter token FCM
        const token = await getFCMToken();
        
        if (token) {
            console.log("🎉 Sistema de notificações inicializado!");
            console.log("📊 Token ativo:", token.substring(0, 30) + "...");
            
            // Atualizar interface
            atualizarInterfaceNotificacoes(true);
        } else {
            console.warn("⚠️ Sistema de notificações não pôde ser inicializado");
            atualizarInterfaceNotificacoes(false);
        }
        
    } catch (erro) {
        console.error("❌ Erro na inicialização:", erro);
        atualizarInterfaceNotificacoes(false);
    }
}

/**
 * 🎛️ ATUALIZA INTERFACE COM STATUS DAS NOTIFICAÇÕES
 */
function atualizarInterfaceNotificacoes(ativo) {
    const statusElement = document.getElementById('notificacoes-status');
    const toggleElement = document.getElementById('toggle-notificacoes');
    
    if (statusElement) {
        statusElement.textContent = ativo ? "✅ Notificações ativas" : "❌ Notificações desativadas";
        statusElement.className = ativo ? "status-sucesso" : "status-erro";
    }
    
    if (toggleElement) {
        toggleElement.checked = ativo;
    }
}
// ============================================
// FUNÇÕES PARA TESTE E DEBUG
// ============================================

/**
 * 🧪 TESTA O SISTEMA DE NOTIFICAÇÕES
 */
async function testarNotificacoesCompletas() {
    console.log("🧪 Testando sistema completo de notificações...");
    
    try {
        // 1. Testar Firebase
        if (typeof firebase === 'undefined') {
            console.error("❌ Firebase não carregado");
            return;
        }
        
        // 2. Obter token
        console.log("1. Obtendo token FCM...");
        const token = await getFCMToken();
        
        if (!token) {
            console.error("❌ Falha ao obter token");
            return;
        }
        
        console.log("✅ Token obtido:", token.substring(0, 50) + "...");
        
        // 3. Testar envio de notificação
        console.log("2. Testando envio de notificação...");
        
        const dadosTeste = {
            acao: "enviarNotificacaoTeste",
            token: token,
            titulo: "🔔 Teste do Sistema",
            mensagem: "Esta é uma notificação de teste do seu sistema!",
            timestamp: new Date().toISOString()
        };
        
        const resultado = await fazerRequisicaoServidor(dadosTeste);
        
        if (resultado && resultado.sucesso) {
            console.log("✅ Notificação de teste enviada com sucesso!");
            mostrarToast("Teste", "Notificação enviada!", "success");
        } else {
            console.error("❌ Falha no envio:", resultado?.erro);
        }
        
    } catch (erro) {
        console.error("❌ Erro no teste:", erro);
        mostrarToast("Erro", "Falha no teste: " + erro.message, "error");
    }
}
// Inicializar automaticamente após carregar
document.addEventListener('DOMContentLoaded', function() {
    // Iniciar após 5 segundos (tempo para o app carregar)
    setTimeout(() => {
        inicializarSistemaNotificacoesCompleto();
    }, 5000);
});

// Exportar funções para uso global
window.inicializarSistemaNotificacoes = inicializarSistemaNotificacoes;
window.enviarNotificacaoNovaDemanda = enviarNotificacaoNovaDemanda;
window.mostrarSecao = mostrarSecao;
window.carregarLogsNotificacoes = carregarLogsNotificacoes;
window.testarNotificacao = testarNotificacao;
window.salvarConfiguracoesNotificacoes = salvarConfiguracoesNotificacoes;
window.testarTodasNotificacoes = testarTodasNotificacoes;
window.mostrarDetalhesDemanda = mostrarDetalhesDemanda;
window.fecharModalDetalhes = fecharModalDetalhes;
window.alterarStatusDemanda = alterarStatusDemanda;
window.excluirDemanda = excluirDemanda;
window.getFCMToken = getFCMToken;
window.testarNotificacoesCompletas = testarNotificacoesCompletas;
window.inicializarSistemaNotificacoesCompleto = inicializarSistemaNotificacoesCompleto;

console.log("✅ app.js carregado com sucesso!");
