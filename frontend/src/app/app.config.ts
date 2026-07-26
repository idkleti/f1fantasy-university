// import 
// provideZoneChangeDetection configura come angular rileva i cambiamenti per aggiornare la UI
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'; 
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

// registrazione servizi globali applicazione
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), // { eventCoalescing: true } perchè se arrivano più eventi in un tempo
                                                            // riavvicinato allora fa un solo controllo UI raggruppando eventi
    provideRouter(routes), // attivazione servizio routing con rotte esportate in ./app.routes.ts
    provideHttpClient() // attivazione servizio HttpClient per accedere al backend
  ]
};
