/**
 * Gera valores em Base64 em partes para o VetraCloud (cada campo tem limite de caracteres).
 * Executa: node firebase-config-para-env.js
 * Cria no VetraCloud as variáveis FIREBASE_CONFIG_1, FIREBASE_CONFIG_2, etc. e cola cada bloco.
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

console.log('\nNo VetraCloud cria estas variáveis e cola o valor correspondente em cada uma:\n');
partes.forEach((parte, i) => {
  console.log(`--- FIREBASE_CONFIG_${i + 1} ---`);
  console.log(parte);
  console.log('');
});
console.log('(Se o VetraCloud deixar uma variável única grande, podes usar só FIREBASE_CONFIG com esta linha toda:\n');
console.log(base64);
console.log('\n');
