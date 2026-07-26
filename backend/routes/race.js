// CONVERSAZIONE 2: calendario
// CONVERSAZIONE 4: regolamento post-gara
const express = require('express');
const db = require('../services/db');
const raceDAO = require('../dao/raceDAO');
const betDAO = require('../dao/betDAO');
const userDAO = require('../dao/userDAO');
const fantateamDAO = require('../dao/fantateamDAO');
const checkAdmin = require('../middleware/checkAdmin');

const router = express.Router();

// Calendario completo 
// -> GET  /races                  
router.get('/races', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const races = await raceDAO.findAllRaces(conn);
    await conn.commit();
    res.json(races);
  } catch (err) {
      console.error('routes/race.js GET /races:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

// Classifica di una gara disputata
// -> GET /races/:nome/results
// non usata ma tenuta per effetuare test di lettura e scrittura
router.get('/races/:nome/results', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const gara = await raceDAO.findRaceByName(conn, req.params.nome);
    if (!gara) {
      res.status(404).json({ erroreMsg: 'Gara non trovata' });
      await conn.commit();
      return;
    }
    gara.risultati = await raceDAO.findRaceResults(conn, req.params.nome);
    await conn.commit();
    res.json(gara);
  } catch (err) {
      console.error('routes/race.js GET results:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

// Scommesse piazzate su una gara (usata da pannello admin)
// -> GET /races/:nome/bets
router.get('/races/:nome/bets', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const bets = await betDAO.findBetsByRace(conn, req.params.nome);
    await conn.commit();
    res.json(bets);
  } catch (err) {
      console.error('routes/race.js GET bets:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

// Determina se una scommessa e' vinta dato il risultato della gara.
function scommessaVinta(bet, risultati, polePilota) {
  const r = risultati.find(x => x.numero_pilota === bet.numero_pilota);
  switch (bet.tipo_scommessa) {
    case 'vincitore': return !!r && r.posizione_finale === 1; // !! converte ogni valore in true/false (r obj=true altrimenti falso)
    case 'podio':     return !!r && r.posizione_finale <= 3;
    case 'pole':      return bet.numero_pilota === polePilota;
    default:          return false;
  }
}

// Chiude la gara: inserisce i risultati, regola le scommesse, aggiorna i fantateam
// PROTETTA dal middleware checkAdmin: solo un utente con ruolo 'admin' puo' chiudere una gara.
// -> POST /races/:nome/results
router.post('/races/:nome/results', checkAdmin, async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const nomeCircuito = req.params.nome;
    const { pole_pilota, risultati } = req.body;

    if (!Array.isArray(risultati) || risultati.length === 0) {
      res.status(400).json({ erroreMsg: 'Il campo risultati (array) e' + "' obbligatorio" });
      if (conn) await conn.rollback();
      return;
    }

    const gara = await raceDAO.findRaceByName(conn, nomeCircuito);
    if (!gara) {
      res.status(404).json({ erroreMsg: 'Gara non trovata' });
      if (conn) await conn.rollback();
      return;
    }
    if (gara.disputata === 'Y') {
      res.status(400).json({ erroreMsg: 'Gara gia' + "' disputata: risultati gia' registrati" });
      if (conn) await conn.rollback();
      return;
    }

    // Validazione minima dei risultati: posizioni uniche, piloti unici
    const posizioni = risultati.map(r => r.posizione_finale);
    const piloti = risultati.map(r => r.numero_pilota);
    if (new Set(posizioni).size !== posizioni.length ||
        new Set(piloti).size !== piloti.length) {
      res.status(400).json({ erroreMsg: 'Risultati con posizioni o piloti duplicati' });
      if (conn) await conn.rollback();
      return;
    }

    // 1) Inserisce i risultati in gareggiare
    for (const r of risultati) {
      await raceDAO.insertResult(conn, nomeCircuito, r);
    }

    // 2) Marca la gara come disputata e salva la pole
    await raceDAO.closeRace(conn, nomeCircuito, pole_pilota);

    // 3) Regola tutte le scommesse in attesa su questa gara
    const pending = await betDAO.findPendingBetsByRace(conn, nomeCircuito);
    let vinte = 0, perse = 0;
    for (const bet of pending) {
      if (scommessaVinta(bet, risultati, pole_pilota)) {
        const vincita = Math.round(bet.crediti_puntati * bet.quota);
        await betDAO.settleBet(conn, bet.id_scommessa, 'vinta', vincita);
        await userDAO.updateCrediti(conn, bet.id_utente, vincita);
        vinte++;
      } else {
          await betDAO.settleBet(conn, bet.id_scommessa, 'persa', 0);
          perse++;
      }
    }

    // 4) Aggiorna i punti totali dei fantateam coinvolti
    const teamAggiornati = await fantateamDAO.refreshTeamPoints(conn, nomeCircuito);

    await conn.commit();
    res.status(201).json({
      message: `Gara chiusa: ${risultati.length} risultati registrati`,
      scommesse_regolate: { vinte, perse },
      fantateam_aggiornati: teamAggiornati
    });
  } catch (err) {
      console.error('routes/race.js POST results:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

module.exports = router;
