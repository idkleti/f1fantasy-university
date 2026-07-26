// CONVERSAZIONE 6: pannello di amministrazione

// - chiusura gara con griglia risultati
// - annullamento scommesse con rimborso
// - assegnazione crediti bonus

// La vista e' raggiungibile solo se l'utente loggato ha ruolo 'admin'  (il link appare solo agli admin e il componente reindirizza gli altri)
// in ogni caso l'autorizzazione vincolante e' quella del backend (403)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../servizi/session.service';
import { AdminService, RisultatoInput } from '../../servizi/admin.service';
import { RaceService } from '../../servizi/race.service';
import { DriverService } from '../../servizi/driver.service';
import { Race } from '../../modelli/race.model';
import { Driver } from '../../modelli/driver.model';
import { BetGara } from '../../modelli/bet.model';
import { User } from '../../modelli/user.model';

// Punti F1 standard per le prime 10 posizioni
const PUNTI_F1 = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

interface RigaRisultato {
  posizione: number;
  numero_pilota: number | null;
  punti: number;
  giri: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html'
})

export class AdminComponent implements OnInit {
  piloti: Driver[] = [];

  // --- Sezione 1: chiusura gara ---
  gareFuture: Race[] = [];
  garaDaChiudere = '';
  polePilota: number | null = null;
  righe: RigaRisultato[] = [];
  esitoChiusura = '';
  erroreChiusura = '';

  // --- Sezione 2: scommesse ---
  tutteLeGare: Race[] = [];
  garaScommesse = '';
  scommesseGara: BetGara[] = [];
  esitoScommesse = '';

  // --- Sezione 3: crediti bonus ---
  utenti: User[] = [];
  utenteSelezionato: number | null = null;
  creditiBonus = 100;
  esitoCrediti = '';

  constructor(
    private session: SessionService,
    private adminService: AdminService,
    private raceService: RaceService,
    private driverService: DriverService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // i non-admin vengono reindirizzati alla home
    const u = this.session.getLoggedUser();
    if (!u || u.ruolo !== 'admin') {
      this.router.navigate(['/home']);
      return;
    }

    // ottengo lista piloti e li inserisco in piloti
    this.driverService.list().subscribe({ next: p => this.piloti = p });
    // carico le gare
    this.caricaGare();
    // ottengo gli utenti e li inserisco in utenti
    this.adminService.listUsers().subscribe({ next: us => this.utenti = us });
    // prepara la griglia per chiudere la gara
    this.resetRighe();
  }

  caricaGare() {
    // mi iscrivo al servizio gare e ricevo la lista delle gare
    this.raceService.list().subscribe({
      next: r => {
        // inserisco le gare in tutteLeGare e le gare non disputate in gareFuture
        this.tutteLeGare = r;
        this.gareFuture = r.filter(g => g.disputata === 'N');
      }
    });
  }

  // prepara la griglia standard: 10 posizioni con i punti F1 ufficiali
  resetRighe() {
    this.righe = PUNTI_F1.map((punti, i) => ({ // map è funzione eseguita su ogni elemento dell'array e ritorna un arr con risultati
      posizione: i + 1,
      numero_pilota: null,
      punti,
      giri: 50
    }));
  }

  // righe complete (con pilota scelto) da inviare al backend
  righeValide(): RigaRisultato[] {
    return this.righe.filter(r => r.numero_pilota !== null);
  }

  // controllo duplicati pilota fra le righe compilate
  pilotiDuplicati(): boolean {
    const scelti = this.righeValide().map(r => r.numero_pilota);
    return new Set(scelti).size !== scelti.length; // true quando ci sono elementi duplicati
  }

  chiusuraValida(): boolean {
    return this.garaDaChiudere !== '' &&
           this.righeValide().length >= 3 &&
           !this.pilotiDuplicati();
  }

  chiudiGara() {
    this.esitoChiusura = '';
    this.erroreChiusura = '';
    const risultati: RisultatoInput[] = this.righeValide().map(r => ({
      numero_pilota: r.numero_pilota as number, // ho già validato e non ci sono null
      posizione_finale: r.posizione,
      numero_giri: r.giri,
      punti_ottenuti: r.punti
    }));
    this.adminService.closeRace(this.garaDaChiudere, this.polePilota, risultati)
      .subscribe({
        next: () => {
          this.esitoChiusura = `Gara chiusa: scommesse regolate e fantateam aggiornati.`;
          this.garaDaChiudere = '';
          this.polePilota = null;
          this.resetRighe();
          this.caricaGare();
        },
        error: err => this.erroreChiusura = err.error?.erroreMsg || 'Errore nella chiusura'
      });
  }

  caricaScommesse() {
    this.scommesseGara = [];
    this.esitoScommesse = '';
    if (!this.garaScommesse) return;
    this.raceService.betsByRace(this.garaScommesse).subscribe({
      next: b => this.scommesseGara = b
    });
  }

  annullaScommessa(idScommessa: number) {
    if (!confirm('Annullare la scommessa e rimborsare la puntata?')) return;
    this.adminService.cancelBet(idScommessa).subscribe({
      next: r => { this.esitoScommesse = r.message; this.caricaScommesse(); },
      error: err => this.esitoScommesse = err.error?.erroreMsg || 'Errore'
    });
  }

  assegnaCrediti() {
    this.esitoCrediti = '';
    if (!this.utenteSelezionato || this.creditiBonus <= 0) return;
    this.adminService.grantCredits(this.utenteSelezionato, this.creditiBonus).subscribe({
      next: r => {
        this.esitoCrediti = r.message;
        this.adminService.listUsers().subscribe({ next: us => this.utenti = us });
      },
      error: err => this.esitoCrediti = err.error?.erroreMsg || 'Errore'
    });
  }
}
