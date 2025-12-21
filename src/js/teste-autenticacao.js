// src/js/teste-autenticacao.js
/**
 * TESTE DA AUTENTICAÇÃO INTEGRADA
 */

async function testarAutenticacaoIntegrada() {
    console.log('🧪 TESTE DA AUTENTICAÇÃO INTEGRADA');
    console.log('='.repeat(50));
    
    // Verificar se o sistema está carregado
    console.log('1. Verificando sistemas carregados...');
    console.log('   • BackendIntegracao:', window.BackendIntegracao ? '✅' : '❌');
    console.log('   • AutenticacaoIntegrada:', window.AutenticacaoIntegrada ? '✅' : '❌');
    
    if (!window.BackendIntegracao) {
        console.error('❌ BackendIntegracao não carregado!');
        return;
    }
    
    // Testar conexão com o backend
    console.log('\n2. Testando conexão com backend...');
    const conexao = await window.BackendIntegracao.testarConexao();
    console.log('   Resultado:', conexao.sucesso ? '✅ CONECTADO' : '❌ FALHA');
    console.log('   Dados:', conexao.dados?.sistema || 'N/A');
    
    // Testar login de exemplo (usar dados de teste)
    console.log('\n3. Testando processo de login...');
    console.log('   Email de teste: teste@teste.com');
    console.log('   Senha: 123456');
    
    // Simular preenchimento do formulário
    const emailInput = document.getElementById('login-email');
    const senhaInput = document.getElementById('login-senha');
    
    if (emailInput && senhaInput) {
        emailInput.value = 'teste@teste.com';
        senhaInput.value = '123456';
        console.log('   ✅ Formulário preenchido para teste');
    }
    
    // Verificar localStorage
    console.log('\n4. Verificar localStorage...');
    const usuarioSalvo = localStorage.getItem('usuario_demandas');
    console.log('   Usuário salvo:', usuarioSalvo ? '✅ SIM' : '❌ NÃO');
    
    if (usuarioSalvo) {
        try {
            const usuario = JSON.parse(usuarioSalvo);
            console.log('   Nome:', usuario.nome);
            console.log('   Tipo:', usuario.tipo_usuario);
            console.log('   Escola:', usuario.escola_sre);
        } catch (e) {
            console.error('   Erro ao ler usuário:', e);
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🧪 TESTE CONCLUÍDO');
    
    console.log('\n💡 INSTRUÇÕES:');
    console.log('1. Use email/senha válidos do sistema');
    console.log('2. Clique em "Entrar" ou use AutenticacaoIntegrada._realizarLogin()');
    console.log('3. Verifique redirecionamento para index.html');
    
    return { conexao, usuario: usuarioSalvo };
}

// Adicionar comandos úteis ao console
window.testarAutenticacao = testarAutenticacaoIntegrada;
window.limparLogin = function() {
    localStorage.removeItem('usuario_demandas');
    sessionStorage.removeItem('usuario_demandas');
    console.log('🧹 Login limpo! Recarregue a página.');
};

console.log('🔧 Teste de autenticação carregado! Use testarAutenticacao() no console.');
