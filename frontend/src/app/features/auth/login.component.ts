// CONVERSAZIONE 1: pagina di login dedicata (card centrata con username/password + link alla registrazione)

// verifica credenziali avviene SUL SERVER (POST /auth/login, bcrypt).
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../servizi/user.service';
import { SessionService } from '../../servizi/session.service';

// elemento grafico
@Component({
  selector: 'app-login', // tag <app-login>
  standalone: true, // gestisco le dependencies da solo
  imports: [CommonModule, FormsModule, RouterLink], // strumenti usati dal template
  templateUrl: './login.component.html' 
})

export class LoginComponent {
  username = '';
  password = '';
  errore = '';

  // richiedo i servizi UserService, SessionService e Router
  constructor(
    private userService: UserService,
    private session: SessionService,
    private router: Router
  ) {}

  login() {
    this.errore = ''; // azzera eventuali errori precedenti (es. psw errata)
    // this.username, this.password sono le variabili del componente legate al form che ha compilato l'utente
    this.userService.login(this.username, this.password).subscribe({ // .subscribe al servizio = quando ricevi dati fai x
      // next scatta se il login viene eseguito correttamente
      next: user => {
        this.session.setLoggedUser(user);   // l'header si aggiorna da solo a seguito di this.session.user$.subscribe(u => this.loggedUser = u)
                                            // in app.component.ts
        this.router.navigate(['/home']);
      },
      // error quando errore nel login
      error: err => this.errore = err.error?.erroreMsg || 'Errore di login'
    });
  }
}
