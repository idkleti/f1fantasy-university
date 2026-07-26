// ROTTA UTENTE
// Conversazione 1: Login/Logout + Registrazione
// nota: il logout è un'operazione client-side che svuota la sessione in localStorage
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../services/db');
const userDAO = require('../dao/userDAO');

const router = express.Router();

// Registrazione nuovo utente:
// -> POST /users
router.post('/users', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const { username, password, email, nome, cognome } = req.body;

    // Validazione dei campi obbligatori
    if (!username || !password || !email) {
      res.status(400).json({ erroreMsg: 'username, password ed email sono obbligatori' });
      if (conn) await conn.rollback();
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ erroreMsg: 'La password deve avere almeno 8 caratteri' });
      if (conn) await conn.rollback();
      return;
    }

    // Controllo univocità per dare msg errore preciso all'utente (oltre al vincolo UNIQUE sul DB)
    const existing = await userDAO.existsByUsernameOrEmail(conn, username, email);
    if (existing.length > 0) {
      const campo = existing[0].username === username ? 'username' : 'email';
      res.status(409).json({ erroreMsg: `Questo ${campo} e' gia' registrato` });
      if (conn) await conn.rollback();
      return;
    }

    // Hash della password: nel DB non entra mai in chiaro
    const hash = bcrypt.hashSync(password, 10);
    const user = await userDAO.createUser(conn, { username, password: hash, email, nome, cognome });

    await conn.commit();
    res.status(201).json(user);
  } catch (err) {
      console.error('routes/user.js POST /users:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

// Login: verifica credenziali e restituisce l'utente (senza password)
// il client salva l'utente in localStorage (sessione client-side)
// -> POST /auth/login
router.post('/auth/login', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ erroreMsg: 'username e password sono obbligatori' });
      if (conn) await conn.rollback();
      return;
    }

    const user = await userDAO.findUserByUsernameWithPassword(conn, username);
    // bcrypt.compareSync confronta la password in chiaro con l'hash salvato.
    if (!user || !bcrypt.compareSync(password, user.password)) {
      res.status(401).json({ erroreMsg: 'Credenziali non valide' });
      if (conn) await conn.rollback();
      return;
    }

    delete user.password; // la password (anche hashata) non esce mai dal server
    await conn.commit();
    res.json(user);
  } catch (err) {
      console.error('routes/user.js POST /auth/login:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

// Dati utente per id (usato per aggiornare il saldo crediti nell'header visto che la sessione è client-sided)
// se non mettessi questa rotta il saldo crediti, aggiornato dalla parte server, sarebbe aggiornato solo al login dopo
router.get('/users/:userId', async function (req, res) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const user = await userDAO.findUserById(conn, req.params.userId);
    if (!user) {
      res.status(404).json({ erroreMsg: 'Utente non trovato' });
    } else {
      res.json(user);
    }
    await conn.commit();
  } catch (err) {
      console.error('routes/user.js GET /users/:userId:', err.message, err.stack);
      if (conn) await conn.rollback();
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
});

module.exports = router;
