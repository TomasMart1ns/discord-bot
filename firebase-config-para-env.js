/**
 * Gera Base64 do FIREBASE_CONFIG.json para variáveis de ambiente (Render, VetraCloud, etc.).
 * Executa na pasta do projeto: node firebase-config-para-env.js
 *
 * - Uma variável: FIREBASE_CONFIG = (linha Base64 completa no fim da saída)
 * - Várias: FIREBASE_CONFIG_1, FIREBASE_CONFIG_2, ... (blocos de 400 chars)
 */
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'FIREBASE_CONFIG.json');
if (!fs.existsSync(configPath)) {
  console.error('Coloca FIREBASE_CONFIG.json nesta pasta e volta a correr o script.');
  process.exit(1);
}

const json = fs.readFileSync(configPath, 'utf8');
const base64 = Buffer.from(json, 'utf8').toString('base64');

// Partes de 400 caracteres (cómodo para colar em campos com limite)
const TAMANHO_PARTE = 400;
const partes = [];
for (let i = 0; i < base64.length; i += TAMANHO_PARTE) {
  partes.push(base64.slice(i, i + TAMANHO_PARTE));
}

console.log('\n=== Opção A — Render / um só campo: variável FIREBASE_CONFIG (valor = linha abaixo, sem espaços) ===\n');
console.log(base64);
console.log('\n=== Opção B — vários campos (limite de caracteres): cria FIREBASE_CONFIG_1, FIREBASE_CONFIG_2, ... ===\n');
partes.forEach((parte, i) => {
  console.log(`--- FIREBASE_CONFIG_${i + 1} ---`);
  console.log(parte);
  console.log('');
});
