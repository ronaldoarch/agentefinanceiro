# 🚨 DIAGNÓSTICO: Transações Desaparecem

## ⚠️ PROBLEMA REPORTADO

As transações são salvas mas **desaparecem depois de um tempo** ou após redeploy/restart.

---

## 🔍 CAUSA MAIS PROVÁVEL

**Volumes NÃO configurados** ou **não funcionando** no Coolify!

Quando não há volumes:
- ❌ Dados são salvos dentro do container temporário
- ❌ Ao fazer redeploy, container é destruído
- ❌ Banco de dados é perdido
- ❌ Tudo volta ao estado inicial

---

## 🎯 SOLUÇÃO DEFINITIVA

### Passo 1: Verificar Logs Após Redeploy

No Coolify, faça:
```
1. Redeploy
2. Aguarde completar
3. Ir em "Logs"
4. Procurar por estas linhas:
```

**Procure por:**
```
🔍 DB_PATH configurado: /app/data/database.sqlite
✅ Diretório já existe: /app/data
✅ Banco de dados encontrado: /app/data/database.sqlite
📊 Tamanho do banco: XX.XX KB
📊 Registros no banco:
   - Usuários: 1
   - Transações: 5
   - Mensagens de chat: 10
📁 Banco está em volume persistente? ✅ SIM
```

**❌ SE VIR:**
```
🆕 Criando novo banco: /app/data/database.sqlite
📊 Tamanho do banco: 4.00 KB
📊 Registros no banco:
   - Usuários: 1
   - Transações: 0  ← SEMPRE ZERO!
   - Mensagens de chat: 0
```

**Significa:** Banco sendo recriado toda vez = **Sem persistência!**

---

### Passo 2: Configurar Volumes no Coolify

**MUITO IMPORTANTE!** Se os logs mostram que o banco é recriado sempre, você precisa configurar volumes.

#### No Coolify:

**1. Acesse seu projeto**

**2. Vá em "Configuration" ou "Settings"**

**3. Procure por:**
- "Storage"
- "Volumes"
- "Persistent Storage"
- "Mounts"

**4. Adicione Volume:**

**Volume para Banco de Dados:**
```
Name: agente-data (ou qualquer nome)
Mount Path: /app/data
Type: Volume (NÃO bind mount)
```

**Volume para WhatsApp (opcional):**
```
Name: agente-auth
Mount Path: /app/auth_info_baileys
Type: Volume
```

**5. Salve e Redeploy**

---

### Passo 3: Verificar Variável de Ambiente

No Coolify → Configuration → Environment Variables

**DEVE TER:**
```
DB_PATH=/app/data/database.sqlite
```

**❌ NÃO use:**
```
DB_PATH=./database.sqlite  ← Errado! Vai salvar no container temporário
```

---

## 📊 VERIFICAÇÃO APÓS CONFIGURAR VOLUMES

### 1. Redeploy
```
Coolify → Redeploy
```

### 2. Ver Logs
Procure por:
```
✅ Banco de dados encontrado: /app/data/database.sqlite  ← BOM!
📊 Tamanho do banco: 24.50 KB  ← Tem dados!
📊 Registros no banco:
   - Usuários: 1
   - Transações: 0  ← Normal no primeiro deploy
```

### 3. Adicionar Transação de Teste
```
Login → Chat IA → "Gastei 100 reais"
```

Nos logs, deve ver:
```
💾 SALVANDO TRANSAÇÃO no banco: /app/data/database.sqlite
   User ID: 1, Tipo: despesa, Valor: R$ 100
✅ TRANSAÇÃO SALVA! ID: 1
📊 Total de transações do usuário 1: 1
```

### 4. TESTE CRÍTICO - Restart
```
Coolify → Restart (NÃO redeploy)
```

Aguarde reiniciar, depois ver logs:
```
✅ Banco de dados encontrado: /app/data/database.sqlite  ← ENCONTROU!
📊 Tamanho do banco: 28.50 KB  ← Aumentou!
📊 Registros no banco:
   - Usuários: 1
   - Transações: 1  ← MANTEVE!
```

**✅ SE VIR TRANSAÇÕES: 1** = **VOLUMES FUNCIONANDO!**

**❌ SE VIR TRANSAÇÕES: 0** = **VOLUMES NÃO CONFIGURADOS!**

---

## 🆘 SE VOLUMES NÃO FUNCIONAREM

### Opção 1: Docker Compose (Recomendado)

Se o Coolify usa `docker-compose.yml`:

Seu arquivo já tem volumes configurados:

```yaml
volumes:
  - agente-data:/app/data
  - agente-auth:/app/auth_info_baileys

volumes:
  agente-data:
  agente-auth:
```

**Coolify deve usar isso automaticamente!**

### Opção 2: Configuração Manual no Coolify

Se não aparece opção de volumes:

**No Terminal do Coolify:**
```bash
# Ver se o volume existe
docker volume ls | grep agente

# Se não existir, criar:
docker volume create agente-data

# Ver detalhes:
docker volume inspect agente-data
```

### Opção 3: Bind Mount (Alternativa)

Se volumes não funcionam, use bind mount:

```
Host Path: /var/lib/coolify/data/agente-financeiro
Container Path: /app/data
```

---

## 🎯 COMANDOS DE VERIFICAÇÃO

### No Terminal do Coolify:

**1. Verificar se volume está montado:**
```bash
df -h | grep data
```

Deve mostrar algo como:
```
/dev/xxx  20G  100M  /app/data
```

**2. Verificar permissões:**
```bash
ls -la /app/data/
```

Deve mostrar:
```
-rw-r--r-- 1 root root 25000 Nov 9 database.sqlite
```

**3. Verificar conteúdo do banco:**
```bash
sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM transacoes;"
```

**4. Ver transações salvas:**
```bash
sqlite3 /app/data/database.sqlite "SELECT id, user_id, valor, descricao FROM transacoes LIMIT 5;"
```

**5. Teste de persistência:**
```bash
# Criar arquivo de teste
echo "teste" > /app/data/teste.txt

# Restart container
# (No Coolify: Restart)

# Verificar se arquivo ainda existe
cat /app/data/teste.txt
```

**✅ Se arquivo existe após restart** = Volumes funcionando!  
**❌ Se arquivo sumiu** = Volumes NÃO funcionando!

---

## 📋 CHECKLIST DE DIAGNÓSTICO

Execute passo a passo:

- [ ] Verificar se `DB_PATH=/app/data/database.sqlite` em Environment Variables
- [ ] Verificar se volume `/app/data` está configurado em Storage/Volumes
- [ ] Fazer Redeploy
- [ ] Ver logs e procurar por "📁 Banco está em volume persistente? ✅ SIM"
- [ ] Adicionar transação de teste via chat
- [ ] Ver nos logs: "✅ TRANSAÇÃO SALVA! ID: X"
- [ ] Fazer Restart (não Redeploy)
- [ ] Ver logs novamente
- [ ] Verificar se "Transações: X" mantém o número (não volta para 0)
- [ ] ✅ Se manteve = RESOLVIDO!
- [ ] ❌ Se voltou para 0 = Volumes não estão funcionando

---

## 🔧 SOLUÇÃO RÁPIDA

### Se Volumes Não Estiverem Configurados:

**No Coolify:**

1. **Stop** a aplicação

2. **Configuration** → **Storage/Volumes**

3. **Add Volume:**
   - Mount Path: `/app/data`
   - (Deixe outros campos vazios, Coolify cria automaticamente)

4. **Save**

5. **Deploy** (não Start, mas Deploy completo)

6. **Aguardar build**

7. **Ver logs** e confirmar:
   ```
   ✅ Banco de dados encontrado
   📁 Banco está em volume persistente? ✅ SIM
   ```

8. **Adicionar transação de teste**

9. **Restart**

10. **Verificar se transação permanece**

11. **✅ RESOLVIDO!**

---

## ⚠️ IMPORTANTE

### SEM VOLUMES:
```
❌ Dados perdidos a cada redeploy
❌ Usuários precisam se recadastrar
❌ Transações somem
❌ Chat histórico perdido
❌ Pagamentos perdidos
❌ IMPOSSÍVEL usar em produção!
```

### COM VOLUMES:
```
✅ Dados preservados entre deploys
✅ Usuários mantidos
✅ Transações salvas permanentemente
✅ Histórico de chat mantido
✅ Pagamentos registrados
✅ PRONTO PARA PRODUÇÃO!
```

---

## 🎯 APÓS CONFIGURAR VOLUMES

Os dados serão **PERMANENTES**:

- ✅ Transações nunca mais somem
- ✅ Usuários cadastrados permanecem
- ✅ Chat histórico preservado
- ✅ Pagamentos registrados
- ✅ Assinaturas mantidas
- ✅ Sistema confiável para clientes

---

## 📞 COMANDOS ÚTEIS

### Backup Manual (Segurança):

```bash
# No Terminal do Coolify
cp /app/data/database.sqlite /app/data/backup-$(date +%Y%m%d).sqlite

# Ver backups
ls -lh /app/data/*.sqlite
```

### Restaurar Backup:

```bash
cp /app/data/backup-20251109.sqlite /app/data/database.sqlite
# Restart
```

### Exportar Banco (Download):

```bash
# Compactar
tar -czf /app/data/database-backup.tar.gz /app/data/database.sqlite

# Download via SFTP ou copiar conteúdo
```

---

## 🚀 AÇÃO IMEDIATA

1. **Redeploy agora** (para aplicar logs)
2. **Ver logs** e procurar pelas mensagens de diagnóstico
3. **Me envie** o que aparece nos logs:
   - DB_PATH configurado
   - Banco está em volume persistente?
   - Registros no banco
   - Se encontra ou cria novo banco

Com essas informações, vou te dizer exatamente o que fazer!

---

**Redeploy e me envie os logs de inicialização!** 🔍

