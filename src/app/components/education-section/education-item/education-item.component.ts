import {
  Component,
  input,
  InputSignal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Degree } from '../../../interfaces';

@Component({
  selector: 'education-item',
  templateUrl: './education-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class EducationItemComponent {
  education: InputSignal<Degree> = input.required<Degree>();

  /** Vrai pour le diplôme le plus élevé (1er du service) : liseré + halo. */
  highlight: InputSignal<boolean> = input<boolean>(false);
}
