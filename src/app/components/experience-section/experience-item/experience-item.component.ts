import { Component, input, InputSignal } from '@angular/core';
import { Experience } from '../../../interfaces';

@Component({
  selector: 'experience-item',
  standalone: true,
  templateUrl: './experience-item.component.html',
})
export class ExperienceItemComponent {
  experience: InputSignal<Experience> = input.required<Experience>();
}
