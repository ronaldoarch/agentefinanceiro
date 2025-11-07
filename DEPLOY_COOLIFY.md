# 🚀 Deploy no Coolify - Guia Completo

## ✅ PREPARADO PARA COOLIFY!

Criei todos os arquivos necessários para deploy no Coolify.

---

## 📁 **Arquivos Criados:**

1. ✅ **Dockerfile** - Configuração do container
2. ✅ **docker-compose.yml** - Orquestração
3. ✅ **.dockerignore** - Arquivos a ignorar

---

## 🎯 **DEPLOY NO COOLIFY - Passo a Passo:**

### **1. Criar Repositório Git (se ainda não fez):**

```bash
cd /Users/ronaldodiasdesousa/Desktop/agentefinanceiro
git init
git add .
git commit -m "Agente Financeiro - Primeira versão"
```

### **2. Subir para GitHub/GitLab:**

**GitHub:**
```bash
# Crie um repositório em github.com
git remote add origin https://github.com/seu-usuario/agente-financeiro.git
git branch -M main
git push -u origin main
```

**OU GitLab:**
```bash
# Crie um repositório em gitlab.com
git remote add origin https://gitlab.com/seu-usuario/agente-financeiro.git
git branch -M main
git push -u origin main
```

### **3. No Coolify:**

#### 3.1 - Criar Novo Projeto
- Clique em **"+ New Resource"**
- Selecione **"Application"**

#### 3.2 - Conectar Repositório
- Source: **GitHub** ou **GitLab**
- Repository: Selecione **agente-financeiro**
- Branch: **main**

#### 3.3 - Configurar Build
- Build Pack: **Docker**
- Dockerfile: `Dockerfile` (padrão)
- Port: **3005**

#### 3.4 - Variáveis de Ambiente
Adicione estas variáveis no Coolify:

```env
OPENAI_API_KEY=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
PORT=3005
DB_PATH=/app/data/database.sqlite
ALERTA_GASTO_ALTO=500
ALERTA_LIMITE_MENSAL=3000
```

#### 3.5 - Volumes Persistentes
Configure volumes para não perder dados:
- `/app/data` → Banco de dados
- `/app/auth_info_baileys` → Sessão WhatsApp

#### 3.6 - Deploy!
- Clique em **"Deploy"**
- Aguarde o build completar

---

## 📱 **Após Deploy no Coolify:**

### 1. Acesse a URL do Coolify
Exemplo: `https://agente-financeiro.seudominio.com`

### 2. Vá na aba WhatsApp
Clique em **📱 WhatsApp**

### 3. Conecte!
- Clique em **"Conectar WhatsApp"**
- **O QR CODE VAI APARECER!** (IP diferente, sem bloqueio)
- Escaneie com +55 62 9507-3443

---

## ⚙️ **Configurações Importantes no Coolify:**

### Health Check:
- Path: `/api/health`
- Port: `3005`

### Logs:
- Habilite logs para ver o QR Code no terminal do Coolify

### Restart Policy:
- `unless-stopped` (já configurado no docker-compose)

---

## 🔒 **Segurança no Coolify:**

### HTTPS Automático:
- Coolify configura SSL automaticamente
- Seu painel ficará em `https://...`

### Firewall:
- Coolify gerencia firewall
- Porta 3005 exposta automaticamente

### Backups:
- Configure backups automáticos no Coolify
- Protege banco de dados e sessão WhatsApp

---

## 🎯 **Vantagens do Coolify:**

✅ **IP Diferente** - Sem bloqueio do WhatsApp  
✅ **Sempre Online** - Servidor 24/7  
✅ **HTTPS** - Conexão segura automática  
✅ **Logs Centralizados** - Ver QR Code fácil  
✅ **Backups** - Dados protegidos  
✅ **Escalável** - Fácil de atualizar  

---

## 📊 **Estrutura no Coolify:**

```
Coolify
  └── agente-financeiro
        ├── Container Docker
        ├── Volumes:
        │   ├── /app/data (banco)
        │   └── /app/auth_info_baileys (sessão)
        ├── Env Variables
        └── Domain/SSL
```

---

## 🔄 **Atualizações Futuras:**

Para atualizar o código:
```bash
git add .
git commit -m "Atualização"
git push
```

No Coolify: **Re-deploy** automático ou manual

---

## 🆘 **Troubleshooting no Coolify:**

### Ver Logs:
- Dashboard → Logs
- Procure por: `📱 QR CODE GERADO!`

### Reiniciar Container:
- Dashboard → Restart

### Acessar Terminal:
- Dashboard → Console
- Execute comandos dentro do container

---

## 💡 **DICA PRO:**

Após conectar o WhatsApp no Coolify:
1. A sessão fica salva no volume
2. Mesmo reiniciando, mantém conectado
3. Não precisa escanear QR Code novamente

---

## 📞 **Comandos Úteis no Coolify:**

### Ver QR Code nos logs:
```
Logs → Buscar "QR CODE"
```

### Resetar WhatsApp:
```
Console → rm -rf /app/auth_info_baileys
Restart
```

### Backup manual:
```
Console → cp /app/data/database.sqlite /app/data/backup.sqlite
```

---

## ✅ **CHECKLIST DE DEPLOY:**

- [ ] Criar repositório Git
- [ ] Fazer commit de todos arquivos
- [ ] Push para GitHub/GitLab
- [ ] Criar projeto no Coolify
- [ ] Configurar variáveis de ambiente
- [ ] Configurar volumes
- [ ] Deploy
- [ ] Acessar URL do Coolify
- [ ] Aba WhatsApp → Conectar
- [ ] Escanear QR Code
- [ ] ✅ Funcionando!

---

## 🎊 **RESULTADO:**

Com Coolify você terá:
- ✅ WhatsApp funcionando (sem bloqueio)
- ✅ Sistema online 24/7
- ✅ Acesso de qualquer lugar
- ✅ HTTPS automático
- ✅ Backups configuráveis

---

**Siga este guia e seu Agente Financeiro estará online em 10 minutos! 🚀**

**URL do projeto:** Será algo como `https://agente-financeiro.seu-coolify.com`

