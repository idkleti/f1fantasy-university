// DAO per i circuiti/gare del calendario.
const db = require('../services/db');

// usata per calendario
const findAllRaces = async function (connection) {
  const sql = `
    SELECT c.nome, c.citta, ci.paese, c.data_gara, c.numero_curve,
           c.disputata, c.pole_pilota,
           pp.cognome AS pole_cognome,
           (SELECT COUNT(*) FROM scommessa sc WHERE sc.nome_circuito = c.nome)
             AS numero_scommesse
    FROM circuito c
    INNER JOIN citta ci ON ci.citta = c.citta
    LEFT JOIN pilota pp ON pp.numero_pilota = c.pole_pilota
    ORDER BY c.data_gara`;
  return await db.execute(connection, sql, []);
};

// usata per classifica di gara disputata, per piazzare una scommessa e admin in race.js
const findRaceByName = async function (connection, nomeCircuito) {
  const sql = `
    SELECT c.*, ci.paese
    FROM circuito c
    INNER JOIN citta ci ON ci.citta = c.citta
    WHERE c.nome = ?`;
  const rows = await db.execute(connection, sql, [nomeCircuito]);
  return rows.length > 0 ? rows[0] : null;
};

// usata nella classifica finale di una gara disputata
const findRaceResults = async function (connection, nomeCircuito) {
  const sql = `
    SELECT g.posizione_finale, g.numero_giri, g.punti_ottenuti,
           p.numero_pilota, p.nome, p.cognome, p.scuderia_corrente
    FROM gareggiare g
    INNER JOIN pilota p ON p.numero_pilota = g.numero_pilota
    WHERE g.nome_c = ?
    ORDER BY g.posizione_finale`;
  return await db.execute(connection, sql, [nomeCircuito]);
};

// inserimento del risultato di un pilota in una gara (usato da parte admin in race.js)
const insertResult = async function (connection, nomeCircuito, r) {
  const sql = `INSERT INTO gareggiare
               (numero_pilota, nome_c, posizione_finale, numero_giri, punti_ottenuti)
               VALUES (?, ?, ?, ?, ?)`;
  const params = [r.numero_pilota, nomeCircuito, r.posizione_finale,
                  r.numero_giri || 0, r.punti_ottenuti || 0];
  const result = await db.execute(connection, sql, params);
  return result.affectedRows > 0;
};

// marca la gara come disputata e registra l'autore della pole (usato da parte admin in race.js)
const closeRace = async function (connection, nomeCircuito, polePilota) {
  const sql = `UPDATE circuito SET disputata = 'Y', pole_pilota = ?
               WHERE nome = ? AND disputata = 'N'`;
  const result = await db.execute(connection, sql, [polePilota || null, nomeCircuito]); // sostituisce polePilota con null quando
                                                                                        // valore non valido
  return result.affectedRows > 0;
};

module.exports = {
  findAllRaces,
  findRaceByName,
  findRaceResults,
  insertResult,
  closeRace
};
