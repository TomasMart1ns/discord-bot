/**
 * EXEMPLO: Como usar o sistema de tradução para novos comandos
 * 
 * Este arquivo mostra exemplos práticos de como integrar o sistema
 * de tradução nos seus comandos.
 */

// ============================================
// EXEMPLO 1: Comando Simples com Mensagem
// ============================================

if (command === 'exemplo1') {
  const lang = getServerLanguage(message.guild.id);
  
  const msg = getString('WELCOME', lang, message.author);
  message.reply(msg);
}

// Resultado:
// PT: "Olá @User, espero que te divirtas no meu servidor!"
// EN: "Hello @User, hope you have fun on my server!"


// ============================================
// EXEMPLO 2: Embed com Tradução
// ============================================

if (command === 'exemplo2') {
  const lang = getServerLanguage(message.guild.id);
  
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(getString('LEVEL_TITLE', lang))
    .setDescription(getString('WELCOME', lang, message.author))
    .addFields({
      name: getString('LEVEL_FIELD', lang),
      value: '10',
      inline: true
    });
  
  message.reply({ embeds: [embed] });
}


// ============================================
// EXEMPLO 3: Strings com Parâmetros
// ============================================

if (command === 'exemplo3') {
  const lang = getServerLanguage(message.guild.id);
  
  // Função que aceita parâmetros
  const msg = getString('LEVEL_UP', lang, message.author, 5);
  // PT: "🎉 Parabéns @User! Agora és nível **5**!"
  // EN: "🎉 Congratulations @User! You're now level **5**!"
  
  message.reply(msg);
}


// ============================================
// EXEMPLO 4: Strings com Placeholders
// ============================================

if (command === 'exemplo4') {
  const lang = getServerLanguage(message.guild.id);
  
  // Sem usar getString - para construções customizadas
  let template = getString('MUSIC_PLAY', lang);
  // template = "🔍 A procurar: \"{busca}\"" (sempre PT para música)
  
  const resultado = formatString(template, { busca: 'Bohemian Rhapsody' });
  // resultado = "🔍 A procurar: \"Bohemian Rhapsody\""
  
  message.reply(resultado);
}


// ============================================
// EXEMPLO 5: Múltiplas Strings em um Comando
// ============================================

if (command === 'exemplo5') {
  const lang = getServerLanguage(message.guild.id);
  const uid = message.author.id;
  
  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setAuthor({ 
      name: getString('RANKING_TITLE', lang),
      iconURL: message.author.displayAvatarURL()
    })
    .addFields(
      { 
        name: getString('LEVEL_FIELD', lang),
        value: `**5**`,
        inline: true
      },
      { 
        name: getString('XP_FIELD', lang),
        value: `**150** / 500`,
        inline: true
      },
      { 
        name: getString('COINS_FIELD', lang),
        value: `**250**`,
        inline: true
      },
      {
        name: 'Próximo nível',
        value: getString('NEXT_LEVEL', lang, 350),
        inline: false
      }
    );
  
  message.reply({ embeds: [embed] });
}

// Resultado PT:
// | 📊 Nível | ⭐ XP atual | 💰 Moedas |
// |   5      | 150 / 500   |   250    |
// Faltam **350** XP

// Resultado EN:
// | 📊 Level | ⭐ Current XP | 💰 Coins |
// |    5     | 150 / 500     |   250    |
// **350** XP needed


// ============================================
// EXEMPLO 6: Erro Tratado com Tradução
// ============================================

if (command === 'exemplo6') {
  const lang = getServerLanguage(message.guild.id);
  
  try {
    // Seu código aqui
    throw new Error("401 Unauthorized");
  } catch (err) {
    if (err.message.includes("401")) {
      message.reply(getString('AI_AUTH_ERROR', lang));
      // PT: "❌ Erro de autorização. Verifica se o teu Token no .env está correto..."
      // EN: "❌ Authorization error. Check if your Token in .env is correct..."
    }
  }
}


// ============================================
// EXEMPLO 7: Comando com Alias em 2 Idiomas
// ============================================

// Em strings.js, adicione:
// const comandoSoLeitura = command === 'nivel' || command === 'level' || ...

if (command === 'nivel' || command === 'level') {
  const lang = getServerLanguage(message.guild.id);
  
  // Mesmo comando responde em 2 idiomas!
  const title = getString('LEVEL_TITLE', lang);
  const embed = new EmbedBuilder()
    .setTitle(title);
  
  message.reply({ embeds: [embed] });
}

// !nivel -> PT: "Nível e XP"
// !level -> EN: "Level and XP" (se servidor estiver em EN)


// ============================================
// EXEMPLO 8: Fallback para Português
// ============================================

if (command === 'exemplo8') {
  // Se o idioma não existir, automaticamente volta para PT
  const lang = getServerLanguage(message.guild.id); // Pode ser PT, EN, ou UNKNOW
  
  const msg = getString('WELCOME', lang, message.author);
  // Se lang = "UNKNOW", getString automaticamente escolhe PT
  
  message.reply(msg);
}


// ============================================
// ESTRUTURA PARA ADICIONAR NOVO COMANDO COM TRADUÇÃO
// ============================================

/*

1. Adicione as strings em strings.js:
   MY_NEW_COMMAND_TITLE: {
     PT: "Meu Comando",
     EN: "My Command"
   },
   MY_NEW_COMMAND_DESC: {
     PT: (user) => `Olá ${user}!`,
     EN: (user) => `Hello ${user}!`
   }

2. No index.js, use:
   if (command === 'mycommand') {
     const lang = getServerLanguage(message.guild.id);
     const embed = new EmbedBuilder()
       .setTitle(getString('MY_NEW_COMMAND_TITLE', lang))
       .setDescription(getString('MY_NEW_COMMAND_DESC', lang, message.author));
     
     message.reply({ embeds: [embed] });
   }

3. Pronto! Seu comando agora suporta ambos idiomas.

*/


// ============================================
// CHECKLIST PARA NOVO COMANDO
// ============================================

/*
☑️ Adicionar strings em strings.js (PT e EN)
☑️ Importar getString no index.js (já está feito)
☑️ Obter o idioma: const lang = getServerLanguage(message.guild.id);
☑️ Usar getString para todas as mensagens
☑️ Testar em ambos idiomas (!idioma PT e !idioma EN)
☑️ Adicionar alias em ambos idiomas se necessário
☑️ Lembrar: Música sempre em português!
*/
