// backend/src/db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ancora',     // <-- NOME DO BANCO EM MINÚSCULO
  port: 3306,             // ajuste se seu MySQL estiver em outra porta
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// API de promise para usar async/await
const db = pool.promise();

module.exports = db;
