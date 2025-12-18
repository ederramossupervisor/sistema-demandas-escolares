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
    
    // VERIFICAÇÃO: Só inicializar na página principal
    // O pathname pode ser: 
    // - "/sistema-demandas-escolares/index.html" (GitHub Pages)
    // - "/index.html" (local)
    // - "/" (página raiz)
    // - "" (outras situações)
    const pathname = window.location.pathname;
    const estaNaPaginaPrincipal = 
        pathname.includes('index.html') || 
        pathname.endsWith('/') || 
        pathname === '' ||
        pathname === '/' ||
        !pathname.includes('.html'); // se não tem .html, pode ser a página principal
    
    console.log("📍 Pathname atual:", pathname);
    console.log("📌 É página principal?", estaNaPaginaPrincipal);
    
    if (!estaNaPaginaPrincipal) {
        console.log("🔍 Não estamos na página principal, pulando inicialização...");
        return; // Não inicializa o app.js na página de login
    }
    
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
 * INICIALIZAÇÃO COM SPLASH SCREEN (COM FALLBACK)
 */
function iniciarSplashScreen() {
    console.log("🎬 Iniciando splash screen...");
    
    // Verificar se o elemento existe
    if (!elementos.splashScreen) {
        console.log("❌ Splash screen não encontrada, iniciando aplicação diretamente");
        iniciarAplicacao();
        return;
    }
    
    // Fallback global: se algo der errado, esconder após 8 segundos
    const fallbackTimeout = setTimeout(() => {
        if (state.splashScreenActive) {
            console.log("⏰ Fallback: tempo limite atingido, forçando início da aplicação");
            esconderSplashScreen();
            iniciarAplicacao();
        }
    }, 8000);
    
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
            if (!state.splashScreenActive) return;
            
            if (statusEl) {
                statusEl.textContent = etapa.texto;
            }
            console.log(`🔧 ${etapa.texto}`);
            
            // Última etapa: iniciar aplicação
            if (index === etapas.length - 1) {
                console.log("✅ Todas as etapas concluídas");
                clearTimeout(fallbackTimeout); // Cancelar fallback
                
                setTimeout(() => {
                    if (state.splashScreenActive) {
                        console.log("🚀 Iniciando aplicação...");
                        iniciarAplicacao();
                    }
                }, 800);
            }
        }, etapa.tempo);
    });
}
/**
 * INICIALIZAR APLICAÇÃO PRINCIPAL COM NOTIFICAÇÕES
 */
function iniciarAplicacao() {
    console.log("📱 Iniciando aplicação principal...");
    
    // 1. Esconder splash screen (com verificação)
    esconderSplashScreen();
    
    // Pequeno delay para garantir transição
    setTimeout(() => {
        // 2. Inicializar resto da aplicação
        try {
            console.log("🔗 Inicializando eventos...");
            inicializarEventos();
            
            console.log("🔄 Carregando demandas...");
            carregarDemandas();
            
            // 3. Inicializar sistema de notificações
            setTimeout(() => {
                console.log("🔔 Inicializando sistema de notificações...");
                inicializarSistemaNotificacoes();
            }, 2000);
            
            // 4. Verificar se é PWA
            if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log("📲 Aplicativo PWA em execução");
                document.body.classList.add('pwa-mode');
            }
            
            console.log("✅ Aplicação iniciada com sucesso!");
            
        } catch (erro) {
            console.error("❌ Erro ao iniciar aplicação:", erro);
            mostrarToast('Erro', 'Falha ao iniciar aplicação', 'error');
        }
    }, 300);
}

/**
 * ESCONDER SPLASH SCREEN (CORRIGIDA)
 */
function esconderSplashScreen() {
    console.log("🎬 Tentando esconder splash screen...");
    
    // Verificar se o elemento existe
    if (!elementos.splashScreen) {
        console.log("⚠️ Splash screen não encontrada no DOM");
        state.splashScreenActive = false;
        return;
    }
    
    if (!state.splashScreenActive) {
        console.log("⚠️ Splash screen já foi escondida anteriormente");
        return;
    }
    
    console.log("✅ Escondendo splash screen...");
    state.splashScreenActive = false;
    
    // Adicionar classe de animação
    elementos.splashScreen.classList.add('hidden');
    elementos.splashScreen.classList.add('fade-out');
    
    console.log("✅ Classe 'hidden' adicionada à splash screen");
    
    // Remover do DOM após animação
    setTimeout(() => {
        if (elementos.splashScreen && elementos.splashScreen.parentNode) {
            console.log("🗑️ Removendo splash screen do DOM...");
            elementos.splashScreen.remove();
            elementos.splashScreen = null;
            console.log("✅ Splash screen removida do DOM");
        } else {
            console.log("⚠️ Splash screen já foi removida ou não existe mais");
        }
    }, 800); // Aumentar tempo para 800ms para garantir animação
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
        // Elementos de estatísticas do bloco
        totalDemandasInfo: document.getElementById('total-demandas-info'),
        pendentesInfo: document.getElementById('pendentes-info'),
        emAndamentoInfo: document.getElementById('em-andamento-info'),
        concluidasInfo: document.getElementById('concluidas-info'),
        atrasadasInfo: document.getElementById('atrasadas-info'),
        
    
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

/**
 * Atualiza o bloco "Demandas" com números reais
 */
function atualizarBlocoEstatisticas(demandas) {
    console.log("📈 Atualizando estatísticas do bloco...");
    
    // VERIFICAÇÃO: Se não estamos na página principal, não faz nada
    if (!elementos || !elementos.mainContainer) {
        console.log("⚠️ Não estamos na página principal, pulando atualização de estatísticas");
        return;
    }
    
    // Contar por status
    const total = demandas.length;
    const pendentes = demandas.filter(d => d.status === 'Pendente').length;
    const emAndamento = demandas.filter(d => d.status === 'Em andamento').length;
    const concluidas = demandas.filter(d => d.status === 'Concluída').length;
    
    // Calcular atrasadas (pendentes ou em andamento com prazo vencido)
    const hoje = new Date();
    const atrasadas = demandas.filter(d => {
        if (d.status === 'Concluída') return false;
        if (!d.prazo) return false;
        
        const prazo = new Date(d.prazo);
        return prazo < hoje;
    }).length;
    
    // Atualizar os números na tela - BUSCANDO ELEMENTOS DIRETAMENTE
    // (mais seguro que depender do objeto elementos)
    
    // Elemento "Total"
    const totalEl = document.getElementById('total-demandas-info');
    if (totalEl) {
        totalEl.textContent = total;
        console.log('✅ total-demandas-info atualizado:', total);
    }
    
    // Elemento "Pendentes"
    const pendentesEl = document.getElementById('pendentes-info');
    if (pendentesEl) {
        pendentesEl.textContent = pendentes;
        console.log('✅ pendentes-info atualizado:', pendentes);
    }
    
    // Elemento "Em Andamento"
    const emAndamentoEl = document.getElementById('em-andamento-info');
    if (emAndamentoEl) {
        emAndamentoEl.textContent = emAndamento;
        console.log('✅ em-andamento-info atualizado:', emAndamento);
    }
    
    // Elemento "Concluídas"
    const concluidasEl = document.getElementById('concluidas-info');
    if (concluidasEl) {
        concluidasEl.textContent = concluidas;
        console.log('✅ concluidas-info atualizado:', concluidas);
    }
    
    // Elemento "Atrasadas"
    const atrasadasEl = document.getElementById('atrasadas-info');
    if (atrasadasEl) {
        atrasadasEl.textContent = atrasadas;
        console.log('✅ atrasadas-info atualizado:', atrasadas);
    }
    
    console.log("📊 Estatísticas calculadas:", { total, pendentes, emAndamento, concluidas, atrasadas });
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
        atualizarBlocoEstatisticas(demandas);
        
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
 * FUNÇÃO NOVA: Renderiza demandas na LISTA (não nos cards)
 * Esta função vai substituir os exemplos fixos pelos dados reais
 */
function renderizarDemandasNaLista() {
    console.log("🎯 Renderizando na lista nova...");
    
    const listaContainer = document.querySelector('.demandas-lista-container');
    if (!listaContainer) return;
    
    // Limpar (manter só o cabeçalho)
    const cabecalho = listaContainer.querySelector('.demanda-linha.cabecalho');
    listaContainer.innerHTML = '';
    if (cabecalho) listaContainer.appendChild(cabecalho);
    
    // Aplicar filtros
    const demandasFiltradas = filtrarDemandas(state.demandas);
    
    // Se não há demandas filtradas
    if (!demandasFiltradas || demandasFiltradas.length === 0) {
        const vazioHTML = `
            <div class="lista-vazia">
                <i class="fas fa-filter fa-3x"></i>
                <h3>Nenhuma demanda encontrada</h3>
                <p>Tente ajustar os filtros ou criar uma nova demanda</p>
            </div>
        `;
        listaContainer.insertAdjacentHTML('beforeend', vazioHTML);
        
        // Atualizar estatísticas com zero (já que nada foi filtrado)
        atualizarBlocoEstatisticas([]);
        return;
    }
    
    // Ordenar: pendentes primeiro, depois por prazo
    demandasFiltradas.sort((a, b) => {
        // Status: Pendente → Em andamento → Concluída
        const statusOrder = { 'Pendente': 1, 'Em andamento': 2, 'Concluída': 3 };
        const statusA = statusOrder[a.status] || 4;
        const statusB = statusOrder[b.status] || 4;
        
        if (statusA !== statusB) return statusA - statusB;
        
        // Por prazo (mais próximos primeiro)
        if (!a.prazo) return 1;
        if (!b.prazo) return -1;
        return new Date(a.prazo) - new Date(b.prazo);
    });
    
    // Para cada demanda filtrada
    demandasFiltradas.forEach(demanda => {
        // Formatar dados
        const dataPrazo = demanda.prazo ? 
            new Date(demanda.prazo).toLocaleDateString('pt-BR') : 
            'Não definido';
        
        // Calcular se está atrasada
        const hoje = new Date();
        const prazoDate = demanda.prazo ? new Date(demanda.prazo) : null;
        let prazoIndicador = '';
        
        if (prazoDate && demanda.status !== 'Concluída') {
            const diasRestantes = Math.ceil((prazoDate - hoje) / (1000 * 60 * 60 * 24));
            
            if (diasRestantes < 0) {
                prazoIndicador = `<div class="prazo-indicator prazo-atrasado">Atrasada ${Math.abs(diasRestantes)}d</div>`;
            } else if (diasRestantes === 0) {
                prazoIndicador = `<div class="prazo-indicator prazo-hoje">Hoje!</div>`;
            } else if (diasRestantes <= 3) {
                prazoIndicador = `<div class="prazo-indicator prazo-alerta">${diasRestantes}d</div>`;
            }
        }
        
        // Escolas (mostrar apenas primeira se tiver muitas)
        let escolasTexto = demanda.escolas || '';
        const escolasArray = escolasTexto.split(',').map(e => e.trim());
        if (escolasArray.length > 1) {
            escolasTexto = `${escolasArray[0]} +${escolasArray.length - 1}`;
        }
        
        // Status
        const status = demanda.status || 'Pendente';
        const statusClass = `status-${status.toLowerCase().replace(' ', '-')}`;
        
        // Criar linha
        const linhaHTML = `
            <div class="demanda-linha" onclick="mostrarDetalhesDemanda(${demanda.id})" style="cursor: pointer;">
                <div class="demanda-titulo">
                    <i class="fas fa-file-alt"></i>
                    ${demanda.titulo || 'Sem título'}
                    ${prazoIndicador}
                </div>
                <div class="demanda-escola" title="${demanda.escolas || ''}">
                    ${escolasTexto}
                </div>
                <div class="demanda-departamento">
                    ${demanda.departamento || 'Não definido'}
                </div>
                <div class="demanda-responsavel">
                    ${demanda.responsavel || 'Não definido'}
                </div>
                <div class="demanda-prazo">
                    ${dataPrazo}
                </div>
                <div class="demanda-status ${statusClass}">
                    ${status}
                </div>
            </div>
        `;
        
        listaContainer.insertAdjacentHTML('beforeend', linhaHTML);
    });
    
    // Atualizar estatísticas com as demandas filtradas
    atualizarBlocoEstatisticas(demandasFiltradas);
}
/**
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
        
        // Filtro por departamento
        if (state.filtros.departamento && state.filtros.departamento !== '') {
            if (!demanda.departamento || !demanda.departamento.includes(state.filtros.departamento)) {
                return false;
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
 * Mostra os detalhes de uma demanda
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
    
    if (demanda.prazo) {
        try {
            const hoje = new Date();
            const prazo = new Date(demanda.prazo);
            const dias = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
            
            if (dias < 0) {
                diasRestantes = `${Math.abs(dias)} dias atrasado`;
                prazoStatus = 'atrasado';
            } else if (dias === 0) {
                diasRestantes = 'Vence hoje';
                prazoStatus = 'urgente';
            } else if (dias <= 3) {
                diasRestantes = `${dias} dias`;
                prazoStatus = 'alerta';
            } else {
                diasRestantes = `${dias} dias`;
                prazoStatus = 'ok';
            }
        } catch (e) {
            diasRestantes = 'Erro no cálculo';
        }
    }
    
    // Preparar modal HTML
    const modalHTML = `
        <div class="modal-header">
            <h2><i class="fas fa-file-lines"></i> Detalhes da Demanda #${demanda.id || 'N/A'}</h2>
            <button class="btn-close" onclick="fecharModalDetalhes()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="modal-body">
            <div class="demanda-detalhes">
                <div class="detalhes-grid">
                    <div class="detalhe-item">
                        <div class="detalhe-label"><i class="fas fa-heading"></i> Título</div>
                        <div class="detalhe-valor">${demanda.titulo || 'Sem título'}</div>
                    </div>
                    
                    <div class="detalhe-item">
                        <div class="detalhe-label"><i class="fas fa-user-tag"></i> Responsável</div>
                        <div class="detalhe-valor ${(demanda.responsavel || '').includes('Supervisor') ? 'supervisor' : 'escola'}">
                            ${demanda.responsavel || 'Não definido'}
                        </div>
                    </div>
                    
                    <div class="detalhe-item">
                        <div class="detalhe-label"><i class="fas fa-tasks"></i> Status</div>
                        <div class="detalhe-valor status-${(demanda.status || 'pendente').toLowerCase().replace(' ', '-')}">
                            ${demanda.status || 'Pendente'}
                        </div>
                    </div>
                    
                    <div class="detalhe-item">
                        <div class="detalhe-label"><i class="fas fa-calendar-day"></i> Prazo</div>
                        <div class="detalhe-valor">${dataPrazo}</div>
                        <small>${diasRestantes}</small>
                    </div>
                    
                    <div class="detalhe-item">
                        <div class="detalhe-label"><i class="fas fa-school"></i> Escolas</div>
                        <div class="detalhe-valor">${demanda.escolas ? demanda.escolas.split(',').length : 0}</div>
                        <small>${demanda.escolas || 'Nenhuma escola'}</small>
                    </div>
                    
                    <div class="detalhe-item">
                        <div class="detalhe-label"><i class="fas fa-calendar-plus"></i> Criada em</div>
                        <div class="detalhe-valor">${dataCriacao}</div>
                    </div>
                </div>
                
                <div class="form-group mt-3">
                    <label><i class="fas fa-align-left"></i> Descrição</label>
                    <div style="padding: 15px; background-color: #f9f9f9; border-radius: var(--border-radius-sm);">
                        ${demanda.descricao || 'Sem descrição'}
                    </div>
                </div>
                
                                <div class="form-group mt-3">
                    <label><i class="fas fa-edit"></i> Ações</label>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="btn btn-primary" onclick="alterarStatusDemanda(${demanda.id}, 'Em andamento')">
                            <i class="fas fa-play"></i> Iniciar
                        </button>
                        <button class="btn btn-success" onclick="alterarStatusDemanda(${demanda.id}, 'Concluída')">
                            <i class="fas fa-check"></i> Concluir
                        </button>
                        <!-- BOTÃO DE EXCLUSÃO APENAS PARA SUPERVISOR -->
                        <!-- O botão será controlado por JavaScript puro -->
                        <button class="btn btn-danger supervisor-only" id="btn-excluir-${demanda.id}" onclick="excluirDemanda(${demanda.id})" title="Apenas Supervisor pode excluir" style="display: none;">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                    <small style="color: #7f8c8d; font-size: 12px; margin-top: 5px; display: block; display: none;" id="msg-permissao-${demanda.id}">
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
        
        // AGORA verificamos o tipo de usuário DEPOIS que o modal foi criado
        setTimeout(() => {
            const usuarioSalvo = localStorage.getItem('usuario_demandas');
            if (usuarioSalvo) {
                try {
                    const usuario = JSON.parse(usuarioSalvo);
                    const btnExcluir = document.getElementById(`btn-excluir-${demanda.id}`);
                    const msgPermissao = document.getElementById(`msg-permissao-${demanda.id}`);
                    
                    if (usuario.tipo_usuario === 'supervisor') {
                        // Mostrar botão para supervisor
                        if (btnExcluir) btnExcluir.style.display = 'inline-block';
                        if (msgPermissao) msgPermissao.style.display = 'none';
                    } else {
                        // Mostrar mensagem para não-supervisor
                        if (btnExcluir) btnExcluir.style.display = 'none';
                        if (msgPermissao) msgPermissao.style.display = 'block';
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

// ============================================
// INICIALIZAÇÃO DAS NOTIFICAÇÕES
// ============================================

/**
 * Inicializa sistema de notificações
 */
async function inicializarSistemaNotificacoes() {
    console.log('🔔 Inicializando sistema de notificações...');
    
    // 1. Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
        try {
            const permissao = await Notification.requestPermission();
            console.log(`Permissão para notificações: ${permissao}`);
        } catch (erro) {
            console.error('Erro ao solicitar permissão:', erro);
        }
    }
    
    // 2. Carregar configurações do usuário
    const configuracoes = await carregarConfiguracoesUsuario();
    if (configuracoes) {
        console.log('Configurações de notificação carregadas:', configuracoes);
    }
    
    // 3. Configurar verificação periódica de lembretes (a cada 1 hora)
    setInterval(verificarLembretesPrazos, 60 * 60 * 1000);
    
    // 4. Verificar agora também
    setTimeout(verificarLembretesPrazos, 5000);
    
    console.log('✅ Sistema de notificações inicializado');
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

// Exportar para uso global
window.mostrarSecao = mostrarSecao;
window.carregarLogsNotificacoes = carregarLogsNotificacoes;
window.testarNotificacao = testarNotificacao;
window.salvarConfiguracoesNotificacoes = salvarConfiguracoesNotificacoes;
window.testarTodasNotificacoes = testarTodasNotificacoes;
window.mostrarDetalhesDemanda = mostrarDetalhesDemanda;
window.fecharModalDetalhes = fecharModalDetalhes;
window.alterarStatusDemanda = alterarStatusDemanda;
window.excluirDemanda = excluirDemanda;

// ============================================
// FUNÇÕES PARA BOTÕES DE AÇÃO RÁPIDA
// ============================================

function filtrarApenasMinhas() {
    console.log("🔍 Filtrando minhas demandas...");
    
    const usuarioSalvo = localStorage.getItem('usuario_demandas');
    if (!usuarioSalvo) {
        mostrarToast('Erro', 'Usuário não identificado!', 'error');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioSalvo);
        
        // 1. Limpar filtros anteriores
        if (elementos.filtroEscola) elementos.filtroEscola.value = '';
        if (elementos.filtroDepartamento) elementos.filtroDepartamento.value = '';
        if (elementos.filtroResponsavel) elementos.filtroResponsavel.value = '';
        if (elementos.filtroStatus) elementos.filtroStatus.value = '';
        if (elementos.filtroPrazo) elementos.filtroPrazo.value = '';
        
        // 2. Aplicar filtros baseados no usuário
        if (usuario.escola_sre && elementos.filtroEscola) {
            elementos.filtroEscola.value = usuario.escola_sre;
            console.log(`🏫 Filtrando por escola: ${usuario.escola_sre}`);
        }
        
        if (usuario.departamento && elementos.filtroDepartamento) {
            elementos.filtroDepartamento.value = usuario.departamento;
            console.log(`🏢 Filtrando por departamento: ${usuario.departamento}`);
        }
        
        // 3. Aplicar filtros
        aplicarFiltros();
        
        // 4. Mostrar mensagem personalizada
        let mensagem = 'Mostrando suas demandas';
        if (usuario.escola_sre && usuario.departamento) {
            mensagem = `Filtro: ${usuario.escola_sre} - ${usuario.departamento}`;
        }
        
        mostrarToast('Filtro Aplicado', mensagem, 'info');
        
    } catch (erro) {
        console.error('Erro ao filtrar:', erro);
        mostrarToast('Erro', 'Não foi possível aplicar o filtro', 'error');
    }
}

function filtrarAtrasadas() {
    console.log("⚠️ Filtrando demandas atrasadas...");
    
    // 1. Limpar filtros anteriores (exceto escola/departamento se já estiverem)
    if (elementos.filtroResponsavel) elementos.filtroResponsavel.value = '';
    if (elementos.filtroStatus) elementos.filtroStatus.value = '';
    
    // 2. Aplicar filtro de atrasadas
    if (elementos.filtroPrazo) {
        elementos.filtroPrazo.value = 'atrasadas';
    }
    
    // 3. Aplicar filtros
    aplicarFiltros();
    
    // 4. Contar quantas atrasadas temos
    const demandasAtrasadas = state.demandas.filter(d => {
        if (!d.prazo) return false;
        if (d.status === 'Concluída') return false;
        
        const hoje = new Date();
        const prazo = new Date(d.prazo);
        return prazo < hoje;
    });
    
    const mensagem = demandasAtrasadas.length > 0 ? 
        `${demandasAtrasadas.length} demanda(s) atrasada(s) encontrada(s)` :
        'Nenhuma demanda atrasada encontrada';
    
    mostrarToast('Demandas Atrasadas', mensagem, 
        demandasAtrasadas.length > 0 ? 'warning' : 'info');
}

// ============================================
// ADICIONAR AO WINDOW PARA ACESSO GLOBAL
// ============================================
window.filtrarApenasMinhas = filtrarApenasMinhas;
window.filtrarAtrasadas = filtrarAtrasadas;
console.log("✅ app.js carregado com sucesso!");
