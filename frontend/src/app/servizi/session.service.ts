// gestione sessione client-side in localStorage REATTIVA con un BehaviorSubject: chi si sottoscrive a user$ (es. l'header)
// viene aggiornato automaticamente a ogni login/logout/aggiornamento crediti, senza dover ricaricare la pagina.
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../modelli/user.model';

@Injectable({ providedIn: 'root' }) // una sola sessione per tutta l'app
export class SessionService {

  // BehaviorSubject è come Observable solo che consegna il valore subito quando ti iscrivi
  private userSubject = new BehaviorSubject<User | null>(this.leggiDaStorage());
  // Observable readonly PUBBLICO dello stato di sessione: emette l'utente corrente o null (leggendo cosa c'è in localStorage all'inizio)
  readonly user$ = this.userSubject.asObservable();

  // legge l'utente da localStorage all'avvio. localStorage salva solo STRINGHE:
  // se c'è qualcosa, la riconverto da JSON a oggetto User o altrimenti null (nessuno loggato)
  private leggiDaStorage(): User | null {
    const raw = localStorage.getItem('utente');
    return raw ? JSON.parse(raw) as User : null;
  }

  getLoggedUser(): User | null {
    return this.userSubject.value;
  }

  // login / aggiornamento crediti:
  // salvataggio in localStorage
  // .next() emette il nuovo valore e tutti i sottoscritti a user$ (l'header html) reagiscono da soli
  setLoggedUser(user: User): void {
    localStorage.setItem('utente', JSON.stringify(user));
    this.userSubject.next(user);
  }

  // logout: svuota localStorage ed emette null -> l'header torna alla vista "ospite"
  clearLoggedUser(): void {
    localStorage.removeItem('utente');
    this.userSubject.next(null);
  }
}
