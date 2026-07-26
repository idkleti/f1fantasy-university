import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { SessionService } from './session.service';
import { Bet, NuovaScommessa } from '../modelli/bet.model';

@Injectable({ providedIn: 'root' })
export class BetService {
 
  // richiesta servizio HttpClient e SessionService
  constructor(private http: HttpClient, private session: SessionService) {}

  // recupero dalla sessione dell'ID utente tramite sessionservice
  private userId(): number {
    const u = this.session.getLoggedUser();
    if (!u) throw new Error('Operazione sulle scommesse senza utente loggato');
    return u.id_utente;
  }

  // CONVERSAZIONE 4: le mie scommesse
  // GET /api/users/:id/bets
  myBets(): Observable<Bet[]> {
    return this.http.get<Bet[]>(`${API_URL}/users/${this.userId()}/bets`);
  }

  // CONVERSAZIONE 4: piazza scommessa (la quota la assegna il server)
  // POST /api/users/:id/bets
  place(bet: NuovaScommessa): Observable<Bet> {
    return this.http.post<Bet>(`${API_URL}/users/${this.userId()}/bets`, bet);
  }
}
