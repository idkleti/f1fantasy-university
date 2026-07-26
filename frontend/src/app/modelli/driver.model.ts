// pilota con statistiche stagione (GET /drivers)
export interface Driver {
  numero_pilota: number;
  nome: string;
  secondo_nome: string | null;
  cognome: string;
  data_nascita: string | null;
  anno_debutto: number;
  nazionalita: string | null;
  ruolo: string;
  numero_pole: number;
  numero_mondiali: number;
  scuderia_corrente: string | null;
  costo_fantasy: number;
  punti_stagione: number;
  gare_disputate: number;
  miglior_posizione: number | null;
}

// risultato di un pilota in una gara (dentro il dettaglio pilota)
export interface RisultatoPilota {
  circuito: string;
  citta: string;
  data_gara: string;
  posizione_finale: number;
  numero_giri: number;
  punti_ottenuti: number;
}

// dettaglio pilota (GET /drivers/:numero)
export interface DriverDetail extends Driver {
  team_principal: string | null;
  numero_titoli_costruttori: number | null;
  risultati: RisultatoPilota[];
  // statistiche fantasy calcolate dal server
  media_punti: number;              // punti fantasy medi a gara
  team_totali: number;              // fantateam esistenti in totale
  team_con_pilota: number;          // fantateam che hanno questo pilota
  percentuale_selezione: number;    // % di fantateam che lo hanno scelto
}

// scuderia con aggregati (GET /teams)
export interface Scuderia {
  nome: string;
  anno_debutto: number;
  numero_titoli_costruttori: number;
  team_principal: string | null;
  numero_piloti: number;
  punti_stagione: number;
}
