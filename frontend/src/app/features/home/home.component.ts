// Home con doppia apparenza (user loggato o no):
// - ospite: hero di presentazione con immagini placeholder, CTA Registrati e card della PROSSIMA GARA con conto alla
//      rovescia (stile gioco ufficiale)
// - loggato: saluto con crediti, , spiegazione del gioco e CTA fantateam
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../servizi/session.service';
import { RaceService } from '../../servizi/race.service';
import { User } from '../../modelli/user.model';
import { Race } from '../../modelli/race.model';

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
              'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html'
})

export class HomeComponent implements OnInit, OnDestroy {
  loggedUser: User | null = null;

  prossimaGara: Race | null = null;
  // numero tappa del calendario
  round = 0;

  giorni = 0;
  ore = 0;
  minuti = 0;

  // il timer, che potrebbe non esistere, ha come tipo i tipo di setInterval
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private session: SessionService,
    private raceService: RaceService
  ) {}

  ngOnInit(): void {
    this.session.user$.subscribe(u => this.loggedUser = u); // subscribe per ottenere i dati dell'utente non appena disponibili

    // ottengo le informazioni sulle gare
    this.raceService.list().subscribe({
      next: gare => {
        // il calendario arriva ordinato per data: la prossima e' la prima non ancora disputata
        const indice = gare.findIndex(g => g.disputata === 'N');
        if (indice >= 0) {
          this.prossimaGara = gare[indice];
          this.round = indice + 1; // inizio a contare da 0
          this.aggiornaConteggio();
          // il conto alla rovescia si aggiorna ogni minuto
          this.timer = setInterval(() => this.aggiornaConteggio(), 60000);
        }
      }
    });
  }

  ngOnDestroy(): void {
    // libera il timer quando si lascia la pagina
    if (this.timer) clearInterval(this.timer);
  }

  // quanto manca alla gara, spezzato in giorni / ore / minuti.
  private aggiornaConteggio(): void {
    if (!this.prossimaGara?.data_gara) return;
    // .getTime() e .now() ritorna num in millisecondi 
    const mancano = new Date(this.prossimaGara.data_gara).getTime() - Date.now();
    if (mancano <= 0) {
      this.giorni = this.ore = this.minuti = 0;
      return;
    }
    this.giorni = Math.floor(mancano / 86400000); // divide per ms in un giorno
    this.ore = Math.floor(mancano / 3600000) % 24; // divide per ms in un ora mod 24 per ottenere 0-23
    this.minuti = Math.floor(mancano / 60000) % 60; // divide per ms in un minuto mod 60 per ottenere 0-59
  }

  /** '2026-07-26' -> '26 luglio 2026' */
  dataEstesa(iso: string): string {
    const [anno, mese, giorno] = iso.split('-').map(Number); // spezza stringa dai - e casta come numeri
    return `${giorno} ${MESI[mese - 1]} ${anno}`;
  }

  /** Aggiunge lo zero davanti ai numeri a una cifra (02 : 20 : 18). */
  dueCifre(n: number): string {
    return n < 10 ? '0' + n : String(n);
  }
}
