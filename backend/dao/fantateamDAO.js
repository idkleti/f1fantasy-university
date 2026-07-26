// DAO per fantateam e composizione piloti (tabelle fantateam + fantateam_pilota).
const db = require('../services/db'); 

// usato da fantateam.js
const findTeamsByUser = async function (connection, idUtente) {
  const sql = `
    SELECT f.id_team, f.nome_team, f.budget_residuo, f.punti_totali, f.data_creazione
    FROM fantateam f
    WHERE f.id_utente = ?
    ORDER BY f.data_creazione`;
  return await db.execute(connection, sql, [idUtente]);
};

// usato da fantateam.js
const findTeamById = async function (connection, idTeam) {
  const sql = `SELECT * FROM fantateam WHERE id_team = ?`;
  const rows = await db.execute(connection, sql, [idTeam]);
  return rows.length > 0 ? rows[0] : null;
};

// Piloti di un team, con i punti stagione che ognuno sta portando.
// usato da fantateam.js
const findTeamDrivers = async function (connection, idTeam) {
  const sql = `
    SELECT p.numero_pilota, p.nome, p.cognome, p.scuderia_corrente,
           p.costo_fantasy, fp.costo_pagato, fp.data_acquisto,
           CAST(COALESCE(SUM(g.punti_ottenuti), 0) AS SIGNED) AS punti_stagione
    FROM fantateam_pilota fp
    INNER JOIN pilota p ON p.numero_pilota = fp.numero_pilota
    LEFT JOIN gareggiare g ON g.numero_pilota = p.numero_pilota
    WHERE fp.id_team = ?
    GROUP BY p.numero_pilota, fp.costo_pagato, fp.data_acquisto
    ORDER BY fp.data_acquisto`;
  return await db.execute(connection, sql, [idTeam]);
};

// usato da fantateam.js
const createTeam = async function (connection, idUtente, nomeTeam, budgetResiduo) {
  const sql = `INSERT INTO fantateam (id_utente, nome_team, budget_residuo)
               VALUES (?, ?, ?)`;
  const result = await db.execute(connection, sql, [idUtente, nomeTeam, budgetResiduo]);
  return result.insertId;
};

// usato da fantateam.js
const updateTeam = async function (connection, idTeam, nomeTeam, budgetResiduo) {
  const sql = `UPDATE fantateam SET nome_team = ?, budget_residuo = ?
               WHERE id_team = ?`;
  const result = await db.execute(connection, sql, [nomeTeam, budgetResiduo, idTeam]);
  return result.affectedRows > 0;
};

// usata da fantateam.js
const deleteTeam = async function (connection, idTeam) {
  // fantateam_pilota viene eliminata a cascata dal vincolo FK ON DELETE CASCADE
  const sql = `DELETE FROM fantateam WHERE id_team = ?`;
  const result = await db.execute(connection, sql, [idTeam]);
  return result.affectedRows > 0;
};

// usata da fantateam.js
const addDriverToTeam = async function (connection, idTeam, numeroPilota, costoPagato) {
  const sql = `INSERT INTO fantateam_pilota (id_team, numero_pilota, costo_pagato)
               VALUES (?, ?, ?)`;
  const result = await db.execute(connection, sql, [idTeam, numeroPilota, costoPagato]);
  return result.affectedRows > 0;
};

// usata da fantateam.js
const removeAllDriversFromTeam = async function (connection, idTeam) {
  const sql = `DELETE FROM fantateam_pilota WHERE id_team = ?`;
  await db.execute(connection, sql, [idTeam]);
};

// dati dei piloti richiesti per la validazione della rosa (costo e scuderia servono per budget e vincolo per-scuderia)
// usata da fantateam.js
const findDriversForValidation = async function (connection, numeriPiloti) {
  if (numeriPiloti.length === 0) return [];
  const placeholders = numeriPiloti.map(() => '?').join(',');
  const sql = `SELECT numero_pilota, nome, cognome, costo_fantasy, scuderia_corrente
               FROM pilota WHERE numero_pilota IN (${placeholders})`;
  return await db.execute(connection, sql, numeriPiloti);
};

// ricalcolo dei punti_totali di tutti i team che possiedono piloti che hanno corso nella gara appena regolata
// usata da race.js
const refreshTeamPoints = async function (connection, nomeCircuito) {
  const sql = `
    UPDATE fantateam f
    SET f.punti_totali = (
      SELECT CAST(COALESCE(SUM(g.punti_ottenuti), 0) AS SIGNED)
      FROM fantateam_pilota fp
      INNER JOIN gareggiare g ON g.numero_pilota = fp.numero_pilota
      WHERE fp.id_team = f.id_team
    )
    WHERE f.id_team IN (
      SELECT DISTINCT fp2.id_team
      FROM fantateam_pilota fp2
      INNER JOIN gareggiare g2 ON g2.numero_pilota = fp2.numero_pilota
      WHERE g2.nome_c = ?
    )`;
  const result = await db.execute(connection, sql, [nomeCircuito]);
  return result.affectedRows;
};

module.exports = {
  findTeamsByUser,
  findTeamById,
  findTeamDrivers,
  createTeam,
  updateTeam,
  deleteTeam,
  addDriverToTeam,
  removeAllDriversFromTeam,
  findDriversForValidation,
  refreshTeamPoints
};
