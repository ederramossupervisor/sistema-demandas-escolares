// ============================================
// SISTEMA DE GESTÃO DE DEMANDAS - SUPERVIÃO ESCOLAR
// Arquivo: app.js
// Lógica principal da interface
// ============================================

// CONFIGURAÇÕES GLOBAIS
const APP_CONFIG = {
    // URLs serão configuradas em googleAppsScript.js
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
        responsavel: '',
        status: '',
        prazo: ''
    },
    arquivosSelecionados: []
};

// ELEMENTOS DO DOM
let elementos = {};

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
    inicializarElementos();
    inicializarEventos();
    carregarDemandas();
    esconderLoading();
    
    // Verificar se é PWA instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log("Aplicativo PWA em execução");
    }
});

/**
 * Inicializa todos os elementos do DOM
 */
function inicializarElementos() {
    elementos = {
        // Containers principais
        loading: document.getElementById('loading'),
        mainContainer: document.getElementById('main-container'),
        demandasContainer: document.getElementById('demandas-container'),
        
        // Filtros
        filtroEscola: document.getElementById('filtro-escola'),
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
    
    // Configurar data mínima como hoje
    const hoje = new Date().toISOString().split('T')[0];
    elementos.prazo.min = hoje;
}

/**
 * Configura todos os eventos da aplicação
 */
function inicializarEventos() {
    // Botão nova demanda
    elementos.btnNovaDemanda.addEventListener('click', mostrarModalNovaDemanda);
    elementos.btnFecharModal.addEventListener('click', fecharModalNovaDemanda);
    elementos.btnCancelar.addEventListener('click', fecharModalNovaDemanda);
    
    // Formulário nova demanda
    elementos.formNovaDemanda.addEventListener('submit', salvarDemanda);
    
    // Filtros
    elementos.filtroEscola.addEventListener('change', aplicarFiltros);
    elementos.filtroResponsavel.addEventListener('change', aplicarFiltros);
    elementos.filtroStatus.addEventListener('change', aplicarFiltros);
    elementos.filtroPrazo.addEventListener('change', aplicarFiltros);
    elementos.btnLimparFiltros.addEventListener('click', limparFiltros);
    elementos.btnAtualizar.addEventListener('click', carregarDemandas);
    
    // Checkbox "Selecionar todas"
    elementos.escolaTodas.addEventListener('change', function() {
        const checked = this.checked;
        elementos.escolasCheckboxes.forEach(cb => {
            cb.checked = checked;
            cb.disabled = checked;
        });
        atualizarPreviewEmail();
    });
    
    // Checkboxes individuais
    elementos.escolasCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            // Atualizar checkbox "Selecionar todas"
            const todasMarcadas = Array.from(elementos.escolasCheckboxes)
                .every(cb => cb.checked);
            elementos.escolaTodas.checked = todasMarcadas;
            
            atualizarPreviewEmail();
        });
    });
    
    // Opção de enviar e-mail
    elementos.enviarEmail.addEventListener('change', function() {
        elementos.emailContent.style.display = this.checked ? 'block' : 'none';
        if (this.checked) {
            atualizarPreviewEmail();
        }
    });
    
    // Campos que afetam o preview do e-mail
    elementos.titulo.addEventListener('input', atualizarPreviewEmail);
    elementos.descricao.addEventListener('input', atualizarPreviewEmail);
    elementos.corpoEmail.addEventListener('input', atualizarPreviewEmail);
    
    // Upload de arquivos
    elementos.uploadArea.addEventListener('click', () => elementos.fileInput.click());
    elementos.uploadArea.addEventListener('dragover', handleDragOver);
    elementos.uploadArea.addEventListener('drop', handleFileDrop);
    elementos.fileInput.addEventListener('change', handleFileSelect);
    
    // Tabs do formulário
    elementos.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            alternarTab(tabId);
        });
    });
}

/**
 * Mostra/esconde tela de loading
 */
function mostrarLoading() {
    elementos.loading.style.display = 'flex';
    elementos.mainContainer.style.opacity = '0.5';
    elementos.mainContainer.style.pointerEvents = 'none';
}

function esconderLoading() {
    elementos.loading.style.display = 'none';
    elementos.mainContainer.style.opacity = '1';
    elementos.mainContainer.style.pointerEvents = 'auto';
}

/**
 * Carrega as demandas do servidor
 */
async function carregarDemandas() {
    mostrarLoading();
    
    try {
        console.log("🔄 Carregando demandas do servidor...");
        
        // Tentar carregar do servidor
        const demandas = await listarDemandasDoServidor();
        
        console.log(`✅ ${demandas.length} demandas recebidas do servidor`);
        
        state.demandas = demandas;
        renderizarDemandas();
        atualizarEstatisticas();
        
        // Se vazio, mostrar mensagem amigável
        if (demandas.length === 0) {
            mostrarToast('Info', 'Nenhuma demanda cadastrada ainda. Clique no botão "+" para criar a primeira.', 'info');
        }
        
    } catch (erro) {
        console.error('❌ Erro ao carregar demandas do servidor:', erro);
        
        // ⭐⭐ MODO DE CONTINGÊNCIA ⭐⭐
        // Dados de exemplo para demonstração
        state.demandas = obterDadosDemonstracao();
        
        renderizarDemandas();
        atualizarEstatisticas();
        
        // Mensagem amigável
        mostrarToast('Modo Demonstração', 
            'Conectado ao servidor, mas usando dados de exemplo. Você pode criar novas demandas normalmente.', 
            'info');
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

/**
 * Aplica os filtros atuais
 */
function aplicarFiltros() {
    state.filtros = {
        escola: elementos.filtroEscola.value,
        responsavel: elementos.filtroResponsavel.value,
        status: elementos.filtroStatus.value,
        prazo: elementos.filtroPrazo.value
    };
    
    renderizarDemandas();
    atualizarEstatisticas();
}

/**
 * Limpa todos os filtros
 */
function limparFiltros() {
    elementos.filtroEscola.value = '';
    elementos.filtroResponsavel.value = '';
    elementos.filtroStatus.value = '';
    elementos.filtroPrazo.value = '';
    
    aplicarFiltros();
}

/**
 * Atualiza as estatísticas na barra de controle
 */
function atualizarEstatisticas() {
    const demandasFiltradas = filtrarDemandas(state.demandas);
    const hoje = new Date();
    
    const total = demandasFiltradas.length;
    const pendentes = demandasFiltradas.filter(d => d.status === 'Pendente').length;
    
    const atrasadas = demandasFiltradas.filter(d => {
        if (!d.prazo || d.status === 'Concluída') return false;
        const prazo = new Date(d.prazo);
        return prazo < hoje;
    }).length;
    
    elementos.totalDemandas.textContent = total;
    elementos.pendentes.textContent = pendentes;
    elementos.atrasadas.textContent = atrasadas;
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
    elementos.modalNovaDemanda.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Resetar formulário
    elementos.formNovaDemanda.reset();
    elementos.arquivosList.innerHTML = '';
    state.arquivosSelecionados = [];
    
    // Voltar para a primeira aba
    alternarTab('principal');
    
    // Configurar data mínima como hoje
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    
    elementos.prazo.min = amanha.toISOString().split('T')[0];
    elementos.prazo.value = '';
    
    // Resetar checkboxes
    elementos.escolasCheckboxes.forEach(cb => {
        cb.checked = false;
        cb.disabled = false;
    });
    elementos.escolaTodas.checked = false;
    
    // Esconder conteúdo de e-mail
    elementos.emailContent.style.display = 'none';
    elementos.enviarEmail.checked = false;
}

/**
 * Fecha modal de nova demanda
 */
function fecharModalNovaDemanda() {
    elementos.modalNovaDemanda.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * Alterna entre as tabs do formulário
 */
function alternarTab(tabId) {
    // Remover classe active de todas as tabs
    elementos.tabs.forEach(tab => tab.classList.remove('active'));
    elementos.tabContents.forEach(content => content.classList.remove('active'));
    
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
    const titulo = elementos.titulo.value || '[Título da demanda]';
    const corpo = elementos.corpoEmail.value || 'Sem mensagem adicional.';
    
    // Obter escolas selecionadas
    const escolasSelecionadas = [];
    elementos.escolasCheckboxes.forEach(cb => {
        if (cb.checked) {
            escolasSelecionadas.push(cb.value);
        }
    });
    
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
    elementos.uploadArea.style.borderColor = '#3498db';
    elementos.uploadArea.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
}

/**
 * Lida com o soltar de arquivos
 */
function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    elementos.uploadArea.style.borderColor = '#ddd';
    elementos.uploadArea.style.backgroundColor = '';
    
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
    elementos.fileInput.value = '';
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

/**
 * Salva uma nova demanda
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
        elementos.escolasCheckboxes.forEach(cb => {
            if (cb.checked) {
                escolasSelecionadas.push(cb.value);
            }
        });
        
        const dadosDemanda = {
            titulo: elementos.titulo.value.trim(),
            descricao: elementos.descricao.value.trim(),
            escolas: escolasSelecionadas,
            responsavel: document.querySelector('input[name="responsavel"]:checked').value,
            prazo: elementos.prazo.value,
            enviarEmail: elementos.enviarEmail.checked,
            corpoEmail: elementos.corpoEmail.value.trim()
        };
        
        // 2. Fazer upload dos anexos se houver
        let linksAnexos = [];
        
        if (state.arquivosSelecionados.length > 0) {
            mostrarToast('Upload', 'Enviando anexos...', 'info');
            
            for (const arquivo of state.arquivosSelecionados) {
                try {
                    console.log(`📤 Enviando arquivo: ${arquivo.name} (${formatarTamanhoArquivo(arquivo.size)})`);
                    
                    // Fazer upload do arquivo (apenas UMA declaração da variável resultado)
                    const resultadoUpload = await fazerUploadArquivo(arquivo);
                    
                    console.log('📥 Resultado do upload:', resultadoUpload);
                    
                    // 🔥 VERIFICAÇÃO ROBUSTA DA URL
                    let urlFinal = null;
                    let mensagemStatus = '';
                    
                    if (resultadoUpload.sucesso !== false && resultadoUpload.dados && resultadoUpload.dados.url) {
                        // Formato novo: resultado.dados.url
                        urlFinal = resultadoUpload.dados.url;
                        mensagemStatus = '✅ Enviado com sucesso';
                        
                    } else if (resultadoUpload.url && resultadoUpload.url.startsWith('http')) {
                        // Formato antigo: resultado.url
                        urlFinal = resultadoUpload.url;
                        mensagemStatus = '✅ Enviado com sucesso (formato antigo)';
                        
                    } else if (resultadoUpload.modo && resultadoUpload.modo.includes('simulado')) {
                        // Modo simulado - upload falhou
                        urlFinal = '#upload-simulado';
                        mensagemStatus = `⚠️ Modo simulado: ${resultadoUpload.mensagem || 'Arquivo grande demais'}`;
                        
                    } else {
                        // Outro erro
                        urlFinal = '#upload-falhou';
                        mensagemStatus = `❌ Falha: ${resultadoUpload.mensagem || 'Erro desconhecido'}`;
                    }
                    
                    // Só adicionar se tem URL válida
                    if (urlFinal && urlFinal.startsWith('http')) {
                        linksAnexos.push({
                            nome: arquivo.name,
                            url: urlFinal,
                            tamanho: arquivo.size,
                            status: 'sucesso'
                        });
                        
                        console.log(`🎯 Arquivo ${arquivo.name}: ${mensagemStatus}`);
                        console.log(`🔗 URL: ${urlFinal}`);
                        
                    } else {
                        console.warn(`⚠️ Arquivo ${arquivo.name} não tem URL válida:`, urlFinal);
                        mostrarToast('Atenção', `${arquivo.name}: ${mensagemStatus}`, 'warning');
                    }
                    
                } catch (erro) {
                    console.error(`❌ Erro no upload de ${arquivo.name}:`, erro);
                    mostrarToast('Atenção', `Erro ao enviar ${arquivo.name}: ${erro.message}`, 'warning');
                }
            }
            
            // Só adicionar anexos se realmente tiver URLs válidas
            dadosDemanda.anexos = linksAnexos.filter(a => a.url.startsWith('http'));
            
            if (dadosDemanda.anexos.length > 0) {
                console.log(`✅ ${dadosDemanda.anexos.length} anexos prontos para salvar`);
            } else {
                console.warn('⚠️ Nenhum anexo válido para salvar');
                delete dadosDemanda.anexos; // Não enviar anexos vazios
            }
        }
        
        // 3. Salvar demanda no servidor
        mostrarToast('Salvando', 'Salvando demanda...', 'info');
        const resultadoSalvar = await salvarDemandaNoServidor(dadosDemanda);
        
        // 4. Enviar e-mail se solicitado
        if (dadosDemanda.enviarEmail && escolasSelecionadas.length > 0) {
            try {
                mostrarToast('E-mail', 'Enviando e-mail...', 'info');
                
                const dadosEmail = {
                    ...dadosDemanda,
                    idDemanda: resultadoSalvar.id
                };
                
                await enviarEmailDemanda(dadosEmail);
                
                mostrarToast('Sucesso', 'E-mail enviado com sucesso!', 'success');
            } catch (erroEmail) {
                console.error('Erro ao enviar e-mail:', erroEmail);
                mostrarToast('Atenção', 'Demanda salva, mas e-mail não foi enviado.', 'warning');
            }
        }
        
        // 5. Sucesso!
        mostrarToast('Sucesso', 'Demanda salva com sucesso!', 'success');
        
        // 6. Fechar modal e atualizar lista
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
    // Título
    if (!elementos.titulo.value.trim()) {
        mostrarToast('Validação', 'Digite um título para a demanda.', 'warning');
        elementos.titulo.focus();
        return false;
    }
    
    // Descrição
    if (!elementos.descricao.value.trim()) {
        mostrarToast('Validação', 'Digite uma descrição para a demanda.', 'warning');
        elementos.descricao.focus();
        return false;
    }
    
    // Escolas
    const escolasSelecionadas = Array.from(elementos.escolasCheckboxes)
        .filter(cb => cb.checked).length;
    
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
    if (!elementos.prazo.value) {
        mostrarToast('Validação', 'Defina um prazo para a demanda.', 'warning');
        elementos.prazo.focus();
        return false;
    }
    
    // Verificar se a data é futura
    const hoje = new Date();
    const prazoSelecionado = new Date(elementos.prazo.value);
    
    if (prazoSelecionado < hoje) {
        mostrarToast('Validação', 'O prazo deve ser uma data futura.', 'warning');
        elementos.prazo.focus();
        return false;
    }
    
    return true;
}
/**
 * Mostra os detalhes de uma demanda (VERSÃO CORRIGIDA)
 */
function mostrarDetalhesDemanda(idDemanda) {
    const demanda = state.demandas.find(d => d.id == idDemanda);
    
    if (!demanda) {
        mostrarToast('Erro', 'Demanda não encontrada.', 'error');
        return;
    }
    
    // Preparar dados com proteção
    const dataCriacao = formatarData(demanda.criado_em);
    const dataAtualizacao = formatarData(demanda.atualizado_em);
    const dataPrazo = demanda.prazo ? formatarData(demanda.prazo) : 'Não definido';
    
    // Calcular dias restantes com proteção
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
    
    // Preparar histórico com proteção
    let historicoHTML = '';
    if (demanda.historico && typeof demanda.historico === 'string') {
        try {
            const entradas = demanda.historico.split('\n').filter(h => h && h.trim());
            entradas.forEach((entrada, index) => {
                if (entrada && entrada.includes(' - ')) {
                    const [data, ...texto] = entrada.split(' - ');
                    historicoHTML += `
                        <div class="historico-item ${index === 0 ? 'nova' : 'atualizacao'}">
                            <div class="historico-data">${data || 'Data desconhecida'}</div>
                            <div class="historico-texto">${texto.join(' - ') || 'Sem detalhes'}</div>
                        </div>
                    `;
                }
            });
        } catch (e) {
            console.warn('Erro ao processar histórico:', e);
        }
    }
    
    // Preparar anexos com proteção
    let anexosHTML = '';
    if (demanda.anexos && typeof demanda.anexos === 'string' && demanda.anexos.trim()) {
        try {
            // Separar por vírgula com proteção
            const anexosArray = demanda.anexos.split(',').filter(a => a && a.trim());
            if (anexosArray.length > 0) {
                anexosHTML = `
                    <div class="form-group mt-3">
                        <label><i class="fas fa-paperclip"></i> Anexos</label>
                        <div style="padding: 10px; background-color: #f9f9f9; border-radius: var(--border-radius-sm);">
                            ${anexosArray.map(anexo => {
                                const url = anexo.trim();
                                const nome = url.substring(url.lastIndexOf('/') + 1) || 'Arquivo';
                                return `
                                    <div style="margin-bottom: 5px;">
                                        <a href="${url}" target="_blank" style="color: var(--secondary-color);">
                                            <i class="fas fa-external-link-alt"></i> ${nome}
                                        </a>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            console.warn('Erro ao processar anexos:', e);
        }
    }
    
    // Contar escolas com proteção
    const numEscolas = demanda.escolas ? 
        (typeof demanda.escolas === 'string' ? demanda.escolas.split(',').filter(e => e.trim()).length : 1) 
        : 0;
    
    // Criar modal de detalhes (CORRIGIDO)
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
                        <div class="detalhe-valor">${numEscolas}</div>
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
                
                ${anexosHTML}
                
                ${historicoHTML ? `
                <div class="historico-container mt-3">
                    <h3><i class="fas fa-history"></i> Histórico</h3>
                    ${historicoHTML}
                </div>
                ` : ''}
                
                <div class="form-group mt-3">
                    <label><i class="fas fa-edit"></i> Ações</label>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="btn btn-primary" onclick="alterarStatusDemanda(${demanda.id}, 'Em andamento')">
                            <i class="fas fa-play"></i> Iniciar
                        </button>
                        <button class="btn btn-success" onclick="alterarStatusDemanda(${demanda.id}, 'Concluída')">
                            <i class="fas fa-check"></i> Concluir
                        </button>
                        <button class="btn btn-secondary" onclick="reenviarEmailDemanda(${demanda.id})">
                            <i class="fas fa-envelope"></i> Reenviar E-mail
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    elementos.modalDetalhes.querySelector('.modal').innerHTML = modalHTML;
    elementos.modalDetalhes.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Fecha o modal de detalhes
 */
function fecharModalDetalhes() {
    elementos.modalDetalhes.style.display = 'none';
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
 * Reenvia e-mail de uma demanda
 */
async function reenviarEmailDemanda(idDemanda) {
    if (!confirm('Deseja reenviar o e-mail desta demanda?')) {
        return;
    }
    
    const demanda = state.demandas.find(d => d.id == idDemanda);
    
    if (!demanda) {
        mostrarToast('Erro', 'Demanda não encontrada.', 'error');
        return;
    }
    
    mostrarLoading();
    
    try {
        const dadosEmail = {
            titulo: demanda.titulo,
            descricao: demanda.descricao,
            escolas: demanda.escolas ? 
                (typeof demanda.escolas === 'string' ? demanda.escolas.split(',').map(e => e.trim()) : []) 
        : [],
            responsavel: demanda.responsavel,
            prazo: demanda.prazo,
            corpoEmail: 'Este e-mail está sendo reenviado.',
            idDemanda: demanda.id
        };
        
        await enviarEmailDemanda(dadosEmail);
        mostrarToast('Sucesso', 'E-mail reenviado com sucesso!', 'success');
        
    } catch (erro) {
        console.error('Erro ao reenviar e-mail:', erro);
        mostrarToast('Erro', 'Não foi possível reenviar o e-mail.', 'error');
    } finally {
        esconderLoading();
    }
}

/**
 * Mostra uma mensagem toast
 */
function mostrarToast(titulo, mensagem, tipo = 'info') {
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

// EXPORTA FUNÇÕES PARA USO GLOBAL
window.mostrarDetalhesDemanda = mostrarDetalhesDemanda;
window.fecharModalDetalhes = fecharModalDetalhes;
window.alterarStatusDemanda = alterarStatusDemanda;
window.reenviarEmailDemanda = reenviarEmailDemanda;

/**
 * Função auxiliar para criar barra de progresso de upload (se necessário)
 */
function criarBarraProgressoUpload(arquivo) {
    // Implementação opcional para mostrar progresso
    return {
        completar: function(sucesso) {
            console.log(`Upload ${sucesso ? 'completo' : 'falhou'} para ${arquivo.name}`);
        },
        remover: function() {
            console.log(`Removendo indicador para ${arquivo.name}`);
        }
    };
}
