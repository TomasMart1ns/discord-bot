require("dotenv").config();
const http = require("http");
http
  .createServer((req, res) => {
    res.write("Bot Online");
    res.end();
  })
  .listen(process.env.PORT || 10000);
const ffmpegPath = require("ffmpeg-static");
const play = require("play-dl");
const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  Events,
  PermissionsBitField,
  EmbedBuilder,
} = require("discord.js");
const { HfInference } = require("@huggingface/inference");
const admin = require("firebase-admin");
const path = require("path");
const { spawn } = require("child_process");
const { helpers: ytdlpHelpers } = require("ytdlp-nodejs");
const { getString, formatString, LANGUAGES } = require("./strings.js");

const {
  initUserConfig,
  getUserLanguage,
  setUserLanguage,
} = require("./guildConfig.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus,
  StreamType,
  getVoiceConnection,
} = require("@discordjs/voice");

// 1. LIMPEZA NO TOPO - Variável global na RAM
let dadosGlobais = { forbiddenWords: {}, userWarnings: {}, userStats: {} };

// Função simplificada que retorna os dados da RAM
function lerDados() {
  return dadosGlobais;
}

// Autorizar play-dl (IMPORTANTE: precisa ser feito antes de usar search)
(async () => {
  try {
    await play.authorization();
    console.log("✅ play-dl autorizado com sucesso");
  } catch (e) {
    console.warn("⚠️ Aviso ao autorizar play-dl:", e.message);
  }
})();
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
  return parts.length ? parts.join("") : null;
}

const firebaseEnv = getFirebaseConfigFromEnv();
if (firebaseEnv) {
  try {
    let jsonStr = firebaseEnv;
    if (!jsonStr.startsWith("{")) {
      jsonStr = Buffer.from(jsonStr, "base64").toString("utf8");
    }
    const serviceAccount = JSON.parse(jsonStr);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
    initUserConfig(db);
  } catch (e) {
    console.warn("Firebase: Erro na configuração.", e.message);
  }
} else {
  const configPath = path.join(__dirname, "FIREBASE_CONFIG.json");
  if (fs.existsSync(configPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(configPath, "utf8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      db = admin.firestore();
      initUserConfig(db);
    } catch (e) {
      console.warn(
        "Firebase: erro ao ler FIREBASE_CONFIG.json, a correr sem Firestore.",
        e.message,
      );
    }
  } else {
    console.warn(
      "Firebase: sem FIREBASE_CONFIG nem FIREBASE_CONFIG.json — o bot corre sem Firestore.",
    );
  }
}

// 3. FUNÇÃO ATUALIZADA PARA SALVAR XP + MOEDAS
async function salvarDadosUser(userId, xp, level, moedas) {
  if (!db) return;
  try {
    await db
      .collection("usuarios")
      .doc(userId)
      .set(
        {
          xp: Number(xp),
          level: Number(level),
          moedas: Number(moedas || 0),
          lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
  } catch (e) {
    console.error("Erro ao salvar no Firebase:", e.message);
  }
}

// --- CONFIGURAÇÃO IA (token apenas via .env — nunca em código) ---
const HF_TOKEN = process.env.HF_TOKEN;
const hf = HF_TOKEN ? new HfInference(HF_TOKEN) : null;

// ffmpeg-static: prism-media procura `require('ffmpeg-static')`; o pacote também aceita env FFMPEG_BIN
try {
  const ffmpegStatic = require("ffmpeg-static");
  const p =
    typeof ffmpegStatic === "string" ? ffmpegStatic : ffmpegStatic?.path;
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

const PREFIX = "!";
const MEU_ID = "601074003234521119";
const CARGO_MEMBRO_ID = "1432386547222581270";
const CANAL_BOAS_VINDAS_ID = "1432386634128687295";

function getSortedLeaderboardEntries(dados, guild) {
  const stats = dados?.userStats || {};
  const entries = Object.entries(stats)
    .map(([userId, s]) => ({
      userId,
      level: Number(s?.level ?? 1),
      xp: Number(s?.xp ?? 0),
      moedas: Number(s?.moedas ?? 0),
    }))
    .filter((e) => Number.isFinite(e.level) && Number.isFinite(e.xp))
    .filter((e) => {
      if (!guild) return true;
      if (!guild.members?.cache) return true;
      if (guild.members.cache.size === 0) return true;
      return guild.members.cache.has(e.userId);
    })
    .sort(
      (a, b) =>
        b.level - a.level || b.xp - a.xp || a.userId.localeCompare(b.userId),
    );

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
  if (!bin) throw new Error("Binário yt-dlp não disponível.");

  // Dar permissão de execução ao binário
  try {
    fs.chmodSync(bin, 0o755);
    console.log(`✅ Permissão de execução concedida a ${bin}`);
  } catch (err) {
    console.warn(`⚠️ Não consegui dar permissão de execução: ${err.message}`);
  }

  return bin;
}

/**
 * Stream de áudio do YouTube via play-dl (search) + ytdlp (streaming) + FFmpeg (decoding).
 */
async function createYoutubeAudioResource(videoUrlOrSearch) {
  if (!videoUrlOrSearch || videoUrlOrSearch === "undefined") {
    throw new Error("URL de vídeo inválida ou vazia.");
  }

  try {
    let videoUrl = videoUrlOrSearch;

    // STEP 1: Se for um termo de busca (não URL), usar play-dl para pesquisar
    if (
      !videoUrlOrSearch.includes("youtube.com") &&
      !videoUrlOrSearch.includes("youtu.be")
    ) {
      console.log(`[play.search] Procurando: "${videoUrlOrSearch}"`);
      const searchResults = await play.search(videoUrlOrSearch, { limit: 1 });

      if (!searchResults || searchResults.length === 0) {
        throw new Error(
          `Não encontrei nenhuma música para "${videoUrlOrSearch}"`,
        );
      }

      videoUrl = searchResults[0].url;
      console.log(`[play.search] Encontrado: ${searchResults[0].title}`);
    }

    // STEP 2: Usar ytdlp para extrair a URL de streaming direto
    console.log(`[ytdlp] Extraindo stream de: ${videoUrl}`);
    const ytdlpBin = await getYtDlpBinary();

    const streamUrl = await new Promise((resolve, reject) => {
      const ytdlpProcess = spawn(
        ytdlpBin,
        [
          "-f",
          "bestaudio",
          "-g",
          "--no-warnings",
          "--socket-timeout",
          "30",
          videoUrl,
        ],
        { timeout: 60000 },
      );

      let output = "";
      let errorOutput = "";

      ytdlpProcess.stdout.on("data", (data) => {
        output += data.toString().trim();
      });

      ytdlpProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      ytdlpProcess.on("close", (code) => {
        if (code === 0 && output) {
          console.log(`[ytdlp] ✅ Stream URL extraída`);
          resolve(output.split("\n")[0]);
        } else {
          console.error(`[ytdlp] ❌ Erro (código ${code}): ${errorOutput}`);
          reject(new Error(`ytdlp falhou: código ${code}`));
        }
      });

      ytdlpProcess.on("error", (err) => {
        reject(new Error(`Erro ao iniciar ytdlp: ${err.message}`));
      });
    });

    // STEP 3: Usar FFmpeg para decodificar para PCM (Discord-compatível)
    console.log(`[FFmpeg] A decodificar stream...`);
    const ffmpeg = spawn("ffmpeg", [
      "-reconnect",
      "1",
      "-reconnect_streamed",
      "1",
      "-reconnect_delay_max",
      "5",
      "-i",
      streamUrl,
      "-analyzeduration",
      "0",
      "-loglevel",
      "error",
      "-f",
      "s16le",
      "-ar",
      "48000",
      "-ac",
      "2",
      "pipe:1",
    ]);

    let ffmpegStarted = false;

    ffmpeg.stdout.on("data", () => {
      if (!ffmpegStarted) {
        ffmpegStarted = true;
        console.log(`[FFmpeg] ✅ Stream ativo`);
      }
    });

    ffmpeg.on("error", (err) => {
      console.error("[FFmpeg] Erro:", err.message);
    });

    ffmpeg.on("close", (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[FFmpeg] Processo terminou com código ${code}`);
      }
    });

    // STEP 4: Criar AudioResource a partir do FFmpeg stdout
    const resource = createAudioResource(ffmpeg.stdout, {
      inputType: StreamType.Raw,
      inlineVolume: true,
    });

    console.log(`[Audio] ✅ Resource criado com sucesso`);
    return resource;
  } catch (err) {
    console.error(`[Audio] ❌ Erro:`, err.message);
    throw err;
  }
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
client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  // Registrar o comando de clique direito nas mensagens
  const traduzirCommand = {
    name: "Traduzir Mensagem",
    type: 3, // 3 é o tipo MESSAGE para Context Menus
  };

  try {
    await client.application.commands.create(traduzirCommand);
    console.log("Comando de tradução registrado!");
  } catch (err) {
    console.error("Erro ao registrar comando:", err);
  }
});

// 2. CORREÇÃO DO EVENTO READY
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot online! Logado como ${c.user.tag}`);

  if (db) {
    try {
      const snapshot = await db.collection("usuarios").get();
      // Puxamos os dados do Firebase diretamente para a variável na RAM
      snapshot.forEach((doc) => {
        const userData = doc.data();
        dadosGlobais.userStats[doc.id] = {
          xp: Number(userData.xp || 0),
          level: Number(userData.level || 1),
          moedas: Number(userData.moedas || 0),
        };
      });
      console.log("🔄 Sincronização concluída: Dados carregados na RAM.");
    } catch (e) {
      console.error("❌ Erro ao carregar do Firebase:", e.message);
    }
  }
});
client.on(Events.InteractionCreate, async (interaction) => {
  if (
    interaction.isMessageContextMenuCommand() &&
    interaction.commandName === "Traduzir Mensagem"
  ) {
    // 64 = ephemeral (só tu vês a resposta)
    await interaction.deferReply({ flags: 64 });

    const mensagemParaTraduzir = interaction.targetMessage.content;

    // 1. Vai buscar o TEU idioma (DE) ao Firebase
    const lang = await getUserLanguage(interaction.user.id);

    // 2. Mapeamento para a IA saber o nome da língua
    const langMapNames = {
      CS: "Czech",
      RU: "Russian",
      PT: "Portuguese (Portugal)",
      EN: "English",
      DE: "German",
      FR: "French",
    };

    // Se não encontrar nada, o padrão é Portuguese
    const targetLang = langMapNames[lang] || "Portuguese (Portugal)";

    try {
      const translation = await hf.chatCompletion({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. 
            Your task is to translate the user's message strictly into ${targetLang}. 
            Do not provide any explanations, just the translated text. 
            Translate even if the source is already in ${targetLang}.`,
          },
          { role: "user", content: mensagemParaTraduzir },
        ],
      });

      const traducao = translation.choices[0].message.content.trim();

      // 3. Envia a resposta com o título correto
      await interaction.editReply({
        content: `**Tradução para ${lang}:**\n> ${traducao}`,
      });
    } catch (error) {
      console.error("Erro na tradução:", error);
      await interaction.editReply({
        content: "⚠️ Erro ao processar a tradução.",
      });
    }
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const role = member.guild.roles.cache.get(CARGO_MEMBRO_ID);
    if (role) await member.roles.add(role);
  } catch (err) {
    console.error("Erro ao atribuir cargo:", err);
  }

  const canalBoasVindas = member.guild.channels.cache.get(CANAL_BOAS_VINDAS_ID);
  if (canalBoasVindas) {
    const lang = getServerLanguage(member.guild.id);
    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("👋 Bem-vindo(a)!")
      .setDescription(getString("WELCOME", lang, member.user))
      .setThumbnail(member.user.displayAvatarURL())
      .addFields({ name: "ID do utilizador", value: member.id, inline: true })
      .setTimestamp()
      .setFooter({ text: "Bem-vindo ao Cantinho do Tomás!" });

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
      const configDoc = await db.collection("configs").doc(guildId).get();
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

  const hasForbiddenWord = serverWords.some((word) =>
    message.content.toLowerCase().includes(word),
  );

  if (hasForbiddenWord && uid !== MEU_ID) {
    if (message.deletable) await message.delete().catch(() => {});
    const lang = await getUserLanguage(message.author.id);

    if (!dados.userWarnings[uid]) dados.userWarnings[uid] = 0;
    dados.userWarnings[uid] += 1;

    if (dados.userWarnings[uid] >= 5) {
      try {
        await message.member.timeout(10 * 60 * 1000, "Atingiu 5 avisos.");
        await message.channel.send(getString("MUTED", lang, message.author));
      } catch (e) {
        console.error("Erro ao aplicar timeout:", e);
        await message.channel.send(
          getString("MUTE_FAILED", lang, message.author),
        );
      }
      dados.userWarnings[uid] = 0;
    } else {
      await message.channel.send(
        getString(
          "WARNING_COUNT",
          lang,
          message.author,
          dados.userWarnings[uid],
        ),
      );
    }
    return;
  }

  // --- XP (CORRIGIDO - SEM ESCRITA EM FICHEIRO) ---
  if (!dados.userStats[uid])
    dados.userStats[uid] = { xp: 0, level: 1, moedas: 0 };

  const xpGanhado = Math.floor(Math.random() * 5) + 1;
  dados.userStats[uid].xp += xpGanhado;

  if (dados.userStats[uid].xp >= dados.userStats[uid].level * 100) {
    dados.userStats[uid].level += 1;
    dados.userStats[uid].xp = 0;
    const lang = await getUserLanguage(message.author.id);

    const levelUpEmbed = new EmbedBuilder()
      .setColor(0x57f287)
      .setAuthor({
        name: getString("LEVEL_UP_TITLE", lang),
        iconURL: message.author.displayAvatarURL(),
      })
      .setDescription(
        getString("LEVEL_UP", lang, message.author, dados.userStats[uid].level),
      )
      .setTimestamp()
      .setFooter({ text: "Cantinho do Tomás" });

    message.channel.send({ embeds: [levelUpEmbed] });
  }

  // Guardamos apenas na nuvem (Firebase) com a nova função que inclui moedas
  salvarDadosUser(
    uid,
    dados.userStats[uid].xp,
    dados.userStats[uid].level,
    dados.userStats[uid].moedas,
  ).catch((err) => console.error("Erro Firebase:", err));

  // --- COMANDOS ---
  if (!message.content.startsWith(PREFIX)) return;

  // Extrair argumentos e comando
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const isStaff = message.member.permissions.has(
    PermissionsBitField.Flags.ManageMessages,
  );

  // Cooldown para comandos que não são só leitura
  const comandoSoLeitura =
    command === "nivel" ||
    command === "avisos" ||
    command === "palavras" ||
    command === "rank" ||
    command === "top" ||
    command === "ranking" ||
    command === "pergunta" ||
    command === "help" ||
    command === "bal" ||
    command === "carteira" ||
    command === "moedas";

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
  if (command === "avisos" || command === "warnings") {
    const lang = await getUserLanguage(message.author.id);
    const avisosEmbed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setAuthor({
        name: getString("WARNINGS_TITLE", lang),
        iconURL: message.author.displayAvatarURL(),
      })
      .setDescription(
        formatString(getString("WARNINGS_FIELD", lang), {
          warns: dados.userWarnings[uid] || 0,
        }),
      )
      .addFields({
        name: "Atenção",
        value: getString("WARNS_INFO", lang),
        inline: false,
      })
      .setTimestamp()
      .setFooter({ text: `Pedido por ${message.author.username}` });
    message.reply({ embeds: [avisosEmbed] });
  }

  // Comando !nivel
  if (command === "nivel" || command === "level") {
    const lang = await getUserLanguage(message.author.id);
    const xpParaProximo = dados.userStats[uid].level * 100;
    const nivelEmbed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({
        name: getString("LEVEL_TITLE", lang),
        iconURL: message.author.displayAvatarURL(),
      })
      .addFields(
        {
          name: getString("LEVEL_FIELD", lang),
          value: `**${dados.userStats[uid].level}**`,
          inline: true,
        },
        {
          name: getString("XP_FIELD", lang),
          value: `**${dados.userStats[uid].xp}** / ${xpParaProximo}`,
          inline: true,
        },
        {
          name: getString("COINS_FIELD", lang),
          value: `**${dados.userStats[uid].moedas || 0}**`,
          inline: true,
        },
        {
          name: "Próximo nível",
          value: getString(
            "NEXT_LEVEL",
            lang,
            xpParaProximo - dados.userStats[uid].xp,
          ),
          inline: false,
        },
      )
      .setTimestamp()
      .setFooter({ text: `Pedido por ${message.author.username}` });
    message.reply({ embeds: [nivelEmbed] });
  }

  // Comando !rank
  if (command === "rank") {
    const lang = await getUserLanguage(message.author.id);
    const entries = getSortedLeaderboardEntries(dados, message.guild);
    const idx = entries.findIndex((e) => e.userId === uid);
    const my = dados.userStats[uid] || { level: 1, xp: 0, moedas: 0 };

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setAuthor({
        name: getString("RANKING_TITLE", lang),
        iconURL: message.author.displayAvatarURL(),
      })
      .addFields(
        {
          name: "🏅 Posição",
          value:
            idx >= 0
              ? getString("POSITION", lang, idx + 1, entries.length)
              : getString("NO_POSITION", lang),
          inline: true,
        },
        {
          name: getString("LEVEL_FIELD", lang),
          value: `**${my.level || 1}**`,
          inline: true,
        },
        {
          name: getString("XP_FIELD", lang),
          value: `**${my.xp || 0}**`,
          inline: true,
        },
        {
          name: getString("COINS_FIELD", lang),
          value: `**${my.moedas || 0}**`,
          inline: true,
        },
      )
      .setTimestamp()
      .setFooter({ text: `Pedido por ${message.author.username}` });

    return message.reply({ embeds: [embed] });
  }

  // Comando !top ou !ranking
  if (command === "top" || command === "ranking") {
    const lang = await getUserLanguage(message.author.id);
    const nRaw = parseInt(args[0] || "10", 10);
    const n = Number.isFinite(nRaw) ? Math.min(Math.max(nRaw, 1), 25) : 10;

    const entries = getSortedLeaderboardEntries(dados, message.guild).slice(
      0,
      n,
    );
    const lines = await Promise.all(
      entries.map(async (e, i) => {
        const name = await getDisplayNameForUserId(message.guild, e.userId);
        return `**#${i + 1}** — **${name}** | Nível **${e.level}** | XP **${e.xp}** | 💰 **${e.moedas}**`;
      }),
    );

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(getString("TOP_PLAYERS", lang, entries.length))
      .setDescription(
        lines.length ? lines.join("\n") : getString("NO_XP_YET", lang),
      )
      .setTimestamp()
      .setFooter({ text: `Pedido por ${message.author.username}` });

    return message.reply({ embeds: [embed] });
  }

  // 5. COMANDO PARA VER O SALDO (!bal, !carteira, !moedas)
  if (
    command === "bal" ||
    command === "carteira" ||
    command === "moedas" ||
    command === "coins"
  ) {
    const lang = await getUserLanguage(message.author.id);
    const saldo = dados.userStats[uid]?.moedas || 0;
    const balEmbed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setAuthor({
        name: getString("BALANCE_TITLE", lang),
        iconURL: message.author.displayAvatarURL(),
      })
      .setDescription(getString("BALANCE_DESC", lang, saldo))
      .setTimestamp()
      .setFooter({ text: `Pedido por ${message.author.username}` });

    message.reply({ embeds: [balEmbed] });
  }

  // 4. COMANDO !quiz COM VARIEDADE REAL E DINÂMICA
  // 4. COMANDO !quiz COM VARIEDADE REAL E DINÂMICA
  if (command === "quiz") {
    if (!hf) {
      const lang = await getUserLanguage(message.author.id);
      return message.reply(getString("AI_NOT_CONFIGURED", lang));
    }

    await message.channel.sendTyping();
    const lang = await getUserLanguage(message.author.id);

    try {
      // Configuração de temas e nomes de línguas
      const configQuiz = {
        CS: {
          name: "Czech",
          temas: [
            "Astronomie",
            "Historie",
            "Vaření",
            "Geografie",
            "Filmy",
            "Technologie",
            "Mytologie",
            "Sport",
            "Literatura",
            "Hudba",
            "Lidské tělo",
            "Vynalez",
            "Zvířata",
            "Videohry",
            "Umění",
          ],
        },
        RU: {
          name: "Russian",
          temas: [
            "Астрономия",
            "История",
            "Кулинария",
            "География",
            "Кино",
            "Технологии",
            "Мифология",
            "Спорт",
            "Литература",
            "Музыка",
            "Человеческое тело",
            "Изобретения",
            "Животные",
            "Видеоигры",
            "Искусство",
          ],
        },
        PT: {
          name: "Portuguese",
          temas: [
            "Astronomia",
            "História",
            "Culinária",
            "Geografia",
            "Cinema",
            "Tecnologia",
            "Mitologia",
            "Desporto",
            "Literatura",
            "Música",
            "Corpo Humano",
            "Invenções",
            "Animais",
            "Videojogos",
            "Arte",
          ],
        },
        EN: {
          name: "English",
          temas: [
            "Astronomy",
            "History",
            "Cooking",
            "Geography",
            "Movies",
            "Technology",
            "Mythology",
            "Sports",
            "Literature",
            "Music",
            "Human Body",
            "Inventions",
            "Animals",
            "Video Games",
            "Art",
          ],
        },
        FR: {
          name: "French",
          temas: [
            "Astronomie",
            "Histoire",
            "Cuisine",
            "Géographie",
            "Cinéma",
            "Technologie",
            "Mythologie",
            "Sports",
            "Littérature",
            "Musique",
            "Corps Humain",
            "Inventions",
            "Animaux",
            "Jeux Vidéo",
            "Art",
          ],
        },
        DE: {
          name: "German",
          temas: [
            "Astronomie",
            "Geschichte",
            "Kochen",
            "Geographie",
            "Filme",
            "Technologie",
            "Mythologie",
            "Sport",
            "Literatur",
            "Musik",
            "Menschlicher Körper",
            "Erfindungen",
            "Tiere",
            "Videospiele",
            "Kunst",
          ],
        },
      };

      // Seleciona a config baseada no idioma do server (ou PT por defeito)
      const currentConf = configQuiz[lang] || configQuiz["PT"];
      const temaEscolhido =
        currentConf.temas[Math.floor(Math.random() * currentConf.temas.length)];
      const seed = Math.floor(Math.random() * 99999);

      // O Prompt agora é dinâmico para qualquer língua
      // O Prompt agora é dinâmico e focado em originalidade extrema
      const promptIA = `You are an Advanced Quiz Generator. 
Generate a HIGHLY UNIQUE and OBSCURE trivia question in ${currentConf.name}.
VARIATION SEED: ${seed}
THEME: ${temaEscolhido}

RULES:
- The question must be about a rare, specific, or complex fact to avoid repetition.
- The question and answer must be in ${currentConf.name}.
- The answer must be ONLY ONE WORD.
- Reply ONLY in JSON: {"pergunta": "...", "resposta": "..."}`;

      const response = await hf.chatCompletion({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: [{ role: "user", content: promptIA }],
        max_tokens: 250,
        temperature: 1.5, // Aumentado para máxima criatividade
      });

      let quizData;
      try {
        const cleanContent = response.choices[0].message.content
          .replace(/```json|```/g, "")
          .trim();
        quizData = JSON.parse(cleanContent);
      } catch (e) {
        throw new Error(getString("QUIZ_PROCESSING_ERROR", lang));
      }

      // --- LOGICA DE NORMALIZAÇÃO ---
      const normalizar = (str) =>
        str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();
      const respostaCerta = normalizar(quizData.resposta);

      const quizEmbed = new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle(getString("QUIZ_TITLE", lang))
        .addFields({
          name: getString("QUIZ_THEME", lang),
          value: `✨ ${temaEscolhido}`,
          inline: true,
        })
        .setDescription(
          `**${getString("QUIZ_QUESTION", lang)}:** ${quizData.pergunta}`,
        )
        .setFooter({ text: getString("QUIZ_FOOTER", lang) });

      message.channel.send({ embeds: [quizEmbed] });

      const filtro = (m) => {
        if (m.author.bot) return false;
        const msgUser = normalizar(m.content);
        const regex = new RegExp(`\\b${respostaCerta}\\b`, "i");
        return regex.test(msgUser);
      };

      const coletor = message.channel.createMessageCollector({
        filter: filtro,
        time: 20000,
        max: 1,
      });

      coletor.on("collect", (m) => {
        const uidVencedor = m.author.id;
        if (!dados.userStats[uidVencedor])
          dados.userStats[uidVencedor] = { xp: 0, level: 1, moedas: 0 };

        dados.userStats[uidVencedor].moedas =
          (dados.userStats[uidVencedor].moedas || 0) + 100;
        salvarDadosUser(
          uidVencedor,
          dados.userStats[uidVencedor].xp,
          dados.userStats[uidVencedor].level,
          dados.userStats[uidVencedor].moedas,
        );

        const vitoriaEmbed = new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle(getString("QUIZ_CORRECT", lang))
          .setDescription(
            getString("QUIZ_CORRECT_DESC", lang, m.author, quizData.resposta),
          )
          .setTimestamp();

        m.reply({ embeds: [vitoriaEmbed] });
      });

      coletor.on("end", (collected) => {
        if (collected.size === 0) {
          message.channel.send(
            getString("QUIZ_TIMEOUT", lang, quizData.resposta),
          );
        }
      });
    } catch (err) {
      console.error("Erro no Quiz:", err);
      message.reply(getString("QUIZ_ERROR", lang));
    }
  }

  // Comando !limpar ou !clear
  if (command === "limpar" || command === "clear") {
    const lang = await getUserLanguage(message.author.id);
    if (!isStaff) {
      const errEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle(getString("PERMISSION_TITLE", lang))
        .setDescription(getString("NO_PERMISSION", lang))
        .setTimestamp();
      return message.reply({ embeds: [errEmbed] });
    }

    const amount = parseInt(args[0], 10);

    if (isNaN(amount) || amount < 1 || amount > 100) {
      const usageEmbed = new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle(getString("USAGE_TITLE", lang))
        .setDescription(getString("CLEAR_USAGE", lang))
        .setTimestamp();
      return message.reply({ embeds: [usageEmbed] });
    }

    message.channel
      .bulkDelete(amount + 1, true)
      .then((deleted) => {
        const limparEmbed = new EmbedBuilder()
          .setColor(0x57f287)
          .setAuthor({
            name: getString("MESSAGES_DELETED_TITLE", lang),
            iconURL: message.author.displayAvatarURL(),
          })
          .setDescription(
            getString("MESSAGES_DELETED_DESC", lang, deleted.size - 1),
          )
          .setTimestamp();
        message.channel
          .send({ embeds: [limparEmbed] })
          .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
      })
      .catch((err) => {
        console.error("Erro ao limpar mensagens:", err);
        const errEmbed = new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle("⚠️ Erro")
          .setDescription(getString("CLEAR_ERROR", lang))
          .setTimestamp();
        message.reply({ embeds: [errEmbed] });
      });

    return;
  }

  // Comando !addpalavra
  if (command === "addpalavra" || command === "addword") {
    if (!isStaff) return;
    const lang = await getUserLanguage(message.author.id);

    const word = args[0]?.toLowerCase();
    if (!word) return message.reply(getString("ADD_WORD_MISSING", lang));

    if (db) {
      try {
        const docRef = db.collection("configs").doc(guildId);
        const doc = await docRef.get();
        let words = [];

        if (doc.exists) words = doc.data().forbiddenWords || [];

        if (!words.includes(word)) {
          words.push(word);
          await docRef.set({ forbiddenWords: words }, { merge: true });

          // Atualizar também na RAM
          if (!dados.forbiddenWords[guildId])
            dados.forbiddenWords[guildId] = [];
          dados.forbiddenWords[guildId].push(word);

          message.reply(getString("WORD_ADDED", lang, word));
        } else {
          message.reply(getString("WORD_EXISTS", lang, word));
        }
      } catch (e) {
        message.reply(getString("FIREBASE_ERROR", lang));
        console.error(e);
      }
    } else {
      // Fallback para RAM apenas
      if (!dados.forbiddenWords[guildId]) dados.forbiddenWords[guildId] = [];
      if (!dados.forbiddenWords[guildId].includes(word)) {
        dados.forbiddenWords[guildId].push(word);
        message.reply(getString("WORD_ADDED_MEMORY", lang, word));
      }
    }
  }
  // --- COMANDO PLAY (MENSAGENS EM PORTUGUÊS) ---
  if (command === "play") {
    const canalVoz = message.member?.voice?.channel;
    if (!canalVoz) return message.reply(getString("NO_VOICE_CHANNEL", "PT"));

    const busca = args.join(" ");
    if (!busca) return message.reply(getString("MUSIC_SONG_NAME", "PT"));

    await message.channel.sendTyping();

    try {
      console.log(`🔍 A procurar: "${busca}"`);
      message.reply(
        formatString(getString("MUSIC_PLAY", "PT"), { busca: busca }),
      );

      // STEP 1: Criar conexão de voz PRIMEIRO
      const connection = joinVoiceChannel({
        channelId: canalVoz.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: true,
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      console.log("✅ Conectado ao canal de voz");

      // STEP 2: Passar o termo de busca DIRETO para play.stream (não a URL)
      console.log(`🎵 A criar stream para: "${busca}"`);
      const resource = await createYoutubeAudioResource(busca);
      console.log("✅ Stream criado com sucesso");

      // STEP 3: Criar player e tocar
      const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play },
      });

      connection.subscribe(player);
      player.play(resource);
      console.log("▶️ Música a tocar");

      // Embed de confirmação
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(getString("MUSIC_TITLE", "PT"))
        .setDescription(getString("MUSIC_DESC", "PT", busca))
        .setFooter({ text: `Pedido por ${message.author.username}` });

      message.channel.send({ embeds: [embed] });

      // Listeners
      player.on(AudioPlayerStatus.Playing, () => {
        console.log("🎵 Player: em reprodução");
      });

      player.on(AudioPlayerStatus.Idle, () => {
        console.log("⏸️ Player: música terminou");
      });

      player.on("error", (err) => {
        console.error("❌ Erro no Player:", err.message);
        message.channel
          .send(getString("MUSIC_ERROR", "PT", err.message))
          .catch(() => {});
      });
    } catch (err) {
      console.error("❌ Erro no comando Play:", err.message);
      console.error("Stack:", err.stack);
      message.reply(`❌ Erro: \`${err.message}\``);
    }
  }

  // --- COMANDO SAIR (PORTUGUÊS) ---
  if (command === "sair" || command === "stop") {
    const connection = getVoiceConnection(message.guild.id);
    if (connection) {
      connection.destroy();
      message.reply(getString("BOT_LEFT", "PT"));
    } else {
      message.reply(getString("NOT_IN_CHANNEL", "PT"));
    }
  }
  // Comando !rempalavra ou !removepalavra
  if (
    command === "rempalavra" ||
    command === "removepalavra" ||
    command === "removeword"
  ) {
    if (!isStaff) return;
    const lang = await getUserLanguage(message.author.id);

    const word = args[0]?.toLowerCase();
    if (!word) return message.reply(getString("REMOVE_WORD_MISSING", lang));

    if (db) {
      try {
        const configRef = db.collection("configs").doc(guildId);
        const doc = await configRef.get();

        if (doc.exists) {
          let words = doc.data().forbiddenWords || [];

          if (words.includes(word)) {
            const novaLista = words.filter((w) => w !== word);
            await configRef.update({ forbiddenWords: novaLista });

            // Atualizar também na RAM
            if (dados.forbiddenWords[guildId]) {
              dados.forbiddenWords[guildId] = dados.forbiddenWords[
                guildId
              ].filter((w) => w !== word);
            }

            message.reply(getString("WORD_REMOVED", lang, word));
          } else {
            message.reply(getString("WORD_NOT_FOUND", lang, word));
          }
        } else {
          message.reply(getString("CONFIG_NOT_FOUND", lang));
        }
      } catch (e) {
        console.error("Erro ao remover palavra:", e);
        message.reply(getString("REMOVE_ERROR", lang));
      }
    } else {
      // Fallback para RAM apenas
      if (
        dados.forbiddenWords[guildId] &&
        dados.forbiddenWords[guildId].includes(word)
      ) {
        dados.forbiddenWords[guildId] = dados.forbiddenWords[guildId].filter(
          (w) => w !== word,
        );
        message.reply(getString("WORD_REMOVED", lang, word));
      } else {
        message.reply(getString("WORD_NOT_FOUND", lang, word));
      }
    }
  }

  // Comando !palavra ou !palavras
  if (command === "palavra" || command === "palavras" || command === "words") {
    const lang = await getUserLanguage(message.author.id);
    try {
      if (db) {
        const configDoc = await db.collection("configs").doc(guildId).get();

        if (configDoc.exists) {
          const words = configDoc.data().forbiddenWords || [];
          const lista = words.length
            ? words.join(", ")
            : getString("NO_FORBIDDEN_WORDS", lang);

          const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(getString("FORBIDDEN_WORDS_TITLE", lang))
            .setDescription(lista)
            .setTimestamp();

          message.reply({ embeds: [embed] });
        } else {
          message.reply(getString("NO_CONFIG", lang));
        }
      } else {
        // Fallback para RAM
        const words = dados.forbiddenWords[guildId] || [];
        const lista = words.length
          ? words.join(", ")
          : getString("NO_FORBIDDEN_WORDS", lang);

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(getString("FORBIDDEN_WORDS_TITLE", lang) + " (Memória)")
          .setDescription(lista)
          .setTimestamp();

        message.reply({ embeds: [embed] });
      }
    } catch (e) {
      console.error("Erro ao ler Firebase:", e);
      message.reply("❌ Erro técnico ao aceder à base de dados.");
    }
  }

  // Comando !idiomas ou !languages (totalmente automático e traduzido)
  if (command === "idiomas" || command === "languages" || command === "langs") {
    const lang = await getUserLanguage(message.author.id);

    const idiomasMap = {
      PT: { nome: "Português", bandeira: "🇵🇹", codigo: "PT" },
      EN: { nome: "English", bandeira: "🇬🇧", codigo: "EN" },
      DE: { nome: "Deutsch", bandeira: "🇩🇪", codigo: "DE" },
      CS: { nome: "Čeština", bandeira: "🇨🇿", codigo: "CS" },
      RU: { nome: "Русский", bandeira: "🇷🇺", codigo: "RU" },
      FR: { nome: "Français", bandeira: "🇫🇷", codigo: "FR" },
      CS: { nome: "Čeština", bandeira: "🇨🇿", codigo: "CS" },
      RU: { nome: "Русский", bandeira: "🇷🇺", codigo: "RU" },
    };

    const idiomaAtual = idiomasMap[lang] || idiomasMap["PT"];

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(getString("LANGUAGES_TITLE", lang))
      .setDescription(
        getString("LANGUAGES_DESC", lang, Object.keys(idiomasMap).length),
      )
      .addFields(
        {
          name: "🇵🇹 Português (PT)",
          value: getString("LANGUAGE_PT", lang),
          inline: true,
        },
        {
          name: "🇬🇧 English (EN)",
          value: getString("LANGUAGE_EN", lang),
          inline: true,
        },
        {
          name: "🇩🇪 Deutsch (DE)",
          value: getString("LANGUAGE_DE", lang),
          inline: true,
        },
        {
          name: "🇫🇷 Français (FR)",
          value: getString("LANGUAGE_FR", lang),
          inline: true,
        },
        {
          name: "🇨🇿 Čeština (CS)",
          value: getString("LANGUAGE_CS", lang),
          inline: true,
        },
        {
          name: "🇷🇺 Русский (RU)",
          value: getString("LANGUAGE_RU", lang),
          inline: true,
        },
        {
          name: getString("CHANGE_LANGUAGE", lang),
          value: getString("CHANGE_LANGUAGE_DESC", lang),
          inline: false,
        },
      )
      .addFields({
        name: getString("CURRENT_LANGUAGE_TITLE", lang),
        value: `${idiomaAtual.bandeira} **${idiomaAtual.nome}** (${idiomaAtual.codigo})`,
        inline: false,
      })
      .setTimestamp()
      .setFooter({
        text: `Pedido por ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      });

    message.reply({ embeds: [embed] });
  }
  // Comando !help ou !ajuda (AGORA DINÂMICO COM IDIOMAS)
  if (command === "help" || command === "ajuda") {
    const lang = await getUserLanguage(message.author.id);

    const helpEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(getString("HELP_TITLE", lang))
      .setDescription(getString("HELP_DESC", lang))
      .addFields(
        {
          name: getString("HELP_LEVEL", lang),
          value: getString("HELP_LEVEL_VALUE", lang),
          inline: false,
        },
        {
          name: getString("HELP_ECONOMY", lang),
          value: getString("HELP_ECONOMY_VALUE", lang),
          inline: false,
        },
        {
          name: getString("HELP_MOD", lang),
          value: getString("HELP_MOD_VALUE", lang),
          inline: false,
        },
      )
      .setTimestamp()
      .setFooter({
        text: "Cantinho do Tomás",
        iconURL: client.user.displayAvatarURL(),
      });

    if (isStaff) {
      helpEmbed.addFields({
        name: getString("HELP_ADMIN", lang),
        value: getString("HELP_ADMIN_VALUE", lang),
        inline: false,
      });
    }

    return message.reply({ embeds: [helpEmbed] });
  }

  // Comando !pergunta (IA)
  if (command === "pergunta" || command === "ask") {
    const lang = await getUserLanguage(message.author.id);
    if (!hf) {
      return message.reply(getString("AI_NOT_CONFIGURED", lang));
    }

    const pergunta = args.length ? args.join(" ") : null;
    if (!pergunta) return message.reply(getString("ASK_MISSING", lang));

    await message.channel.sendTyping();

    try {
      const langNames = {
        PT: "Portuguese (Portugal)",
        EN: "English",
        DE: "German",
        FR: "French",
        CS: "Czech",
        RU: "Russian",
      };
      const targetLangName = langNames[lang] || "Portuguese (Portugal)";
      const response = await hf.chatCompletion({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant. You MUST answer the user strictly in ${targetLangName}. Do not use any other language.`,
          },
          { role: "user", content: pergunta },
        ],
        max_tokens: 400,
        temperature: 0.7,
      });
      const respostaIA = response.choices[0].message.content;
      if (!respostaIA) throw new Error("A IA devolveu uma resposta vazia.");

      message.reply(respostaIA.trim());
    } catch (err) {
      console.error("Erro na IA:", err);
      const lang = await getUserLanguage(message.author.id);

      if (err.message.includes("loading") || err.message.includes("503")) {
        return message.reply(getString("AI_LOADING", lang));
      }

      if (
        err.message.includes("401") ||
        err.message.includes("Authorization")
      ) {
        return message.reply(getString("AI_AUTH_ERROR", lang));
      }

      message.reply(getString("AI_ERROR", lang, err.message));
    }
  }

  // --- COMANDO IDIOMA ---
  if (command === "lang" || command === "idioma") {
    const current = await getUserLanguage(message.author.id);

    const langMap = {
      PT: "🇵🇹 Português",
      EN: "🇬🇧 English",
      DE: "🇩🇪 Deutsch",
      FR: "🇫🇷 Français",
      CS: "🇨🇿 Čeština",
      RU: "🇷🇺 Русский",
    };

    const novoIdioma = args[0]?.toUpperCase();

    if (!novoIdioma) {
      return message.reply(`🌐 O teu idioma atual é **${langMap[current]}**`);
    }

    if (!langMap[novoIdioma]) {
      return message.reply("❌ Usa: PT, EN, DE, FR, CS ou RU");
    }

    await setUserLanguage(message.author.id, novoIdioma);

    return message.reply(
      `✅ O teu idioma foi alterado para **${langMap[novoIdioma]}**`,
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
