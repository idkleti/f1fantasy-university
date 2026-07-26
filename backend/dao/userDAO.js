// DAO utente
// solo i dao scrivono sql
const db = require('../services/db');

// colonne restituite al client (mai psw)
const SAFE_COLUMNS = `id_utente, username, email, nome, cognome,
                      data_registrazione, crediti, ruolo, cancellato`;

// creazione utente
const createUser = async function (connection, user) {
  const sql = `INSERT INTO utente (username, password, email, nome, cognome)
               VALUES (?, ?, ?, ?, ?)`;
  const params = [user.username, user.password, user.email,
                  user.nome || null, user.cognome || null];
  const result = await db.execute(connection, sql, params);
  if (result.affectedRows === 0) return null;
  return findUserById(connection, result.insertId);
};

// usata da /users/:userId e createUser
const findUserById = async function (connection, idUtente) {
  const sql = `SELECT ${SAFE_COLUMNS} FROM utente
               WHERE id_utente = ? AND cancellato = 'N'`;
  const rows = await db.execute(connection, sql, [idUtente]);
  return rows.length > 0 ? rows[0] : null;
};

// usata dal login
// serve anche la password (hash) per il confronto bcrypt.
const findUserByUsernameWithPassword = async function (connection, username) {
  const sql = `SELECT ${SAFE_COLUMNS}, password FROM utente
               WHERE username = ? AND cancellato = 'N'`;
  const rows = await db.execute(connection, sql, [username]);
  return rows.length > 0 ? rows[0] : null;
};

// Controllo di univocita' in fase di registrazione usato in user.js
const existsByUsernameOrEmail = async function (connection, username, email) {
  const sql = `SELECT username, email FROM utente
               WHERE username = ? OR email = ?`;
  const rows = await db.execute(connection, sql, [username, email]);
  return rows;
};

// Aggiornamento del saldo crediti (usata da scommesse e regolamento gare).
// delta puo' essere negativo (puntata) o positivo (vincita).
const updateCrediti = async function (connection, idUtente, delta) {
  const sql = `UPDATE utente SET crediti = crediti + ?
               WHERE id_utente = ? AND cancellato = 'N'`;
  const result = await db.execute(connection, sql, [delta, idUtente]);
  return result.affectedRows > 0;
};

// Lista utenti per il pannello admin (assegnazione crediti bonus).
const findAllUsers = async function (connection) {
  const sql = `SELECT ${SAFE_COLUMNS} FROM utente
               WHERE cancellato = 'N' ORDER BY username`;
  return await db.execute(connection, sql, []);
};

module.exports = {
  createUser,
  findUserById,
  findUserByUsernameWithPassword,
  existsByUsernameOrEmail,
  updateCrediti,
  findAllUsers
};
