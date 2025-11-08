# 💾 Como Configurar Volumes no Coolify

## 🎯 Por que Volumes são Importantes?

Sem volumes, ao fazer redeploy você perde:
- ❌ Todo o banco de dados (todas as transações)
- ❌ A sessão do WhatsApp (precisa escanear QR code novamente)
- ❌ Todas as configurações salvas

Com volumes configurados:
- ✅ Dados preservados entre deploys
- ✅ WhatsApp mantém conectado
- ✅ Histórico completo de transações

---

## 📋 Passo a Passo no Coolify

### Interface Antiga do Coolify:

1. **Acesse seu Application no Coolify**

2. **Procure por "Volumes" ou "Storage" ou "Persistent Storage"**
   - Geralmente fica na aba lateral ou no menu da aplicação

3. **Clique em "+ Add Volume" ou "Add Storage"**

4. **Adicione o primeiro volume (Banco de Dados):**
   ```
   Source: agente-data (ou deixe vazio para criar automaticamente)
   Destination: /app/data
   Type: Volume (não bind mount)
   ```

5. **Adicione o segundo volume (WhatsApp):**
   ```
   Source: agente-auth (ou deixe vazio para criar automaticamente)
   Destination: /app/auth_info_baileys
   Type: Volume (não bind mount)
   ```

6. **Salve e faça Redeploy**

---

### Interface Nova do Coolify (v4+):

1. **Acesse seu Application**

2. **Vá em "Configuration" → "Storage"**

3. **Clique em "Add"**

4. **Volume 1 - Banco de Dados:**
   - **Name:** `database`
   - **Mount Path:** `/app/data`
   - **Host Path:** deixe vazio (Coolify cria automaticamente)
   - Clique em **Save**

5. **Volume 2 - WhatsApp:**
   - **Name:** `whatsapp-session`
   - **Mount Path:** `/app/auth_info_baileys`
   - **Host Path:** deixe vazio
   - Clique em **Save**

6. **Redeploy** a aplicação

---

## 🔍 Verificando se Funcionou

Após o redeploy com volumes configurados:

### 1. Acesse o Terminal do Coolify

Na interface do Coolify: **Terminal** ou **Console**

### 2. Execute estes comandos:

```bash
# Verificar se o diretório de dados existe
ls -la /app/data

# Deve mostrar algo como:
# drwxrwxrwx 2 root root 4096 Nov 8 10:00 data
```

```bash
# Verificar se o banco foi criado
ls -la /app/data/

# Deve mostrar:
# -rw-r--r-- 1 root root 12288 Nov 8 10:00 database.sqlite
```

```bash
# Verificar permissões
stat /app/data

# Deve mostrar:
# Access: (0777/drwxrwxrwx)
```

---

## 🎨 Capturas de Tela do Coolify

### Onde Encontrar Volumes:

```
Seu App no Coolify
  └── Configuration
        ├── General
        ├── Environment Variables
        ├── Build
        └── Storage/Volumes  ← AQUI!
```

### Como Deve Ficar:

```
Storage / Volumes:

📁 Volume 1
   Name: database (ou agente-data)
   Mount: /app/data
   [Delete]

📁 Volume 2
   Name: whatsapp-session (ou agente-auth)
   Mount: /app/auth_info_baileys
   [Delete]
```

---

## ⚠️ Problemas Comuns

### "Não encontro onde adicionar volumes"

**Solução:**
- Procure por: "Storage", "Volumes", "Persistent Storage", "Mounts"
- Se não encontrar, talvez sua versão do Coolify use docker-compose.yml
- Neste caso, os volumes já estão configurados no arquivo!

### "Os dados ainda somem ao fazer redeploy"

**Verificar:**
1. Os volumes estão realmente salvos? (Clique em Save após adicionar)
2. O caminho está correto? (`/app/data` não `/data`)
3. A variável `DB_PATH` aponta para `/app/data/database.sqlite`?

### "Erro de permissão ao escrever no volume"

**Solução:**
```bash
# No terminal do Coolify
chmod -R 777 /app/data
chmod -R 777 /app/auth_info_baileys
```

---

## 📊 Configuração Completa

Seu `docker-compose.yml` já tem os volumes configurados:

```yaml
volumes:
  - agente-data:/app/data
  - agente-auth:/app/auth_info_baileys

volumes:
  agente-data:
  agente-auth:
```

**Se o Coolify usa docker-compose.yml:**
- ✅ Os volumes são criados automaticamente
- ✅ Não precisa configurar manualmente
- ✅ Basta fazer deploy!

---

## 🧪 Testar se os Volumes Funcionam

### 1. Faça deploy da aplicação

### 2. Adicione uma transação de teste

Via interface web ou comando:

```bash
# No terminal do Coolify
cd /app
node -e "
const db = require('./services/database');
db.init();
db.addTransacao('receita', 100, 'Teste', 'Teste de volume', 'TESTE');
console.log('Transação adicionada!');
"
```

### 3. Verifique no banco:

```bash
sqlite3 /app/data/database.sqlite "SELECT * FROM transacoes;"
```

### 4. Faça Redeploy

```
Coolify → Redeploy
```

### 5. Verifique novamente:

```bash
sqlite3 /app/data/database.sqlite "SELECT * FROM transacoes;"
```

**Se a transação ainda está lá:** ✅ Volumes funcionando!  
**Se desapareceu:** ❌ Volumes não configurados corretamente

---

## 💡 Dicas Pro

### Backup Manual dos Volumes:

```bash
# No terminal do Coolify

# Backup do banco
cp /app/data/database.sqlite /app/data/backup-$(date +%Y%m%d).sqlite

# Backup da sessão WhatsApp
tar -czf /app/data/whatsapp-backup.tar.gz /app/auth_info_baileys
```

### Ver tamanho dos dados:

```bash
du -h /app/data
du -h /app/auth_info_baileys
```

### Limpar dados antigos:

```bash
# ⚠️ CUIDADO: Apaga tudo!
rm -rf /app/data/*
rm -rf /app/auth_info_baileys/*
# Depois: Restart
```

---

## ✅ Checklist de Volumes

- [ ] Volumes configurados no Coolify OU docker-compose.yml
- [ ] Volume 1: `/app/data` para banco de dados
- [ ] Volume 2: `/app/auth_info_baileys` para WhatsApp
- [ ] Variável `DB_PATH=/app/data/database.sqlite` configurada
- [ ] Redeploy realizado
- [ ] Teste: adicionar dado → redeploy → verificar se dado permanece

---

**Com volumes configurados, seus dados estarão seguros! 🔒**

