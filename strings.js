/**
 * Sistema de tradução para o bot
 * Suporta: PT (português), EN (inglês), DE (alemão), FR (francês), CS (checo), RU (russo)
 * Nota: Mensagens de música (🎶) sempre em português
 */

const LANGUAGES = {
  PT: "PT",
  EN: "EN",
  DE: "DE",
  FR: "FR",
  CS: "CS", // Czech
  RU: "RU", // Russian
};

const STRINGS = {
  // ===== BOAS-VINDAS =====
  WELCOME: {
    PT: (member) => `Olá ${member}, espero que te divirtas no meu servidor!`,
    EN: (member) => `Hello ${member}, hope you have fun on my server!`,
    DE: (member) =>
      `Hallo ${member}, ich hoffe du hast Spaß auf meinem Server!`,
    FR: (member) =>
      `Bonjour ${member}, j'espère que tu t'amuseras sur mon serveur !`,
    CS: (member) => `Ahoj ${member}, doufám, že se na mém serveru pobavíš!`,
    RU: (member) =>
      `Привет ${member}, надеюсь, тебе будет весело на моём сервере!`,
  },

  // ===== AVISOS E ADVERTÊNCIAS =====
  NO_VOICE_CHANNEL: {
    PT: "⚠️ Entra num canal de voz primeiro!",
    EN: "⚠️ Join a voice channel first!",
    DE: "⚠️ Tritt zuerst einem Sprachkanal bei!",
    FR: "⚠️ Rejoins d'abord un canal vocal !",
    CS: "⚠️ Nejprve se připoj k hlasovému kanálu!",
    RU: "⚠️ Сначала зайди в голосовой канал!",
  },
  MUTED: {
    PT: (author) => `🚫 ${author}, foste mutado por 10 min.`,
    EN: (author) => `🚫 ${author}, you've been muted for 10 min.`,
    DE: (author) => `🚫 ${author}, du wurdest für 10 Minuten stummgeschaltet.`,
    FR: (author) => `🚫 ${author}, tu as été muet pour 10 minutes.`,
    CS: (author) => `🚫 ${author}, byl jsi ztlumen na 10 minut.`,
    RU: (author) => `🚫 ${author}, ты был заглушен на 10 минут.`,
  },
  MUTE_FAILED: {
    PT: (author) =>
      `⚠️ ${author}, atingiste 5 avisos mas não consegui aplicar o mute automaticamente.`,
    EN: (author) =>
      `⚠️ ${author}, you reached 5 warnings but I couldn't apply the mute automatically.`,
    DE: (author) =>
      `⚠️ ${author}, du hast 5 Verwarnungen erreicht, aber ich konnte die Stummschaltung nicht automatisch anwenden.`,
    FR: (author) =>
      `⚠️ ${author}, tu as atteint 5 avertissements mais je n'ai pas pu appliquer le mute automatiquement.`,
    CS: (author) =>
      `⚠️ ${author}, dosáhl jsi 5 varování, ale nemohl jsem automaticky aplikovat ztlumení.`,
    RU: (author) =>
      `⚠️ ${author}, ты получил 5 предупреждений, но я не смог автоматически применить мут.`,
  },
  WARNING_COUNT: {
    PT: (author, count) => `⚠️ ${author}, aviso ${count}/5.`,
    EN: (author, count) => `⚠️ ${author}, warning ${count}/5.`,
    DE: (author, count) => `⚠️ ${author}, Verwarnung ${count}/5.`,
    FR: (author, count) => `⚠️ ${author}, avertissement ${count}/5.`,
    CS: (author, count) => `⚠️ ${author}, varování ${count}/5.`,
    RU: (author, count) => `⚠️ ${author}, предупреждение ${count}/5.`,
  },
  FORBIDDEN_WORD: {
    PT: "Palavra proibida detectada!",
    EN: "Forbidden word detected!",
    DE: "Verbotenes Wort erkannt!",
    FR: "Mot interdit détecté !",
    CS: "Bylo detekováno zakázané slovo!",
    RU: "Обнаружено запрещённое слово!",
  },

  // ===== NÍVEL UP =====
  LEVEL_UP: {
    PT: (author, level) =>
      `🎉 Parabéns ${author}! Agora és nível **${level}**!`,
    EN: (author, level) =>
      `🎉 Congratulations ${author}! You're now level **${level}**!`,
    DE: (author, level) =>
      `🎉 Glückwunsch ${author}! Du bist jetzt Level **${level}**!`,
    FR: (author, level) =>
      `🎉 Félicitations ${author}! Tu es maintenant niveau **${level}**!`,
    CS: (author, level) =>
      `🎉 Gratuluji ${author}! Nyní jsi na úrovni **${level}**!`,
    RU: (author, level) =>
      `🎉 Поздравляю ${author}! Теперь ты уровень **${level}**!`,
  },

  // ===== EMBEDS TÍTULO =====
  WARNINGS_TITLE: {
    PT: "Avisos",
    EN: "Warnings",
    DE: "Verwarnungen",
    FR: "Avertissements",
    CS: "Varování",
    RU: "Предупреждения",
  },
  LEVEL_TITLE: {
    PT: "Nível e XP",
    EN: "Level and XP",
    DE: "Level und XP",
    FR: "Niveau et XP",
    CS: "Úroveň a XP",
    RU: "Уровень и XP",
  },
  RANKING_TITLE: {
    PT: "Ranking",
    EN: "Ranking",
    DE: "Rangliste",
    FR: "Classement",
    CS: "Žebříček",
    RU: "Рейтинг",
  },
  LEVEL_UP_TITLE: {
    PT: "Subida de nível!",
    EN: "Level Up!",
    DE: "Levelaufstieg!",
    FR: "Niveau supérieur !",
    CS: "Zvýšení úrovně!",
    RU: "Повышение уровня!",
  },

  // ===== EMBEDS CAMPOS =====
  WARNINGS_FIELD: {
    PT: "Tens **{warns}** avisos de moderação.",
    EN: "You have **{warns}** moderation warnings.",
    DE: "Du hast **{warns}** Verwarnungen der Moderation.",
    FR: "Tu as **{warns}** avertissements de modération.",
    CS: "Máš **{warns}** moderátorských varování.",
    RU: "У тебя **{warns}** предупреждений от модерации.",
  },
  WARNS_INFO: {
    PT: "Com 5 avisos serás mutado por 10 minutos.",
    EN: "With 5 warnings you'll be muted for 10 minutes.",
    DE: "Mit 5 Verwarnungen wirst du für 10 Minuten stummgeschaltet.",
    FR: "Avec 5 avertissements, tu seras muet pendant 10 minutes.",
    CS: "S 5 varováními budeš ztlumen na 10 minut.",
    RU: "С 5 предупреждениями ты будешь заглушен на 10 минут.",
  },
  LEVEL_FIELD: {
    PT: "📊 Nível",
    EN: "📊 Level",
    DE: "📊 Level",
    FR: "📊 Niveau",
    CS: "📊 Úroveň",
    RU: "📊 Уровень",
  },
  XP_FIELD: {
    PT: "⭐ XP atual",
    EN: "⭐ Current XP",
    DE: "⭐ Aktuelle XP",
    FR: "⭐ XP actuel",
    CS: "⭐ Aktuální XP",
    RU: "⭐ Текущий XP",
  },
  COINS_FIELD: {
    PT: "💰 Moedas",
    EN: "💰 Coins",
    DE: "💰 Münzen",
    FR: "💰 Pièces",
    CS: "💰 Mince",
    RU: "💰 Монеты",
  },
  NEXT_LEVEL: {
    PT: (xpNeeded) => `Faltam **${xpNeeded}** XP`,
    EN: (xpNeeded) => `**${xpNeeded}** XP needed`,
    DE: (xpNeeded) => `**${xpNeeded}** XP fehlen`,
    FR: (xpNeeded) => `**${xpNeeded}** XP manquants`,
    CS: (xpNeeded) => `Chybí **${xpNeeded}** XP`,
    RU: (xpNeeded) => `Не хватает **${xpNeeded}** XP`,
  },
  POSITION: {
    PT: (pos, total) => `**#${pos}** de ${total}`,
    EN: (pos, total) => `**#${pos}** of ${total}`,
    DE: (pos, total) => `**#${pos}** von ${total}`,
    FR: (pos, total) => `**#${pos}** sur ${total}`,
    CS: (pos, total) => `**#${pos}** z ${total}`,
    RU: (pos, total) => `**#${pos}** из ${total}`,
  },
  NO_POSITION: {
    PT: "*Sem posição (ainda sem XP?)*",
    EN: "*No position (no XP yet?)*",
    DE: "*Keine Position (noch keine XP?)*",
    FR: "*Aucune position (pas encore d'XP?)*",
    CS: "*Bez pozice (zatím žádné XP?)*",
    RU: "*Нет позиции (ещё нет XP?)*",
  },

  // ===== TOP/RANKING =====
  TOP_PLAYERS: {
    PT: (count) => `🏆 Top ${count} jogadores`,
    EN: (count) => `🏆 Top ${count} players`,
    DE: (count) => `🏆 Top ${count} Spieler`,
    FR: (count) => `🏆 Top ${count} joueurs`,
    CS: (count) => `🏆 Top ${count} hráčů`,
    RU: (count) => `🏆 Топ ${count} игроков`,
  },
  NO_XP_YET: {
    PT: "*Ainda ninguém tem XP.*",
    EN: "*No one has XP yet.*",
    DE: "*Noch niemand hat XP.*",
    FR: "*Personne n'a encore d'XP.*",
    CS: "*Zatím nikdo nemá XP.*",
    RU: "*У никого ещё нет XP.*",
  },

  // ===== MOEDAS =====
  BALANCE_TITLE: {
    PT: "Saldo de Moedas",
    EN: "Coin Balance",
    DE: "Münzsaldo",
    FR: "Solde de pièces",
    CS: "Zůstatek mincí",
    RU: "Баланс монет",
  },
  BALANCE_DESC: {
    PT: (coins) => `💰 Tens atualmente **${coins} Moedas** na tua conta.`,
    EN: (coins) => `💰 You currently have **${coins} Coins** in your account.`,
    DE: (coins) => `💰 Du hast derzeit **${coins} Münzen** auf deinem Konto.`,
    FR: (coins) => `💰 Tu as actuellement **${coins} Pièces** sur ton compte.`,
    CS: (coins) => `💰 Momentálně máš **${coins} Mincí** na svém účtu.`,
    RU: (coins) => `💰 У тебя сейчас **${coins} Монет** на счету.`,
  },

  // ===== QUIZ =====
  QUIZ_TITLE: {
    PT: "🎲 QUIZ ALEATÓRIO!",
    EN: "🎲 RANDOM QUIZ!",
    DE: "🎲 ZUFALLSQUIZ!",
    FR: "🎲 QUIZ ALÉATOIRE !",
    CS: "🎲 NÁHODNÝ KVIZ!",
    RU: "🎲 СЛУЧАЙНАЯ ВИКТОРИНА!",
  },
  QUIZ_THEME: {
    PT: "Tema",
    EN: "Theme",
    DE: "Thema",
    FR: "Thème",
    CS: "Téma",
    RU: "Тема",
  },
  QUIZ_QUESTION: {
    PT: "Pergunta",
    EN: "Question",
    DE: "Frage",
    FR: "Question",
    CS: "Otázka",
    RU: "Вопрос",
  },
  QUIZ_FOOTER: {
    PT: "Tens 20 segundos! Ganha 100 Moedas.",
    EN: "You have 20 seconds! Win 100 Coins.",
    DE: "Du hast 20 Sekunden! Gewinne 100 Münzen.",
    FR: "Tu as 20 secondes ! Gagne 100 Pièces.",
    CS: "Máš 20 sekund! Vyhraj 100 Mincí.",
    RU: "У тебя 20 секунд! Выиграй 100 Монет.",
  },
  QUIZ_CORRECT: {
    PT: "✅ Acertaste em cheio!",
    EN: "✅ You got it right!",
    DE: "✅ Volltreffer!",
    FR: "✅ Tu as tout juste !",
    CS: "✅ Správně!",
    RU: "✅ Правильно!",
  },
  QUIZ_CORRECT_DESC: {
    PT: (author, answer) =>
      `${author}, a resposta era mesmo **${answer}**!\n💰 +100 Moedas adicionadas à tua carteira.`,
    EN: (author, answer) =>
      `${author}, the answer was indeed **${answer}**!\n💰 +100 Coins added to your wallet.`,
    DE: (author, answer) =>
      `${author}, die Antwort war tatsächlich **${answer}**!\n💰 +100 Münzen wurden deiner Brieftasche hinzugefügt.`,
    FR: (author, answer) =>
      `${author}, la réponse était bien **${answer}**!\n💰 +100 Pièces ajoutées à ton portefeuille.`,
    CS: (author, answer) =>
      `${author}, odpověď byla opravdu **${answer}**!\n💰 +100 Mincí přidáno do tvé peněženky.`,
    RU: (author, answer) =>
      `${author}, ответ действительно был **${answer}**!\n💰 +100 Монет добавлено в твой кошелёк.`,
  },
  QUIZ_TIMEOUT: {
    PT: (answer) =>
      `⏰ **O tempo voou!** Ninguém acertou. A resposta era: **${answer}**`,
    EN: (answer) =>
      `⏰ **Time's up!** No one got it. The answer was: **${answer}**`,
    DE: (answer) =>
      `⏰ **Die Zeit ist um!** Niemand hat es erraten. Die Antwort war: **${answer}**`,
    FR: (answer) =>
      `⏰ **C'est l'heure !** Personne n'a trouvé. La réponse était : **${answer}**`,
    CS: (answer) =>
      `⏰ **Čas vypršel!** Nikdo to neuhádl. Odpověď byla: **${answer}**`,
    RU: (answer) =>
      `⏰ **Время вышло!** Никто не угадал. Ответ был: **${answer}**`,
  },

  // ===== LIMPEZA =====
  NO_PERMISSION: {
    PT: "Não tens permissão para apagar mensagens.",
    EN: "You don't have permission to delete messages.",
    DE: "Du hast keine Berechtigung, Nachrichten zu löschen.",
    FR: "Tu n'as pas la permission de supprimer des messages.",
    CS: "Nemáš oprávnění mazat zprávy.",
    RU: "У тебя нет разрешения удалять сообщения.",
  },
  PERMISSION_TITLE: {
    PT: "❌ Sem permissão",
    EN: "❌ No Permission",
    DE: "❌ Keine Berechtigung",
    FR: "❌ Pas de permission",
    CS: "❌ Bez oprávnění",
    RU: "❌ Нет разрешения",
  },
  USAGE_TITLE: {
    PT: "❗ Uso do comando",
    EN: "❗ Command Usage",
    DE: "❗ Befehlsnutzung",
    FR: "❗ Utilisation de la commande",
    CS: "❗ Použití příkazu",
    RU: "❗ Использование команды",
  },
  CLEAR_USAGE: {
    PT: "Usa: `!limpar <número entre 1 e 100>`",
    EN: "Usage: `!clear <number between 1 and 100>`",
    DE: "Verwendung: `!clear <Zahl zwischen 1 und 100>`",
    FR: "Utilisation : `!clear <nombre entre 1 et 100>`",
    CS: "Použití: `!clear <číslo mezi 1 a 100>`",
    RU: "Использование: `!clear <число от 1 до 100>`",
  },
  MESSAGES_DELETED_TITLE: {
    PT: "Mensagens apagadas",
    EN: "Messages Deleted",
    DE: "Gelöschte Nachrichten",
    FR: "Messages supprimés",
    CS: "Smazané zprávy",
    RU: "Удалённые сообщения",
  },
  MESSAGES_DELETED_DESC: {
    PT: (count) => `🧹 Apaguei **${count}** mensagens.`,
    EN: (count) => `🧹 I deleted **${count}** messages.`,
    DE: (count) => `🧹 Ich habe **${count}** Nachrichten gelöscht.`,
    FR: (count) => `🧹 J'ai supprimé **${count}** messages.`,
    CS: (count) => `🧹 Smazal jsem **${count}** zpráv.`,
    RU: (count) => `🧹 Я удалил **${count}** сообщений.`,
  },
  CLEAR_ERROR: {
    PT: "Não consegui apagar as mensagens. Verifica se não são muito antigas (mais de 14 dias).",
    EN: "I couldn't delete the messages. Check if they're not too old (more than 14 days).",
    DE: "Ich konnte die Nachrichten nicht löschen. Überprüfe, ob sie nicht zu alt sind (älter als 14 Tage).",
    FR: "Je n'ai pas pu supprimer les messages. Vérifie qu'ils ne sont pas trop vieux (plus de 14 jours).",
    CS: "Nemohl jsem smazat zprávy. Zkontroluj, zda nejsou příliš staré (více než 14 dní).",
    RU: "Я не смог удалить сообщения. Проверь, не слишком ли они старые (больше 14 дней).",
  },

  // ===== PALAVRAS PROIBIDAS =====
  ADD_WORD_MISSING: {
    PT: "❌ Indica a palavra a adicionar.",
    EN: "❌ Specify the word to add.",
    DE: "❌ Gib das hinzuzufügende Wort an.",
    FR: "❌ Indique le mot à ajouter.",
    CS: "❌ Uveď slovo k přidání.",
    RU: "❌ Укажи слово для добавления.",
  },
  WORD_ADDED: {
    PT: (word) => `✅ Palavra **${word}** adicionada à lista de proibidas.`,
    EN: (word) => `✅ Word **${word}** added to forbidden list.`,
    DE: (word) => `✅ Wort **${word}** zur Verbotsliste hinzugefügt.`,
    FR: (word) => `✅ Mot **${word}** ajouté à la liste des mots interdits.`,
    CS: (word) => `✅ Slovo **${word}** přidáno na seznam zakázaných.`,
    RU: (word) => `✅ Слово **${word}** добавлено в список запрещённых.`,
  },
  WORD_EXISTS: {
    PT: (word) => `⚠️ A palavra **${word}** já está na lista.`,
    EN: (word) => `⚠️ Word **${word}** is already on the list.`,
    DE: (word) => `⚠️ Das Wort **${word}** ist bereits auf der Liste.`,
    FR: (word) => `⚠️ Le mot **${word}** est déjà sur la liste.`,
    CS: (word) => `⚠️ Slovo **${word}** je již na seznamu.`,
    RU: (word) => `⚠️ Слово **${word}** уже есть в списке.`,
  },
  FIREBASE_ERROR: {
    PT: "❌ Erro ao salvar no Firebase.",
    EN: "❌ Error saving to Firebase.",
    DE: "❌ Fehler beim Speichern in Firebase.",
    FR: "❌ Erreur lors de l'enregistrement dans Firebase.",
    CS: "❌ Chyba při ukládání do Firebase.",
    RU: "❌ Ошибка при сохранении в Firebase.",
  },
  WORD_ADDED_MEMORY: {
    PT: (word) => `✅ Palavra **${word}** adicionada (apenas em memória).`,
    EN: (word) => `✅ Word **${word}** added (memory only).`,
    DE: (word) => `✅ Wort **${word}** hinzugefügt (nur im Speicher).`,
    FR: (word) => `✅ Mot **${word}** ajouté (mémoire uniquement).`,
    CS: (word) => `✅ Slovo **${word}** přidáno (pouze v paměti).`,
    RU: (word) => `✅ Слово **${word}** добавлено (только в памяти).`,
  },

  // ===== REMOVER PALAVRAS =====
  REMOVE_WORD_MISSING: {
    PT: "❌ Indica a palavra que queres remover: `!rempalavra <palavra>`",
    EN: "❌ Specify the word to remove: `!removeword <word>`",
    DE: "❌ Gib das zu entfernende Wort an: `!removeword <Wort>`",
    FR: "❌ Indique le mot à supprimer : `!removeword <mot>`",
    CS: "❌ Uveď slovo k odstranění: `!removeword <slovo>`",
    RU: "❌ Укажи слово для удаления: `!removeword <слово>`",
  },
  WORD_REMOVED: {
    PT: (word) =>
      `🗑️ A palavra **${word}** foi removida da lista de proibidas.`,
    EN: (word) => `🗑️ Word **${word}** removed from forbidden list.`,
    DE: (word) =>
      `🗑️ Das Wort **${word}** wurde von der Verbotsliste entfernt.`,
    FR: (word) =>
      `🗑️ Le mot **${word}** a été retiré de la liste des mots interdits.`,
    CS: (word) => `🗑️ Slovo **${word}** bylo odstraněno ze seznamu zakázaných.`,
    RU: (word) => `🗑️ Слово **${word}** удалено из списка запрещённых.`,
  },
  WORD_NOT_FOUND: {
    PT: (word) => `⚠️ A palavra **${word}** não está na lista.`,
    EN: (word) => `⚠️ Word **${word}** is not on the list.`,
    DE: (word) => `⚠️ Das Wort **${word}** ist nicht auf der Liste.`,
    FR: (word) => `⚠️ Le mot **${word}** n'est pas sur la liste.`,
    CS: (word) => `⚠️ Slovo **${word}** není na seznamu.`,
    RU: (word) => `⚠️ Слово **${word}** нет в списке.`,
  },
  CONFIG_NOT_FOUND: {
    PT: "❌ Não encontrei nenhuma configuração para este servidor.",
    EN: "❌ I didn't find any configuration for this server.",
    DE: "❌ Ich habe keine Konfiguration für diesen Server gefunden.",
    FR: "❌ Je n'ai trouvé aucune configuration pour ce serveur.",
    CS: "❌ Nenašel jsem žádnou konfiguraci pro tento server.",
    RU: "❌ Я не нашёл никакой конфигурации для этого сервера.",
  },
  REMOVE_ERROR: {
    PT: "❌ Houve um erro ao tentar remover a palavra no Firebase.",
    EN: "❌ There was an error removing the word from Firebase.",
    DE: "❌ Es gab einen Fehler beim Entfernen des Wortes aus Firebase.",
    FR: "❌ Une erreur s'est produite lors de la suppression du mot de Firebase.",
    CS: "❌ Došlo k chybě při odstraňování slova z Firebase.",
    RU: "❌ Произошла ошибка при удалении слова из Firebase.",
  },

  // ===== LISTAR PALAVRAS =====
  FORBIDDEN_WORDS_TITLE: {
    PT: "📜 Palavras Proibidas",
    EN: "📜 Forbidden Words",
    DE: "📜 Verbotene Wörter",
    FR: "📜 Mots interdits",
    CS: "📜 Zakázaná slova",
    RU: "📜 Запрещённые слова",
  },
  NO_FORBIDDEN_WORDS: {
    PT: "*Nenhuma palavra proibida registada.*",
    EN: "*No forbidden words registered.*",
    DE: "*Keine verbotenen Wörter registriert.*",
    FR: "*Aucun mot interdit enregistré.*",
    CS: "*Žádná zakázaná slova registrovaná.*",
    RU: "*Нет зарегистрированных запрещённых слов.*",
  },
  NO_CONFIG: {
    PT: "⚠️ Este servidor ainda não tem configuração no Firebase. Use `!addpalavra` primeiro.",
    EN: "⚠️ This server has no configuration in Firebase yet. Use `!addword` first.",
    DE: "⚠️ Dieser Server hat noch keine Konfiguration in Firebase. Verwende zuerst `!addword`.",
    FR: "⚠️ Ce serveur n'a pas encore de configuration dans Firebase. Utilise d'abord `!addword`.",
    CS: "⚠️ Tento server zatím nemá konfiguraci ve Firebase. Nejprve použij `!addword`.",
    RU: "⚠️ У этого сервера ещё нет конфигурации в Firebase. Сначала используй `!addword`.",
  },

  // ===== HELP =====
  HELP_TITLE: {
    PT: "📖 Guia de Comandos do Bot",
    EN: "📖 Bot Commands Guide",
    DE: "📖 Bot-Befehlsleitfaden",
    FR: "📖 Guide des commandes du bot",
    CS: "📖 Průvodce příkazy bota",
    RU: "📖 Руководство по командам бота",
  },
  HELP_DESC: {
    PT: "Aqui estão todos os comandos disponíveis no servidor:",
    EN: "Here are all available commands on the server:",
    DE: "Hier sind alle verfügbaren Befehle auf dem Server:",
    FR: "Voici toutes les commandes disponibles sur le serveur :",
    CS: "Zde jsou všechny dostupné příkazy na serveru:",
    RU: "Вот все доступные команды на сервере:",
  },
  HELP_LEVEL: {
    PT: "⭐ Nível e XP",
    EN: "⭐ Level and XP",
    DE: "⭐ Level und XP",
    FR: "⭐ Niveau et XP",
    CS: "⭐ Úroveň a XP",
    RU: "⭐ Уровень и XP",
  },
  HELP_LEVEL_VALUE: {
    PT: "`!nivel` - Vê o teu nível.\n`!top` - Vê o ranking.\n`!rank` - Vê a tua posição.\n`!pergunta <pergunta>` - Pergunta algo à IA.",
    EN: "`!level` - Check your level.\n`!top` - Check ranking.\n`!rank` - Check your position.\n`!ask <question>` - Ask the AI a question.",
    DE: "`!level` - Prüfe dein Level.\n`!top` - Prüfe die Rangliste.\n`!rank` - Prüfe deine Position.\n`!ask <Frage>` - Stelle der KI eine Frage.",
    FR: "`!level` - Vérifie ton niveau.\n`!top` - Vérifie le classement.\n`!rank` - Vérifie ta position.\n`!ask <question>` - Pose une question à l'IA.",
    CS: "`!level` - Zkontroluj svou úroveň.\n`!top` - Zkontroluj žebříček.\n`!rank` - Zkontroluj svou pozici.\n`!ask <otázka>` - Zeptej se AI na otázku.",
    RU: "`!level` - Проверь свой уровень.\n`!top` - Проверь рейтинг.\n`!rank` - Проверь свою позицию.\n`!ask <вопрос>` - Задай вопрос ИИ.",
  },
  HELP_ECONOMY: {
    PT: "💰 Economia",
    EN: "💰 Economy",
    DE: "💰 Wirtschaft",
    FR: "💰 Économie",
    CS: "💰 Ekonomika",
    RU: "💰 Экономика",
  },
  HELP_ECONOMY_VALUE: {
    PT: "`!bal` / `!moedas` - Vê o teu saldo.\n`!quiz` - Participa num quiz e ganha moedas!",
    EN: "`!bal` / `!coins` - Check your balance.\n`!quiz` - Participate in a quiz and win coins!",
    DE: "`!bal` / `!coins` - Prüfe dein Guthaben.\n`!quiz` - Nimm an einem Quiz teil und gewinne Münzen!",
    FR: "`!bal` / `!coins` - Vérifie ton solde.\n`!quiz` - Participe à un quiz et gagne des pièces !",
    CS: "`!bal` / `!coins` - Zkontroluj svůj zůstatek.\n`!quiz` - Zúčastni se kvízu a vyhraj mince!",
    RU: "`!bal` / `!coins` - Проверь свой баланс.\n`!quiz` - Участвуй в викторине и выигрывай монеты!",
  },
  HELP_MOD: {
    PT: "🛡️ Moderação",
    EN: "🛡️ Moderation",
    DE: "🛡️ Moderation",
    FR: "🛡️ Modération",
    CS: "🛡️ Moderace",
    RU: "🛡️ Модерация",
  },
  HELP_MOD_VALUE: {
    PT: "`!avisos` - Consulta os teus avisos.\n`!palavras` - Lista as palavras proibidas.",
    EN: "`!warnings` - Check your warnings.\n`!words` - List forbidden words.",
    DE: "`!warnings` - Prüfe deine Verwarnungen.\n`!words` - Liste verbotene Wörter auf.",
    FR: "`!warnings` - Vérifie tes avertissements.\n`!words` - Liste les mots interdits.",
    CS: "`!warnings` - Zkontroluj svá varování.\n`!words` - Seznam zakázaných slov.",
    RU: "`!warnings` - Проверь свои предупреждения.\n`!words` - Список запрещённых слов.",
  },
  HELP_ADMIN: {
    PT: "🛠️ Administração (Staff)",
    EN: "🛠️ Administration (Staff)",
    DE: "🛠️ Verwaltung (Team)",
    FR: "🛠️ Administration (Staff)",
    CS: "🛠️ Administrace (Staff)",
    RU: "🛠️ Администрация (Staff)",
  },
  HELP_ADMIN_VALUE: {
    PT: "`!addpalavra <palavra>` - Proíbe uma palavra.\n`!rempalavra <palavra>` - Remove uma palavra.\n`!limpar <1-100>` - Apaga mensagens do chat.",
    EN: "`!addword <word>` - Forbid a word.\n`!removeword <word>` - Remove a word.\n`!clear <1-100>` - Delete chat messages.",
    DE: "`!addword <Wort>` - Verbot eines Wortes.\n`!removeword <Wort>` - Entfernt ein Wort.\n`!clear <1-100>` - Löscht Chat-Nachrichten.",
    FR: "`!addword <mot>` - Interdit un mot.\n`!removeword <mot>` - Supprime un mot.\n`!clear <1-100>` - Supprime les messages du chat.",
    CS: "`!addword <slovo>` - Zakáže slovo.\n`!removeword <slovo>` - Odstraní slovo.\n`!clear <1-100>` - Smaže zprávy v chatu.",
    RU: "`!addword <слово>` - Запретить слово.\n`!removeword <слово>` - Удалить слово.\n`!clear <1-100>` - Удалить сообщения в чате.",
  },

  // ===== IA =====
  AI_NOT_CONFIGURED: {
    PT: "❌ A IA não está configurada. Define `HF_TOKEN` no ficheiro `.env`.",
    EN: "❌ AI is not configured. Set `HF_TOKEN` in the `.env` file.",
    DE: "❌ KI ist nicht konfiguriert. Setze `HF_TOKEN` in der `.env`-Datei.",
    FR: "❌ L'IA n'est pas configurée. Définissez `HF_TOKEN` dans le fichier `.env`.",
    CS: "❌ AI není nakonfigurována. Nastav `HF_TOKEN` v souboru `.env`.",
    RU: "❌ ИИ не настроен. Установи `HF_TOKEN` в файле `.env`.",
  },
  ASK_MISSING: {
    PT: "⚠️ Escreve uma pergunta! Exemplo: `!pergunta Como fazer um bolo?`",
    EN: "⚠️ Write a question! Example: `!ask How to make a cake?`",
    DE: "⚠️ Schreibe eine Frage! Beispiel: `!ask Wie macht man einen Kuchen?`",
    FR: "⚠️ Écris une question ! Exemple : `!ask Comment faire un gâteau ?`",
    CS: "⚠️ Napiš otázku! Příklad: `!ask Jak udělat dort?`",
    RU: "⚠️ Напиши вопрос! Пример: `!ask Как приготовить торт?`",
  },
  AI_LOADING: {
    PT: "😴 A IA está a iniciar os sistemas. Tenta novamente em 20 segundos!",
    EN: "😴 AI is starting up. Try again in 20 seconds!",
    DE: "😴 KI startet. Versuche es in 20 Sekunden erneut!",
    FR: "😴 L'IA démarre. Réessaie dans 20 secondes !",
    CS: "😴 AI se spouští. Zkus to znovu za 20 sekund!",
    RU: "😴 ИИ запускается. Попробуй снова через 20 секунд!",
  },
  AI_AUTH_ERROR: {
    PT: "❌ Erro de autorização. Verifica se o teu Token no .env está correto e tem permissões de Inference.",
    EN: "❌ Authorization error. Check if your Token in .env is correct and has Inference permissions.",
    DE: "❌ Autorisierungsfehler. Überprüfe, ob dein Token in .env korrekt ist und Inferenzberechtigungen hat.",
    FR: "❌ Erreur d'autorisation. Vérifie que ton token dans .env est correct et a les permissions d'inférence.",
    CS: "❌ Chyba autorizace. Zkontroluj, zda je tvůj token v .env správný a má oprávnění pro Inference.",
    RU: "❌ Ошибка авторизации. Проверь, правильный ли у тебя токен в .env и есть ли у него разрешения на Inference.",
  },
  AI_ERROR: {
    PT: (error) => `❌ Erro da IA: \`${error}\``,
    EN: (error) => `❌ AI Error: \`${error}\``,
    DE: (error) => `❌ KI-Fehler: \`${error}\``,
    FR: (error) => `❌ Erreur de l'IA : \`${error}\``,
    CS: (error) => `❌ Chyba AI: \`${error}\``,
    RU: (error) => `❌ Ошибка ИИ: \`${error}\``,
  },
  QUIZ_ERROR: {
    PT: "❌ A IA está a pensar em muitas coisas ao mesmo tempo. Tenta de novo!",
    EN: "❌ AI is thinking about too many things. Try again!",
    DE: "❌ KI denkt über zu viele Dinge gleichzeitig nach. Versuche es erneut!",
    FR: "❌ L'IA pense à trop de choses en même temps. Réessaie !",
    CS: "❌ AI přemýšlí o příliš mnoha věcech najednou. Zkus to znovu!",
    RU: "❌ ИИ думает о слишком многих вещах одновременно. Попробуй снова!",
  },
  QUIZ_PROCESSING_ERROR: {
    PT: "Erro no processamento. Tenta de novo!",
    EN: "Processing error. Try again!",
    DE: "Verarbeitungsfehler. Versuche es erneut!",
    FR: "Erreur de traitement. Réessaie !",
    CS: "Chyba zpracování. Zkus to znovu!",
    RU: "Ошибка обработки. Попробуй снова!",
  },
  // Adiciona ao STRINGS no strings.js
  LANGUAGES_TITLE: {
    PT: "🌐 Idiomas Disponíveis",
    EN: "🌐 Available Languages",
    DE: "🌐 Verfügbare Sprachen",
    FR: "🌐 Langues Disponibles",
    CS: "🌐 Dostupné Jazyky",
    RU: "🌐 Доступные Языки",
  },
  LANGUAGES_DESC: {
    PT: (count) => `O bot suporta **${count} idiomas** diferentes!`,
    EN: (count) => `The bot supports **${count} different languages**!`,
    DE: (count) => `Der Bot unterstützt **${count} verschiedene Sprachen**!`,
    FR: (count) => `Le bot supporte **${count} langues différentes** !`,
    CS: (count) => `Bot podporuje **${count} různých jazyků**!`,
    RU: (count) => `Бот поддерживает **${count} разных языков**!`,
  },
  LANGUAGE_PT: {
    PT: "Idioma padrão",
    EN: "Default language",
    DE: "Standardsprache",
    FR: "Langue par défaut",
    CS: "Výchozí jazyk",
    RU: "Язык по умолчанию",
  },
  LANGUAGE_EN: {
    PT: "Idioma padrão",
    EN: "Default language",
    DE: "Standardsprache",
    FR: "Langue par défaut",
    CS: "Výchozí jazyk",
    RU: "Язык по умолчанию",
  },
  LANGUAGE_DE: {
    PT: "Idioma padrão",
    EN: "Default language",
    DE: "Standardsprache",
    FR: "Langue par défaut",
    CS: "Výchozí jazyk",
    RU: "Язык по умолчанию",
  },
  LANGUAGE_FR: {
    PT: "Idioma padrão",
    EN: "Default language",
    DE: "Standardsprache",
    FR: "Langue par défaut",
    CS: "Výchozí jazyk",
    RU: "Язык по умолчанию",
  },
  LANGUAGE_CS: {
    PT: "Idioma padrão",
    EN: "Default language",
    DE: "Standardsprache",
    FR: "Langue par défaut",
    CS: "Výchozí jazyk",
    RU: "Язык по умолчанию",
  },
  LANGUAGE_RU: {
    PT: "Idioma padrão",
    EN: "Default language",
    DE: "Standardsprache",
    FR: "Langue par défaut",
    CS: "Výchozí jazyk",
    RU: "Язык по умолчанию",
  },

  CHANGE_LANGUAGE: {
    PT: "🔄 Mudar Idioma",
    EN: "🔄 Change Language",
    DE: "🔄 Sprache ändern",
    FR: "🔄 Changer la langue",
    CS: "🔄 Změnit Jazyk",
    RU: "🔄 Сменить Язык",
  },
  CHANGE_LANGUAGE_DESC: {
    PT: "Usa `!lang <código>` para mudar o idioma do servidor.\nExemplo: `!lang EN`, `!lang PT`, `!lang DE`, `!lang FR`, `!lang CS`, `!lang RU`",
    EN: "Use `!lang <code>` to change the server language.\nExample: `!lang EN`, `!lang PT`, `!lang DE`, `!lang FR`, `!lang CS`, `!lang RU`",
    DE: "Verwende `!lang <code>` um die Serversprache zu ändern.\nBeispiel: `!lang EN`, `!lang PT`, `!lang DE`, `!lang FR`, `!lang CS`, `!lang RU`",
    FR: "Utilise `!lang <code>` pour changer la langue du serveur.\nExemple: `!lang EN`, `!lang PT`, `!lang DE`, `!lang FR`, `!lang CS`, `!lang RU`",
    CS: "Použij `!lang <kód>` pro změnu jazyka serveru.\nPříklad: `!lang EN`, `!lang PT`, `!lang DE`, `!lang FR`, `!lang CS`, `!lang RU`",
    RU: "Используй `!lang <код>` для изменения языка сервера.\nПример: `!lang EN`, `!lang PT`, `!lang DE`, `!lang FR`, `!lang CS`, `!lang RU`",
  },
  CURRENT_LANGUAGE_TITLE: {
    PT: "📌 Teu Atual idioma atual",
    EN: "📌 Your current Language",
    DE: "📌 Ihre aktuelle Sprache",
    FR: "📌 Votre langue actuelle",
    CS: "📌 Tvůj aktuální jazyk",
    RU: "📌 Твой текущий язык",
  },

  // ===== MÚSICA (SEMPRE EM PORTUGUÊS) =====
  MUSIC_SEARCH_PROMPT: {
    PT: "🔍 A procurar: `{query}`...",
    EN: "🔍 A procurar: `{query}`...",
    DE: "🔍 A procurar: `{query}`...",
    FR: "🔍 A procurar: `{query}`...",
    CS: "🔍 A procurar: `{query}`...",
    RU: "🔍 A procurar: `{query}`...",
  },
  MUSIC_TITLE: {
    PT: "🎶 A tocar agora",
    EN: "🎶 A tocar agora",
    DE: "🎶 A tocar agora",
    FR: "🎶 A tocar agora",
    CS: "🎶 A tocar agora",
    RU: "🎶 A tocar agora",
  },
  MUSIC_DESC: {
    PT: (song) => `Reproduzindo: **${song}**`,
    EN: (song) => `Reproduzindo: **${song}**`,
    DE: (song) => `Reproduzindo: **${song}**`,
    FR: (song) => `Reproduzindo: **${song}**`,
    CS: (song) => `Reproduzindo: **${song}**`,
    RU: (song) => `Reproduzindo: **${song}**`,
  },
  MUSIC_PLAY: {
    PT: '🔍 A procurar: "{busca}"',
    EN: '🔍 A procurar: "{busca}"',
    DE: '🔍 A procurar: "{busca}"',
    FR: '🔍 A procurar: "{busca}"',
    CS: '🔍 A procurar: "{busca}"',
    RU: '🔍 A procurar: "{busca}"',
  },
  MUSIC_SONG_NAME: {
    PT: "🎵 Diz o nome da música!",
    EN: "🎵 Diz o nome da música!",
    DE: "🎵 Diz o nome da música!",
    FR: "🎵 Diz o nome da música!",
    CS: "🎵 Diz o nome da música!",
    RU: "🎵 Diz o nome da música!",
  },
  MUSIC_ERROR: {
    PT: (error) => `⚠️ Erro ao tocar: ${error}`,
    EN: (error) => `⚠️ Erro ao tocar: ${error}`,
    DE: (error) => `⚠️ Erro ao tocar: ${error}`,
    FR: (error) => `⚠️ Erro ao tocar: ${error}`,
    CS: (error) => `⚠️ Erro ao tocar: ${error}`,
    RU: (error) => `⚠️ Erro ao tocar: ${error}`,
  },
  BOT_LEFT: {
    PT: "👋 Saí do canal!",
    EN: "👋 Saí do canal!",
    DE: "👋 Saí do canal!",
    FR: "👋 Saí do canal!",
    CS: "👋 Saí do canal!",
    RU: "👋 Saí do canal!",
  },

  NOT_IN_CHANNEL: {
    PT: "Não estou num canal.",
    EN: "Não estou num canal.",
    DE: "Não estou num canal.",
    FR: "Não estou num canal.",
    CS: "Não estou num canal.",
    RU: "Não estou num canal.",
  },
};

// Função para obter a string traduzida
function getString(key, lang = "PT", ...args) {
  if (!STRINGS[key]) {
    console.warn(`String não encontrada: ${key}`);
    return key;
  }

  const stringObj = STRINGS[key];
  const translation =
    stringObj[lang] || stringObj["PT"] || Object.values(stringObj)[0];

  if (typeof translation === "function") {
    return translation(...args);
  }

  return translation;
}

// Função para substituir placeholders
function formatString(str, replacements) {
  return str.replace(/{(\w+)}/g, (match, key) => replacements[key] || match);
}

// Função para detectar idioma do servidor (pode ser guardada no Firebase)
async function getServerLanguage(guildId, firebaseDB) {
  try {
    const serverRef = firebaseDB.ref(`servers/${guildId}/language`);
    const snapshot = await serverRef.once("value");
    const lang = snapshot.val();
    return LANGUAGES[lang] || LANGUAGES.PT;
  } catch (error) {
    console.error("Erro ao obter idioma do servidor:", error);
    return LANGUAGES.PT;
  }
}

// Função para definir idioma do servidor
async function setServerLanguage(guildId, language, firebaseDB) {
  if (!LANGUAGES[language]) {
    return false;
  }

  try {
    await firebaseDB.ref(`servers/${guildId}/language`).set(language);
    return true;
  } catch (error) {
    console.error("Erro ao definir idioma do servidor:", error);
    return false;
  }
}

module.exports = {
  LANGUAGES,
  STRINGS,
  getString,
  formatString,
  getServerLanguage,
  setServerLanguage,
};
