// SERVIZIO ACCESSO DB 
const mysql = require('mysql2/promise');
const config = require('../config');

// ogni richiesta ha una connessione dedicata
// il route handler gestisce la transazione (beginTransaction/commit/rollback) 
// chiusura connessione nel finally
async function getConnection() {
  const connection = await mysql.createConnection(config.db);
  return connection;
}

async function execute(connection, sql, params) {
  const [results] = await connection.execute(sql, params);
  return results;
}

module.exports = { getConnection, execute };
