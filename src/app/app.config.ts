import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    /* Sans zone.js : la détection de changement suit les signals. */
    provideZonelessChangeDetection(),
    /* Le HTML pré-rendu est réutilisé tel quel ; les clics faits avant la
       fin du chargement sont rejoués. */
    provideClientHydration(withEventReplay()),
  ],
};
