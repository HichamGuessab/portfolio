import {
  Component,
  input,
  InputSignal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Experience } from '../../../interfaces';

@Component({
  selector: 'experience-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './experience-item.component.html',
})
export class ExperienceItemComponent {
  experience: InputSignal<Experience> = input.required<Experience>();
}
