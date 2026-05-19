const admin = require("firebase-admin");

let db;

function initUserConfig(database) {
  db = database;
}

async function getUserLanguage(userId) {
  if (!db) return "PT";
  try {
    // Agora usamos o ID do utilizador como documento
    const doc = await db.collection("guildConfig").doc(userId).get();
    if (doc.exists) {
      return doc.data().lang || "PT";
    }
  } catch (e) {
    console.error(`Erro ao obter idioma para ${userId}:`, e.message);
  }
  return "PT"; // Padrão se não encontrar nada
}

async function setUserLanguage(userId, lang) {
  if (!db) return false;
  try {
    await db.collection("guildConfig").doc(userId).set(
      {
        lang: lang,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  } catch (e) {
    console.error("Erro ao guardar idioma:", e.message);
    return false;
  }
}

module.exports = { initUserConfig, getUserLanguage, setUserLanguage };
