// CONVERSAZIONE 4: piazza una scommessa

// si puo' scommettere solo su gare non ancora disputate
// la quota la calcola il server al momento della conferma.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RaceService } from '../../servizi/race.service';
import { DriverService } from '../../servizi/driver.service';
import { BetService } from '../../servizi/bet.service';
import { SessionService } from '../../servizi/session.service';
import { UserService } from '../../servizi/user.service';
import { Race } from '../../modelli/race.model';
import { Driver } from '../../modelli/driver.model';
import { TipoScommessa } from '../../modelli/bet.model';

@Component({
  selector: 'app-form-scommessa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-scommessa.component.html'
})

export class FormScommessaComponent implements OnInit {
  gareFuture: Race[] = [];
  piloti: Driver[] = [];
  nomeCircuito = '';
  numeroPilota: number | null = null;
  tipo: TipoScommessa = 'vincitore'; // di default il sito mostra "Vincitore della Gara"
  crediti = 10;
  creditiDisponibili = 0;
  errore = '';

  constructor(
    private raceService: RaceService,
    private driverService: DriverService,
    private betService: BetService,
    private session: SessionService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // solo gare non ancora disputate
    this.raceService.list().subscribe({
      next: r => this.gareFuture = r.filter(g => g.disputata === 'N'),
      error: () => this.errore = 'Impossibile caricare il calendario'
    });

    // lista piloti
    this.driverService.list().subscribe({
      next: p => this.piloti = p,
      error: () => this.errore = 'Impossibile caricare i piloti'
    });

    // saldo crediti aggiornato dal server (non dalla copia in localStorage)
    const u = this.session.getLoggedUser();
    if (u) {
      this.userService.getById(u.id_utente).subscribe({
        next: fresh => {
          this.creditiDisponibili = fresh.crediti;
          this.session.setLoggedUser(fresh); // salsa in sessione e aggiorna tutti i dati utente
        }
      });
    }
  }

  valido(): boolean {
    return !!this.nomeCircuito && !!this.numeroPilota &&
           this.crediti > 0 && this.crediti <= this.creditiDisponibili;
  }

  piazza() {
    this.errore = '';
    if (!this.numeroPilota) return;
    this.betService.place({
      nome_circuito: this.nomeCircuito,
      numero_pilota: this.numeroPilota,
      tipo_scommessa: this.tipo, // può cambiare dal selettore nella pagina
      crediti_puntati: this.crediti
    }).subscribe({
      next: () => {
        // ricarica il saldo dal server e aggiorna la sessione
        const u = this.session.getLoggedUser();
        if (u) {
          this.userService.getById(u.id_utente).subscribe({
            next: fresh => this.session.setLoggedUser(fresh)
          });
        }
        this.router.navigate(['/scommesse']);
      },
      error: err => this.errore = err.error?.erroreMsg || 'Errore nella scommessa'
    });
  }
}
