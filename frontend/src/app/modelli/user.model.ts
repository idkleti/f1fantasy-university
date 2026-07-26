// utente restituito dall'API (la password non esce mai dal server)
export interface User {
  id_utente: number;
  username: string;
  email: string;
  nome: string | null;
  cognome: string | null;
  data_registrazione: string;
  crediti: number;
  ruolo: 'admin' | 'giocatore';
  cancellato: 'Y' | 'N';
}

// Payload per la registrazione
export interface NuovoUtente {
  username: string;
  password: string;
  email: string;
  nome?: string;
  cognome?: string;
}
