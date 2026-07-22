import {
  Component,
  input,
  InputSignal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { BlueImage, Skill, SkillType } from '../../../interfaces';

@Component({
  selector: 'skill-item',
  templateUrl: './skill-item.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'flex place-items-center gap-2 transition-transform duration-200 ease-out hover:translate-x-1',
  },
})
export class SkillItemComponent {
  skill: InputSignal<Skill> = input.required<Skill>();

  protected readonly SkillType = SkillType;
}
