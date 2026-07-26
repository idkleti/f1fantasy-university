// rotte frontend
import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login.component';
import { RegistrazioneComponent } from './features/auth/registrazione.component';
import { ProfiloComponent } from './features/auth/profilo.component';
import { ListaPilotiComponent } from './features/drivers/lista-piloti.component';
import { DettaglioPilotaComponent } from './features/drivers/dettaglio-pilota.component';
import { ListaTeamComponent } from './features/fantateam/lista-team.component';
import { FormTeamComponent } from './features/fantateam/form-team.component';
import { ListaScommesseComponent } from './features/bets/lista-scommesse.component';
import { FormScommessaComponent } from './features/bets/form-scommessa.component';
import { ClassificaComponent } from './features/leaderboard/classifica.component';
import { AdminComponent } from './features/admin/admin.component';

// definizione tabella rotte per SPA (cambio solo contenuto <router-outlet> in index.html) ed esportazione delle rotte
export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' }, // quando apro app senza / mi reindirizza alla home
                                                        // pathMatch full applica solo quando url è esattamente vuoto
  { path: 'home', component: HomeComponent },
  // CONVERSAZIONE 1: login e registrazione su pagine dedicate
  { path: 'login', component: LoginComponent },
  { path: 'registrazione', component: RegistrazioneComponent },
  { path: 'profilo', component: ProfiloComponent },
  // CONVERSAZIONE 2
  { path: 'piloti', component: ListaPilotiComponent },
  { path: 'piloti/:numero', component: DettaglioPilotaComponent },
  // CONVERSAZIONE 3
  { path: 'fantateam', component: ListaTeamComponent },
  { path: 'fantateam/nuovo', component: FormTeamComponent },
  { path: 'fantateam/modifica/:id', component: FormTeamComponent },
  // CONVERSAZIONE 4
  { path: 'scommesse', component: ListaScommesseComponent },
  { path: 'scommesse/nuova', component: FormScommessaComponent },
  // CONVERSAZIONE 5
  { path: 'classifica', component: ClassificaComponent },
  // CONVERSAZIONE 6 (solo admin)
  { path: 'admin', component: AdminComponent }
];
