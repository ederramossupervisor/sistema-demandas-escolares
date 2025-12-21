// teste-integracao-rapido.js
async function testarIntegracaoCompleta() {
    console.log('🧪 TESTE COMPLETO DA INTEGRAÇÃO');
    console.log('='.repeat(50));
    
    // 1. Testar conexão
    console.log('🔗 1. Testando conexão...');
    const conexao = await window.BackendIntegracao.testarConexao();
    console.log('   Resultado:', conexao.sucesso ? '✅ SUCESSO' : '❌ FALHA');
    if (!conexao.sucesso) console.log('   Erro:', conexao.erro);
    
    // 2. Verificar usuário logado
    console.log('\n👤 2. Verificando usuário logado...');
    const usuario = window.BackendIntegracao._obterUsuarioLogado();
    console.log('   Usuário:', usuario ? usuario.nome : 'Não logado');
    
    // 3. Testar listagem de demandas (se logado)
    if (usuario) {
        console.log('\n📋 3. Testando listagem de demandas...');
        const demandas = await window.BackendIntegracao.listarDemandas();
        console.log('   Resultado:', demandas.sucesso ? '✅ SUCESSO' : '❌ FALHA');
        console.log('   Total de demandas:', demandas.total);
    }
    
    // 4. Verificar status geral
    console.log('\n📊 4. Status do sistema:');
    const status = window.BackendIntegracao.getStatus();
    console.log('   Conectado:', status.conectado ? '✅ SIM' : '❌ NÃO');
    console.log('   URL backend:', status.urlBackend);
    console.log('   Usuário logado:', status.usuarioLogado ? '✅ SIM' : '❌ NÃO');
    
    console.log('\n' + '='.repeat(50));
    console.log('🧪 TESTE CONCLUÍDO');
    
    return {
        conexao,
        usuario,
        status
    };
}

// Adicionar ao window para testar via console
window.testarIntegracaoCompleta = testarIntegracaoCompleta;

console.log('🔧 Teste rápido carregado! Use testarIntegracaoCompleta() no console.');
