require('dotenv').config();
const http = require('http');
http.createServer((req, res) => {
  res.write("Bot Online");
  res.end();
}).listen(process.env.PORT || 10000);
const ffmpegPath = require('ffmpeg-static');
const play = require('play-dl');
const fs = require('fs');
// Verifica se o ficheiro existe e carrega os cookies
// --- CARREGAR COOKIES DO YOUTUBE (VERSÃO STRING) ---
if (fs.existsSync('./cookies.json')) {
  try {
      // Lemos o ficheiro. Se exportaste como JSON, isto vai falhar.
      // Se exportaste como String, isto vai funcionar.
      const cookiesRaw = fs.readFileSync('./cookies.json', 'utf8');

      play.setToken({
          youtube: {
              cookie: cookiesRaw.trim() // Aqui passamos a string pura
          }
      });
      console.log("✅ Cookies do YouTube injetados como String!");
  } catch (e) {
      console.error("❌ Erro ao processar cookies:", e.message);
  }
}
const { Client, GatewayIntentBits, Events, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { HfInference } = require('@huggingface/inference');
const admin = require('firebase-admin');
const path = require('path');
const { spawn } = require('child_process');
const { helpers: ytdlpHelpers } = require('ytdlp-nodejs');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  entersState,
  VoiceConnectionStatus,
  StreamType,
  getVoiceConnection,
} = require('@discordjs/voice');

// 1. LIMPEZA NO TOPO - Variável global na RAM
let dadosGlobais = { forbiddenWords: {}, userWarnings: {}, userStats: {} };

// Função simplificada que retorna os dados da RAM
function lerDados() {
    return dadosGlobais;
}

// Firebase: opcional — usar FIREBASE_CONFIG (env) ou FIREBASE_CONFIG.json (local)
let db = null;
process.env.FFMPEG_BIN = ffmpegPath;
// Reunir FIREBASE_CONFIG (uma variável) ou FIREBASE_CONFIG_1, FIREBASE_CONFIG_2, ...
function getFirebaseConfigFromEnv() {
  if (process.env.FIREBASE_CONFIG) return process.env.FIREBASE_CONFIG.trim();
  const parts = [];
  for (let i = 1; process.env[`FIREBASE_CONFIG_${i}`]; i++) {
    parts.push(process.env[`FIREBASE_CONFIG_${i}`].trim());
  }
  return parts.length ? parts.join('') : null;
}

const firebaseEnv = getFirebaseConfigFromEnv();
if (firebaseEnv) {
  try {
    let jsonStr = firebaseEnv;
    if (!jsonStr.startsWith('{')) {
      jsonStr = Buffer.from(jsonStr, 'base64').toString('utf8');
    }
    const serviceAccount = JSON.parse(jsonStr);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
  } catch (e) {
    console.warn('Firebase: Erro na configuração.', e.message);
  }
} else {
  const configPath = path.join(__dirname, 'FIREBASE_CONFIG.json');
  if (fs.existsSync(configPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      db = admin.firestore();
    } catch (e) {
      console.warn('Firebase: erro ao ler FIREBASE_CONFIG.json, a correr sem Firestore.', e.message);
    }
  } else {
    console.warn('Firebase: sem FIREBASE_CONFIG nem FIREBASE_CONFIG.json — o bot corre sem Firestore.');
  }
}

// 3. FUNÇÃO ATUALIZADA PARA SALVAR XP + MOEDAS
async function salvarDadosUser(userId, xp, level, moedas) {
  if (!db) return;
  try {
    await db.collection('usuarios').doc(userId).set({ 
      xp: Number(xp), 
      level: Number(level),
      moedas: Number(moedas || 0),
      lastUpdate: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error("Erro ao salvar no Firebase:", e.message);
  }
}

// --- CONFIGURAÇÃO IA (token apenas via .env — nunca em código) ---
const HF_TOKEN = process.env.HF_TOKEN;
const hf = HF_TOKEN ? new HfInference(HF_TOKEN) : null;

// ffmpeg-static: prism-media procura `require('ffmpeg-static')`; o pacote também aceita env FFMPEG_BIN
try {
  const ffmpegStatic = require('ffmpeg-static');
  const p = typeof ffmpegStatic === 'string' ? ffmpegStatic : ffmpegStatic?.path;
  if (p && !process.env.FFMPEG_BIN) process.env.FFMPEG_BIN = p;
} catch (_) {}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    // Necessário para saber em que canal de voz o membro está (!play, etc.)
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const PREFIX = '!';
const MEU_ID = '601074003234521119';
const CARGO_MEMBRO_ID = '1432386547222581270'; 
const CANAL_BOAS_VINDAS_ID = '1432386634128687295';

function getSortedLeaderboardEntries(dados, guild) {
  const stats = dados?.userStats || {};
  const entries = Object.entries(stats)
    .map(([userId, s]) => ({
      userId,
      level: Number(s?.level ?? 1),
      xp: Number(s?.xp ?? 0),
      moedas: Number(s?.moedas ?? 0)
    }))
    .filter(e => Number.isFinite(e.level) && Number.isFinite(e.xp))
    .filter(e => {
      if (!guild) return true;
      if (!guild.members?.cache) return true;
      if (guild.members.cache.size === 0) return true;
      return guild.members.cache.has(e.userId);
    })
    .sort((a, b) => (b.level - a.level) || (b.xp - a.xp) || a.userId.localeCompare(b.userId));

  return entries;
}

async function getDisplayNameForUserId(guild, userId) {
  if (!guild) return `<@${userId}>`;
  const cached = guild.members.cache.get(userId);
  if (cached) return cached.displayName;
  try {
    const member = await guild.members.fetch(userId);
    return member?.displayName || `<@${userId}>`;
  } catch (_) {
    return `<@${userId}>`;
  }
}

/** Subprocessos yt-dlp por guild (parar ao trocar de música / !sair). */
const ytdlpProcesses = new Map();

async function getYtDlpBinary() {
  let bin = ytdlpHelpers.findYtdlpBinary();
  if (!bin) {
    await ytdlpHelpers.downloadYtDlp();
    bin = ytdlpHelpers.findYtdlpBinary();
  }
  if (!bin) throw new Error('Binário yt-dlp não disponível.');
  return bin;
}

/**
 * Stream de áudio YouTube via yt-dlp (o play-dl falha: formatos sem URL direta → "Invalid URL").
 * StreamType.Arbitrary → FFmpeg (ffmpeg-static) descodifica WebM/M4A/etc.
 */
// --- FUNÇÃO DE ÁUDIO CORRIGIDA ---
async function createYoutubeAudioResource(videoUrl) {
  const source = await play.stream(videoUrl, { discordPlayerCompatibility: true });
  return createAudioResource(source.stream, { inputType: source.type, inlineVolume: true });
}

/** Canal de voz do utilizador (member.voice falha por vezes sem estado em cache). */
async function getMemberVoiceChannel(guild, userId, member) {
  const fromMember = member?.voice?.channel;
  if (fromMember) return fromMember;
  const cached = guild.voiceStates.cache.get(userId)?.channel;
  if (cached) return cached;
  try {
    const vs = await guild.voiceStates.fetch(userId);
    return vs.channel;
  } catch {
    return null;
  }
}

// Cooldown para comandos
const cooldowns = new Map();

// 2. CORREÇÃO DO EVENTO READY
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot online! Logado como ${c.user.tag}`);

  if (db) {
    try {
      const snapshot = await db.collection('usuarios').get();
      // Puxamos os dados do Firebase diretamente para a variável na RAM
      snapshot.forEach(doc => {
        const userData = doc.data();
        dadosGlobais.userStats[doc.id] = {
          xp: Number(userData.xp || 0),
          level: Number(userData.level || 1),
          moedas: Number(userData.moedas || 0)
        };
      });
      console.log("🔄 Sincronização concluída: Dados carregados na RAM.");
    } catch (e) {
      console.error("❌ Erro ao carregar do Firebase:", e.message);
    }
  }
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
  
  let dados = dadosGlobais;
  const uid = message.author.id;
  const guildId = message.guild.id;

  // --- MODERAÇÃO (Firestore) ---
  let serverWords = [];
  
  if (db) {
    try {
      const configDoc = await db.collection('configs').doc(guildId).get();
      if (configDoc.exists) {
        serverWords = configDoc.data().forbiddenWords || [];
      }
    } catch (e) {
      console.error("Erro ao buscar palavras proibidas:", e);
    }
  }
  
  // Fallback para dados locais se Firebase falhar
  if (serverWords.length === 0) {
    serverWords = dados.forbiddenWords[guildId] || [];
  }

  const hasForbiddenWord = serverWords.some(word => message.content.toLowerCase().includes(word));

  if (hasForbiddenWord && uid !== MEU_ID) {
    if (message.deletable) await message.delete().catch(() => {});

    if (!dados.userWarnings[uid]) dados.userWarnings[uid] = 0;
    dados.userWarnings[uid] += 1;

    if (dados.userWarnings[uid] >= 5) {
      try {
        await message.member.timeout(10 * 60 * 1000, 'Atingiu 5 avisos.');
        await message.channel.send(`🚫 ${message.author}, foste mutado por 10 min.`);
      } catch (e) {
        console.error('Erro ao aplicar timeout:', e);
        await message.channel.send(`⚠️ ${message.author}, atingiste 5 avisos mas não consegui aplicar o mute automaticamente.`);
      }
      dados.userWarnings[uid] = 0;
    } else {
      await message.channel.send(`⚠️ ${message.author}, aviso ${dados.userWarnings[uid]}/5.`);
    }
    return;
  }

  // --- XP (CORRIGIDO - SEM ESCRITA EM FICHEIRO) ---
  if (!dados.userStats[uid]) dados.userStats[uid] = { xp: 0, level: 1, moedas: 0 };
  
  const xpGanhado = Math.floor(Math.random() * 5) + 1;
  dados.userStats[uid].xp += xpGanhado;

  if (dados.userStats[uid].xp >= dados.userStats[uid].level * 100) {
    dados.userStats[uid].level += 1;
    dados.userStats[uid].xp = 0;
  
    const levelUpEmbed = new EmbedBuilder()
      .setColor(0x57F287)
      .setAuthor({ name: 'Subida de nível!', iconURL: message.author.displayAvatarURL() })
      .setDescription(`🎉 Parabéns ${message.author}! Agora és nível **${dados.userStats[uid].level}**!`)
      .setTimestamp()
      .setFooter({ text: 'Cantinho do Tomás' });

    message.channel.send({ embeds: [levelUpEmbed] });
  }

  // Guardamos apenas na nuvem (Firebase) com a nova função que inclui moedas
  salvarDadosUser(uid, dados.userStats[uid].xp, dados.userStats[uid].level, dados.userStats[uid].moedas)
    .catch(err => console.error("Erro Firebase:", err));

  // --- COMANDOS ---
  if (!message.content.startsWith(PREFIX)) return;
  
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const isStaff = message.member.permissions.has(PermissionsBitField.Flags.ManageMessages);

  // Cooldown para comandos que não são só leitura
  const comandoSoLeitura = command === 'nivel' || command === 'avisos' || command === 'palavras' || command === 'rank' || command === 'top' || command === 'ranking' || command === 'pergunta' || command === 'help' || command === 'bal' || command === 'carteira' || command === 'moedas';
  
  if (!comandoSoLeitura) {
    const now = Date.now();
    if (cooldowns.has(uid)) {
      const expirationTime = cooldowns.get(uid) + 5000;
      if (now < expirationTime) return;
    }
    cooldowns.set(uid, now);
    setTimeout(() => cooldowns.delete(uid), 5000);
  }

  // Comando !avisos
  if (command === 'avisos') {
    const avisosEmbed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setAuthor({ name: 'Avisos', iconURL: message.author.displayAvatarURL() })
      .setDescription(`Tens **${dados.userWarnings[uid] || 0}** avisos de moderação.`)
      .addFields({ name: 'Atenção', value: 'Com 5 avisos serás mutado por 10 minutos.', inline: false })
      .setTimestamp()
      .setFooter({ text: `Pedido por ${message.author.username}` });
    message.reply({ embeds: [avisosEmbed] });
  }

  // Comando !nivel
  if (command === 'nivel') {
    const xpParaProximo = dados.userStats[uid].level * 100;
    const nivelEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({ name: 'Nível e XP', iconURL: message.author.displayAvatarURL() })
      .addFields(
        { name: '📊 Nível', value: `**${dados.userStats[uid].level}**`, inline: true },
        { name: '⭐ XP atual', value: `**${dados.userStats[uid].xp}** / ${xpParaProximo}`, inline: true },
        { name: '💰 Moedas', value: `**${dados.userStats[uid].moedas || 0}**`, inline: true },
        { name: 'Próximo nível', value: `Faltam **${xpParaProximo - dados.userStats[uid].xp}** XP`, inline: false }
      )
      .setTimestamp()
      .setFooter({ text: `Pedido por ${message.author.username}` });
    message.reply({ embeds: [nivelEmbed] });
  }

  // Comando !rank
  if (command === 'rank') {
    const entries = getSortedLeaderboardEntries(dados, message.guild);
    const idx = entries.findIndex(e => e.userId === uid);
    const my = dados.userStats[uid] || { level: 1, xp: 0, moedas: 0 };

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setAuthor({ name: 'Ranking', iconURL: message.author.displayAvatarURL() })
      .addFields(
        { name: '🏅 Posição', value: idx >= 0 ? `**#${idx + 1}** de ${entries.length}` : '*Sem posição (ainda sem XP?)*', inline: true },
        { name: '📊 Nível', value: `**${my.level || 1}**`, inline: true },
        { name: '⭐ XP atual', value: `**${my.xp || 0}**`, inline: true },
        { name: '💰 Moedas', value: `**${my.moedas || 0}**`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Pedido por ${message.author.username}` });

    return message.reply({ embeds: [embed] });
  }

  // Comando !top ou !ranking
  if (command === 'top' || command === 'ranking') {
    const nRaw = parseInt(args[0] || '10', 10);
    const n = Number.isFinite(nRaw) ? Math.min(Math.max(nRaw, 1), 25) : 10;

    const entries = getSortedLeaderboardEntries(dados, message.guild).slice(0, n);
    const lines = await Promise.all(entries.map(async (e, i) => {
      const name = await getDisplayNameForUserId(message.guild, e.userId);
      return `**#${i + 1}** — **${name}** | Nível **${e.level}** | XP **${e.xp}** | 💰 **${e.moedas}**`;
    }));

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle(`🏆 Top ${entries.length} jogadores`)
      .setDescription(lines.length ? lines.join('\n') : '*Ainda ninguém tem XP.*')
      .setTimestamp()
      .setFooter({ text: `Pedido por ${message.author.username}` });

    return message.reply({ embeds: [embed] });
  }

  // 5. COMANDO PARA VER O SALDO (!bal, !carteira, !moedas)
  if (command === 'bal' || command === 'carteira' || command === 'moedas') {
    const saldo = dados.userStats[uid]?.moedas || 0;
    const balEmbed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setAuthor({ name: 'Saldo de Moedas', iconURL: message.author.displayAvatarURL() })
      .setDescription(`💰 Tens atualmente **${saldo} Moedas** na tua conta.`)
      .setTimestamp()
      .setFooter({ text: `Pedido por ${message.author.username}` });
    
    message.reply({ embeds: [balEmbed] });
  }

  // 4. COMANDO !quiz COM VARIEDADE REAL E DINÂMICA
  if (command === 'quiz') {
    if (!hf) {
      return message.reply('❌ A IA não está configurada. Define `HF_TOKEN` no ficheiro `.env`.');
    }

    await message.channel.sendTyping();

    try {
      // 1. Criamos uma lista de temas para forçar a IA a sair do "óbvio"
      const temas = [
        'Astronomia', 'Mitologia Grega', 'Culinária Mundial', 'História de Portugal',
        'Tecnologia Moderna', 'Animais Exóticos', 'Séries da Netflix', 'Desportos Radicais',
        'Geografia (Capitais)', 'Filmes de Terror', 'Corpo Humano', 'Invenções'
      ];
      const temaEscolhido = temas[Math.floor(Math.random() * temas.length)];

      // 2. Um número aleatório para mudar a "assinatura" do prompt
      const seed = Math.floor(Math.random() * 99999);

      const promptIA = `Gera uma pergunta de cultura geral para um quiz.
    ID DE VARIAÇÃO: ${seed}
    TEMA OBRIGATÓRIO: ${temaEscolhido}
    
    REGRAS CRÍTICAS:
    - Proibido perguntas sobre: Einstein, Fleming, Fotossíntese, Rússia ou Breaking Bad.
    - A pergunta deve ser de dificuldade média.
    - A resposta deve ser apenas UMA ÚNICA palavra.
    - Responde APENAS no formato JSON (sem texto extra): {"pergunta": "...", "resposta": "..."}`;

      const response = await hf.chatCompletion({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: [{ role: "user", content: promptIA }],
        max_tokens: 150,
        temperature: 1.2, // Aumentada para 1.2 para máxima criatividade
      });

      let quizData;
      try {
        const cleanContent = response.choices[0].message.content.replace(/```json|```/g, "").trim();
        quizData = JSON.parse(cleanContent);
      } catch (e) {
        throw new Error("Erro no processamento. Tenta de novo!");
      }

      // --- LOGICA DE NORMALIZAÇÃO ---
      const normalizar = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const respostaCerta = normalizar(quizData.resposta);

      const quizEmbed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle('🎲 QUIZ ALEATÓRIO!')
        .addFields({ name: 'Tema', value: `✨ ${temaEscolhido}`, inline: true })
        .setDescription(`**Pergunta:** ${quizData.pergunta}`)
        .setFooter({ text: 'Tens 20 segundos! Ganha 100 Moedas.' });

      message.channel.send({ embeds: [quizEmbed] });

      const filtro = m => {
        if (m.author.bot) return false;
        const msgUser = normalizar(m.content);
        // Regex para aceitar a palavra mesmo que esteja no meio de uma frase
        const regex = new RegExp(`\\b${respostaCerta}\\b`, 'i');
        return regex.test(msgUser);
      };

      const coletor = message.channel.createMessageCollector({ filter: filtro, time: 20000, max: 1 });

      coletor.on('collect', m => {
        const uidVencedor = m.author.id;
        if (!dados.userStats[uidVencedor]) dados.userStats[uidVencedor] = { xp: 0, level: 1, moedas: 0 };

        dados.userStats[uidVencedor].moedas = (dados.userStats[uidVencedor].moedas || 0) + 100;
        salvarDadosUser(uidVencedor, dados.userStats[uidVencedor].xp, dados.userStats[uidVencedor].level, dados.userStats[uidVencedor].moedas);

        const vitoriaEmbed = new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle('✅ Acertaste em cheio!')
          .setDescription(`${m.author}, a resposta era mesmo **${quizData.resposta}**!\n💰 +100 Moedas adicionadas à tua carteira.`)
          .setTimestamp();

        m.reply({ embeds: [vitoriaEmbed] });
      });

      coletor.on('end', collected => {
        if (collected.size === 0) {
          message.channel.send(`⏰ **O tempo voou!** Ninguém acertou. A resposta era: **${quizData.resposta}**`);
        }
      });

    } catch (err) {
      console.error("Erro no Quiz:", err);
      message.reply("❌ A IA está a pensar em muitas coisas ao mesmo tempo. Tenta de novo!");
    }
  }

  // Comando !limpar ou !clear
  if (command === 'limpar' || command === 'clear') {
    if (!isStaff) {
      const errEmbed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('❌ Sem permissão')
        .setDescription('Não tens permissão para apagar mensagens.')
        .setTimestamp();
      return message.reply({ embeds: [errEmbed] });
    }

    const amount = parseInt(args[0], 10);

    if (isNaN(amount) || amount < 1 || amount > 100) {
      const usageEmbed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle('❗ Uso do comando')
        .setDescription('Usa: `!limpar <número entre 1 e 100>`')
        .setTimestamp();
      return message.reply({ embeds: [usageEmbed] });
    }

    message.channel.bulkDelete(amount + 1, true)
      .then(deleted => {
        const limparEmbed = new EmbedBuilder()
          .setColor(0x57F287)
          .setAuthor({ name: 'Mensagens apagadas', iconURL: message.author.displayAvatarURL() })
          .setDescription(`🧹 Apaguei **${deleted.size - 1}** mensagens.`)
          .setTimestamp();
        message.channel.send({ embeds: [limparEmbed] })
          .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
      })
      .catch(err => {
        console.error('Erro ao limpar mensagens:', err);
        const errEmbed = new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle('⚠️ Erro')
          .setDescription('Não consegui apagar as mensagens. Verifica se não são muito antigas (mais de 14 dias).')
          .setTimestamp();
        message.reply({ embeds: [errEmbed] });
      });

    return;
  }
  
  // Comando !addpalavra
  if (command === 'addpalavra') {
    if (!isStaff) return;
    
    const word = args[0]?.toLowerCase();
    if (!word) return message.reply("❌ Indica a palavra a adicionar.");

    if (db) {
      try {
        const docRef = db.collection('configs').doc(guildId);
        const doc = await docRef.get();
        let words = [];
        
        if (doc.exists) words = doc.data().forbiddenWords || [];
        
        if (!words.includes(word)) {
          words.push(word);
          await docRef.set({ forbiddenWords: words }, { merge: true });
          
          // Atualizar também na RAM
          if (!dados.forbiddenWords[guildId]) dados.forbiddenWords[guildId] = [];
          dados.forbiddenWords[guildId].push(word);
          
          message.reply(`✅ Palavra **${word}** adicionada à lista de proibidas.`);
        } else {
          message.reply(`⚠️ A palavra **${word}** já está na lista.`);
        }
      } catch (e) {
        message.reply("❌ Erro ao salvar no Firebase.");
        console.error(e);
      }
    } else {
      // Fallback para RAM apenas
      if (!dados.forbiddenWords[guildId]) dados.forbiddenWords[guildId] = [];
      if (!dados.forbiddenWords[guildId].includes(word)) {
        dados.forbiddenWords[guildId].push(word);
        message.reply(`✅ Palavra **${word}** adicionada (apenas em memória).`);
      }
    }
  }
  // --- COMANDO PLAY ---
  // --- COMANDO PLAY (CORRIGIDO) ---
  if (command === 'play') {
    const canalVoz = message.member?.voice?.channel;
    if (!canalVoz) return message.reply("⚠️ Entra num canal de voz primeiro!");

    const busca = args.join(" ");
    if (!busca) return message.reply("🎵 Diz o nome da música!");

    await message.channel.sendTyping();

    try {
      const info = await play.search(busca, { limit: 1 });
      if (!info.length) return message.reply("❌ Não encontrei a música.");
      const track = info[0];

      const connection = joinVoiceChannel({
        channelId: canalVoz.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: true,
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

      const resource = await createYoutubeAudioResource(track.url);
      const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play }
      });

      connection.subscribe(player);
      player.play(resource);

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🎶 A tocar agora')
        .setDescription(`[${track.title}](${track.url})`)
        .setThumbnail(track.thumbnails[0]?.url)
        .setFooter({ text: `Pedido por ${message.author.username}` });

      message.channel.send({ embeds: [embed] });

      player.on('error', err => console.error("Erro no Player:", err.message));

    } catch (err) {
      console.error("Erro no comando Play:", err);
      message.reply("❌ Erro ao tocar música. Verifica os logs.");
    }
  }

  // --- COMANDO SAIR ---
  if (command === 'sair' || command === 'stop') {
    const connection = getVoiceConnection(message.guild.id);
    if (connection) {
      connection.destroy();
      message.reply("👋 Saí do canal!");
    } else {
      message.reply("Não estou num canal.");
    }
  }
  // Comando !rempalavra ou !removepalavra
  if (command === 'rempalavra' || command === 'removepalavra') {
    if (!isStaff) return;

    const word = args[0]?.toLowerCase();
    if (!word) return message.reply("❌ Indica a palavra que queres remover: `!rempalavra <palavra>`");

    if (db) {
      try {
        const configRef = db.collection('configs').doc(guildId);
        const doc = await configRef.get();

        if (doc.exists) {
          let words = doc.data().forbiddenWords || [];
          
          if (words.includes(word)) {
            const novaLista = words.filter(w => w !== word);
            await configRef.update({ forbiddenWords: novaLista });
            
            // Atualizar também na RAM
            if (dados.forbiddenWords[guildId]) {
              dados.forbiddenWords[guildId] = dados.forbiddenWords[guildId].filter(w => w !== word);
            }
            
            message.reply(`🗑️ A palavra **${word}** foi removida da lista de proibidas.`);
          } else {
            message.reply(`⚠️ A palavra **${word}** não está na lista.`);
          }
        } else {
          message.reply("❌ Não encontrei nenhuma configuração para este servidor.");
        }
      } catch (e) {
        console.error("Erro ao remover palavra:", e);
        message.reply("❌ Houve um erro ao tentar remover a palavra no Firebase.");
      }
    } else {
      // Fallback para RAM apenas
      if (dados.forbiddenWords[guildId] && dados.forbiddenWords[guildId].includes(word)) {
        dados.forbiddenWords[guildId] = dados.forbiddenWords[guildId].filter(w => w !== word);
        message.reply(`🗑️ A palavra **${word}** foi removida (apenas em memória).`);
      } else {
        message.reply(`⚠️ A palavra **${word}** não está na lista.`);
      }
    }
  }

  // Comando !palavra ou !palavras
  if (command === 'palavra' || command === 'palavras') {
    try {
      if (db) {
        const configDoc = await db.collection('configs').doc(guildId).get();
        
        if (configDoc.exists) {
          const words = configDoc.data().forbiddenWords || [];
          const lista = words.length ? words.join(', ') : '*Nenhuma palavra proibida registada.*';
          
          const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📜 Palavras Proibidas')
            .setDescription(lista)
            .setTimestamp();

          message.reply({ embeds: [embed] });
        } else {
          message.reply("⚠️ Este servidor ainda não tem configuração no Firebase. Use `!addpalavra` primeiro.");
        }
      } else {
        // Fallback para RAM
        const words = dados.forbiddenWords[guildId] || [];
        const lista = words.length ? words.join(', ') : '*Nenhuma palavra proibida registada.*';
        
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('📜 Palavras Proibidas (Memória)')
          .setDescription(lista)
          .setTimestamp();

        message.reply({ embeds: [embed] });
      }
    } catch (e) {
      console.error("Erro ao ler Firebase:", e);
      message.reply("❌ Erro técnico ao aceder à base de dados.");
    }
  }

  // Comando !help ou !ajuda
  if (command === 'help' || command === 'ajuda') {
    const helpEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('📖 Guia de Comandos do Bot')
      .setDescription('Aqui estão todos os comandos disponíveis no servidor:')
      .addFields(
        { name: '⭐ Nível e XP', value: '`!nivel` - Vê o teu nível.\n`!top` - Vê o ranking.\n`!rank` - Vê a tua posição.\n`!pergunta <pergunta>` - Pergunta algo à IA.', inline: false },
        { name: '💰 Economia', value: '`!bal` / `!moedas` - Vê o teu saldo.\n`!quiz` - Participa num quiz e ganha moedas!', inline: false },
        { name: '🛡️ Moderação', value: '`!avisos` - Consulta os teus avisos.\n`!palavras` - Lista as palavras proibidas.', inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Cantinho do Tomás', iconURL: client.user.displayAvatarURL() });

    if (isStaff) {
      helpEmbed.addFields(
        { name: '🛠️ Administração (Staff)', value: '`!addpalavra <palavra>` - Proíbe uma palavra.\n`!rempalavra <palavra>` - Remove uma palavra.\n`!limpar <1-100>` - Apaga mensagens do chat.', inline: false }
      );
    }

    return message.reply({ embeds: [helpEmbed] });
  }

  // Comando !pergunta (IA)
  if (command === 'pergunta') {
    if (!hf) {
      return message.reply('❌ A IA não está configurada. Define `HF_TOKEN` no ficheiro `.env`.');
    }

    const pergunta = args.length ? args.join(" ") : null;
    if (!pergunta) return message.reply("⚠️ Escreve uma pergunta! Exemplo: `!pergunta Como fazer um bolo?`");

    await message.channel.sendTyping();

    try {
      const response = await hf.chatCompletion({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: [
          { 
            role: "user", 
            content: `Responde em português de Portugal: ${pergunta}` 
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      });

      const respostaIA = response.choices[0].message.content;
      if (!respostaIA) throw new Error("A IA devolveu uma resposta vazia.");

      message.reply(respostaIA.trim());

    } catch (err) {
      console.error("Erro na IA:", err);

      if (err.message.includes("loading") || err.message.includes("503")) {
        return message.reply("😴 A IA está a iniciar os sistemas. Tenta novamente em 20 segundos!");
      }

      if (err.message.includes("401") || err.message.includes("Authorization")) {
        return message.reply("❌ Erro de autorização. Verifica se o teu Token no .env está correto e tem permissões de Inference.");
      }

      message.reply(`❌ Erro da IA: \`${err.message}\``);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);