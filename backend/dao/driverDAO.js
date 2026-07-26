// DAO per piloti e scuderie (conversazione "Visualizzazione statistiche")
const db = require('../services/db');

// lista piloti con filtri opzionali + statistiche stagione correnti.
// LEFT JOIN su gareggiare perchè un pilota senza gare disputate ha 0 punti ma NON sparisce
// usato in driver.js
const findAllDrivers = async function (connection, filters) { 
  let sql = `
    SELECT p.numero_pilota, p.nome, p.secondo_nome, p.cognome,
           p.data_nascita, p.anno_debutto, p.nazionalita, p.ruolo,
           p.numero_pole, p.numero_mondiali,
           p.scuderia_corrente, p.costo_fantasy,
           CAST(COALESCE(SUM(g.punti_ottenuti), 0) AS SIGNED) AS punti_stagione,
           COUNT(g.nome_c) AS gare_disputate,
           MIN(g.posizione_finale) AS miglior_posizione
    FROM pilota p
    LEFT JOIN gareggiare g ON g.numero_pilota = p.numero_pilota
    WHERE 1 = 1`;
  const params = [];

  if (filters.scuderia) {
    sql += ` AND p.scuderia_corrente = ?`;
    params.push(filters.scuderia);
  }
  if (filters.nazionalita) {
    sql += ` AND p.nazionalita = ?`;
    params.push(filters.nazionalita);
  }
  if (filters.search) {
    sql += ` AND (p.nome LIKE ? OR p.cognome LIKE ?)`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  sql += ` GROUP BY p.numero_pilota
           ORDER BY punti_stagione DESC, p.cognome, p.nome`;

  return await db.execute(connection, sql, params);
};

// usato in driver.js
const findDriverByNumber = async function (connection, numeroPilota) {
  const sql = `
    SELECT p.*, s.team_principal, s.numero_titoli_costruttori,
           CAST(COALESCE(SUM(g.punti_ottenuti), 0) AS SIGNED) AS punti_stagione,
           COUNT(g.nome_c) AS gare_disputate
    FROM pilota p
    LEFT JOIN scuderia s ON s.nome = p.scuderia_corrente
    LEFT JOIN gareggiare g ON g.numero_pilota = p.numero_pilota
    WHERE p.numero_pilota = ?
    GROUP BY p.numero_pilota`;
  const rows = await db.execute(connection, sql, [numeroPilota]);
  return rows.length > 0 ? rows[0] : null;
};

// risultati gara-per-gara di un singolo pilota (per la pagina di dettaglio), usato in driver.js
const findDriverResults = async function (connection, numeroPilota) {
  const sql = `
    SELECT g.nome_c AS circuito, c.citta, c.data_gara,
           g.posizione_finale, g.numero_giri, g.punti_ottenuti
    FROM gareggiare g
    INNER JOIN circuito c ON c.nome = g.nome_c
    WHERE g.numero_pilota = ?
    ORDER BY c.data_gara`;
  return await db.execute(connection, sql, [numeroPilota]);
};

// Quanto è gettonato un pilota: quanti fantateam lo hanno in rosa sul
// totale dei fantateam esistenti. Serve per la percentuale di selezione
// mostrata nella scheda del pilota: e' un dato aggregato su TUTTI gli utenti,
// quindi puo' essere calcolato solo qui, lato server.
// usato in driver.js
const findDriverSelection = async function (connection, numeroPilota) {
  const sql = `
    SELECT (SELECT COUNT(*) FROM fantateam) AS team_totali,
           (SELECT COUNT(*) FROM fantateam_pilota WHERE numero_pilota = ?)
             AS team_con_pilota`;
  const rows = await db.execute(connection, sql, [numeroPilota]);
  return rows[0];
};

// Scuderie con statistiche aggregate dei loro piloti correnti usato in driver.js
const findAllTeams = async function (connection) {
  const sql = `
    SELECT s.nome, s.anno_debutto, s.numero_titoli_costruttori, s.team_principal,
           COUNT(DISTINCT p.numero_pilota) AS numero_piloti,
           CAST(COALESCE(SUM(g.punti_ottenuti), 0) AS SIGNED) AS punti_stagione
    FROM scuderia s
    LEFT JOIN pilota p ON p.scuderia_corrente = s.nome
    LEFT JOIN gareggiare g ON g.numero_pilota = p.numero_pilota
    GROUP BY s.nome
    ORDER BY punti_stagione DESC, s.nome`;
  return await db.execute(connection, sql, []);
};

module.exports = {
  findAllDrivers,
  findDriverByNumber,
  findDriverResults,
  findDriverSelection,
  findAllTeams
};
