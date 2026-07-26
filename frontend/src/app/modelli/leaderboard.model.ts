// riga della classifica generale
export interface RigaClassifica {
  id_utente: number;
  username: string;
  crediti: number;
  punti_fantateam: number;
  crediti_vinti_totali: number;
  scommesse_vinte: number;
  punteggio: number;
}

// risposta paginata (GET /leaderboard)
export interface Classifica {
  page: number;
  pageSize: number;
  totale: number;
  classifica: RigaClassifica[];
}

// riga della classifica di una singola gara
export interface RigaClassificaGara {
  id_utente: number;
  username: string;
  punti_fantateam_gara: number;
  crediti_vinti_gara: number;
  punteggio_gara: number;
}
