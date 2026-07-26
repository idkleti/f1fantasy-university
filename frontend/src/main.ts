// import necessari per l'app
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// avvio app
// AppComponent viene inserito in index.html nel tag <app-root>
// poi gli si applica la appConfig
// e a cascata vengono aggiunti tutti gli altri components
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
