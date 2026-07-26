// CONFIG DELL'APP
module.exports = {
  port: 3000,
  contextPath: '/api',
  // origine frontend angular (utilizzo per CORS)
  frontendOrigin: 'http://localhost:4200',
  db: {
    host: 'localhost',
    user: 'f1fantasy',
    password: 'f1fantasy!',
    database: 'f1db',
    // per una migliore gestione nel frontend ritorno le data come oggetto stringa 'YYYY-MM-DD'
    dateStrings: true
  },
  // per una migliore gestione delle regole del fantasy, queste vengono definite in config
  fantasy: {
    BUDGET_MAX: 100,        // crediti disponibili per comporre un fantateam
    MIN_PILOTI: 2,          // numero minimo di piloti per team
    MAX_PILOTI: 5,          // numero massimo di piloti per team
    MAX_PER_SCUDERIA: 2     // massimo piloti della stessa scuderia
  }
};
