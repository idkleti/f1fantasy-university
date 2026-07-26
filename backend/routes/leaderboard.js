// CONVERSAZIONE 5: classifica degli utenti
const express = require('express');
const db = require('../services/db');
const leaderboardDAO = require('../dao/leaderboardDAO');

const router = express.Router();

// Classifica generale paginata
// -> GET /leaderboard?page=&pageSize=
router.get('/leaderboard', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const result = await leaderboardDAO.findGeneralLeaderboard(
      conn, req.query.page, req.query.pageSize
    );
    await conn.commit();
    res.json(result);
  } catch (err) {
      console.error('routes/leaderboard.js GET /leaderboard:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

// Classifica relativa a una singola gara
// -> GET /leaderboard/race/:nome
router.get('/leaderboard/race/:nome', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const rows = await leaderboardDAO.findRaceLeaderboard(conn, req.params.nome);
    await conn.commit();
    res.json(rows);
  } catch (err) {
      console.error('routes/leaderboard.js GET race:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

module.exports = router;
