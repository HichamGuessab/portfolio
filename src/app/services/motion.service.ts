import { computed, effect, Injectable, Signal, signal } from '@angular/core';

/** Clé localStorage mémorisant l'override d'animations du visiteur. */
const STORAGE_KEY = 'portfolio-motion-override';

/** Préférence système « réduire les animations ». */
const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Classe posée sur `<html>` quand l'override est actif : les règles CSS
 * (neutralisation globale, styles .reveal, mascotte) s'y réfèrent pour
 * réactiver les animations malgré `prefers-reduced-motion: reduce`.
 */
const FORCE_MOTION_CLASS = 'force-motion';

/**
 * Source de vérité unique sur les animations du portfolio.
 *
 * Combine la préférence système (`prefers-reduced-motion`, suivie en direct
 * via matchMedia) et un override explicite du visiteur (persisté dans
 * localStorage) : quelqu'un dont le système réduit les animations peut ainsi
 * choisir de les voir ici sans toucher à son réglage d'accessibilité.
 *
 * Quand l'override est actif, la classe `force-motion` est posée sur `<html>`
 * — de manière synchrone dès la construction du service (avant le premier
 * rendu, aucun flash) puis réactivement à chaque bascule.
 */
@Injectable({
  providedIn: 'root',
})
export class MotionService {
  /** Vrai quand le système demande de réduire les animations. */
  private readonly _systemReducedMotion = signal(false);

  /** Vrai quand le visiteur a explicitement réactivé les animations. */
  private readonly _overrideEnabled = signal(false);

  /** Exposé pour l'UI : le bouton d'override n'a de sens que si le système réduit. */
  readonly systemReducedMotion: Signal<boolean> =
    this._systemReducedMotion.asReadonly();

  /** Vrai quand l'override du visiteur est actif. */
  readonly overrideEnabled: Signal<boolean> =
    this._overrideEnabled.asReadonly();

  /**
   * Vrai quand les animations doivent jouer : le système ne réduit pas,
   * ou le visiteur a activé l'override.
   */
  readonly motionEnabled: Signal<boolean> = computed(
    () => !this._systemReducedMotion() || this._overrideEnabled()
  );

  constructor() {
    this.restoreOverride();
    /* Classe posée immédiatement (avant le premier rendu) pour éviter tout
       flash d'animations neutralisées au chargement avec un override actif. */
    this.applyClass();
    effect(() => this.applyClass());

    const query = window.matchMedia(REDUCED_MOTION_MEDIA_QUERY);
    this._systemReducedMotion.set(query.matches);
    query.addEventListener('change', (event) =>
      this._systemReducedMotion.set(event.matches)
    );
  }

  /** Active ou désactive l'override, et persiste ce choix pour les visites suivantes. */
  toggleOverride(): void {
    const next = !this._overrideEnabled();
    this._overrideEnabled.set(next);
    try {
      if (next) {
        localStorage.setItem(STORAGE_KEY, 'on');
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Stockage indisponible (navigation privée…) : le choix vaut pour la session.
    }
  }

  private restoreOverride(): void {
    try {
      this._overrideEnabled.set(localStorage.getItem(STORAGE_KEY) === 'on');
    } catch {
      // Stockage indisponible : pas d'override, la préférence système s'applique.
    }
  }

  private applyClass(): void {
    document.documentElement.classList.toggle(
      FORCE_MOTION_CLASS,
      this._overrideEnabled()
    );
  }
}
