// import
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { User, NuovoUtente } from '../modelli/user.model';

// NOTA: @Injectable = servizio (logica,dati) senza aspetto -> @Component = aspetto in ../features/
@Injectable({ providedIn: 'root' }) // { providedIn: 'root' } è dove vive il servizio (intera app)
export class UserService {

  // viene passato il servizio HttpClient
  constructor(private http: HttpClient) {}

  // CONVERSAZIONE 1: registrazione
  // -> POST /api/users  (routes/user.js) 
  register(nuovo: NuovoUtente): Observable<User> { // Observable = risposta asincrona del server, chi chiama fa .subscribe() per riceverla
    return this.http.post<User>(`${API_URL}/users`, nuovo);
  }

  // CONVERSAZIONE 1: login (la verifica della password avviene sul server)
  // -> POST /api/auth/login — login
  login(username: string, password: string): Observable<User> {
    return this.http.post<User>(`${API_URL}/auth/login`, { username, password });
  }

  // Ricarica i dati utente (es. saldo crediti dopo una scommessa)
  // -> GET  /api/users/:id — dati aggiornati
  getById(idUtente: number): Observable<User> {
    return this.http.get<User>(`${API_URL}/users/${idUtente}`);
  }
}
