// ============================================
// admin.js - COMUNICAÇÃO DO PAINEL DO SUPERVISOR
// Compatível com sistema existente
// ============================================

const AdminSystem = {
    /**
     * Testa a conexão com o servidor
     */
    async testarConexao() {
        try {
            if (window.testarConexao) {
                return await window.testarConexao();
            }
            
            // Fallback usando googleAppsScript
            if (window.enviarParaGoogleAppsScript) {
                const resultado = await window.enviarParaGoogleAppsScript({
                    acao: 'testarConexao'
                });
                return {
                    online: true,
                    dados: resultado
                };
            }
            
            throw new Error('Função de teste não disponível');
            
        } catch (erro) {
            console.error('❌ Erro no teste de conexão:', erro);
            return {
                online: false,
                erro: erro.message
            };
        }
    },

    /**
     * Lista solicitações pendentes
     */
    async listarSolicitacoesPendentes() {
        console.log('📋 Listando solicitações pendentes...');
        
        try {
            if (window.enviarParaGoogleAppsScript) {
                const resultado = await window.enviarParaGoogleAppsScript({
                    acao: 'listarSolicitacoesPendentes'
                });
                
                console.log('✅ Solicitações recebidas:', resultado);
                return resultado;
            }
            
            throw new Error('Função não disponível');
            
        } catch (erro) {
            console.error('❌ Erro ao listar solicitações:', erro);
            return {
                sucesso: false,
                solicitacoes: [],
                erro: erro.message
            };
        }
    },

    /**
     * Lista usuários cadastrados
     */
    async listarUsuarios() {
        console.log('👥 Listando usuários...');
        
        try {
            if (window.enviarParaGoogleAppsScript) {
                const resultado = await window.enviarParaGoogleAppsScript({
                    acao: 'listarUsuarios'
                });
                
                console.log('✅ Usuários recebidos:', resultado);
                return resultado;
            }
            
            throw new Error('Função não disponível');
            
        } catch (erro) {
            console.error('❌ Erro ao listar usuários:', erro);
            return {
                sucesso: false,
                usuarios: [],
                erro: erro.message
            };
        }
    },

    /**
     * Autoriza um novo usuário
     */
    async autorizarUsuario(email, nome, tipo, departamento, escola, senha) {
        console.log('✅ Autorizando usuário:', email);
        
        try {
            if (window.enviarParaGoogleAppsScript) {
                const resultado = await window.enviarParaGoogleAppsScript({
                    acao: 'autorizarUsuario',
                    email: email,
                    nome: nome || 'Usuário',
                    tipo_usuario: tipo,
                    departamento: departamento,
                    escola_sre: escola,
                    senha: senha
                });
                
                console.log('✅ Usuário autorizado:', resultado);
                return resultado;
            }
            
            throw new Error('Função não disponível');
            
        } catch (erro) {
            console.error('❌ Erro ao autorizar usuário:', erro);
            return {
                sucesso: false,
                erro: erro.message
            };
        }
    },

    /**
     * Altera dados de um usuário
     */
    async alterarUsuario(email, tipo, departamento, escola, senha) {
        console.log('✏️ Alterando usuário:', email);
        
        try {
            const dados = {
                acao: 'alterarUsuario',
                email: email,
                tipo_usuario: tipo,
                departamento: departamento,
                escola_sre: escola
            };
            
            if (senha && senha.trim() !== '') {
                dados.senha = senha;
            }
            
            if (window.enviarParaGoogleAppsScript) {
                const resultado = await window.enviarParaGoogleAppsScript(dados);
                return resultado;
            }
            
            throw new Error('Função não disponível');
            
        } catch (erro) {
            console.error('❌ Erro ao alterar usuário:', erro);
            return {
                sucesso: false,
                erro: erro.message
            };
        }
    },

    /**
     * Recusa uma solicitação
     */
    async recusarSolicitacao(email) {
        console.log('❌ Recusando solicitação:', email);
        
        try {
            if (window.enviarParaGoogleAppsScript) {
                const resultado = await window.enviarParaGoogleAppsScript({
                    acao: 'recusarSolicitacao',
                    email: email
                });
                
                return resultado;
            }
            
            throw new Error('Função não disponível');
            
        } catch (erro) {
            console.error('❌ Erro ao recusar solicitação:', erro);
            return {
                sucesso: false,
                erro: erro.message
            };
        }
    },

    /**
     * Reseta senha de um usuário
     */
    async resetarSenha(email, senha) {
        console.log('🔑 Resetando senha para:', email);
        
        try {
            if (window.enviarParaGoogleAppsScript) {
                const resultado = await window.enviarParaGoogleAppsScript({
                    acao: 'resetarSenha',
                    email: email,
                    senha: senha
                });
                
                return resultado;
            }
            
            throw new Error('Função não disponível');
            
        } catch (erro) {
            console.error('❌ Erro ao resetar senha:', erro);
            return {
                sucesso: false,
                erro: erro.message
            };
        }
    },

    /**
     * Formata data para exibição
     */
    formatarData(dataString) {
        if (!dataString) return 'N/A';
        
        try {
            const data = new Date(dataString);
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (erro) {
            return dataString;
        }
    },

    /**
     * Gera senha aleatória
     */
    gerarSenhaAleatoria() {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let senha = '';
        
        for (let i = 0; i < 8; i++) {
            senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        
        return senha;
    },

    /**
     * Verifica se usuário é supervisor
     */
    verificarPermissao() {
        try {
            const usuarioSalvo = localStorage.getItem('usuario_demandas');
            if (!usuarioSalvo) {
                return false;
            }
            
            const usuario = JSON.parse(usuarioSalvo);
            return usuario.tipo_usuario === 'supervisor';
            
        } catch (erro) {
            console.error('❌ Erro ao verificar permissão:', erro);
            return false;
        }
    },

    /**
     * Mostra toast (compatível com sistema existente)
     */
    mostrarToast(titulo, mensagem, tipo = 'info') {
        if (window.mostrarToast) {
            window.mostrarToast(titulo, mensagem, tipo);
        } else {
            // Fallback simples
            alert(`${titulo}: ${mensagem}`);
        }
    }
};

// Exportar para uso global
window.AdminSystem = AdminSystem;
console.log('✅ AdminSystem carregado!');
