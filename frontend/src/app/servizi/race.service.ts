import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { Race, RisultatoGara } from '../modelli/race.model';
import { BetGara } from '../modelli/bet.model';

@Injectable({ providedIn: 'root' })
export class RaceService {

  // richiesta servizio httpClient 
  constructor(private http: HttpClient) {}

  // GET /api/races
  list(): Observable<Race[]> {
    return this.http.get<Race[]>(`${API_URL}/races`);
  }

  // GET /api/races/:nome/results
  // Il nome circuito contiene spazi quindi va URL-encodato con %20
  results(nomeCircuito: string): Observable<Race & { risultati: RisultatoGara[] }> { // intersezione tra tipo Race e RisultatiGara[]
    return this.http.get<Race & { risultati: RisultatoGara[] }>(
      `${API_URL}/races/${encodeURIComponent(nomeCircuito)}/results`);
  }

  // GET /api/races/:nome/bets
  // Scommesse piazzate su una gara (usata dal pannello admin)
  betsByRace(nomeCircuito: string): Observable<BetGara[]> {
    return this.http.get<BetGara[]>(
      `${API_URL}/races/${encodeURIComponent(nomeCircuito)}/bets`);
  }
}
