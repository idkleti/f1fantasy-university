// CONVERSAZIONE 1: pagina di registrazione (username, email, nome, cognome, password e conferma password).

// conferma password è un controllo solo client-side
// la validazione vincolante (univocita', lunghezza) resta sul server

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../servizi/user.service';
import { SessionService } from '../../servizi/session.service';

@Component({
  selector: 'app-registrazione',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registrazione.component.html'
})

export class RegistrazioneComponent {
  username = '';
  email = '';
  nome = '';
  cognome = '';
  password = '';
  confermaPassword = '';
  errore = '';

  constructor(
    private userService: UserService,
    private session: SessionService,
    private router: Router
  ) {}

  passwordCoincidono(): boolean {
    return this.password === this.confermaPassword;
  }

  registra() {
    this.errore = '';
    if (!this.passwordCoincidono()) {
      this.errore = 'Le due password non coincidono';
      return;
    }
    this.userService.register({
      username: this.username,
      password: this.password,
      email: this.email,
      nome: this.nome,
      cognome: this.cognome
    }).subscribe({
      next: user => {
        // registrazione riuscita: login automatico e ritorno alla home
        this.session.setLoggedUser(user);
        this.router.navigate(['/home']);
      },
      error: err => this.errore = err.error?.erroreMsg || 'Errore nella registrazione'
    });
  }
}
