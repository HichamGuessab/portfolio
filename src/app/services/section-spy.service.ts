import {
  computed,
  Injectable,
  PLATFORM_ID,
  Signal,
  signal,
  WritableSignal,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SectionId } from '../interfaces';

/** Ordre de lecture des sections (index exposé aux mascottes). */
export const SECTION_ORDER: readonly SectionId[] = [
  'profil',
  'experience',
  'projets',
  'competences',
  'formation',
  'contact',
];

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
 * de page, la dernière section (trop courte pour atteindre la bande) est
 * déclarée active.
 */
@Injectable({
  providedIn: 'root',
})
export class SectionSpyService {
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _band: WritableSignal<SectionId> = signal('profil');
  private readonly _atBottom: WritableSignal<boolean> = signal(false);

  /** Section actuellement lue. */
  readonly active: Signal<SectionId> = computed(() =>
    this._atBottom() ? SECTION_ORDER[SECTION_ORDER.length - 1] : this._band()
  );

  /** Index de la section active dans SECTION_ORDER. */
  readonly activeIndex: Signal<number> = computed(() =>
    SECTION_ORDER.indexOf(this.active())
  );

  private _bandObserver?: IntersectionObserver;
  private _bottomObserver?: IntersectionObserver;

  /** Suit une section ; renvoie la fonction de désinscription. */
  observeSection(element: HTMLElement, id: SectionId): () => void {
    const observer = this.bandObserver();
    if (!observer) {
      return () => undefined;
    }
    element.dataset['spy'] = id;
    observer.observe(element);
    return () => observer.unobserve(element);
  }

  /** Suit le pied de page : visible = bas de page atteint. */
  observeBottom(element: HTMLElement): () => void {
    if (!this._isBrowser || typeof IntersectionObserver === 'undefined') {
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

  private bandObserver(): IntersectionObserver | undefined {
    if (!this._isBrowser || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    this._bandObserver ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset['spy'];
          if (entry.isIntersecting && id) {
            this._band.set(id as SectionId);
          }
        }
      },
      { rootMargin: BAND_MARGIN }
    );
    return this._bandObserver;
  }
}
