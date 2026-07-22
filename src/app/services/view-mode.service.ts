import { computed, Injectable, signal } from '@angular/core';

export type ViewMode = 'slideshow' | 'compact';

const STORAGE_KEY = 'portfolio-view-mode';

/** Breakpoint md de Tailwind : le mode compact n'existe que sur ordinateur. */
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';

@Injectable({
  providedIn: 'root',
})
export class ViewModeService {
  /** Mode choisi par l'utilisateur (persisté dans localStorage). */
  private readonly _mode = signal<ViewMode>('slideshow');

  /** Vrai à partir du breakpoint md (768px). */
  private readonly _isDesktop = signal(false);

  readonly mode = this._mode.asReadonly();

  /**
   * Vrai quand la mise en page compacte doit être rendue : mode compact
   * choisi ET écran d'ordinateur. Sur mobile, le diaporama reste seul.
   */
  readonly isCompact = computed(
    () => this._mode() === 'compact' && this._isDesktop()
  );

  constructor() {
    this.restoreMode();

    const query = window.matchMedia(DESKTOP_MEDIA_QUERY);
    this._isDesktop.set(query.matches);
    query.addEventListener('change', (event) =>
      this._isDesktop.set(event.matches)
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
