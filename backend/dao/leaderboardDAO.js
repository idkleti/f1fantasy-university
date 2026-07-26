// DAO per le classifiche (conversazione "Classifica").

// Aggregati su fantateam + scommesse. Il "punteggio" e' definito come:
//   punti_fantateam + FLOOR(crediti_vinti / 10)
const db = require('../services/db');

// Classifica generale con paginazione
const findGeneralLeaderboard = async function (connection, page, pageSize) {
  const limit = Math.max(1, Math.min(50, parseInt(pageSize, 10) || 10));
  const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;

  // coalesce è per gestione dei valori NULL, che vengono messi a 0
  // LEFT JOIN perchè voglio che compaiano tutti gli utenti, anche quelli senza fantateam/scommesse 
  const sql = `
    SELECT u.id_utente, u.username, u.crediti,
           COALESCE(pf.punti_fantateam, 0) AS punti_fantateam,
           COALESCE(sv.crediti_vinti_totali, 0) AS crediti_vinti_totali,
           COALESCE(sv.scommesse_vinte, 0) AS scommesse_vinte,
           COALESCE(pf.punti_fantateam, 0)
             + FLOOR(COALESCE(sv.crediti_vinti_totali, 0) / 10) AS punteggio
    FROM utente u
    LEFT JOIN (
      SELECT f.id_utente, CAST(SUM(g.punti_ottenuti) AS SIGNED) AS punti_fantateam
      FROM fantateam f
      INNER JOIN fantateam_pilota fp ON fp.id_team = f.id_team
      INNER JOIN gareggiare g ON g.numero_pilota = fp.numero_pilota
      GROUP BY f.id_utente
    ) pf ON pf.id_utente = u.id_utente
    LEFT JOIN (
      SELECT s.id_utente,
             CAST(SUM(s.crediti_vinti) AS SIGNED) AS crediti_vinti_totali,
             CAST(SUM(CASE WHEN s.esito = 'vinta' THEN 1 ELSE 0 END) AS SIGNED) AS scommesse_vinte
      FROM scommessa s
      GROUP BY s.id_utente
    ) sv ON sv.id_utente = u.id_utente
    WHERE u.cancellato = 'N' AND u.ruolo = 'giocatore'
    ORDER BY punteggio DESC, u.username
    LIMIT ${limit} OFFSET ${offset}`; // interi validati interpolati perchè prepared statement 
                                       // non accettano placeholder su LIMIT

  const rows = await db.execute(connection, sql, []);

  const countSql = `SELECT COUNT(*) AS totale FROM utente WHERE cancellato = 'N' AND ruolo = 'giocatore'`;
  const countRows = await db.execute(connection, countSql, []);

  return {
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    totale: countRows[0].totale,
    classifica: rows
  };
};

// Classifica relativa a una singola gara
const findRaceLeaderboard = async function (connection, nomeCircuito) {
  // AND (pg.punti_gara IS NOT NULL OR sg.crediti_vinti_gara IS NOT NULL) mostra SOLO chi ha partecipato
  const sql = `
    SELECT u.id_utente, u.username,
           COALESCE(pg.punti_gara, 0) AS punti_fantateam_gara,
           COALESCE(sg.crediti_vinti_gara, 0) AS crediti_vinti_gara,
           COALESCE(pg.punti_gara, 0)
             + FLOOR(COALESCE(sg.crediti_vinti_gara, 0) / 10) AS punteggio_gara
    FROM utente u
    LEFT JOIN (
      SELECT f.id_utente, CAST(SUM(g.punti_ottenuti) AS SIGNED) AS punti_gara
      FROM fantateam f
      INNER JOIN fantateam_pilota fp ON fp.id_team = f.id_team
      INNER JOIN gareggiare g ON g.numero_pilota = fp.numero_pilota
      WHERE g.nome_c = ?
      GROUP BY f.id_utente
    ) pg ON pg.id_utente = u.id_utente
    LEFT JOIN (
      SELECT s.id_utente, CAST(SUM(s.crediti_vinti) AS SIGNED) AS crediti_vinti_gara
      FROM scommessa s
      WHERE s.nome_circuito = ? AND s.esito = 'vinta'
      GROUP BY s.id_utente
    ) sg ON sg.id_utente = u.id_utente
    WHERE u.cancellato = 'N' AND u.ruolo = 'giocatore'
      AND (pg.punti_gara IS NOT NULL OR sg.crediti_vinti_gara IS NOT NULL)
    ORDER BY punteggio_gara DESC, u.username`;

  return await db.execute(connection, sql, [nomeCircuito, nomeCircuito]);
};

module.exports = { findGeneralLeaderboard, findRaceLeaderboard };
