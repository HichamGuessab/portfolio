import { Component, input, Input, InputSignal } from '@angular/core';
import { Degree } from '../../../interfaces';

@Component({
  selector: 'education-item',
  templateUrl: './education-item.component.html',
  standalone: true,
  imports: [],
})
export class EducationItemComponent {
  education: InputSignal<Degree> = input.required<Degree>();
}
