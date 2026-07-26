// Middleware di autorizzazione per le operazioni amministrative tra richiesta e risposta

// servizio accesso DB
const db = require('../services/db');

// middleware verifica sul DB che quell'utente abbia ruolo admin leggendo l'header "x-user-id"
// - header mancante        -> 401 (non autenticato)
// - utente non admin       -> 403 (autenticato ma non autorizzato)
// - utente admin           -> next(): il controllo passa all'handler
async function checkAdmin(req, res, next) {
  const idUtente = req.header('x-user-id');
  if (!idUtente) {
    res.status(401).json({ erroreMsg: 'Autenticazione richiesta (header x-user-id mancante)' });
    return;
  }
  let conn;
  try {
    conn = await db.getConnection();
    const rows = await db.execute(
      conn,
      `SELECT ruolo FROM utente WHERE id_utente = ? AND cancellato = 'N'`,
      [idUtente] // i parametri vanno sempre passati come array
    );
    if (rows.length === 0 || rows[0].ruolo !== 'admin') {
      res.status(403).json({ erroreMsg: 'Operazione riservata agli amministratori' });
      return;
    }
    next();
  } catch (err) { // errore generale
      console.error('middleware/checkAdmin:', err.message, err.stack);
      res.status(400).json({ erroreMsg: err.message });
  } finally {
      if (conn) await conn.end();
  }
}

module.exports = checkAdmin;
