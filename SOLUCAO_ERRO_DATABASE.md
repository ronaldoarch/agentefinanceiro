# 🔧 Solução - Erro "Cannot open database because the directory does not exist"

## 📋 Problema

Ao fazer deploy da aplicação no Coolify ou Docker, você pode encontrar este erro:

```
TypeError: Cannot open database because the directory does not exist
at new Database (/app/node_modules/better-sqlite3/lib/database.js:65:9)
at Object.init (/app/services/database.js:10:8)
```

## 🔍 Causa

O erro ocorre porque:
1. O SQLite tenta criar o arquivo do banco de dados
2. O diretório pai onde o banco será criado não existe no container
3. O SQLite não cria diretórios automaticamente, apenas o arquivo do banco

## ✅ Solução Implementada

### 1. **Código Atualizado** (`services/database.js`)

Adicionamos código para criar o diretório automaticamente:

```javascript
const fs = require('fs');

function init() {
  // Criar diretório se não existir
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Diretório criado: ${dbDir}`);
  }
  
  db = new Database(DB_PATH);
  // ...
}
```

### 2. **Dockerfile Atualizado**

Criamos o diretório de dados no Dockerfile:

```dockerfile
# Criar diretório para dados e garantir permissões
RUN mkdir -p /app/data && chmod 777 /app/data
```

### 3. **docker-compose.yml Atualizado**

Adicionamos volumes para persistir os dados:

```yaml
volumes:
  - agente-data:/app/data
  - agente-auth:/app/auth_info_baileys

volumes:
  agente-data:
  agente-auth:
```

E alteramos a variável de ambiente:

```yaml
environment:
  - DB_PATH=/app/data/database.sqlite
```

## 🚀 Como Aplicar a Correção

### No Coolify:

1. **Commit e push das alterações**:
   ```bash
   git add .
   git commit -m "fix: corrige erro de diretório do banco de dados"
   git push
   ```

2. **No painel do Coolify**:
   - Vá para a página da aplicação
   - Clique em **"Redeploy"**
   - Aguarde o rebuild da imagem Docker
   - A aplicação deve iniciar sem erros

3. **Verificar variáveis de ambiente**:
   - Na aba "Environment" do Coolify
   - Certifique-se de que `DB_PATH=/app/data/database.sqlite` está configurada
   - Se não estiver, adicione-a

### Localmente com Docker:

```bash
# Rebuild da imagem
docker-compose build --no-cache

# Iniciar a aplicação
docker-compose up -d

# Ver os logs
docker-compose logs -f
```

## 📊 Vantagens da Solução

1. **Criação Automática**: O diretório é criado automaticamente se não existir
2. **Persistência de Dados**: Com volumes Docker, os dados não são perdidos entre deploys
3. **Portabilidade**: Funciona em qualquer ambiente (local, Coolify, outros)
4. **Segurança**: Permissões adequadas no diretório

## 🔍 Verificar se Funcionou

Após o deploy, nos logs você deve ver:

```
✅ Banco de dados inicializado
🚀 Servidor rodando na porta 3005
```

E **NÃO** deve ver:

```
TypeError: Cannot open database because the directory does not exist
```

## 💾 Persistência de Dados

Com a configuração de volumes, seus dados serão mantidos mesmo quando:
- Você faz redeploy da aplicação
- O container é reiniciado
- Você atualiza o código

Os volumes persistem:
- **agente-data**: Banco de dados SQLite
- **agente-auth**: Sessão do WhatsApp

## 🆘 Se o Erro Persistir

1. **Verifique as permissões**:
   ```bash
   docker-compose exec agente-financeiro ls -la /app/data
   ```

2. **Verifique a variável DB_PATH**:
   ```bash
   docker-compose exec agente-financeiro env | grep DB_PATH
   ```

3. **Recrie os volumes** (⚠️ isso apagará os dados):
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

## 📝 Notas Importantes

- A alteração no código garante compatibilidade com qualquer caminho de banco de dados
- O uso de volumes é essencial para não perder dados entre deploys
- As permissões 777 no diretório garantem que qualquer usuário possa escrever (útil em diferentes ambientes)

---

✅ **Problema Resolvido!** Sua aplicação agora deve funcionar corretamente no Coolify.

