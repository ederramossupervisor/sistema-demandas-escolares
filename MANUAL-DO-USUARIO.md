# 📖 MANUAL DO USUÁRIO - SISTEMA DE DEMANDAS

## ÍNDICE
1. [Acesso ao Sistema](#acesso)
2. [Tela Inicial](#tela-inicial)
3. [Criar Nova Demanda](#criar-demanda)
4. [Gerenciar Demandas](#gerenciar)
5. [Filtros e Buscas](#filtros)
6. [E-mails Automáticos](#emails)
7. [Prazos e Lembretes](#prazos)
8. [Anexos](#anexos)
9. [Dúvidas Frequentes](#duvidas)

---

## 1. 🚪 ACESSO AO SISTEMA <a name="acesso"></a>

### Pelo Computador:
1. Abra o link do sistema no navegador
2. Faça login com sua conta @sedu.es.gov.br
3. O sistema carrega automaticamente

### Como App (PWA):
1. No Chrome/Edge, clique em "Instalar app" no canto superior direito
2. Ou clique no botão "Instalar" que aparece no sistema
3. O app será instalado no seu celular/computador

---

## 2. 🏠 TELA INICIAL <a name="tela-inicial"></a>

![Tela Inicial](screenshots/tela-inicial.png)

### Elementos principais:
- **Barra superior**: Logo e informações do usuário
- **Filtros**: Selecione escola, responsável, status ou prazo
- **Estatísticas**: Veja totais de demandas
- **Lista de demandas**: Todas as demandas em cartões coloridos
- **Botão "+"**: Cria nova demanda (flutuante)

### Cores das demandas:
- 🔵 **Azul**: Demandas do Supervisor
- 🟢 **Verde**: Demandas das Escolas  
- 🔴 **Vermelho**: Demandas atrasadas
- 🟠 **Laranja**: Demandas próximas do prazo

---

## 3. ✨ CRIAR NOVA DEMANDA <a name="criar-demanda"></a>

### Passo a passo:
1. Clique no botão **"+"** (canto inferior direito)
2. Preencha os campos:

#### 📋 **Aba "Informações Principais"**
- **Título**: Nome claro da demanda (obrigatório)
- **Descrição**: Detalhes do que precisa ser feito (obrigatório)
- **Escolas**: Selecione uma ou mais escolas (use "Selecionar todas")
- **Responsável**: Quem executará (Supervisor ou Escola(s))
- **Prazo**: Data limite (obrigatório)

#### 📧 **Aba "Configuração de E-mail"**
- Marque "Enviar e-mail automático" se quiser notificar
- Digite uma mensagem adicional (opcional)

#### 📎 **Aba "Anexos"**
- Arraste arquivos ou clique para selecionar
- Formatos: PDF, Word, Excel, PowerPoint, imagens
- Tamanho máximo: 10MB por arquivo

3. Clique em **"Salvar Demanda"**

---

## 4. 🛠️ GERENCIAR DEMANDAS <a name="gerenciar"></a>

### Visualizar detalhes:
- Clique em qualquer demanda na lista
- Veja todas as informações, histórico e anexos

### Alterar status:
Na tela de detalhes, clique em:
- **"Iniciar"**: Muda para "Em andamento"
- **"Concluir"**: Muda para "Concluída"
- **"Reenviar E-mail"**: Envia e-mail novamente

### Atualizar dados:
- Use o botão **"Atualizar"** (setas circulares)
- Ou pressione **F5** no teclado

---

## 5. 🔍 FILTROS E BUSCAS <a name="filtros"></a>

### Filtros disponíveis:
1. **Por Escola**: Selecione uma escola específica
2. **Por Responsável**: Supervisor ou Escola(s)
3. **Por Status**: Pendente, Em andamento ou Concluída
4. **Por Prazo**:
   - Vencem hoje
   - Próximos 3 dias
   - Atrasadas

### Limpar filtros:
- Clique no botão **"Limpar Filtros"**

### Ordenação:
- As demandas são sempre ordenadas por prazo (mais próximas primeiro)

---

## 6. 📧 E-MAILS AUTOMÁTICOS <a name="emails"></a>

### Quando são enviados:
1. **Ao criar demanda** (se marcada a opção)
2. **Lembretes automáticos** (configurados no sistema)

### Destinatários:
- Escolas selecionadas na demanda
- Cópia para: ecramos@sedu.es.gov.br

### Conteúdo do e-mail:
- Assunto: [DEMANDA] + título
- Corpo: Descrição completa, escolas, responsável, prazo
- Anexos: Links para os arquivos no Drive
- Assinatura automática da Supervisão

---

## 7. ⏰ PRAZOS E LEMBRETES <a name="prazos"></a>

### Lembretes automáticos:
O sistema envia e-mails automaticamente:
- 📅 **3 dias antes** do prazo
- ⏳ **1 dia antes** do prazo
- 🚨 **No dia** do vencimento
- ❌ **Para demandas atrasadas**

### Quem recebe os lembretes:
- Se a demanda for **da escola** → e-mail da escola
- Se for **do supervisor** → e-mail do supervisor

### Cores na interface:
- 🟢 **Verde**: No prazo (mais de 3 dias)
- 🟠 **Laranja**: Próxima do prazo (1-3 dias)
- 🔴 **Vermelho**: Atrasada ou vence hoje

---

## 8. 📎 ANEXOS <a name="anexos"></a>

### Formatos suportados:
- Documentos: PDF, DOC, DOCX
- Planilhas: XLS, XLSX
- Apresentações: PPT, PPTX
- Imagens: JPG, PNG

### Como adicionar:
1. Na aba "Anexos" do formulário
2. Arraste os arquivos para a área pontilhada
3. Ou clique para selecionar

### Limitações:
- Tamanho máximo: 10MB por arquivo
- Os arquivos são salvos no Google Drive
- Links são compartilhados com acesso público

### Como visualizar:
- Na tela de detalhes da demanda
- Clique no nome do arquivo para abrir

---

## 9. ❓ DÚVIDAS FREQUENTES <a name="duvidas"></a>

### ❓ Não consigo acessar o sistema
**Solução**: 
1. Verifique sua conexão com a internet
2. Certifique-se de estar logado com conta @sedu
3. Tente abrir em navegador diferente

### ❓ Os e-mails não estão sendo enviados
**Solução**:
1. Verifique se marcou a opção "Enviar e-mail"
2. Confira se selecionou pelo menos uma escola
3. Verifique sua caixa de spam

### ❓ Não consigo anexar arquivos
**Solução**:
1. Verifique o tamanho do arquivo (máx. 10MB)
2. Confira o formato (só os listados acima)
3. Tente renomear o arquivo (sem caracteres especiais)

### ❓ A demanda não aparece na lista
**Solução**:
1. Clique no botão "Atualizar"
2. Verifique os filtros ativos
3. Limpe os filtros com "Limpar Filtros"

### ❓ Como instalar como app no celular?
**Solução**:
1. Abra no Chrome no celular
2. Toque no menu (três pontos)
3. Selecione "Adicionar à tela inicial"
4. O app será instalado

---

## 📞 SUPORTE

### Em caso de problemas:
1. **Verifique os logs**: Pressione F12 > Console
2. **Contate o administrador**: ecramos@sedu.es.gov.br
3. **Forneça informações**:
   - O que estava tentando fazer
   - Mensagem de erro (se houver)
   - Data e hora do problema

### Horário de funcionamento:
- Sistema: 24 horas
- Suporte técnico: Dias úteis, 8h às 18h

---

## 🆕 ATUALIZAÇÕES

O sistema é atualizado automaticamente. Quando houver nova versão:
1. Uma notificação aparecerá
2. Clique em "Atualizar" para aplicar
3. Ou recarregue a página (F5)

---

**Última atualização**: Janeiro 2024  
**Versão do sistema**: 1.0  
**Desenvolvido para**: Supervisão Escolar SEDU/ES
