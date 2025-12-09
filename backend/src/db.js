// backend/src/db.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Caminho do arquivo do banco local (SQLite)
const dbFile = path.join(__dirname, '..', 'ancora.db');

// Abre (ou cria) o arquivo do banco
const db = new sqlite3.Database(dbFile);

/**
 * Helpers para usar Promises (async/await)
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        return reject(err);
      }
      // this.lastID e this.changes vêm do sqlite3
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
}

/**
 * Criação das tabelas se não existirem (versão SQLite)
 */
async function initDb() {
  // Usuario
  await run(`
    CREATE TABLE IF NOT EXISTS Usuario (
      id_usuario       INTEGER PRIMARY KEY AUTOINCREMENT,
      nome             TEXT NOT NULL,
      cpf              TEXT,
      cnpj             TEXT,
      email            TEXT,
      data_nascimento  TEXT
    )
  `);

  // Ocorrencia
  await run(`
    CREATE TABLE IF NOT EXISTS Ocorrencia (
      id_ocorrencia  INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario     INTEGER NOT NULL,
      protocolo      INTEGER NOT NULL,
      tema           TEXT,
      descricao      TEXT,
      data_criacao   TEXT NOT NULL,
      FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
    )
  `);

  // Pagamento
  await run(`
    CREATE TABLE IF NOT EXISTS Pagamento (
      id_pagamento     INTEGER PRIMARY KEY AUTOINCREMENT,
      id_ocorrencia    INTEGER NOT NULL,
      valor            INTEGER NOT NULL,
      data_pagamento   TEXT NOT NULL,
      forma_pagamento  TEXT NOT NULL,
      FOREIGN KEY (id_ocorrencia) REFERENCES Ocorrencia(id_ocorrencia)
    )
  `);

  // Documento
  await run(`
    CREATE TABLE IF NOT EXISTS Documento (
      id_documento   INTEGER PRIMARY KEY AUTOINCREMENT,
      id_ocorrencia  INTEGER NOT NULL,
      nome_arquivo   TEXT NOT NULL,
      tipo_documento TEXT,
      data_upload    TEXT NOT NULL,
      FOREIGN KEY (id_ocorrencia) REFERENCES Ocorrencia(id_ocorrencia)
    )
  `);

  // Certidao
  await run(`
    CREATE TABLE IF NOT EXISTS Certidao (
      id_certidao   INTEGER PRIMARY KEY AUTOINCREMENT,
      id_ocorrencia INTEGER NOT NULL,
      status        TEXT NOT NULL,
      FOREIGN KEY (id_ocorrencia) REFERENCES Ocorrencia(id_ocorrencia)
    )
  `);
}

module.exports = {
  db,
  run,
  get,
  all,
  initDb
};
