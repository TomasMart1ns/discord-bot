# 🤖 Bot para Discord (JavaScript)

Bot simples para Discord criado com Node.js e a biblioteca [discord.js](https://discord.js.org/).

## Comandos disponíveis

| Comando | Descrição |
|---------|-----------|
| `!ping` | Mostra a latência do bot |
| `!hello` ou `!ola` | O bot te cumprimenta |
| `!help` | Lista todos os comandos |
| `!info` | Mostra informações do servidor |

## Como configurar

### 1. Criar a aplicação no Discord

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique em **"New Application"** e dê um nome ao seu bot
3. No menu lateral, vá em **"Bot"**
4. Clique em **"Add Bot"**
5. Em **"Token"**, clique em **"Reset Token"** para gerar um novo token (guarde-o em local seguro!)

### 2. Ativar Message Content Intent

No painel do Bot, ative a opção **"Message Content Intent"** em Privileged Gateway Intents. Isto é necessário para o bot ler mensagens.

### 3. Convidar o bot para o seu servidor

1. Vá em **"OAuth2" → "URL Generator"**
2. Em **Scopes**, selecione `bot`
3. Em **Bot Permissions**, selecione as permissões que precisar (ex: Send Messages, Read Messages)
4. Copie a URL gerada e abra no browser para adicionar o bot ao servidor

### 4. Instalar e executar

```bash
cd discord-bot
npm install
```

Crie um ficheiro `.env` (copie de `.env.example`):

```
DISCORD_TOKEN=cole_o_seu_token_aqui
```

Depois execute:

```bash
npm start
```

Se tudo estiver correto, verá `✅ Bot online! Logado como SeuBot#1234`.

## Personalizar

- **Prefixo**: Altere a variável `PREFIX` em `index.js` (ex: `?`, `$`)
- **Novos comandos**: Adicione mais blocos `if (command === 'nome')` no handler de mensagens

## Requisitos

- Node.js 18 ou superior
- Uma aplicação/bot criada no Discord Developer Portal
