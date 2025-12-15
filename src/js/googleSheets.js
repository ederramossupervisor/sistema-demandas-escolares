// ============================================
// SISTEMA DE GESTÃO DE DEMANDAS - SUPERVIÃO ESCOLAR
// Arquivo: googleSheets.js
// Funções auxiliares para manipulação de dados
// ============================================

// CONFIGURAÇÕES
const SHEETS_CONFIG = {
    // Colunas da planilha (deve corresponder ao Google Apps Script)
    COLUNAS: {
        ID: 'id',
        TITULO: 'titulo',
        DESCRICAO: 'descricao',
        ESCOLAS: 'escolas',
        RESPONSAVEL: 'responsavel',
        STATUS: 'status',
        PRAZO: 'prazo',
        CRIADO_EM: 'criado_em',
        ATUALIZADO_EM: 'atualizado_em',
        EMAILS_ENVIADOS: 'emails_enviados',
        ANEXOS: 'anexos',
        HISTORICO: 'historico',
        AVISOS_ENVIADOS: 'avisos_enviados'
    },
    
    // Status possíveis
    STATUS: {
        PENDENTE: 'Pendente',
        EM_ANDAMENTO: 'Em andamento',
        CONCLUIDA: 'Concluída'
    },
    
    // Responsáveis possíveis
    RESPONSAVEIS: {
        SUPERVISOR: 'Supervisor',
        ESCOLA: 'Escola(s)'
    }
};

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Valida os dados de uma demanda antes de enviar
 */
function validarDadosDemanda(dados) {
    const erros = [];
    
    // Título
    if (!dados.titulo || dados.titulo.trim().length === 0) {
        erros.push('O título é obrigatório');
    } else if (dados.titulo.length > 200) {
        erros.push('O título deve ter no máximo 200 caracteres');
    }
    
    // Descrição
    if (!dados.descricao || dados.descricao.trim().length === 0) {
        erros.push('A descrição é obrigatória');
    }
    
    // Escolas
    if (!dados.escolas || !Array.isArray(dados.escolas) || dados.escolas.length === 0) {
        erros.push('Selecione pelo menos uma escola');
    }
    
    // Responsável
    if (!dados.responsavel) {
        erros.push('O responsável é obrigatório');
    } else if (!Object.values(SHEETS_CONFIG.RESPONSAVEIS).includes(dados.responsavel)) {
        erros.push('Responsável inválido');
    }
    
    // Prazo
    if (!dados.prazo) {
        erros.push('O prazo é obrigatório');
    } else {
        const dataPrazo = new Date(dados.prazo);
        const hoje = new Date();
        
        if (isNaN(dataPrazo.getTime())) {
            erros.push('Data do prazo inválida');
        } else if (dataPrazo < hoje) {
            erros.push('O prazo não pode ser uma data passada');
        }
    }
    
    // Corpo do e-mail (se enviar e-mail estiver marcado)
    if (dados.enviarEmail && dados.corpoEmail && dados.corpoEmail.length > 5000) {
        erros.push('O corpo do e-mail deve ter no máximo 5000 caracteres');
    }
    
    // Anexos
    if (dados.anexos && Array.isArray(dados.anexos)) {
        const tamanhoTotal = dados.anexos.reduce((total, anexo) => {
            return total + (anexo.tamanho || 0);
        }, 0);
        
        if (tamanhoTotal > 10 * 1024 * 1024) { // 10MB
            erros.push('O tamanho total dos anexos não pode exceder 10MB');
        }
    }
    
    return {
        valido: erros.length === 0,
        erros: erros
    };
}

/**
 * Formata os dados para envio ao servidor
 */
function formatarDadosParaEnvio(dados) {
    // Garantir que escolas seja um array
    const escolas = Array.isArray(dados.escolas) ? dados.escolas : [];
    
    // Formatar anexos se existirem
    let anexosFormatados = [];
    if (dados.anexos && Array.isArray(dados.anexos)) {
        anexosFormatados = dados.anexos.map(anexo => ({
            nome: anexo.nome || 'arquivo',
            url: anexo.url || '',
            tamanho: anexo.tamanho || 0
        }));
    }
    
    return {
        titulo: (dados.titulo || '').trim(),
        descricao: (dados.descricao || '').trim(),
        escolas: escolas,
        responsavel: dados.responsavel || SHEETS_CONFIG.RESPONSAVEIS.SUPERVISOR,
        prazo: dados.prazo || null,
        enviarEmail: !!dados.enviarEmail,
        corpoEmail: (dados.corpoEmail || '').trim(),
        anexos: anexosFormatados
    };
}

/**
 * Processa os dados recebidos do servidor
 */
function processarDadosRecebidos(dadosBrutos) {
    if (!Array.isArray(dadosBrutos)) {
        return [];
    }
    
    return dadosBrutos.map(demanda => {
        // Garantir que todas as propriedades existam
        const demandaProcessada = {
            id: demanda.id || 0,
            titulo: demanda.titulo || 'Sem título',
            descricao: demanda.descricao || '',
            escolas: demanda.escolas || '',
            responsavel: demanda.responsavel || SHEETS_CONFIG.RESPONSAVEIS.SUPERVISOR,
            status: demanda.status || SHEETS_CONFIG.STATUS.PENDENTE,
            prazo: demanda.prazo || null,
            criado_em: demanda.criado_em || new Date().toISOString(),
            atualizado_em: demanda.atualizado_em || demanda.criado_em || new Date().toISOString(),
            emails_enviados: demanda.emails_enviados || '',
            anexos: demanda.anexos || '',
            historico: demanda.historico || '',
            avisos_enviados: demanda.avisos_enviados || ''
        };
        
        // Calcular status do prazo
        if (demandaProcessada.prazo) {
            const hoje = new Date();
            const prazo = new Date(demandaProcessada.prazo);
            const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
            
            demandaProcessada.dias_restantes = diasRestantes;
            demandaProcessada.prazo_status = calcularStatusPrazo(prazo, diasRestantes);
        } else {
            demandaProcessada.dias_restantes = null;
            demandaProcessada.prazo_status = 'sem-prazo';
        }
        
        return demandaProcessada;
    });
}

/**
 * Calcula o status do prazo para coloração
 */
function calcularStatusPrazo(dataPrazo, diasRestantes) {
    if (!dataPrazo) return 'sem-prazo';
    
    if (diasRestantes < 0) return 'atrasado';
    if (diasRestantes === 0) return 'vencendo-hoje';
    if (diasRestantes <= 3) return 'proximo-vencimento';
    return 'no-prazo';
}

/**
 * Formata uma data para exibição amigável
 */
function formatarDataParaExibicao(dataString, incluirHora = false) {
    if (!dataString) return 'Data não disponível';
    
    try {
        const data = new Date(dataString);
        
        const opcoes = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };
        
        if (incluirHora) {
            opcoes.hour = '2-digit';
            opcoes.minute = '2-digit';
        }
        
        return data.toLocaleDateString('pt-BR', opcoes);
    } catch (erro) {
        console.error('Erro ao formatar data:', erro);
        return dataString;
    }
}

/**
 * Formata o nome das escolas para exibição
 */
function formatarEscolasParaExibicao(escolasString, maxCaracteres = 50) {
    if (!escolasString) return 'Nenhuma escola';
    
    // Se já é uma string muito curta, retorna como está
    if (escolasString.length <= maxCaracteres) {
        return escolasString;
    }
    
    // Truncar e adicionar reticências
    const truncado = escolasString.substring(0, maxCaracteres - 3) + '...';
    
    // Contar quantas escolas estão visíveis
    const escolas = escolasString.split(', ');
    const escolasVisiveis = truncado.split(', ');
    const escolasOcultas = escolas.length - escolasVisiveis.length;
    
    if (escolasOcultas > 0) {
        return `${truncado} (+${escolasOcultas} mais)`;
    }
    
    return truncado;
}

/**
 * Extrai informações dos anexos
 */
function processarInformacoesAnexos(anexosString) {
    if (!anexosString) return [];
    
    try {
        // Tentar parsear como JSON
        if (anexosString.startsWith('[') || anexosString.startsWith('{')) {
            const anexos = JSON.parse(anexosString);
            return Array.isArray(anexos) ? anexos : [anexos];
        }
        
        // Se for string simples com URLs separadas por vírgula
        const urls = anexosString.split(',').map(url => url.trim()).filter(url => url);
        
        return urls.map(url => ({
            nome: url.substring(url.lastIndexOf('/') + 1),
            url: url,
            tipo: obterTipoArquivo(url)
        }));
        
    } catch (erro) {
        console.error('Erro ao processar anexos:', erro);
        return [];
    }
}

/**
 * Determina o tipo de arquivo pela extensão
 */
function obterTipoArquivo(url) {
    const extensao = url.split('.').pop().toLowerCase();
    
    const tipos = {
        'pdf': 'PDF',
        'doc': 'Word',
        'docx': 'Word',
        'xls': 'Excel',
        'xlsx': 'Excel',
        'ppt': 'PowerPoint',
        'pptx': 'PowerPoint',
        'jpg': 'Imagem',
        'jpeg': 'Imagem',
        'png': 'Imagem',
        'gif': 'Imagem',
        'txt': 'Texto',
        'csv': 'CSV'
    };
    
    return tipos[extensao] || 'Arquivo';
}

/**
 * Formata o tamanho do arquivo
 */
function formatarTamanhoArquivo(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const tamanhos = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanhos[i];
}

/**
 * Gera um ID único temporário (para uso local antes de salvar)
 */
function gerarIdTemporario() {
    return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Filtra demandas por critérios específicos
 */
function filtrarDemandas(demandas, criterios = {}) {
    return demandas.filter(demanda => {
        // Filtro por escola
        if (criterios.escola && demanda.escolas) {
            const escolas = demanda.escolas.split(', ');
            if (!escolas.includes(criterios.escola)) {
                return false;
            }
        }
        
        // Filtro por responsável
        if (criterios.responsavel && demanda.responsavel !== criterios.responsavel) {
            return false;
        }
        
        // Filtro por status
        if (criterios.status && demanda.status !== criterios.status) {
            return false;
        }
        
        // Filtro por prazo
        if (criterios.prazo && demanda.prazo) {
            const hoje = new Date();
            const prazo = new Date(demanda.prazo);
            const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
            
            switch(criterios.prazo) {
                case 'hoje':
                    if (diasRestantes !== 0) return false;
                    break;
                case 'proximos':
                    if (diasRestantes > 3 || diasRestantes < 0) return false;
                    break;
                case 'atrasadas':
                    if (diasRestantes >= 0) return false;
                    break;
                case 'semana':
                    if (diasRestantes > 7 || diasRestantes < 0) return false;
                    break;
            }
        }
        
        // Filtro por texto (busca em título e descrição)
        if (criterios.busca) {
            const busca = criterios.busca.toLowerCase();
            const titulo = (demanda.titulo || '').toLowerCase();
            const descricao = (demanda.descricao || '').toLowerCase();
            
            if (!titulo.includes(busca) && !descricao.includes(busca)) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Ordena demandas por critério
 */
function ordenarDemandas(demandas, criterio = 'prazo', direcao = 'asc') {
    const demandasOrdenadas = [...demandas];
    
    demandasOrdenadas.sort((a, b) => {
        let valorA, valorB;
        
        switch(criterio) {
            case 'prazo':
                valorA = a.prazo ? new Date(a.prazo) : new Date('9999-12-31');
                valorB = b.prazo ? new Date(b.prazo) : new Date('9999-12-31');
                break;
                
            case 'criacao':
                valorA = new Date(a.criado_em);
                valorB = new Date(b.criado_em);
                break;
                
            case 'atualizacao':
                valorA = new Date(a.atualizado_em);
                valorB = new Date(b.atualizado_em);
                break;
                
            case 'titulo':
                valorA = (a.titulo || '').toLowerCase();
                valorB = (b.titulo || '').toLowerCase();
                break;
                
            case 'status':
                // Ordem personalizada: Pendente > Em andamento > Concluída
                const ordemStatus = {
                    'Pendente': 1,
                    'Em andamento': 2,
                    'Concluída': 3
                };
                valorA = ordemStatus[a.status] || 4;
                valorB = ordemStatus[b.status] || 4;
                break;
                
            default:
                return 0;
        }
        
        if (valorA < valorB) return direcao === 'asc' ? -1 : 1;
        if (valorA > valorB) return direcao === 'asc' ? 1 : -1;
        return 0;
    });
    
    return demandasOrdenadas;
}

/**
 * Calcula estatísticas das demandas
 */
function calcularEstatisticas(demandas) {
    const hoje = new Date();
    
    const estatisticas = {
        total: demandas.length,
        porStatus: {
            pendente: 0,
            em_andamento: 0,
            concluida: 0
        },
        porResponsavel: {
            supervisor: 0,
            escola: 0
        },
        porPrazo: {
            atrasadas: 0,
            vencem_hoje: 0,
            proximas_3_dias: 0,
            no_prazo: 0,
            sem_prazo: 0
        },
        porEscola: {}
    };
    
    demandas.forEach(demanda => {
        // Status
        if (demanda.status === 'Pendente') estatisticas.porStatus.pendente++;
        else if (demanda.status === 'Em andamento') estatisticas.porStatus.em_andamento++;
        else if (demanda.status === 'Concluída') estatisticas.porStatus.concluida++;
        
        // Responsável
        if (demanda.responsavel === 'Supervisor') estatisticas.porResponsavel.supervisor++;
        else if (demanda.responsavel === 'Escola(s)') estatisticas.porResponsavel.escola++;
        
        // Prazo
        if (!demanda.prazo) {
            estatisticas.porPrazo.sem_prazo++;
        } else {
            const prazo = new Date(demanda.prazo);
            const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
            
            if (diasRestantes < 0) {
                estatisticas.porPrazo.atrasadas++;
            } else if (diasRestantes === 0) {
                estatisticas.porPrazo.vencem_hoje++;
            } else if (diasRestantes <= 3) {
                estatisticas.porPrazo.proximas_3_dias++;
            } else {
                estatisticas.porPrazo.no_prazo++;
            }
        }
        
        // Por escola
        if (demanda.escolas) {
            const escolas = demanda.escolas.split(', ');
            escolas.forEach(escola => {
                estatisticas.porEscola[escola] = (estatisticas.porEscola[escola] || 0) + 1;
            });
        }
    });
    
    return estatisticas;
}

// ============================================
// FUNÇÕES DE FORMATAÇÃO PARA RELATÓRIOS
// ============================================

/**
 * Formata dados para exportação em CSV
 */
function formatarParaCSV(demandas) {
    if (!Array.isArray(demandas) || demandas.length === 0) {
        return 'Não há dados para exportar';
    }
    
    // Cabeçalhos
    const cabecalhos = [
        'ID',
        'Título',
        'Descrição',
        'Escolas',
        'Responsável',
        'Status',
        'Prazo',
        'Criado em',
        'Atualizado em',
        'E-mails Enviados',
        'Anexos'
    ];
    
    // Linhas de dados
    const linhas = demandas.map(demanda => {
        return [
            demanda.id || '',
            `"${(demanda.titulo || '').replace(/"/g, '""')}"`,
            `"${(demanda.descricao || '').replace(/"/g, '""')}"`,
            `"${(demanda.escolas || '').replace(/"/g, '""')}"`,
            demanda.responsavel || '',
            demanda.status || '',
            formatarDataParaExibicao(demanda.prazo) || '',
            formatarDataParaExibicao(demanda.criado_em) || '',
            formatarDataParaExibicao(demanda.atualizado_em) || '',
            demanda.emails_enviados ? 'Sim' : 'Não',
            demanda.anexos ? 'Sim' : 'Não'
        ].join(',');
    });
    
    return [cabecalhos.join(','), ...linhas].join('\n');
}

/**
 * Gera um resumo textual das estatísticas
 */
function gerarResumoEstatisticas(estatisticas) {
    const resumo = [];
    
    resumo.push(`📊 RESUMO DO SISTEMA`);
    resumo.push(`=====================`);
    resumo.push(``);
    resumo.push(`📋 Total de Demandas: ${estatisticas.total}`);
    resumo.push(``);
    resumo.push(`📈 Por Status:`);
    resumo.push(`  • Pendentes: ${estatisticas.porStatus.pendente}`);
    resumo.push(`  • Em andamento: ${estatisticas.porStatus.em_andamento}`);
    resumo.push(`  • Concluídas: ${estatisticas.porStatus.concluida}`);
    resumo.push(``);
    resumo.push(`👤 Por Responsável:`);
    resumo.push(`  • Supervisor: ${estatisticas.porResponsavel.supervisor}`);
    resumo.push(`  • Escola(s): ${estatisticas.porResponsavel.escola}`);
    resumo.push(``);
    resumo.push(`⏰ Por Prazo:`);
    resumo.push(`  • Atrasadas: ${estatisticas.porPrazo.atrasadas}`);
    resumo.push(`  • Vencem hoje: ${estatisticas.porPrazo.vencem_hoje}`);
    resumo.push(`  • Próximas 3 dias: ${estatisticas.porPrazo.proximas_3_dias}`);
    resumo.push(`  • No prazo: ${estatisticas.porPrazo.no_prazo}`);
    resumo.push(`  • Sem prazo: ${estatisticas.porPrazo.sem_prazo}`);
    
    return resumo.join('\n');
}

// Exportar funções para uso global
window.validarDadosDemanda = validarDadosDemanda;
window.formatarDadosParaEnvio = formatarDadosParaEnvio;
window.processarDadosRecebidos = processarDadosRecebidos;
window.formatarDataParaExibicao = formatarDataParaExibicao;
window.formatarEscolasParaExibicao = formatarEscolasParaExibicao;
window.processarInformacoesAnexos = processarInformacoesAnexos;
window.formatarTamanhoArquivo = formatarTamanhoArquivo;
window.gerarIdTemporario = gerarIdTemporario;
window.filtrarDemandas = filtrarDemandas;
window.ordenarDemandas = ordenarDemandas;
window.calcularEstatisticas = calcularEstatisticas;
window.formatarParaCSV = formatarParaCSV;
window.gerarResumoEstatisticas = gerarResumoEstatisticas;
