// CONVERSAZIONE 3: creazione/modifica fantateam.
// lo stesso componente serve /fantateam/nuovo e /fantateam/modifica/:id visto che condividono praticamente la stessa interfaccia
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DriverService } from '../../servizi/driver.service';
import { FantateamService } from '../../servizi/fantateam.service';
import { Driver } from '../../modelli/driver.model';

const BUDGET_MAX = 100;
const MIN_PILOTI = 2;
const MAX_PILOTI = 5;

@Component({
  selector: 'app-form-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-team.component.html'
})

export class FormTeamComponent implements OnInit {
  // ridefinisco perchè template vede proprietà classe e non variabili/costanti del file
  BUDGET_MAX = BUDGET_MAX;
  MIN_PILOTI = MIN_PILOTI;
  MAX_PILOTI = MAX_PILOTI;

  modifica = false;
  idTeam: number | null = null;
  nomeTeam = '';
  piloti: Driver[] = [];
  // il Set evita di default i duplicati quindi elimino questa possibilità
  selezionati = new Set<number>();
  errore = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private driverService: DriverService,
    private fantateamService: FantateamService
  ) {}

  ngOnInit(): void {
    // Lista completa dei piloti
    this.driverService.list().subscribe({
      next: p => this.piloti = p,
      error: () => this.errore = 'Impossibile caricare i piloti'
    });

    // In modalita' modifica, precarica nome e rosa correnti nel form
    const id = this.route.snapshot.paramMap.get('id'); // se url è modifica allora prendo id e sono in modalità modifica
    if (id) {
      this.modifica = true;
      this.idTeam = Number(id);
      this.fantateamService.myTeams().subscribe({
        next: teams => {
          const team = teams.find(t => t.id_team === this.idTeam);
          if (team) {
            this.nomeTeam = team.nome_team;
            // set di numero di pilota
            this.selezionati = new Set(team.piloti.map(p => p.numero_pilota));
          }
        }
      });
    }
  }

  // usato in form-team-component.html
  toggle(numeroPilota: number) {
    if (this.selezionati.has(numeroPilota)) {
      this.selezionati.delete(numeroPilota);
    } else {
      this.selezionati.add(numeroPilota);
    }
  }

  costoTotale(): number {
    return this.piloti
      .filter(p => this.selezionati.has(p.numero_pilota))
      .reduce((tot, p) => tot + p.costo_fantasy, 0); // risultato accumulato a partire da ogni elemento array
  }

  budgetResiduo(): number {
    return BUDGET_MAX - this.costoTotale();
  }

  valido(): boolean {
    const n = this.selezionati.size;
    return this.nomeTeam.trim().length > 0 &&
           n >= MIN_PILOTI && n <= MAX_PILOTI &&
           this.budgetResiduo() >= 0;
  }

  salva() {
    this.errore = '';
    const payload = {
      nome_team: this.nomeTeam.trim(),
      piloti: [...this.selezionati] // da set vado ad array perchè backend si aspetta array e Set non serializzabile
    };
    const obs = this.modifica && this.idTeam
      ? this.fantateamService.update(this.idTeam, payload)
      : this.fantateamService.create(payload);
    // faccio un solo subscribe in entrambi i casi della gestione del team
    obs.subscribe({
      next: () => this.router.navigate(['/fantateam']),
      error: err => this.errore = err.error?.erroreMsg || 'Errore nel salvataggio'
    });
  }

  annulla() {
    this.router.navigate(['/fantateam']);
  }
}
