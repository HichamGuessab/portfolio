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
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [],
})
export class EducationItemComponent {
  education: InputSignal<Degree> = input.required<Degree>();
}
