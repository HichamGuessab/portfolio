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
 * src/styles.css. Quand les animations sont désactivées (préférence système
 * `prefers-reduced-motion: reduce` sans override du visiteur — voir
 * MotionService et la classe `force-motion` sur <html>), une règle CSS force
 * l'état visible : le visiteur ne voit jamais l'état masqué, le contenu reste
 * visible même si ce code ne s'exécute pas. L'observation, elle, tourne dans
 * tous les cas : si le visiteur active l'override en cours de visite, les
 * éléments encore hors écran se révèlent normalement au défilement.
 */
@Directive({
  selector: '[reveal]',
  host: { class: 'reveal' },
})
export class RevealDirective implements OnInit, OnDestroy {
  /** Délai d'apparition en millisecondes (stagger des listes). */
  revealDelay: InputSignal<number> = input(0);

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
        /* Léger retrait en bas du viewport : en mode compact, l'élément
           n'apparaît qu'une fois réellement entré dans l'écran. */
        { rootMargin: '0px 0px -10% 0px' }
      );
      this._observer.observe(element);
    });
  }

  ngOnDestroy(): void {
    this._observer?.disconnect();
  }
}
