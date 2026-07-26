// CONVERSAZIONE 6: servizio per le operazioni amministrative 

// ogni chiamata include l'header x-user-id dell'utente loggato e il backend verifica che quel'utente abbia 
// ruolo 'admin' (middleware checkAdmin)
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { SessionService } from './session.service';
import { User } from '../modelli/user.model';

// Risultato di un pilota da inviare alla chiusura gara
export interface RisultatoInput { 
  numero_pilota: number;
  posizione_finale: number;
  numero_giri: number;
  punti_ottenuti: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  // richiesta servizio HttpClient e SessionService
  constructor(private http: HttpClient, private session: SessionService) {}

  private headers(): HttpHeaders {
    const u = this.session.getLoggedUser();
    if (!u) throw new Error('Operazione amministrativa senza utente loggato');
    return new HttpHeaders({ 'x-user-id': String(u.id_utente) }); // costruzione header da inviare per verificare che sono admin
  }

  // Lista utenti (per l'assegnazione crediti)
  // GET /api/users + header {'x-user-id': idadmin}
  listUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${API_URL}/users`, { headers: this.headers() });
  }

  // Chiusura gara: risultati + pole. Il backend regola scommesse e fantateam.
  // POST /api/races/:nome/results
  // uso Observable<unknown> perchè a me non interessa la risposta ma voglio sapere se l'op è andata a buon fine o no tramite codici di stato
  closeRace(nomeCircuito: string, polePilota: number | null, risultati: RisultatoInput[]): Observable<unknown> {
    return this.http.post(
      `${API_URL}/races/${encodeURIComponent(nomeCircuito)}/results`,
      { pole_pilota: polePilota, risultati }, // body
      { headers: this.headers() } // header custom con auth admin id
    );
  }

  // Annulla una scommessa in attesa (con rimborso)
  // POST /api/bets/:id/cancel
  cancelBet(idScommessa: number): Observable<{ message: string }> { // server ritornerà sempre un obj di tipo { message: string }
    return this.http.post<{ message: string }>(
      `${API_URL}/bets/${idScommessa}/cancel`, {}, { headers: this.headers() }
    );
  }

  // Crediti bonus a un utente
  // POST /api/users/:id/credits
  // { message: string; utente: User } così frontend aggiorna crediti senza rifare una GET
  grantCredits(idUtente: number, crediti: number): Observable<{ message: string; utente: User }> {
    return this.http.post<{ message: string; utente: User }>(
      `${API_URL}/users/${idUtente}/credits`, { crediti }, { headers: this.headers() });
  }
}
