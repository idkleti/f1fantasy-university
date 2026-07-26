// gara del calendario (GET /races)
export interface Race {
  nome: string;
  citta: string;
  paese: string;
  data_gara: string;
  numero_curve: number;
  disputata: 'Y' | 'N';
  pole_pilota: number | null;
  pole_cognome: string | null;
  numero_scommesse: number;
}

// riga della classifica di gara (GET /races/:nome/results)
export interface RisultatoGara {
  posizione_finale: number;
  numero_giri: number;
  punti_ottenuti: number;
  numero_pilota: number;
  nome: string;
  cognome: string;
  scuderia_corrente: string | null;
}
