// CALCOLO QUOTE VINCITE SCOMMESSA
// la quota (pesata) viene calcolata sempre dal server con la formula:
//    40 / costo_fantasy
// ed è limitata tra 1.2 e 5.0 

// un top driver (ex. Verstappen) ha base circa 1.2 perchè vince spesso quindi paga poco
// un pilota meno esperto ha base circa 4.0 perchè vince raramente quindi paga molto

// la quota del podio è più bassa perchè è un evento più probabile della vittoria

// la quota della pole è intermedia

function quotaFor(tipoScommessa, costoFantasy) {
  const base = Math.min(5.0, Math.max(1.2, 40 / costoFantasy));
  let quota;
  switch (tipoScommessa) {
    case 'vincitore': quota = base; break;
    case 'podio':     quota = Math.max(1.1, base * 0.55); break;
    case 'pole':      quota = Math.max(1.15, base * 0.8); break;
    default: return null;
  }
  return Math.round(quota * 100) / 100;
}

const TIPI_VALIDI = ['vincitore', 'podio', 'pole']; // tipologia di scommessa effettuata

module.exports = { quotaFor, TIPI_VALIDI };
