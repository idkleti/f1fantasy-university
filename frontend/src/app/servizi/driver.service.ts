import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { Driver, DriverDetail, Scuderia } from '../modelli/driver.model';

@Injectable({ providedIn: 'root' })
export class DriverService {

  // richiesta servizio HttpClient
  constructor(private http: HttpClient) {}
 
  // CONVERSAZIONE 2: lista piloti con filtri opzionali
  // GET /api/drivers?scuderia=&nazionalita=&search=
  list(filtri?: { scuderia?: string; nazionalita?: string; search?: string }): Observable<Driver[]> { // ? = opzionale
    let params = new HttpParams(); // let params perchè HttpParams è immutabile quindi ogni set è oggetto nuovo
    if (filtri?.scuderia) params = params.set('scuderia', filtri.scuderia); // controllo se inserito
    if (filtri?.nazionalita) params = params.set('nazionalita', filtri.nazionalita); // controllo se inserito
    if (filtri?.search) params = params.set('search', filtri.search); // controllo se inserito
    return this.http.get<Driver[]>(`${API_URL}/drivers`, { params }); // se params è vuoto allora req.query è vuoto in backend
  }

  // CONVERSAZIONE 2: dettaglio pilota con risultati
  // GET /api/drivers/:numero
  get(numeroPilota: number): Observable<DriverDetail> {
    return this.http.get<DriverDetail>(`${API_URL}/drivers/${numeroPilota}`);
  }

  // CONVERSAZIONE 2: scuderie con punti aggregati
  // GET /api/teams
  listTeams(): Observable<Scuderia[]> {
    return this.http.get<Scuderia[]>(`${API_URL}/teams`);
  }
}
