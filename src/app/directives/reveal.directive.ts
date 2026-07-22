import {
  Directive,
  ElementRef,
  inject,
  input,
  InputSignal,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';

/**
 * Révèle l'élément en douceur (opacité + légère translation) quand il entre
 * dans le viewport. IntersectionObserver fonctionne dans les deux modes
 * d'affichage (diaporama Swiper et page compacte), le déclenchement est donc
 * identique quel que soit le mode.
 *
 * Les styles associés (.reveal / .reveal-visible) sont définis dans
 * src/styles.css. Les animations sont actives par défaut pour tous les
 * visiteurs (voir MotionService) ; si IntersectionObserver n'existe pas,
 * l'état visible est posé immédiatement pour ne jamais masquer de contenu.
 */
@Directive({
  selector: '[reveal]',
  host: { class: 'reveal' },
})
export class RevealDirective implements OnInit, OnDestroy {
  /** Délai d'apparition en millisecondes (stagger des listes). */
  revealDelay: InputSignal<number> = input(0);

  /**
   * rootMargin de l'observation. Par défaut, léger retrait en bas du
   * viewport : l'élément n'apparaît qu'une fois réellement entré dans
   * l'écran. À passer à '0px' pour les éléments collés au bord bas d'une
   * vue plein écran (barre de statut du mode compact), sinon ils ne
   * seraient jamais révélés.
   */
  revealMargin: InputSignal<string> = input('0px 0px -10% 0px');

  private readonly _element: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly _zone: NgZone = inject(NgZone);
  private _observer?: IntersectionObserver;

  ngOnInit(): void {
    const element = this._element.nativeElement;

    if (this.revealDelay() > 0) {
      element.style.setProperty('--reveal-delay', `${this.revealDelay()}ms`);
    }

    /* Environnement sans IntersectionObserver : afficher immédiatement,
       le contenu ne doit jamais rester masqué. */
    if (typeof IntersectionObserver === 'undefined') {
      element.classList.add('reveal-visible');
      return;
    }

    /* Hors zone Angular : l'observation ne déclenche aucune détection de
       changement, seule la classe CSS est posée. */
    this._zone.runOutsideAngular(() => {
      this._observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            element.classList.add('reveal-visible');
            this._observer?.disconnect();
            this._observer = undefined;
          }
        },
        { rootMargin: this.revealMargin() }
      );
      this._observer.observe(element);
    });
  }

  ngOnDestroy(): void {
    this._observer?.disconnect();
  }
}
