// shell applicazione: header con logo, navigazione e router-outlet.

// l'header mostra solo i link, diversi per ospite e utente loggato.

// lo stato di sessione arriva in modo reattivo da SessionService.user$.

// import 
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from './servizi/session.service';
import { User } from './modelli/user.model';

@Component({
  selector: 'app-root', // nome tag html con cui componente compare in index.html
  standalone: true, // dichiaro da solo (sotto) cosa mi serve per template
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html'
})

export class AppComponent implements OnInit {
  loggedUser: User | null = null;
  // mi viene passato il servizio SessionService
  constructor(private session: SessionService) {}
  ngOnInit(): void { // caricamento dati iniziali sessione all'avvio del componente
    // ogni variazione di sessione (login, logout, aggiornamento crediti)
    // aggiorna automaticamente l'header senza ricaricamenti di pagina.
    this.session.user$.subscribe(u => this.loggedUser = u);
  }
}
