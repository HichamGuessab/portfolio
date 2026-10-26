import {
  booleanAttribute,
  Component,
  computed,
  input,
  InputSignal,
  InputSignalWithTransform,
  ChangeDetectionStrategy,
  Signal,
} from '@angular/core';
import { Degree } from '../../../interfaces';
import { formatPeriod } from '../../../data/period';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'education-item',
  templateUrl: './education-item.component.html',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
})
export class EducationItemComponent {
  education: InputSignal<Degree> = input.required<Degree>();

  /** Vrai pour le diplôme le plus élevé (Master) : liseré dégradé + halo. */
  highlight: InputSignalWithTransform<boolean, unknown> = input(false, {
    transform: booleanAttribute,
  });

  protected readonly period: Signal<string> = computed(() =>
    formatPeriod(this.education().period)
  );
}
