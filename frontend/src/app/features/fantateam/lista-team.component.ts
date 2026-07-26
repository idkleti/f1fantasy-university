// CONVERSAZIONE 3: lista dei fantateam dell'utente loggato
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FantateamService } from '../../servizi/fantateam.service';
import { Fantateam } from '../../modelli/fantateam.model';

@Component({
  selector: 'app-lista-team',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lista-team.component.html'
})

export class ListaTeamComponent implements OnInit {
  teams: Fantateam[] = [];
  errore = '';

  constructor(private fantateamService: FantateamService) {}

  ngOnInit(): void {
    this.carica();
  }

  carica() {
    this.fantateamService.myTeams().subscribe({
      next: t => this.teams = t,
      error: err => this.errore = err.error?.erroreMsg || 'Impossibile caricare i team'
    });
  }

  elimina(idTeam: number) {
    if (!confirm('Eliminare questo fantateam?')) return;
    this.fantateamService.delete(idTeam).subscribe({
      next: () => this.carica(),
      error: err => this.errore = err.error?.erroreMsg || 'Errore nella cancellazione'
    });
  }
}
