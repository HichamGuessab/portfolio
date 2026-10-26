import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  InputSignal,
} from '@angular/core';

/** Réaction d'un élément observé, appelée à chaque changement d'intersection. */
type RevealHandler = (entry: IntersectionObserverEntry) => void;

/* Un IntersectionObserver partagé par tous les éléments (au lieu d'un par
   élément), et la réaction de chaque élément suivi. Léger retrait en bas du
   viewport : l'élément n'apparaît qu'une fois réellement entré dans
   l'écran. */
let sharedObserver: IntersectionObserver | undefined;
const handlers = new WeakMap<Element, RevealHandler>();

function revealObserver(): IntersectionObserver {
  return (sharedObserver ??= new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => handlers.get(entry.target)?.(entry)),
    { rootMargin: '0px 0px -10% 0px' }
  ));
}

/**
 * Révèle l'élément en douceur (opacité + légère translation) quand il entre
 * dans le viewport.
 *
 * Amélioration progressive : le HTML pré-rendu est entièrement visible. Après
 * le premier rendu navigateur, la directive observe l'élément ; au premier
 * rapport de l'IntersectionObserver, un élément déjà à l'écran est laissé
 * tel quel, un élément hors écran est « armé » (.reveal-pending, styles dans
 * src/styles.css) puis révélé à son entrée. Aucune lecture de géométrie
 * synchrone (pas de reflow forcé), rien ne clignote au chargement, et sans
 * JavaScript tout reste lisible.
 */
@Directive({
  selector: '[reveal]',
})
export class RevealDirective {
  /** Délai d'apparition en millisecondes (stagger des listes). */
  revealDelay: InputSignal<number> = input(0);

  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    let observer: IntersectionObserver | undefined;

    const stop = (): void => {
      observer?.unobserve(element);
      handlers.delete(element);
      observer = undefined;
      element.removeEventListener('focusin', revealNow);
    };

    /* Le focus clavier n'attend pas l'animation : un élément focalisé doit
       être visible immédiatement. */
    const revealNow = (): void => {
      element.classList.add('reveal-visible');
      stop();
    };

    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }
      if (this.revealDelay() > 0) {
        element.style.setProperty('--reveal-delay', `${this.revealDelay()}ms`);
      }

      let first = true;
      handlers.set(element, (entry) => {
        if (first) {
          /* Premier rapport : déjà visible (viewport entier, marge
             ignorée) → on n'y touche pas ; sinon on l'arme. Le rect est
             fourni par l'observer : aucune lecture de layout. */
          first = false;
          const { top, bottom } = entry.boundingClientRect;
          if (top < window.innerHeight && bottom > 0) {
            stop();
            return;
          }
          element.classList.add('reveal-pending');
          return;
        }
        if (entry.isIntersecting) {
          element.classList.add('reveal-visible');
          stop();
        }
      });
      observer = revealObserver();
      observer.observe(element);
      element.addEventListener('focusin', revealNow);
    });

    inject(DestroyRef).onDestroy(stop);
  }
}
