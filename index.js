require('dotenv').config();
const fs = require('fs');
const http = require('http');
const { Client, GatewayIntentBits, Events, PermissionsBitField, EmbedBuilder } = require('discord.js');

// Servidor HTTP para o Render
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running!');
});
server.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const PREFIX = '!';
const MEU_ID = '601074003234521119';
const CARGO_MEMBRO_ID = '1432386547222581270'; 
const CANAL_BOAS_VINDAS_ID = '1432386634128687295';

// Armazenamento para cooldown de comandos
const cooldowns = new Map();

function lerDados() {
    try {
        return JSON.parse(fs.readFileSync('./dados.json', 'utf8'));
    } catch (e) {
        return { forbiddenWords: [], userWarnings: {}, userStats: {} };
    }
}

function salvarDados(dados) {
    fs.writeFileSync('./dados.json', JSON.stringify(dados, null, 2));
}

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot online! Logado como ${c.user.tag}`);
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const role = member.guild.roles.cache.get(CARGO_MEMBRO_ID);
    if (role) await member.roles.add(role);
  } catch (err) { console.error("Erro ao atribuir cargo:", err); }

  const canalBoasVindas = member.guild.channels.cache.get(CANAL_BOAS_VINDAS_ID);
  if (canalBoasVindas) {
    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('👋 Bem-vindo(a)!')
      .setDescription(`Olá ${member.user}, espero que te divirtas no meu servidor!`)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields({ name: 'ID do utilizador', value: member.id, inline: true })
      .setTimestamp()
      .setFooter({ text: 'Bem-vindo ao Cantinho do Tomás!' });

    canalBoasVindas.send({ embeds: [welcomeEmbed] });
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;
  
  let dados = lerDados();
  const uid = message.author.id;

  // --- 1. MODERAÇÃO ---
  const messageContent = message.content.toLowerCase();
  const hasForbiddenWord = dados.forbiddenWords.some(word => messageContent.includes(word));

  if (hasForbiddenWord && message.author.id !== MEU_ID) {
    if (message.deletable) await message.delete().catch(() => {});
    
    if (!dados.userWarnings[uid]) dados.userWarnings[uid] = 0;
    dados.userWarnings[uid] += 1;

    if (dados.userWarnings[uid] >= 5) {
      await message.member.timeout(10 * 60 * 1000, 'Atingiu 5 avisos.');
      message.channel.send(`🚫 ${message.author}, foste mutado por 10 min.`);
      dados.userWarnings[uid] = 0;
    } else {
      message.channel.send(`⚠️ ${message.author}, aviso ${dados.userWarnings[uid]}/5.`);
    }
    salvarDados(dados);
    return;
  }

  // --- 2. XP ---
  if (!dados.userStats[uid]) dados.userStats[uid] = { xp: 0, level: 1 };
  dados.userStats[uid].xp += Math.floor(Math.random() * 5) + 1;

  if (dados.userStats[uid].xp >= dados.userStats[uid].level * 100) {
    dados.userStats[uid].level += 1;
    dados.userStats[uid].xp = 0;
    message.channel.send(`🎉 Parabéns ${message.author}, subiste para o **nível ${dados.userStats[uid].level}**!`);
  }
  salvarDados(dados);

  // --- 3. COMANDOS ---
  if (!message.content.startsWith(PREFIX)) return;

  // Bloqueio rigoroso de cooldown (Anti-Spam)
  const now = Date.now();
  if (cooldowns.has(uid)) {
      const expirationTime = cooldowns.get(uid) + 5000;
      if (now < expirationTime) return; 
  }
  cooldowns.set(uid, now);
  setTimeout(() => cooldowns.delete(uid), 5000);

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'avisos') message.reply(`Tens **${dados.userWarnings[uid] || 0}** avisos.`);
  if (command === 'nivel') message.reply(`📈 Nível: ${dados.userStats[uid].level} | XP: ${dados.userStats[uid].xp}`);
  
  if (command === 'addpalavra') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    const word = args[0]?.toLowerCase();
    if (word && !dados.forbiddenWords.includes(word)) {
      dados.forbiddenWords.push(word);
      salvarDados(dados);
      message.reply(`✅ **${word}** adicionada à lista.`);
    }
  }
  
  if (command === 'palavras') {
    message.reply(`📜 Palavras proibidas: ${dados.forbiddenWords.join(', ')}`);
  }
});

client.login(process.env.DISCORD_TOKEN);