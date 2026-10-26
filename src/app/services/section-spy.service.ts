import {
  computed,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { SectionId } from '../interfaces';

/**
 * Bande de détection : une section devient active quand elle traverse une
 * fine bande horizontale située à ~35-40 % de la hauteur du viewport (sous
 * l'en-tête collant), là où se pose naturellement le regard.
 */
const BAND_MARGIN = '-35% 0px -60% 0px';

/**
 * Section active de la page (scroll-spy), pour la navigation et les
 * commentaires des mascottes. Deux IntersectionObserver, aucune écoute de
 * scroll : l'un suit la bande de lecture, l'autre le pied de page — en bas
 * de page, la dernière section (contact, trop courte pour atteindre la
 * bande) est déclarée active. Quand plus aucune section n'est suivie (mode
 * compact), l'état revient au profil : la page recréée repart du haut, sans
 * faux changement de section.
 *
 * Appelé uniquement après le premier rendu navigateur (afterNextRender) :
 * rien ne s'exécute pendant le pré-rendu.
 */
@Injectable({
  providedIn: 'root',
})
export class SectionSpyService {
  private readonly _band: WritableSignal<SectionId> = signal('profil');
  private readonly _atBottom: WritableSignal<boolean> = signal(false);

  /** Section actuellement lue. */
  readonly active: Signal<SectionId> = computed(() =>
    this._atBottom() ? 'contact' : this._band()
  );

  private _bandObserver?: IntersectionObserver;
  private _bottomObserver?: IntersectionObserver;
  private _observedSections = 0;

  /** Suit une section, repérée par son id ; renvoie la désinscription. */
  observeSection(element: HTMLElement): () => void {
    if (typeof IntersectionObserver === 'undefined') {
      return () => undefined;
    }
    this._bandObserver ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this._band.set(entry.target.id as SectionId);
          }
        }
      },
      { rootMargin: BAND_MARGIN }
    );
    const observer = this._bandObserver;
    observer.observe(element);
    this._observedSections++;
    return () => {
      observer.unobserve(element);
      if (--this._observedSections === 0) {
        this._band.set('profil');
      }
    };
  }

  /** Suit le pied de page : visible = bas de page atteint. */
  observeBottom(element: HTMLElement): () => void {
    if (typeof IntersectionObserver === 'undefined') {
      return () => undefined;
    }
    this._bottomObserver ??= new IntersectionObserver((entries) => {
      this._atBottom.set(entries.some((entry) => entry.isIntersecting));
    });
    const observer = this._bottomObserver;
    observer.observe(element);
    return () => {
      observer.unobserve(element);
      this._atBottom.set(false);
    };
  }
}
