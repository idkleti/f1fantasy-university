// CONVERSAZIONE 3: gestione fantateam

const express = require('express');
const config = require('../config');
const db = require('../services/db');
const userDAO = require('../dao/userDAO');
const fantateamDAO = require('../dao/fantateamDAO'); 

const router = express.Router();
const F = config.fantasy;

// Regole fantateam (config.fantasy):
//   - budget massimo 100 crediti, 2-5 piloti, max 2 della stessa scuderia,
//   - nessun pilota duplicato. La validazione avviene sempre lato server.
// Valida la rosa richiesta e calcola il costo totale.
// Ritorna { errore } oppure { costoTotale, piloti } con i dati dal DB.
async function validaRosa(conn, numeriPiloti) {
  if (!Array.isArray(numeriPiloti)) {
    return { errore: 'Il campo piloti deve essere un array di numeri pilota' };
  }
  const unici = [...new Set(numeriPiloti)];
  if (unici.length !== numeriPiloti.length) {
    return { errore: 'La rosa contiene piloti duplicati' };
  }
  if (unici.length < F.MIN_PILOTI || unici.length > F.MAX_PILOTI) {
    return { errore: `La rosa deve avere da ${F.MIN_PILOTI} a ${F.MAX_PILOTI} piloti` };
  }

  const piloti = await fantateamDAO.findDriversForValidation(conn, unici);
  if (piloti.length !== unici.length) {
    return { errore: 'Uno o piu' + "' numeri pilota non esistono" };
  }

  // Vincolo: massimo N piloti della stessa scuderia
  const perScuderia = {};
  for (const p of piloti) {
    const s = p.scuderia_corrente || 'nessuna';
    perScuderia[s] = (perScuderia[s] || 0) + 1;
    if (perScuderia[s] > F.MAX_PER_SCUDERIA) {
      return { errore: `Massimo ${F.MAX_PER_SCUDERIA} piloti della stessa scuderia (${s})` };
    }
  }

  // Vincolo: budget
  const costoTotale = piloti.reduce((tot, p) => tot + p.costo_fantasy, 0);
  if (costoTotale > F.BUDGET_MAX) {
    return { errore: `Budget sforato: costo rosa ${costoTotale}, massimo ${F.BUDGET_MAX}` };
  }

  return { costoTotale, piloti };
}

// team dell'utente con piloti
// -> GET /users/:userId/fantateams
router.get('/users/:userId/fantateams', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const teams = await fantateamDAO.findTeamsByUser(conn, req.params.userId);
    for (const team of teams) {
      team.piloti = await fantateamDAO.findTeamDrivers(conn, team.id_team);
    }
    await conn.commit();
    res.json(teams);
  } catch (err) {
      console.error('routes/fantateam.js GET fantateams:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

// Creazione di un fantateam {nome_team, piloti:[numeri]} con la sua rosa (transazione unica)
// -> POST /users/:userId/fantateams
router.post('/users/:userId/fantateams', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const idUtente = req.params.userId;
    const { nome_team, piloti } = req.body;

    if (!nome_team || !nome_team.trim()) {
      res.status(400).json({ erroreMsg: 'Il nome del team e' + "' obbligatorio" });
      if (conn) await conn.rollback();
      return;
    }
    const utente = await userDAO.findUserById(conn, idUtente);
    if (!utente) {
      res.status(404).json({ erroreMsg: 'Utente non trovato' });
      if (conn) await conn.rollback();
      return;
    }

    const esito = await validaRosa(conn, piloti || []);
    if (esito.errore) {
      res.status(400).json({ erroreMsg: esito.errore });
      if (conn) await conn.rollback();
      return;
    }

    const budgetResiduo = F.BUDGET_MAX - esito.costoTotale;
    const idTeam = await fantateamDAO.createTeam(conn, idUtente, nome_team.trim(), budgetResiduo);
    for (const p of esito.piloti) {
      await fantateamDAO.addDriverToTeam(conn, idTeam, p.numero_pilota, p.costo_fantasy);
    }

    const team = await fantateamDAO.findTeamById(conn, idTeam);
    team.piloti = await fantateamDAO.findTeamDrivers(conn, idTeam);
    await conn.commit();
    res.status(201).json(team);
  } catch (err) {
      console.error('routes/fantateam.js POST fantateams:', err.message, err.stack);
      if (conn) await conn.rollback();
      // Violazione del vincolo UNIQUE (id_utente, nome_team)
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ erroreMsg: 'Hai gia' + "' un team con questo nome" });
      } else {
        res.status(400).json({ erroreMsg: err.message });
      }
  } finally {
      if (conn) await conn.end();
  }
});

// Modifica: sostituzione o rinomina della rosa
// la rosa precedente viene eliminata e reinserita nella stessa transazione e se una validazione fallisce, 
// il rollback ripristina la situazione precedente.
// -> PUT /fantateams/:teamId
router.put('/fantateams/:teamId', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const idTeam = req.params.teamId;
    const { nome_team, piloti } = req.body;

    const team = await fantateamDAO.findTeamById(conn, idTeam);
    if (!team) {
      res.status(404).json({ erroreMsg: 'Fantateam non trovato' });
      if (conn) await conn.rollback();
      return;
    }

    const nuovoNome = (nome_team && nome_team.trim()) || team.nome_team;
    let budgetResiduo = team.budget_residuo;

    if (piloti) { // se la rosa viene modificata, va rivalidata da zero
      const esito = await validaRosa(conn, piloti);
      if (esito.errore) {
        res.status(400).json({ erroreMsg: esito.errore });
        if (conn) await conn.rollback();
        return;
      }
      await fantateamDAO.removeAllDriversFromTeam(conn, idTeam);
      for (const p of esito.piloti) {
        await fantateamDAO.addDriverToTeam(conn, idTeam, p.numero_pilota, p.costo_fantasy);
      }
      budgetResiduo = F.BUDGET_MAX - esito.costoTotale;
    }

    await fantateamDAO.updateTeam(conn, idTeam, nuovoNome, budgetResiduo);

    const updated = await fantateamDAO.findTeamById(conn, idTeam);
    updated.piloti = await fantateamDAO.findTeamDrivers(conn, idTeam);
    await conn.commit();
    res.json(updated);
  } catch (err) {
      console.error('routes/fantateam.js PUT fantateams:', err.message, err.stack);
      if (conn) await conn.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ erroreMsg: 'Hai gia' + "' un team con questo nome" });
      } else {
        res.status(400).json({ erroreMsg: err.message });
      }
  } finally {
      if (conn) await conn.end();
  }
});

// Eliminazione del team (la rosa segue per FK ON DELETE CASCADE)
// -> DELETE /fantateams/:teamId
router.delete('/fantateams/:teamId', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const deleted = await fantateamDAO.deleteTeam(conn, req.params.teamId);
    if (deleted) {
      res.status(200).json({ message: 'Fantateam eliminato' });
    } else {
      res.status(404).json({ erroreMsg: 'Fantateam non trovato' });
    }
    await conn.commit();
  } catch (err) {
      console.error('routes/fantateam.js DELETE fantateams:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

module.exports = router;
