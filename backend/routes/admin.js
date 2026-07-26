// CONVERSAZIONE 6: amministrazione del gioco

// solamente gli admin (check di header x-user-id) possono eseguire queste azioni (è admin-only anche
// POST /races/:nome/results definito in ./race.js) 

const express = require('express');
const db = require('../services/db');
const userDAO = require('../dao/userDAO');
const betDAO = require('../dao/betDAO');
const checkAdmin = require('../middleware/checkAdmin');

const router = express.Router();

// checkAdmin e' applicato per singola route (non con router.use) per non
// intercettare richieste destinate ad altri router montati sullo stesso path.

// Lista completa degli utenti (senza password) per assegnare crediti
// -> GET /users
router.get('/users', checkAdmin, async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const users = await userDAO.findAllUsers(conn);
    await conn.commit();
    res.json(users);
  } catch (err) {
      console.error('routes/admin.js GET /users:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

// Assegnazione di N crediti bonus a un utente
// -> POST /users/:userId/credits
router.post('/users/:userId/credits', checkAdmin, async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const crediti = parseInt(req.body.crediti, 10);
    if (!crediti || crediti <= 0) {
      res.status(400).json({ erroreMsg: 'Il campo crediti deve essere un intero positivo' });
      if (conn) await conn.rollback();
      return;
    }
    const utente = await userDAO.findUserById(conn, req.params.userId);
    if (!utente) {
      res.status(404).json({ erroreMsg: 'Utente non trovato' });
      if (conn) await conn.rollback();
      return;
    }
    await userDAO.updateCrediti(conn, req.params.userId, crediti);
    const aggiornato = await userDAO.findUserById(conn, req.params.userId);
    await conn.commit();
    res.json({ message: `Accreditati ${crediti} crediti a ${aggiornato.username}`,
               utente: aggiornato });
  } catch (err) {
      console.error('routes/admin.js POST credits:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

// Annullamento di una scommessa in attesa, con rimborso della puntata (nella stessa transazione)
// -> POST /bets/:betId/cancel
router.post('/bets/:betId/cancel', checkAdmin, async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const bet = await betDAO.findBetById(conn, req.params.betId);
    if (!bet) {
      res.status(404).json({ erroreMsg: 'Scommessa non trovata' });
      if (conn) await conn.rollback();
      return;
    }
    if (bet.esito !== 'in_attesa') {
      res.status(400).json({
        erroreMsg: `La scommessa e' gia' stata regolata (esito: ${bet.esito}): non annullabile`
      });
      if (conn) await conn.rollback();
      return;
    }
    await betDAO.cancelBet(conn, bet.id_scommessa);
    await userDAO.updateCrediti(conn, bet.id_utente, bet.crediti_puntati); // rimborso
    await conn.commit();
    res.json({ message: `Scommessa annullata: rimborsati ${bet.crediti_puntati} crediti` });
  } catch (err) {
      console.error('routes/admin.js POST cancel:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

module.exports = router;
