import { computed, Injectable, signal } from '@angular/core';

export type ViewMode = 'slideshow' | 'compact';

const STORAGE_KEY = 'portfolio-view-mode';

/**
 * Garde d'activation du mode compact « pont de commandement » : la grille
 * bento 12 colonnes exige un vrai viewport d'ordinateur, en largeur ET en
 * hauteur. En dessous de ce seuil, le diaporama reste la seule expérience.
 */
const COMPACT_MEDIA_QUERY = '(min-width: 1024px) and (min-height: 620px)';

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
   * les petites fenêtres, le diaporama reste seul.
   */
  readonly isCompact = computed(
    () => this._mode() === 'compact' && this._compactViewport()
  );

  constructor() {
    this.restoreMode();

    const query = window.matchMedia(COMPACT_MEDIA_QUERY);
    this._compactViewport.set(query.matches);
    query.addEventListener('change', (event) =>
      this._compactViewport.set(event.matches)
    );
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
      // Stockage indisponible : on garde le défaut (diaporama).
    }
  }
}
