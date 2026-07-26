import { Injectable } from '@angular/core'; 
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { SessionService } from './session.service';
import { Fantateam, NuovoFantateam } from '../modelli/fantateam.model';

@Injectable({ providedIn: 'root' })
export class FantateamService {

  // richiesta servizi HttpClient e SessionService
  constructor(private http: HttpClient, private session: SessionService) {}

  // id dell'utente loggato preso dalla sessione
  // errore esplicito se la sessione manca
  private userId(): number {
    const u = this.session.getLoggedUser();
    if (!u) throw new Error('Operazione sui fantateam senza utente loggato');
    return u.id_utente;
  }

  // CREATE READ UPDATE DELETE
  // CONVERSAZIONE 3: i miei team
  // GET /api/users/:id/fantateams
  myTeams(): Observable<Fantateam[]> {
    return this.http.get<Fantateam[]>(`${API_URL}/users/${this.userId()}/fantateams`);
  }
  // POST /api/users/:id/fantateams
  create(team: NuovoFantateam): Observable<Fantateam> {
    return this.http.post<Fantateam>(`${API_URL}/users/${this.userId()}/fantateams`, team);
  }
  // PUT /api/fantateams/:id
  // Partial perchè non sono obbligato ad inviare tutti i campi ma solo alcuni quando modifico il team
  update(idTeam: number, team: Partial<NuovoFantateam>): Observable<Fantateam> {
    return this.http.put<Fantateam>(`${API_URL}/fantateams/${idTeam}`, team);
  }
  // DELETE /api/fantateams/:id
  delete(idTeam: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_URL}/fantateams/${idTeam}`);
  }
}
