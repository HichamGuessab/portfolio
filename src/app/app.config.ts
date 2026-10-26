import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideClientHydration,
  withIncrementalHydration,
} from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    /* Sans zone.js : la détection de changement suit les signals. */
    provideZonelessChangeDetection(),
    /* Le HTML pré-rendu est réutilisé tel quel. Hydratation incrémentale :
       chaque section sous la ligne de flottaison ne s'hydrate qu'en entrant
       à l'écran (voir app.component.html) ; les clics faits entre-temps
       sont rejoués. */
    provideClientHydration(withIncrementalHydration()),
  ],
};
