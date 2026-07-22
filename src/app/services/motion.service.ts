import { Injectable, Signal, signal } from '@angular/core';

/**
 * Ancienne clé localStorage de l'override d'animations (bouton « Activer les
 * animations », retiré). Nettoyée au démarrage pour les visiteurs qui
 * l'auraient encore.
 */
const LEGACY_OVERRIDE_KEY = 'portfolio-motion-override';

/**
 * Source de vérité unique sur les animations du portfolio.
 *
 * Les animations sont actives par défaut pour tout le monde, y compris quand
 * le système demande de réduire les animations (`prefers-reduced-motion`) :
 * elles font partie de l'identité du site. Le service est conservé comme
 * point d'extension unique pour tous ses consommateurs (mascottes, cadre de
 * la photo, animations d'entrée).
 */
@Injectable({
  providedIn: 'root',
})
export class MotionService {
  /** Vrai quand les animations doivent jouer : toujours, par défaut. */
  readonly motionEnabled: Signal<boolean> = signal(true).asReadonly();

  constructor() {
    /* L'override n'existe plus : la clé persistée par les anciennes visites
       est retirée. */
    try {
      localStorage.removeItem(LEGACY_OVERRIDE_KEY);
    } catch {
      // Stockage indisponible (navigation privée…) : rien à nettoyer.
    }
  }
}
