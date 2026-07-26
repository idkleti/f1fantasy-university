// F1 Fantasy - Backend REST API
// app.js monta i router, ogni router usa i DAO, i DAO usano services/db (pattern della lezione RUBRICA MAV).

// INIZIALIZZAZIONE
// Import dei moduli utilizzati dall'app
const express = require('express');
const cors = require('cors');
const config = require('./config');

// Import delle rotte dell'app 
const userRouter = require('./routes/user');
const driverRouter = require('./routes/driver');
const raceRouter = require('./routes/race');
const fantateamRouter = require('./routes/fantateam');
const betRouter = require('./routes/bet');
const leaderboardRouter = require('./routes/leaderboard');
const adminRouter = require('./routes/admin');

// Creazione dell'applicazione
const app = express();

// MIDDLEWARE
// dato che backend e frontend girano rispettivamente su localhost:3000 e localhost:4200, uso CORS per permettere
// al frontend di accedere in maniera sicura all'app backend (altrimenti le richieste sono bloccate di default)
app.use(cors({ origin: config.frontendOrigin }));

// parsing del body del msg in json e trasformazione dell'HTML in oggetto JS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// tutti gli endpoint sono montati sotto /api (definito in config.js)
app.use(config.contextPath, userRouter);
app.use(config.contextPath, driverRouter);
app.use(config.contextPath, raceRouter);
app.use(config.contextPath, fantateamRouter);
app.use(config.contextPath, betRouter);
app.use(config.contextPath, leaderboardRouter);

// middleware per operazioni dell'admin
// è montato per ultimo perchè le sue route non devono oscurare quelle degli altri router
// esempio: ho POST /users della registrazione che non deve essere oscurato da GET /users dell'admin
app.use(config.contextPath, adminRouter);

// ERROR HANDLING
// qualsiasi altra richiesta viene gestita con un errore con codice stato 404
app.all('*', function (req, res) {
  res.status(404).json({ erroreMsg: 'Resource Not Found' });
});

// AVVIO DELL'APPLICAZIONE
app.listen(config.port, () => {
  console.log(`F1 Fantasy API in ascolto su http://localhost:${config.port}${config.contextPath}`);
});
