// CONVERSAZIONE 2: classifica piloti con filtro per scuderia e ricerca

// i filtri passano da un flusso RxJS per non tempestare il server:
//  - debounceTime: aspetta che l'utente smetta di digitare, cosi' parte UNA richiesta invece di una per ogni lettera
//  - switchMap: se arriva un nuovo filtro annulla la richiesta precedente,
//      evitando che una risposta vecchia sovrascriva quella nuova.
// nel template il *ngFor usa trackBy dove Angular riusa le righe esistenti invece
// di distruggerle e ricrearle a ogni risposta (niente sfarfallio della lista)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs'; // Subject = sorgente di eventi che creo io e non http
import { debounceTime, switchMap } from 'rxjs/operators';
import { DriverService } from '../../servizi/driver.service';
import { Driver, Scuderia } from '../../modelli/driver.model';
import { coloreScuderia, logoScuderia } from '../../modelli/scuderie';

@Component({
  selector: 'app-lista-piloti',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lista-piloti.component.html'
})

export class ListaPilotiComponent implements OnInit, OnDestroy {
  piloti: Driver[] = [];
  scuderie: Scuderia[] = [];
  filtroScuderia = '';
  ricerca = '';
  errore = '';

  // ogni volta che il Subject emette un segnale, significa che i filtri sono cambiati (tipo void perchè è solo un impulso)
  private filtri$ = new Subject<void>();

  constructor(private driverService: DriverService) {}

  ngOnInit(): void {
    this.driverService.listTeams().subscribe({
      next: s => this.scuderie = s,
      error: () => this.errore = 'Impossibile caricare le scuderie'
    });

    // pipe della ricerca
    this.filtri$.pipe( // parto dai filtri
      // aspetto 300ms di pausa nel digitare 
      debounceTime(300),
      // invio la richiesta, annullando quella precedente
      switchMap(() => this.richiestaPiloti())
    ).subscribe({
        next: p => this.piloti = p,
        error: () => this.errore = 'Impossibile caricare i piloti'
    });

    // primo caricamento immediato, senza attesa perchè pipe vuota all'inizio
    this.richiestaPiloti().subscribe({
      next: p => this.piloti = p,
      error: () => this.errore = 'Impossibile caricare i piloti'
    });
  }

  ngOnDestroy(): void {
    this.filtri$.complete();   // chiudo Subject
  }

  private richiestaPiloti() {
    return this.driverService.list({
      scuderia: this.filtroScuderia || undefined,
      search: this.ricerca || undefined
    });
  }

  // chiamato dal template ad ogni modifica dei filti
  // invia impulso su filtri$ e poi la gestisce la pipe
  carica(): void {
    this.filtri$.next();
  }

  // trackBy per il *ngFor: identifica ogni riga col numero pilota,
  // così Angular riusa le righe invece di ricrearle a ogni risposta (niente sfarfallio)
  perNumeroPilota(_indice: number, pilota: Driver): number {
    return pilota.numero_pilota;
  }

  // ---- aspetto: foto del pilota, colore e logo della scuderia ----

  foto(pilota: Driver): string {
    const file = pilota.cognome
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z]/g, '');
    return `assets/piloti/${file}.webp`;
  }

  colore(pilota: Driver): string {
    return coloreScuderia(pilota.scuderia_corrente);
  }

  logo(pilota: Driver): string {
    return logoScuderia(pilota.scuderia_corrente);
  }
}
