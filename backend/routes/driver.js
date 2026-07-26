// CONVERSAZIONE 2: visualizzazione piloti / statistiche
const express = require('express');
const db = require('../services/db');
const driverDAO = require('../dao/driverDAO'); 

const router = express.Router();

// Lista piloti filtrabile (?scuderia=&nazionalita=&search=)
// -> GET /drivers 
router.get('/drivers', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const drivers = await driverDAO.findAllDrivers(conn, req.query);
    await conn.commit();
    res.json(drivers);
  } catch (err) {
      console.error('routes/driver.js GET /drivers:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

// pagina dettaglio pilota + risultati gara per gara
// -> GET /drivers/:numero
router.get('/drivers/:numero', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const driver = await driverDAO.findDriverByNumber(conn, req.params.numero);
    if (!driver) {
      res.status(404).json({ erroreMsg: 'Pilota non trovato' });
      await conn.commit();
      return;
    }
    // il dettaglio include i risultati di tutte le gare corse
    driver.risultati = await driverDAO.findDriverResults(conn, req.params.numero);

    // Statistiche fantasy (calcolabile solo lato server)
    driver.media_punti = driver.gare_disputate > 0
      ? Math.round((driver.punti_stagione / driver.gare_disputate) * 10) / 10
      : 0;
      
    const selezione = await driverDAO.findDriverSelection(conn, req.params.numero);
    driver.team_totali = selezione.team_totali;
    driver.team_con_pilota = selezione.team_con_pilota;
    driver.percentuale_selezione = selezione.team_totali > 0
      ? Math.round((selezione.team_con_pilota / selezione.team_totali) * 1000) / 10
      : 0;

    await conn.commit();
    res.json(driver);
  } catch (err) {
      console.error('routes/driver.js GET /drivers/:numero:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

// Lista scuderie
// -> GET /teams
router.get('/teams', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const teams = await driverDAO.findAllTeams(conn);
    await conn.commit();
    res.json(teams);
  } catch (err) {
    console.error('routes/driver.js GET /teams:', err.message, err.stack);
    if (conn) await conn.rollback();
    res.status(400).json({ erroreMsg: err.message });
  } finally {
    if (conn) await conn.end();
  }
});

module.exports = router;
