import {
  afterNextRender,
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ViewMode = 'slideshow' | 'compact';

const STORAGE_KEY = 'portfolio-view-mode';

/**
 * Garde d'activation du mode compact « pont de commandement » : la grille
 * bento 12 colonnes exige un vrai viewport d'ordinateur, en largeur ET en
 * hauteur. En dessous de ce seuil, la page défilante reste la seule
 * expérience.
 */
const COMPACT_MEDIA_QUERY = '(min-width: 1024px) and (min-height: 620px)';

/**
 * Mode d'affichage : la page défilante (« slideshow », valeur historique
 * conservée pour les choix déjà mémorisés) ou le pont compact.
 *
 * Le pré-rendu produit toujours la page défilante. Le choix mémorisé et la
 * taille du viewport ne sont lus qu'après le premier rendu navigateur :
 * l'hydratation retrouve exactement le HTML pré-rendu, puis bascule si
 * besoin.
 */
@Injectable({
  providedIn: 'root',
})
export class ViewModeService {
  /** Mode choisi par l'utilisateur (persisté dans localStorage). */
  private readonly _mode = signal<ViewMode>('slideshow');

  /** Vrai quand le viewport peut accueillir la grille bento du mode compact. */
  private readonly _compactViewport = signal(false);

  readonly mode = this._mode.asReadonly();

  /**
   * Vrai quand le viewport peut accueillir le mode compact. Exposé pour les
   * déclencheurs (triple-clic sur une mascotte) : sur une fenêtre trop
   * petite, la surprise est annoncée « pour grand écran » au lieu de
   * basculer dans le vide.
   */
  readonly compactCapable = this._compactViewport.asReadonly();

  /**
   * Vrai quand la mise en page compacte doit être rendue : mode compact
   * choisi ET viewport assez grand (largeur et hauteur). Sur mobile et sur
   * les petites fenêtres, la page défilante reste seule.
   */
  readonly isCompact = computed(
    () => this._mode() === 'compact' && this._compactViewport()
  );

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return;
    }
    afterNextRender(() => {
      this.restoreMode();
      const query = window.matchMedia(COMPACT_MEDIA_QUERY);
      this._compactViewport.set(query.matches);
      query.addEventListener('change', (event) =>
        this._compactViewport.set(event.matches)
      );
    });
  }

  toggle(): void {
    const next: ViewMode = this._mode() === 'compact' ? 'slideshow' : 'compact';
    this._mode.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Stockage indisponible (navigation privée…) : le choix vaut pour la session.
    }
  }

  private restoreMode(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'compact' || saved === 'slideshow') {
        this._mode.set(saved);
      }
    } catch {
      // Stockage indisponible : on garde le défaut (page défilante).
    }
  }
}
