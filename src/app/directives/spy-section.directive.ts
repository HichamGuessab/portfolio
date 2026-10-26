import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';
import { SectionSpyService } from '../services/section-spy.service';

/**
 * Inscrit une section de la page auprès du scroll-spy (SectionSpyService),
 * qui la repère par son id (`<section id="projets" spySection>`).
 * L'observation démarre après le premier rendu côté navigateur uniquement :
 * rien ne s'exécute pendant le pré-rendu.
 */
@Directive({
  selector: '[spySection]',
})
export class SpySectionDirective {
  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    const spy = inject(SectionSpyService);
    let stop: () => void = () => undefined;

    afterNextRender(() => {
      stop = spy.observeSection(element);
    });
    inject(DestroyRef).onDestroy(() => stop());
  }
}
