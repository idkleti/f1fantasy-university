// Pagina Profilo: dati dell'utente loggato, saldo crediti aggiornato dal server e pulsante di logout.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '../../servizi/session.service';
import { UserService } from '../../servizi/user.service';
import { User } from '../../modelli/user.model';

// creazione componente grafico 
@Component({
  selector: 'app-profilo', // tag html <app-profilo>
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profilo.component.html'
})

export class ProfiloComponent implements OnInit {
  // tipo User o null
  utente: User | null = null;

  // richiesta dei servizi
  constructor(
    private session: SessionService,
    private userService: UserService,
    private router: Router
  ) {}

  // inizializzo i dati con ngOnInit() all'avvio del componente
  ngOnInit(): void {
    const u = this.session.getLoggedUser();
    if (!u) {
      this.router.navigate(['/login']);
      return;
    }
    // saldo dal server (i crediti possono essere cambiati)
    this.userService.getById(u.id_utente).subscribe({
      next: fresh => {
        this.utente = fresh;
        this.session.setLoggedUser(fresh);   // riallinea header e storage
      },
      error: () => this.utente = u // se server non risponde, mantengo dati della sessione vecchia
    });
  }

  logout() {
    this.session.clearLoggedUser(); 
    this.router.navigate(['/home']);
  }
}
