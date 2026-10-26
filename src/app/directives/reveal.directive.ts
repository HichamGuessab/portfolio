import {
  afterNextRender,
  booleanAttribute,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  InputSignal,
  InputSignalWithTransform,
} from '@angular/core';

/** Réaction d'un élément observé, appelée à chaque changement d'intersection. */
type RevealHandler = (entry: IntersectionObserverEntry) => void;

/* Un IntersectionObserver partagé par rootMargin (au lieu d'un par élément),
   et la réaction de chaque élément suivi. */
const observers = new Map<string, IntersectionObserver>();
const handlers = new WeakMap<Element, RevealHandler>();

function sharedObserver(rootMargin: string): IntersectionObserver {
  let observer = observers.get(rootMargin);
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => handlers.get(entry.target)?.(entry)),
      { rootMargin }
    );
    observers.set(rootMargin, observer);
  }
  return observer;
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
 *
 * `revealOnLoad` arme l'élément dès le premier rendu, même à l'écran :
 * réservé aux vues créées côté navigateur (mode compact), dont l'entrée est
 * chorégraphiée par les délais.
 */
@Directive({
  selector: '[reveal]',
  host: { class: 'reveal' },
})
export class RevealDirective {
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

  /** Arme l'élément dès le premier rendu, même s'il est déjà visible. */
  revealOnLoad: InputSignalWithTransform<boolean, unknown> = input(false, {
    transform: booleanAttribute,
  });

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
      const onLoad = this.revealOnLoad();
      if (onLoad) {
        element.classList.add('reveal-pending');
      }

      let first = !onLoad;
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
      observer = sharedObserver(this.revealMargin());
      observer.observe(element);
      element.addEventListener('focusin', revealNow);
    });

    inject(DestroyRef).onDestroy(stop);
  }
}
