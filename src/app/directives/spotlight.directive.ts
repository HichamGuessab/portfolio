import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';

/**
 * Halo lumineux qui suit le pointeur sur les cartes marquées
 * [data-spotlight] (styles dans src/styles.css). Un seul écouteur délégué
 * pour toute la zone, passif, limité à une écriture par frame : seules deux
 * variables CSS changent, jamais la mise en page. Ignoré sur écran tactile.
 */
@Directive({
  selector: '[spotlightZone]',
})
export class SpotlightDirective {
  constructor() {
    const zone: HTMLElement = inject(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        return;
      }
      let frame = 0;
      let target: HTMLElement | null = null;
      let x = 0;
      let y = 0;

      const paint = (): void => {
        frame = 0;
        if (target) {
          const rect = target.getBoundingClientRect();
          target.style.setProperty('--spot-x', `${x - rect.left}px`);
          target.style.setProperty('--spot-y', `${y - rect.top}px`);
        }
      };

      const onMove = (event: PointerEvent): void => {
        target =
          (event.target as Element | null)?.closest<HTMLElement>(
            '[data-spotlight]'
          ) ?? null;
        x = event.clientX;
        y = event.clientY;
        if (target) {
          frame ||= requestAnimationFrame(paint);
        }
      };

      zone.addEventListener('pointermove', onMove, { passive: true });
      destroyRef.onDestroy(() => {
        zone.removeEventListener('pointermove', onMove);
        cancelAnimationFrame(frame);
      });
    });
  }
}
