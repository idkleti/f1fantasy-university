import { Injectable } from '@angular/core'; 
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { Classifica, RigaClassificaGara } from '../modelli/leaderboard.model';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {

  // richiesta servizio HttpClient
  constructor(private http: HttpClient) {}

  // CONVERSAZIONE 5: classifica generale paginata
  general(page: number, pageSize: number): Observable<Classifica> {
    // costruzione query string tipo: GET /api/leaderboard?page=1&pageSize=10
    const params = new HttpParams()
      .set('page', page)          // page e pageSize vanno in req.query
      .set('pageSize', pageSize);
    return this.http.get<Classifica>(`${API_URL}/leaderboard`, { params });
  }

  // CONVERSAZIONE 5: classifica di una singola gara
  // GET /api/leaderboard/race/:nome
  byRace(nomeCircuito: string): Observable<RigaClassificaGara[]> {
    return this.http.get<RigaClassificaGara[]>(
      `${API_URL}/leaderboard/race/${encodeURIComponent(nomeCircuito)}`);
  }
}
