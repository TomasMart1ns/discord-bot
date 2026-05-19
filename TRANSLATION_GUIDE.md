# 🌐 Sistema de Tradução do Bot

## Descrição

O seu bot Discord agora suporta **tradução de mensagens entre Português e Inglês**! 

As mensagens de **música** ficam sempre em **português** para não prejudicar a experiência de reprodução.

## Mudando o Idioma do Servidor

Use o comando:

```
!idioma <PT|EN>
!lang <PT|EN>
```

### Exemplos:

```
!idioma PT     → Muda para Português (padrão)
!idioma EN     → Muda para English
!lang EN       → Muda para English (alias)
```

## Comandos Disponíveis

### 📊 Informações Gerais

| Comando | PT | EN | Descrição |
|---------|----|----|-----------|
| `!nivel` | `!nivel` | `!level` | Ver nível e XP |
| `!rank` | `!rank` | `!rank` | Ver posição no ranking |
| `!top` | `!top` | `!top` | Ver top jogadores |
| `!avisos` | `!avisos` | `!warnings` | Ver avisos |

### 💰 Economia

| Comando | PT | EN | Descrição |
|---------|----|----|-----------|
| `!bal` | `!bal` | `!bal` | Ver saldo |
| `!carteira` | `!carteira` | `!coins` | Alias para ver saldo |
| `!moedas` | `!moedas` | `!coins` | Alias para ver saldo |
| `!quiz` | `!quiz` | `!quiz` | Jogar quiz e ganhar moedas |

### 🤖 IA

| Comando | PT | EN | Descrição |
|---------|----|----|-----------|
| `!pergunta` | `!pergunta` | `!ask` | Fazer pergunta à IA |

### 🎶 Música (SEMPRE em Português)

| Comando | Descrição |
|---------|-----------|
| `!play <música>` | Tocar uma música |
| `!sair` | Sair do canal de voz |
| `!stop` | Alias para sair |

### 🛡️ Moderação

| Comando | Descrição |
|---------|-----------|
| `!palavras` / `!words` | Listar palavras proibidas |
| `!addpalavra <palavra>` | Adicionar palavra proibida (Staff) |
| `!rempalavra <palavra>` | Remover palavra proibida (Staff) |
| `!limpar <1-100>` | Apagar mensagens (Staff) |

### ℹ️ Outros

| Comando | Descrição |
|---------|-----------|
| `!help` / `!ajuda` | Ver guia de comandos |
| `!idioma` / `!lang` | Mudar idioma do servidor |

## 📁 Arquivos do Sistema

### Novos Arquivos Criados:

1. **`strings.js`** - Dicionário com todas as mensagens do bot em PT e EN
2. **`guildConfig.js`** - Gerenciador de configurações do servidor (idioma, etc)
3. **`configs/guild_languages.json`** - Arquivo de persistência com idiomas dos servidores

### Arquivo Modificado:

- **`index.js`** - Integração do sistema de tradução em todos os comandos

## 🔧 Como Funciona

### Estrutura de Tradução

```javascript
// Em strings.js - cada mensagem tem ambas as versões

WELCOME: {
  PT: (member) => `Olá ${member}, espero que te divirtas no meu servidor!`,
  EN: (member) => `Hello ${member}, hope you have fun on my server!`
}
```

### Uso nos Comandos

```javascript
// No índex.js - obter a língua do servidor
const lang = getServerLanguage(message.guild.id);

// Usar a tradução
const msg = getString('WELCOME', lang, member);
```

## 🎵 Exceção: Mensagens de Música em Português

Todas as mensagens relacionadas com música **permanecem em português**:

- "🔍 A procurar: `música`"
- "🎶 A tocar agora"
- "👋 Saí do canal!"
- Erros de reprodução

Isto garante uma experiência de reprodução consistente.

## 📝 Exemplo de Uso

```
Usuário: !idioma EN
Bot: ✅ Language changed to 🇬🇧 English

Usuário: !level
Bot: [Responde em English]

Usuário: !play Bohemian Rhapsody
Bot: 🔍 A procurar: `Bohemian Rhapsody`... [em Português]
Bot: 🎶 A tocar agora - Reproduzindo: **Bohemian Rhapsody** [em Português]
```

## 🚀 Adicionar Novos Idiomas

Para adicionar um novo idioma (ex: Espanhol):

1. Editar `strings.js`
2. Adicionar a linguagem no objeto LANGUAGES
3. Adicionar as traduções para cada STRING

```javascript
LANGUAGES = { PT, EN, ES }

// Em cada string:
WELCOME: {
  PT: (member) => `...`,
  EN: (member) => `...`,
  ES: (member) => `...`  // Novo idioma
}
```

## ⚙️ Configuração

O arquivo `configs/guild_languages.json` é criado automaticamente:

```json
{
  "guild_id_1": {
    "language": "PT"
  },
  "guild_id_2": {
    "language": "EN"
  }
}
```

## 📌 Notas Importantes

- O idioma **padrão é Português (PT)**
- Cada servidor tem sua própria configuração de idioma
- A configuração é **persistida** em arquivo JSON
- Mensagens de **música sempre em português**
- Suporta **aliases de comandos** em ambos idiomas

---

**Versão:** 1.0.0  
**Data:** Abril 2026
