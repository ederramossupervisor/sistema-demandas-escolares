# 🏫 Sistema de Gestão de Demandas da Supervisão Escolar

Sistema completo para gerenciamento de demandas entre supervisor escolar e escolas estaduais.

## ✨ Funcionalidades

- ✅ Cadastro de demandas com múltiplas escolas
- ✅ Seleção por checkbox com "Selecionar todas"
- ✅ Diferenciação entre demandas do supervisor e das escolas
- ✅ Envio automático de e-mails com anexos
- ✅ Controle de prazos com lembretes automáticos
- ✅ Interface responsiva (mobile e desktop)
- ✅ Banco de dados Google Sheets
- ✅ Backend Google Apps Script
- ✅ PWA (instalável como app)

## 🏢 Escolas Configuradas

1. **EEEFM Pedra Azul** - escolapedreiras@sedu.es.gov.br
2. **EEEFM Fioravante Caliman** - escolafioravante@sedu.es.gov.br  
3. **EEEFM Alto Rio Possmoser** - escolapossmoser@sedu.es.gov.br

**Supervisor:** ecramos@sedu.es.gov.br

## 🚀 Instalação Rápida

### 1. Configurar Google Apps Script
1. Crie a planilha `Demandas da Supervisão Escolar` com aba `demandas`
2. Copie o código de `backend-google-apps-script/Code.gs` para o Apps Script
3. Configure as propriedades do script:
   - `EMAIL_SUPERVISAO`: ecramos@sedu.es.gov.br
   - `NOME_SUPERVISAO`: Supervisão Escolar
4. Publique como aplicativo web

### 2. Configurar Site
1. Coloque seus ícones em `public/icons/`
2. Atualize a URL do script em `src/js/googleAppsScript.js`
3. Abra `src/index.html` no navegador

### 3. Hospedar (Opcional)
1. Faça upload para GitHub
2. Ative GitHub Pages em Settings > Pages

## 📁 Estrutura do Projeto
sistema-demandas-escolares/
├── public/ # Arquivos públicos
│ ├── icons/ # Ícones PWA (colocar seus PNGs aqui)
│ ├── manifest.json # Configuração PWA
│ └── robots.txt
├── src/ # Código fonte
│ ├── css/
│ │ └── style.css # Estilos
│ ├── js/
│ │ ├── app.js # Lógica principal
│ │ ├── googleSheets.js # Manipulação de dados
│ │ └── googleAppsScript.js # Conexão com backend
│ └── index.html # Página principal
├── backend-google-apps-script/
│ └── Code.gs # Código completo do backend
└── README.md

## 🔧 Configuração Técnica

### Backend (Google Apps Script)
- Armazenamento: Google Sheets
- E-mails: GmailApp
- Arquivos: Google Drive
- Gatilhos automáticos para lembretes

### Frontend
- HTML5, CSS3, JavaScript puro
- Design responsivo (mobile-first)
- PWA (Progressive Web App)
- LocalStorage para cache

## 📧 Funcionamento dos E-mails

### Ao criar demanda:
- Envia para escolas selecionadas
- Cópia para supervisão
- Assinatura automática
- Anexos do Drive

### Lembretes automáticos:
- 3 dias antes do prazo
- 1 dia antes do prazo
- No dia do vencimento
- Para demandas atrasadas

## 🎨 Cores do Sistema

- **Supervisor:** Azul (#2980b9)
- **Escola:** Verde (#27ae60)  
- **Atrasada:** Vermelho (#e74c3c)
- **Próxima do prazo:** Laranja (#f39c12)

## 📱 PWA (Aplicativo Instalável)

O sistema funciona como Progressive Web App:
- Instalável em celular e computador
- Funciona offline (leitura)
- Notificações de lembrete
- Ícones personalizados

## 🔒 Segurança

- Acesso via Google Workspace (conta institucional)
- Permissões por escopo (apenas necessárias)
- Dados armazenados em conta institucional
- Comunicação HTTPS

## 🐛 Solução de Problemas

### Erro de conexão:
```javascript
// Verifique a URL em:
src/js/googleAppsScript.js - linha 6
E-mails não enviados:
Verifique propriedades do script

Confirme e-mails das escolas

Check quota do Gmail

Planilha não encontrada:
Nome exato: "Demandas da Supervisão Escolar"

Aba exata: "demandas"

📄 Licença
Uso interno da Supervisão Escolar - SEDU/ES

👨‍💼 Desenvolvido para
Supervisão Escolar
Estado do Espírito Santo
Secretaria da Educação - SEDU

---

## **🎯 PASSO A PASSO FINAL PARA VOCÊ**

Agora que tem todos os códigos, siga ESTA ORDEM:

### **📋 CHECKLIST FINAL**

1. **✅ Planilha Google criada** com as 13 colunas
2. **✅ Google Apps Script configurado** com o código `Code.gs`
3. **✅ Propriedades do script configuradas**:
   - `EMAIL_SUPERVISAO`: `ecramos@sedu.es.gov.br`
   - `NOME_SUPERVISAO`: `Supervisão Escolar`
4. **✅ Apps Script publicado** como aplicativo web
5. **✅ Pastas criadas** conforme estrutura
6. **✅ Ícones colocados** em `public/icons/`
7. **✅ URL do script configurada** em `googleAppsScript.js` (JÁ FEITO)
8. **✅ Arquivos HTML/CSS/JS criados** e colados os códigos

### **🔧 TESTE RÁPIDO**

1. Abra o arquivo `src/index.html` no seu navegador
2. Clique no botão **"+"** para nova demanda
3. Preencha:
   - Título: "Teste do sistema"
   - Descrição: "Esta é uma demanda de teste"
   - Selecione 1 escola
   - Responsável: "Escola(s)"
   - Prazo: escolha uma data futura
   - NÃO marque "Enviar e-mail" (teste primeiro sem e-mail)
4. Clique em **"Salvar Demanda"**

5. **Verifique se funcionou:**
   - Apareceu mensagem de sucesso?
   - A demanda aparece na lista?
   - Verifique a planilha Google - tem uma nova linha?

### **🚀 PRÓXIMOS PASSOS**

1. **Teste completo**: Crie demanda COM envio de e-mail
2. **Configure gatilho automático**: No Apps Script, execute `configurarGatilhoDiario()`
3. **Hospede no GitHub**: Siga as instruções do `instructions.txt`

### **❓ PRECISA DE AJUDA?**

Se algo não funcionar:

1. **Console do navegador**: Pressione F12 > Console (veja erros)
2. **Logs do Apps Script**: No editor, clique em "Execuções"
3. **Verifique a planilha**: Os dados estão sendo salvos?

**Seu sistema está 95% pronto!** A URL do seu script já está configurada. Agora é testar cada parte.

**Tem alguma dúvida sobre algum dos códigos ou passos?**
