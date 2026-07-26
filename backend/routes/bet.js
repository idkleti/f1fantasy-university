// CONVERSAZIONE 4 (parte utente): scommesse.
const express = require('express');
const db = require('../services/db');
const userDAO = require('../dao/userDAO');
const raceDAO = require('../dao/raceDAO');
const betDAO = require('../dao/betDAO');
const { quotaFor, TIPI_VALIDI } = require('../services/quota');

const router = express.Router();

// Le mie scommesse
// -> GET  /users/:userId/bets
router.get('/users/:userId/bets', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const bets = await betDAO.findBetsByUser(conn, req.params.userId);
    await conn.commit();
    res.json(bets);
  } catch (err) {
      console.error('routes/bet.js GET bets:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

// Piazza una scommessa
// -> POST /users/:userId/bets
// Regole scommesse: 
//   - si scommette solo su gare NON ancora disputate (disputata='N')
//   - la quota la calcola il server (services/quota.js), mai il client
//   - i crediti puntati vengono scalati subito dal saldo, nella stessa
//      transazione dell'inserimento della scommessa
router.post('/users/:userId/bets', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const idUtente = req.params.userId;
    const { nome_circuito, numero_pilota, tipo_scommessa } = req.body;
    const creditiPuntati = parseInt(req.body.crediti_puntati, 10);

    // validazioni
    if (!nome_circuito || !numero_pilota || !tipo_scommessa || !creditiPuntati) {
      res.status(400).json({
        erroreMsg: 'nome_circuito, numero_pilota, tipo_scommessa e crediti_puntati sono obbligatori'
      });
      if (conn) await conn.rollback();
      return;
    }
    if (!TIPI_VALIDI.includes(tipo_scommessa)) {
      res.status(400).json({ erroreMsg: `tipo_scommessa deve essere uno di: ${TIPI_VALIDI.join(', ')}` });
      if (conn) await conn.rollback();
      return;
    }
    if (creditiPuntati <= 0) {
      res.status(400).json({ erroreMsg: 'I crediti puntati devono essere positivi' });
      if (conn) await conn.rollback();
      return;
    }

    const utente = await userDAO.findUserById(conn, idUtente);
    if (!utente) {
      res.status(404).json({ erroreMsg: 'Utente non trovato' });
      if (conn) await conn.rollback();
      return;
    }
    if (utente.crediti < creditiPuntati) {
      res.status(400).json({
        erroreMsg: `Crediti insufficienti: disponibili ${utente.crediti}, richiesti ${creditiPuntati}`
      });
      if (conn) await conn.rollback();
      return;
    }

    const gara = await raceDAO.findRaceByName(conn, nome_circuito);
    if (!gara) {
      res.status(404).json({ erroreMsg: 'Gara non trovata' });
      if (conn) await conn.rollback();
      return;
    }
    // niente scommesse su gare gia' corse
    if (gara.disputata === 'Y') {
      res.status(400).json({ erroreMsg: 'La gara e' + "' gia' stata disputata: scommessa non ammessa" });
      if (conn) await conn.rollback();
      return;
    }

    // la quota dipende dal pilota scelto (dal suo costo fantasy)
    const piloti = await db.execute(conn,
      'SELECT costo_fantasy FROM pilota WHERE numero_pilota = ?', [numero_pilota]);
    if (piloti.length === 0) {
      res.status(404).json({ erroreMsg: 'Pilota non trovato' });
      if (conn) await conn.rollback();
      return;
    }
    const quota = quotaFor(tipo_scommessa, piloti[0].costo_fantasy);

    // scala i crediti e registra la scommessa (stessa transazione)
    await userDAO.updateCrediti(conn, idUtente, -creditiPuntati);
    const bet = await betDAO.createBet(conn, {
      id_utente: idUtente,
      nome_circuito,
      numero_pilota,
      tipo_scommessa,
      quota,
      crediti_puntati: creditiPuntati
    });

    await conn.commit();
    res.status(201).json(bet);
  } catch (err) {
      console.error('routes/bet.js POST bets:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

module.exports = router;
