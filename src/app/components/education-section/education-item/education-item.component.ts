import { Component, input, InputSignal } from '@angular/core';
import { Degree } from '../../../interfaces';

@Component({
    selector: 'education-item',
    templateUrl: './education-item.component.html',
    imports: []
})
export class EducationItemComponent {
  education: InputSignal<Degree> = input.required<Degree>();
}
