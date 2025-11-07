# 🚀 Guia de Início Rápido

## ✅ Status Atual

- ✅ Servidor rodando em: http://localhost:3001
- ✅ Backend funcionando
- ✅ OpenAI configurado
- ⏳ WhatsApp aguardando conexão

## 📱 Próximos Passos

### 1. Ver o QR Code do WhatsApp

O QR Code deve estar sendo exibido no terminal onde você executou `npm start`.

**Se não está vendo o QR Code:**
- Olhe na janela do terminal onde o servidor está rodando
- O QR Code aparece como caracteres ASCII no terminal

### 2. Conectar o WhatsApp

1. Abra o WhatsApp no seu celular
2. Toque em **⋮** (menu) ou vá em **Configurações**
3. Toque em **Aparelhos Conectados**
4. Toque em **Conectar um Aparelho**
5. Escaneie o QR Code exibido no terminal
6. Aguarde a confirmação de conexão

### 3. Acessar o Painel

Abra seu navegador e acesse:
```
http://localhost:3001
```

### 4. Começar a Usar!

Envie mensagens para o seu WhatsApp (do próprio número conectado):

**Exemplos:**
```
Gastei R$ 45 no supermercado
Paguei 150 da conta de luz
Recebi 3000 de salário
Almoço foi 35 reais
```

**Comandos:**
```
resumo - Ver resumo completo
ajuda - Ver lista de comandos
```

## 🎯 Funcionalidades do Painel

- 📊 **Dashboard**: Gráficos e resumo financeiro
- 💳 **Transações**: Lista completa com filtros
- 🔔 **Alertas**: Notificações inteligentes

## 🔄 Como Reiniciar o Servidor

Se precisar reiniciar o servidor:

1. **Parar o servidor**: Pressione `Ctrl+C` no terminal
2. **Iniciar novamente**:
```bash
cd /Users/ronaldodiasdesousa/Desktop/agentefinanceiro
npm start
```

## 📞 Verificar Status

### Status do Servidor
```bash
curl http://localhost:3001/api/health
```

### Status do WhatsApp
```bash
curl http://localhost:3001/api/whatsapp/status
```

## 🐛 Problemas Comuns

### QR Code não aparece
- Reinicie o servidor
- Delete a pasta `auth_info_baileys` e reinicie
- Verifique se a porta 3001 não está em uso

### Erro de API Key
- Verifique se o arquivo `.env` existe
- Confirme se a API Key está correta

### WhatsApp desconecta
- É normal após algumas horas de inatividade
- Basta reconectar escaneando o QR Code novamente

## 💡 Dicas

1. **Mantenha o servidor rodando**: Deixe o terminal aberto
2. **Seja específico**: "Gastei R$ 50 no mercado" é melhor que "gastei dinheiro"
3. **Use categorias**: Alimentação, Transporte, Moradia, etc.
4. **Consulte o painel**: Acesse regularmente para ver seus gráficos

## 🎉 Pronto!

Seu Agente Financeiro está funcionando!

**Acesse agora:** http://localhost:3001

