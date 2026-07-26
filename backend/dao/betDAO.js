// DAO per le scommesse (tabella scommessa).
const db = require('../services/db'); 

// usato in bet.js
const createBet = async function (connection, bet) {
  const sql = `INSERT INTO scommessa
               (id_utente, nome_circuito, numero_pilota, tipo_scommessa,
                quota, crediti_puntati)
               VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [bet.id_utente, bet.nome_circuito, bet.numero_pilota,
                  bet.tipo_scommessa, bet.quota, bet.crediti_puntati];
  const result = await db.execute(connection, sql, params);
  if (result.affectedRows === 0) return null;
  return findBetById(connection, result.insertId);
};

// usato in betDAO e admin.js
const findBetById = async function (connection, idScommessa) {
  const sql = `SELECT * FROM scommessa WHERE id_scommessa = ?`;
  const rows = await db.execute(connection, sql, [idScommessa]);
  return rows.length > 0 ? rows[0] : null;
};

// Scommesse di un utente con i dettagli di gara e pilota (per la vista "mie scommesse")
const findBetsByUser = async function (connection, idUtente) {
  const sql = `
    SELECT s.id_scommessa, s.nome_circuito, s.tipo_scommessa, s.quota,
           s.crediti_puntati, s.data_scommessa, s.esito, s.crediti_vinti,
           p.numero_pilota, p.nome AS pilota_nome, p.cognome AS pilota_cognome,
           c.data_gara, c.disputata
    FROM scommessa s
    INNER JOIN pilota p ON p.numero_pilota = s.numero_pilota
    INNER JOIN circuito c ON c.nome = s.nome_circuito
    WHERE s.id_utente = ?
    ORDER BY s.data_scommessa DESC`;
  return await db.execute(connection, sql, [idUtente]);
};

// Tutte le scommesse su una gara (per la vista pubblica della gara) in race.js
const findBetsByRace = async function (connection, nomeCircuito) {
  const sql = `
    SELECT s.id_scommessa, s.tipo_scommessa, s.quota, s.crediti_puntati,
           s.esito, s.crediti_vinti, s.data_scommessa,
           u.username,
           p.numero_pilota, p.cognome AS pilota_cognome
    FROM scommessa s
    INNER JOIN utente u ON u.id_utente = s.id_utente
    INNER JOIN pilota p ON p.numero_pilota = s.numero_pilota
    WHERE s.nome_circuito = ?
    ORDER BY s.data_scommessa DESC`;
  return await db.execute(connection, sql, [nomeCircuito]);
};

// Scommesse ancora aperte su una gara: da regolare al termine in race.js
const findPendingBetsByRace = async function (connection, nomeCircuito) {
  const sql = `SELECT * FROM scommessa
               WHERE nome_circuito = ? AND esito = 'in_attesa'`;
  return await db.execute(connection, sql, [nomeCircuito]);
};

// usato in race.js per regolare scommesse alla chiusura
const settleBet = async function (connection, idScommessa, esito, creditiVinti) {
  const sql = `UPDATE scommessa SET esito = ?, crediti_vinti = ?
               WHERE id_scommessa = ? AND esito = 'in_attesa'`;
  const result = await db.execute(connection, sql, [esito, creditiVinti, idScommessa]);
  return result.affectedRows > 0;
};

// annullamento amministrativo: solo scommesse ancora in attesa
const cancelBet = async function (connection, idScommessa) {
  const sql = `UPDATE scommessa SET esito = 'annullata', crediti_vinti = 0
               WHERE id_scommessa = ? AND esito = 'in_attesa'`;
  const result = await db.execute(connection, sql, [idScommessa]);
  return result.affectedRows > 0;
};

module.exports = {
  createBet,
  findBetById,
  findBetsByUser,
  findBetsByRace,
  findPendingBetsByRace,
  settleBet,
  cancelBet
};
