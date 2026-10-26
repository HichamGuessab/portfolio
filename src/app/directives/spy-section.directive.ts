import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  InputSignal,
} from '@angular/core';
import { SectionId } from '../interfaces';
import { SectionSpyService } from '../services/section-spy.service';

/**
 * Inscrit une section de la page auprès du scroll-spy (SectionSpyService).
 * L'observation démarre après le premier rendu côté navigateur uniquement :
 * rien ne s'exécute pendant le pré-rendu.
 */
@Directive({
  selector: '[spySection]',
})
export class SpySectionDirective {
  /** Ancre de la section suivie. */
  readonly spySection: InputSignal<SectionId> = input.required<SectionId>();

  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    const spy = inject(SectionSpyService);
    let stop: () => void = () => undefined;

    afterNextRender(() => {
      stop = spy.observeSection(element, this.spySection());
    });
    inject(DestroyRef).onDestroy(() => stop());
  }
}
