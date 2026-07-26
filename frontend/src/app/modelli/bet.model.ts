export type TipoScommessa = 'vincitore' | 'podio' | 'pole';
export type EsitoScommessa = 'in_attesa' | 'vinta' | 'persa' | 'annullata';

// scommessa dell'utente (GET /users/:id/bets)
export interface Bet {
  id_scommessa: number;
  nome_circuito: string;
  tipo_scommessa: TipoScommessa;
  quota: number;
  crediti_puntati: number;
  data_scommessa: string;
  esito: EsitoScommessa;
  crediti_vinti: number;
  numero_pilota: number;
  pilota_nome: string;
  pilota_cognome: string;
  data_gara: string;
  disputata: 'Y' | 'N';
}

// payload per piazzare una scommessa (la quota la calcola il server)
export interface NuovaScommessa {
  nome_circuito: string;
  numero_pilota: number;
  tipo_scommessa: TipoScommessa;
  crediti_puntati: number;
}

// scommessa vista dal pannello admin (GET /races/:nome/bets)
export interface BetGara {
  id_scommessa: number;
  tipo_scommessa: TipoScommessa;
  quota: number;
  crediti_puntati: number;
  esito: EsitoScommessa;
  crediti_vinti: number;
  data_scommessa: string;
  username: string;
  numero_pilota: number;
  pilota_cognome: string;
}
