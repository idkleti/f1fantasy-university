// CONVERSAZIONE 5: classifica generale (paginata) e per singola gara
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaderboardService } from '../../servizi/leaderboard.service';
import { RaceService } from '../../servizi/race.service';
import { Classifica, RigaClassificaGara } from '../../modelli/leaderboard.model';
import { Race } from '../../modelli/race.model';

@Component({
  selector: 'app-classifica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './classifica.component.html'
})

export class ClassificaComponent implements OnInit {
  classifica: Classifica | null = null;
  page = 1;
  pageSize = 10;

  gareDisputate: Race[] = [];
  garaSelezionata = '';
  classificaGara: RigaClassificaGara[] = [];

  errore = '';

  constructor(
    private leaderboardService: LeaderboardService,
    private raceService: RaceService
  ) {}

  ngOnInit(): void {
    this.carica();
    this.raceService.list().subscribe({
      next: r => this.gareDisputate = r.filter(g => g.disputata === 'Y'),
      error: () => this.errore = 'Impossibile caricare le gare'
    });
  }

  carica() {
    this.leaderboardService.general(this.page, this.pageSize).subscribe({
      next: c => this.classifica = c,
      error: () => this.errore = 'Impossibile caricare la classifica'
    });
  }

  totalePagine(): number {
    if (!this.classifica) return 1;
    return Math.max(1, Math.ceil(this.classifica.totale / this.classifica.pageSize)); // ritorna int più piccolo >= risultato
  }

  vaiPagina(delta: number) {
    const nuova = this.page + delta;
    if (nuova >= 1 && nuova <= this.totalePagine()) {
      this.page = nuova;
      this.carica();
    }
  }

  caricaGara() {
    this.classificaGara = [];
    if (!this.garaSelezionata) return;
    this.leaderboardService.byRace(this.garaSelezionata).subscribe({
      next: rows => this.classificaGara = rows,
      error: () => this.errore = 'Impossibile caricare la classifica di gara'
    });
  }
}
